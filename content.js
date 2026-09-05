/* Twist Seek — content script
 * 영상을 클릭해 활성화한 뒤 스크롤로 탐색/볼륨을 조절한다.
 *  - 그냥 스크롤            → 볼륨 ±5%   (volumeScroll 옵션)
 *  - Shift + 스크롤         → 1초 탐색
 *  - Shift + Alt + 스크롤   → 5초 탐색
 */
(() => {
  "use strict";

  const DEFAULTS = {
    enabled: true,        // 전체 기능 on/off
    hoverMode: false,     // 클릭 대신 호버로 활성화
    invertScroll: false,  // 스크롤 방향 반전
    volumeScroll: true,   // 그냥 스크롤로 볼륨 조절
    showOSD: true,        // 화면 피드백 표시
    seekSmall: 1,         // 짧은 탐색(Shift+Alt) 간격(초)
    seekLarge: 5,         // 긴 탐색(Shift) 간격(초)
    volumeStep: 5,        // 볼륨 단계(%)
    language: "auto"      // auto | ko | en
  };

  // OSD 문자열 (언어별)
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
  let ctrlVideo = null;   // 현재 보라색 테두리가 적용된 영상
  let ctrlTimer = null;

  /* ---------- 설정 로드 / 동기화 ---------- */
  chrome.storage.sync.get(DEFAULTS, (stored) => {
    settings = { ...DEFAULTS, ...stored };
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    for (const key in changes) {
      if (key in settings) settings[key] = changes[key].newValue;
    }
  });

  /* ---------- 유틸 ---------- */
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

    // 중앙은 유튜브 재생/일시정지 인디케이터와 겹치므로 상단에 표시
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

  /* ---------- 제어 중 보라색 테두리 ---------- */
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

  /* ---------- 활성화 (클릭) — 호버 모드에서는 비활성 ---------- */
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

  /* 활성 영상이 DOM에서 사라지면 해제 */
  const cleanup = () => {
    if (activeVideo && !document.contains(activeVideo)) activeVideo = null;
  };

  /* 제어 대상 영상 결정: 호버 모드면 커서 밑 영상, 아니면 활성 영상 */
  function targetVideo(x, y) {
    if (settings.hoverMode) {
      return videoAtPoint(x, y);
    }
    cleanup();
    if (activeVideo && pointerInside(activeVideo, x, y)) return activeVideo;
    return null;
  }

  /* ---------- 스크롤 처리 ---------- */
  function onWheel(e) {
    if (!settings.enabled) return;
    const v = targetVideo(e.clientX, e.clientY);
    if (!v) return; // 대상 영상이 없으면 일반 스크롤 허용

    let dir = e.deltaY < 0 ? 1 : -1; // 스크롤 업 = +
    if (settings.invertScroll) dir *= -1;

    if (e.shiftKey && e.altKey) {
      // Shift+Alt → 짧은 탐색
      e.preventDefault();
      e.stopPropagation();
      seek(v, dir * settings.seekSmall);
    } else if (e.shiftKey) {
      // Shift → 긴 탐색
      e.preventDefault();
      e.stopPropagation();
      seek(v, dir * settings.seekLarge);
    } else if (settings.volumeScroll) {
      e.preventDefault();
      e.stopPropagation();
      changeVolume(v, dir * (settings.volumeStep / 100));
    } else {
      return; // 수정자 없고 volumeScroll=off → 일반 페이지 스크롤 유지
    }
    markControlling(v);
  }

  function fmtSec(n) {
    // 소수점 불필요한 0 제거 (1.0 → 1, 1.5 → 1.5)
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

  // passive:false 여야 preventDefault 가능
  window.addEventListener("wheel", onWheel, { capture: true, passive: false });

  // 전체화면 전환 시 OSD 위치 재배치 대비
  document.addEventListener("fullscreenchange", () => {
    if (osdEl && osdEl.parentElement) osdEl.parentElement.removeChild(osdEl);
  });
})();
