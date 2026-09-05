# Chrome Web Store publishing checklist

The easiest way to use this on other machines without "Load unpacked" is to publish it to the Web Store. Work through the items below in order. (Policies change often, so re-check the official docs right before you publish.)

## 1. Developer account

- **One-time $5 registration fee.** It's per account, not per extension, and one account can publish **up to 20** items.
- The account **must have 2-Step Verification enabled** to publish or update.
- Pick a **developer email** for public listing. (A dedicated address is better than your personal one.)

## 2. Packaging

- Zip the whole folder and upload the **ZIP** (`manifest.json` must be at the ZIP root).
- The ZIP must include a **128×128 icon** → already have `icons/icon128.png` ✅
- Must be **Manifest V3** → currently V3 ✅
- Every update needs a **higher `version`** in `manifest.json` than the previous one (see CHANGELOG.md).
- Dev-only files can be left out: the ZIP doesn't need `README.md`, `CHANGELOG.md`, or `STORE.md` (not required for the extension to run).

## 3. Store listing images (required)

- **Extension icon 128×128** — actual artwork ~96×96, keep the outer 16px transparent.
- **Screenshots 1280×800** — at least 1, up to 5. (640×400 is also accepted.)
- **Small promo tile 440×280** — required.
- The listing is **rejected if the description is empty**. Missing icon/screenshots are also rejection reasons.

> For screenshots, capture the popup UI plus the on-video OSD at 1280×800.

## 4. Privacy / data handling (important)

- The store listing requires a **data-use (Privacy) section**, and it must **match** the actual behavior and privacy policy. A mismatch can get the item removed.
- This extension **collects and transmits nothing.** It only stores settings in `chrome.storage.sync` → declare "Does not collect user data".
- A **privacy policy URL** may still be required. A Markdown file in the GitHub repo, a GitHub Pages page, or a public Notion page is enough. (For open source, a direct link to the file works.)

## 5. Permissions / single-purpose policy

- **Single purpose**: the extension must do one clear thing → "control videos with scroll" qualifies ✅
- You must justify requested permissions. The only permission is `storage` (saving settings) → easy to explain ✅
- The `<all_urls>` content script is justified by the purpose ("control HTML5 video on any site"). If asked in review, state: "to control `<video>` elements on any site".

## 6. Submit & review

- In the dashboard: upload the ZIP → fill in listing info (name/description/category/language/images/privacy) → submit.
- Review can take **anywhere from a few hours to a few days**. (Longer if there are many permissions or policy-sensitive items.)
- After publishing, other machines just need to be signed into the same Google account and install from the store.

## Private / faster alternatives

If the public review is a hassle:

- Set **visibility to "Private"** or **"Tester only"** in the dashboard so only you / listed accounts can install. (The $5 fee still applies.)
- Or keep using **Developer mode + Load unpacked** on each machine (free, but manual per machine).

## Links

- Register a developer account: https://developer.chrome.com/docs/webstore/register
- Program policies: https://developer.chrome.com/docs/webstore/program-policies/policies
- Listing info: https://developer.chrome.com/docs/webstore/cws-dashboard-listing
- Image specs: https://developer.chrome.com/docs/webstore/images
