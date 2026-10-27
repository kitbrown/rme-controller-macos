# v1.1.9 Maker Console submission checkpoint

User authorization: restore starter profiles, verify connected hardware, and submit v1.1.9 with new icons; preserve controls and keep automatic publication OFF.

- Exact candidate: `marketplace/v1.1.9/candidate/com.fionetworks.rme-globalosc.streamDeckPlugin`, manifest 1.1.9.1, 134,106 bytes.
- SHA-256: `8b2b0f08db4327d9b4796a41c7203503bf19b60bc2315789cb0afe87e3a8cb0f`.
- Existing product: https://maker.elgato.com/8e915638-e18c-4e54-a55d-3b2f206fa00a/products/4805d54d-4d34-4f36-b392-e4f86172c12b
- Source base and scoped test results: [VALIDATION.md](VALIDATION.md).
- Console recognition confirmed: SDK 3 or later, DRM Yes, default profiles Yes, + dials Yes.
- New icon, matching thumbnail/cover, description and release notes prepared. Existing real media retained.
- Automatic publication OFF.
- Current action boundary: final console verification, then the explicitly authorized Submit for Review. Do not publish.

## Earlier handoff (historical)

# RME Controller for macOS — v1.1.9 Maker Console upload handoff

Updated 2026-10-27. Author: Chris W. Brown. Work product: CONFIDENTIAL, FiO Networks. This is a **DRAFT UPLOAD** handoff; it is not a claim of a completed Elgato upload or hardware acceptance.

## Destination and identity

