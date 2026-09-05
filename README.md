# Twist Seek ↻

A Chrome extension that controls videos with the scroll wheel. Works on any HTML5 `<video>` (YouTube, Netflix, lecture sites, etc.).

## What it does

| Action | Result |
| --- | --- |
| **Click** a video | **Activates** it (a purple outline flashes briefly) |
| **Scroll** | Volume ±5% |
| **Shift + Scroll** | Long seek (default 5s) |
| **Shift + Alt + Scroll** | Short seek (default 1s) |

- Scroll / seek only act **while the cursor is over the target video**, so everywhere else the page scrolls as usual.
- The change is shown briefly on the video (`+5s`, `🔊 70%`, etc.).

> 💡 Pairs really well with a **free-spinning (infinite) scroll wheel** — flick it and let it spin to scrub across a long video in one motion.

### Settings (click the toolbar icon → popup)

- **Master on/off** — the big switch in the header turns the extension fully on or off.
- **Hover mode** — act on the video under the cursor without clicking first. (On by default.)
- **Invert scroll direction** — flips which way scrolling moves the action.
- **Scroll to change volume** — off by default; when off, plain scroll (no modifier) is just normal page scroll.
- **On-screen feedback** — toggles the OSD shown over the video.
- **Language** — `Auto / 한국어 / English`, bottom-right of the popup. `Auto` follows the browser language.

All settings **sync through your Chrome account** to your other signed-in devices.

> Publishing to the Web Store: see [STORE.md](STORE.md). Version history: [CHANGELOG.md](CHANGELOG.md).

## Install (developer mode / unpacked)

1. Put this folder somewhere permanent on your machine. *(Moving or deleting the folder removes the extension, so keep it in a fixed location.)*
2. Go to `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked**.
5. Select this folder (the one containing `manifest.json`).
6. **Twist Seek** appears in the list. Pin it (📌) from the toolbar puzzle icon for quick access.

> Chromium-based browsers such as Edge and Whale install the same way from `edge://extensions`, etc.

### Quick check

1. Open a page with a video (e.g. YouTube).
2. **Click** the video once → the purple outline flashes and it activates.
3. **Shift + scroll** over the video → jumps 5s at a time; **Shift + Alt** → 1s at a time.
4. Turn on *Scroll to change volume* in the popup if you want plain scroll to control volume.

## Troubleshooting

- **Nothing happens**: reload the page. Tabs opened before the extension was installed aren't covered.
- **Some sites (e.g. Netflix)** use their own shortcuts / DRM players that limit seeking. Volume control usually still works.
- **Page won't scroll**: volume scroll is active over the video. Turn off *Scroll to change volume* in the popup.
- Setting changes apply immediately (no reload needed).

## Files

```
twist-seek/
├── manifest.json     # extension config (MV3)
├── content.js        # click/hover activation · scroll seek/volume logic
├── content.css       # OSD · control outline styles
├── popup.html        # settings popup
├── popup.css         # popup styles
├── popup.js          # settings save/sync · i18n
├── _locales/         # extension name/description (en, ko)
├── icons/            # 16 / 48 / 128 icons
├── CHANGELOG.md      # version history
├── STORE.md          # Web Store publishing checklist
└── README.md
```

## How it works (short version)

- `content.js` is injected into every page (and iframe). It picks the active video on `click` and intercepts `wheel` events (`passive:false`), adjusting `video.currentTime` / `video.volume` based on the modifier keys held.
- Settings live in `chrome.storage.sync` and are applied live via `storage.onChanged`.

## Customize

To change the seek / volume steps, edit the `DEFAULTS` at the top of `content.js`:

```js
seekSmall: 1,   // short seek (Shift+Alt), seconds
seekLarge: 5,   // long seek (Shift), seconds
volumeStep: 5   // volume step (%)
```
