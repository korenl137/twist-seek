# Changelog

This project follows [Semantic Versioning](https://semver.org/).
Format: `MAJOR.MINOR.PATCH`

- **MAJOR** — changes incompatible with previous behavior (e.g. reworking the whole shortcut scheme)
- **MINOR** — backward-compatible feature additions (e.g. a new option)
- **PATCH** — backward-compatible bug fixes / minor improvements

> The single source of truth for the version is `"version"` in `manifest.json`; the popup footer reads it at runtime via `chrome.runtime.getManifest()`. The Chrome Web Store requires a higher `manifest.json` version on every published update.

---

## [1.2.0] - 2026-09-05

### Changed

- New defaults: **hover mode on**, **scroll-to-volume off**.
- Flipped the base scroll direction (scroll up = rewind / volume down); *Invert scroll direction* now defaults **off** and flips back to the old direction.
- Documentation and code comments are now in English (the popup UI keeps the Korean / English toggle).
- Popup footer reads the version from `manifest.json` at runtime instead of a hardcoded label.

## [1.1.0] - 2026-06-16

### Added

- Localization: Korean / English (language selector in the popup, `Auto` follows the browser)
- `_locales/`-based extension name / description localization

### Changed

- Reworked shortcut mapping: **Shift = long seek (default 5s)**, **Shift + Alt = short seek (default 1s)**

## [1.0.x] - development (unreleased)

### Added

- Click a video to activate, then scroll to control (base behavior)
- Shift / Shift+Alt scroll seek, plain scroll for volume ±5%
- Invert scroll direction option, master on/off
- Hover mode toggle (control the video under the cursor without clicking)
- Custom seek-time inputs
- Purple outline while controlling
- On-screen feedback (OSD) — placed near the top so it doesn't overlap the center indicator
- Settings synced via `chrome.storage.sync`