- **CONFIRMED in repository history:** Existing FiO Networks Elgato product [RME Controller for macOS](https://maker.elgato.com/8e915638-e18c-4e54-a55d-3b2f206fa00a/products/4805d54d-4d34-4f36-b392-e4f86172c12b), product ID `4805d54d-4d34-4f36-b392-e4f86172c12b`, organization ID `8e915638-e18c-4e54-a55d-3b2f206fa00a`.
- **UNKNOWN live:** Maker Console's current status after user canceled/deleted the previously submitted v1.1.8 review/version. Before uploading, confirm that **the same product draft still exists**. Do **not** recreate a product if it exists; do **not** reuse the deleted legacy 0.9 UUID.
- **CONFIRMED in CI package:** Current UUID `com.fionetworks.rme-globalosc`, manifest version `1.1.9.0`, SDK 3, DRM-capable, Author `FiO Networks`, minimum macOS 13 / Stream Deck 7.1.
- The user explicitly requested **v1.1.9 draft upload including new icons, listing, media and package**. No explicit authorization in the current request to click Submit for Review or enable automatic publication.

## Exact source package and graphics

- **CONFIRMED** validated run: https://github.com/kitbrown/rme-controller-macos/actions/runs/40438626986
- Artifact `console-surface-next-UNRELEASED`, `RME_Controller_v1.1.9.0_UNRELEASED.zip`; inside use `com.fionetworks.rme-globalosc.streamDeckPlugin` (NOT v1.1.8 package).
- That CI build renders the new mixer-console app icons inside the plugin: `com.fionetworks.rme-globalosc.sdPlugin/imgs/plugin.png` (256×256) and `plugin@2x.png` (512×512).
- The same CI artifact also contains **`dist/console-marketplace-icon-288.png`**, the new 288×288 Marketplace icon. Upload **that** to the product's Media → Icon field.
- Vector source: `marketplace/source/console-app-icon.svg` on branch `feature/console-ui-improvements`.
- **Existing 1920×960 thumbnail**, if still appropriate after comparison with installed v1.1.9 UI: `marketplace/assets/thumbnail-1920x960.png` on `main`. Updated v1.1.9 thumbnail based on real evidence is preferred. Do not upload 288×288 icon in thumbnail field.

## Gallery, video and source evidence

Completed prior real gallery/video assets exist in ChatGPT's **Stream Deck for RME Library folder**, but the current chat could not materialize the Library files for Maker Console uploads. Retrieve by exact names:

- `gallery_streamdeck_closeup_1920x960.png`
- `gallery_totalmix_integration_1920x960.png`
- `gallery_hardware_and_totalmix_1920x960.png`
- `IMG_0209_marketplace_1920x1080.mp4`
- `video_thumbnail_1920x960.png`
- Archive `RME_Controller_v1.1.7_Marketplace_Media.zip` is **older media only**, not a v1.1.9 software package.

**CONFIRMED:** Prior media was designed for the tested v1.1.7 hardware configuration. **UNKNOWN:** Whether any such capture demonstrates a **v1.1.9** action. Do not label old footage as new-release functionality or falsely imply that peak metering/processing features were hardware-validated. Reuse only for unchanged existing controls and refresh new-feature captures before submission for review.

### Publishing requirements and sizes

- Marketplace app icon: 288×288 PNG.
- Thumbnail/gallery PNGs: 1920×960; at least three gallery items, no placeholders.
- Hardware demonstration MP4: 1920×1080. Treat **50 MB** as stricter upload ceiling from Elgato Maker Console, even if other docs specify 250 MB.
- Correct English title, Free, Audio, support/setup URLs, AI-use disclosure and non-affiliation statement.

Official guidance:
- https://docs.elgato.com/maker-console/managing-products/
- https://docs.elgato.com/maker-console/submitting-products/
- https://docs.elgato.com/guidelines/products/
- https://docs.elgato.com/maker-console/review-process/

## Listing metadata

- Name: `RME Controller for macOS`
- Developer: `FiO Networks`
- Price: `Free`
- Language: `English`
- Category: `Audio`
- Version: `1.1.9.0`
- Description: `marketplace/v1.1.9/description.txt` (1,231 Unicode codepoints, within 1,500).
- Release notes: `marketplace/v1.1.9/release-notes.txt`.
- Support URL: `https://github.com/kitbrown/rme-controller-macos/issues`
- Setup URL: `https://github.com/kitbrown/rme-controller-macos#install`
- Public disclosure: AI-assisted development, documentation, testing, listing copy and visual preparation under Maker direction; independent software, not RME/Elgato endorsed. The previously supplied real photographs/videos were not AI-generated; the new icon is project artwork. Confirm provenance before submission.

## Maker Console workflow and stop condition

1. Log into FiO Networks' Maker Console. Check existing product identity, current version records and canceled-review status.
2. Reuse existing current-UUID product. Under **Media**, replace app icon with new 288px icon; update thumbnail/gallery/video from verified assets only.
3. Update description/details, support URL, setup URL, pricing/category/language, and review any AI-use questions.
4. Under **Versions**, create/upload **1.1.9.0** using the validated `.streamDeckPlugin` and the v1.1.9 release notes. Verify SDK3/DRM Yes.
5. **Disable Automatically publish after being approved.** Check before finalizing; Maker Console may default this setting ON.
6. Verify exact icon, package UUID/version, preview, text, URLs and media; save a draft.
7. **STOP before Submit for Review or Publish**. Elgato submission requires fresh hardware evidence for v1.1.9 functions and user authorization. Report exact completed fields and outstanding issues.

## State ledger

- **CONFIRMED:** Branch v1.1.9 code and CI validator/package passed.
- **CONFIRMED:** New app / Marketplace icon generated and dimensional checks passed in CI.
- **CONFIRMED:** Listing and release notes prepared on feature branch.
- **UNKNOWN:** Actual remote Maker Console edit/upload status; this chat has no authenticated console browser.
- **UNKNOWN:** v1.1.9 hardware verification for newly implemented pan/EQ/dynamics/FX, channel discovery and live audio peaks.
- **REJECTED:** Claiming old media proves new features; claiming actual console submission before tool confirmation; publishing automatically; changing previous validated v1.1.8 runtime.
