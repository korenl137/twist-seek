/* Twist Seek — content script
 * Activate a video (click or hover), then scroll to seek / change volume.
 *  - plain scroll          → volume ±5%   (volumeScroll option)
 *  - Shift + scroll        → 1s seek
 *  - Shift + Alt + scroll  → 5s seek
 */
(() => {
  "use strict";

  const DEFAULTS = {
    enabled: true,        // master on/off
    hoverMode: true,      // activate on hover instead of click
    invertScroll: false,  // invert scroll direction
    volumeScroll: false,  // plain scroll changes volume
    showOSD: true,        // show on-screen feedback
    seekSmall: 1,         // short seek (Shift+Alt) step, seconds
    seekLarge: 5,         // long seek (Shift) step, seconds
    volumeStep: 5,        // volume step (%)
    language: "auto"      // auto | ko | en
  };

  // OSD strings (per language)
  const STRINGS = {
    ko: { activated: "활성화", unit: "초" },
    en: { activated: "Activated", unit: "s" }
  };
  function t() {
    let lang = settings.language;
    if (lang !== "ko" && lang !== "en") {
      lang = (navigator.language || "en").toLowerCase().startsWith("ko")
        ? "ko"
        : "en";
    }
    return STRINGS[lang];
  }

  let settings = { ...DEFAULTS };
  let activeVideo = null;
  let osdEl = null;
  let osdTimer = null;
  let ctrlVideo = null;   // video currently showing the purple outline
  let ctrlTimer = null;

  /* ---------- load / sync settings ---------- */
  chrome.storage.sync.get(DEFAULTS, (stored) => {
    settings = { ...DEFAULTS, ...stored };
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    for (const key in changes) {
      if (key in settings) settings[key] = changes[key].newValue;
    }
  });

  /* ---------- utils ---------- */
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  function videoAtPoint(x, y) {
    const stack = document.elementsFromPoint(x, y) || [];
    for (const el of stack) {
      if (el && el.tagName === "VIDEO") return el;
    }
    return null;
  }

  function pointerInside(el, x, y) {
    if (!el || !document.contains(el)) return false;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  /* ---------- OSD ---------- */
  function showOSD(text, video) {
    if (!settings.showOSD || !video) return;
    const host = document.fullscreenElement || document.body;
    if (!osdEl) {
      osdEl = document.createElement("div");
      osdEl.className = "twist-seek-osd";
    }
    if (osdEl.parentElement !== host) host.appendChild(osdEl);

    // Center overlaps YouTube's play/pause indicator, so show near the top
    const r = video.getBoundingClientRect();
    osdEl.style.left = `${r.left + r.width / 2}px`;
    osdEl.style.top = `${r.top + Math.max(28, r.height * 0.14)}px`;
    osdEl.textContent = text;
    osdEl.classList.add("twist-seek-osd--show");

    clearTimeout(osdTimer);
    osdTimer = setTimeout(() => {
      osdEl && osdEl.classList.remove("twist-seek-osd--show");
    }, 650);
  }

  /* ---------- purple outline while controlling ---------- */
  function markControlling(video) {
    if (ctrlVideo && ctrlVideo !== video) {
      ctrlVideo.classList.remove("twist-seek-controlling");
    }
    ctrlVideo = video;
    video.classList.add("twist-seek-controlling");
    clearTimeout(ctrlTimer);
    ctrlTimer = setTimeout(() => {
      video.classList.remove("twist-seek-controlling");
      if (ctrlVideo === video) ctrlVideo = null;
    }, 900);
  }

  /* ---------- activation (click) — disabled in hover mode ---------- */
  document.addEventListener(
    "click",
    (e) => {
      if (!settings.enabled || settings.hoverMode) return;
      const v = videoAtPoint(e.clientX, e.clientY);
      if (v) {
        activeVideo = v;
        markControlling(v);
        showOSD(t().activated, v);
      }
    },
    true
  );

  /* release the active video once it leaves the DOM */
  const cleanup = () => {
    if (activeVideo && !document.contains(activeVideo)) activeVideo = null;
  };

  /* pick the target video: hover mode → video under the cursor, else the active one */
  function targetVideo(x, y) {
    if (settings.hoverMode) {
      return videoAtPoint(x, y);
    }
    cleanup();
    if (activeVideo && pointerInside(activeVideo, x, y)) return activeVideo;
    return null;
  }

  /* ---------- scroll handling ---------- */
  function onWheel(e) {
    if (!settings.enabled) return;
    const v = targetVideo(e.clientX, e.clientY);
    if (!v) return; // no target video → allow normal scroll

    let dir = e.deltaY < 0 ? -1 : 1; // scroll up = - (default); invertScroll flips it
    if (settings.invertScroll) dir *= -1;

    if (e.shiftKey && e.altKey) {
      // Shift+Alt → short seek
      e.preventDefault();
      e.stopPropagation();
      seek(v, dir * settings.seekSmall);
    } else if (e.shiftKey) {
      // Shift → long seek
      e.preventDefault();
      e.stopPropagation();
      seek(v, dir * settings.seekLarge);
    } else if (settings.volumeScroll) {
      e.preventDefault();
      e.stopPropagation();
      changeVolume(v, dir * (settings.volumeStep / 100));
    } else {
      return; // no modifier and volumeScroll=off → keep normal page scroll
    }
    markControlling(v);
  }

  function fmtSec(n) {
    // drop trailing zeros (1.0 → 1, 1.5 → 1.5)
    return Number(n.toFixed(2)).toString();
  }

  function seek(v, delta) {
    const dur = isFinite(v.duration) ? v.duration : Infinity;
    v.currentTime = clamp(v.currentTime + delta, 0, dur);
    showOSD(`${delta > 0 ? "+" : "-"}${fmtSec(Math.abs(delta))}${t().unit}`, v);
  }

  function changeVolume(v, delta) {
    if (v.muted && delta > 0) v.muted = false;
    v.volume = clamp(v.volume + delta, 0, 1);
    showOSD(`🔊 ${Math.round(v.volume * 100)}%`, v);
  }

  // passive:false is required so preventDefault works
  window.addEventListener("wheel", onWheel, { capture: true, passive: false });

  // re-anchor the OSD when entering/leaving fullscreen
  document.addEventListener("fullscreenchange", () => {
    if (osdEl && osdEl.parentElement) osdEl.parentElement.removeChild(osdEl);
  });
})();
