const DEFAULTS = {
  enabled: true,
  hoverMode: false,
  invertScroll: false,
  volumeScroll: true,
  showOSD: true,
  seekSmall: 1,
  seekLarge: 5,
  language: "auto" // auto | ko | en
};

const BOOL_KEYS = [
  "enabled",
  "hoverMode",
  "invertScroll",
  "volumeScroll",
  "showOSD"
];
const NUM_KEYS = ["seekSmall", "seekLarge"];

/* ---------- i18n 사전 ---------- */
const I18N = {
  ko: {
    tagline: "스크롤 영상 컨트롤러",
    masterTitle: "전체 기능 켜기/끄기",
    hoverTitle: "호버 모드",
    hoverDesc: "클릭 없이 커서를 올린 영상에서 바로 동작",
    invertTitle: "스크롤 방향 반전",
    invertDesc: "위로 스크롤 시 동작 방향을 뒤집습니다",
    volTitle: "스크롤로 볼륨 조절",
    volDesc: "수정자 키 없이 스크롤하면 볼륨 ±5%",
    osdTitle: "화면 피드백 표시",
    osdDesc: "탐색·볼륨 변화를 영상 위에 잠깐 표시",
    seekLongDesc: "긴 탐색 간격",
    seekShortDesc: "짧은 탐색 간격",
    unit: "초",
    wheel: "스크롤",
    cheatHeader: "단축 동작",
    cheatActivate: "영상 활성화",
    cheatVolume: "볼륨 조절",
    activateClick: "클릭",
    activateHover: "호버",
    statusAuto: "자동 저장됨",
    statusSaved: "저장됨 ✓",
    seekFmt: (n) => `${n}초 탐색`
  },
  en: {
    tagline: "Scroll video controller",
    masterTitle: "Turn the whole extension on/off",
    hoverTitle: "Hover mode",
    hoverDesc: "Act on the video under the cursor, no click needed",
    invertTitle: "Invert scroll direction",
    invertDesc: "Flip the action direction when scrolling up",
    volTitle: "Scroll to change volume",
    volDesc: "Plain scroll changes volume by ±5%",
    osdTitle: "On-screen feedback",
    osdDesc: "Briefly shows seek / volume changes on the video",
    seekLongDesc: "Long seek step",
    seekShortDesc: "Short seek step",
    unit: "s",
    wheel: "Scroll",
    cheatHeader: "Shortcuts",
    cheatActivate: "Activate video",
    cheatVolume: "Volume",
    activateClick: "Click",
    activateHover: "Hover",
    statusAuto: "Auto-saved",
    statusSaved: "Saved ✓",
    seekFmt: (n) => `Seek ${n}s`
  }
};

function resolveLang(setting) {
  if (setting === "ko" || setting === "en") return setting;
  const ui = (navigator.language || "en").toLowerCase();
  return ui.startsWith("ko") ? "ko" : "en";
}

let dict = I18N.en;

/* ---------- DOM refs ---------- */
const $ = (id) => document.getElementById(id);
const statusEl = $("status");
const contentEl = $("content");
const activateKey = $("activateKey");
let statusTimer = null;

function applyI18n() {
  document.documentElement.lang = dict === I18N.ko ? "ko" : "en";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (dict[key]) el.title = dict[key];
  });

  reflectHover();
  reflectCheats();
  statusEl.textContent = dict.statusAuto;
}

function reflectMaster() {
  contentEl.classList.toggle("disabled", !$("enabled").checked);
}

function reflectHover() {
  activateKey.textContent = $("hoverMode").checked
    ? dict.activateHover
    : dict.activateClick;
}

function reflectCheats() {
  $("cheatSeekLong").textContent = dict.seekFmt($("seekLarge").value);
  $("cheatSeekShort").textContent = dict.seekFmt($("seekSmall").value);
}

function flashSaved() {
  statusEl.textContent = dict.statusSaved;
  statusEl.classList.add("saved");
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    statusEl.textContent = dict.statusAuto;
    statusEl.classList.remove("saved");
  }, 1200);
}

function clampNum(v, lo, hi, fallback) {
  v = parseFloat(v);
  if (!isFinite(v)) return fallback;
  return Math.min(hi, Math.max(lo, v));
}

/* ---------- 초기 로드 ---------- */
chrome.storage.sync.get(DEFAULTS, (s) => {
  const v = { ...DEFAULTS, ...s };
  BOOL_KEYS.forEach((k) => ($(k).checked = v[k]));
  NUM_KEYS.forEach((k) => ($(k).value = v[k]));
  $("language").value = v.language;
  dict = I18N[resolveLang(v.language)];
  applyI18n();
  reflectMaster();
});

/* ---------- 이벤트 ---------- */
BOOL_KEYS.forEach((k) => {
  $(k).addEventListener("change", (e) => {
    chrome.storage.sync.set({ [k]: e.target.checked }, flashSaved);
    if (k === "enabled") reflectMaster();
    if (k === "hoverMode") reflectHover();
  });
});

NUM_KEYS.forEach((k) => {
  const el = $(k);
  el.addEventListener("change", () => {
    const val = clampNum(el.value, 0.5, 600, DEFAULTS[k]);
    el.value = val;
    chrome.storage.sync.set({ [k]: val }, flashSaved);
    reflectCheats();
  });
});

$("language").addEventListener("change", (e) => {
  const setting = e.target.value;
  dict = I18N[resolveLang(setting)];
  chrome.storage.sync.set({ language: setting }, flashSaved);
  applyI18n();
});
