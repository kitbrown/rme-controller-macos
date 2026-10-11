# Marketplace Submission — RME Controller for macOS

Updated 2026-10-11. v1.1.7 is functionally accepted on real hardware. Maker Console exposed a concrete SDK 3/DRM blocker; v1.1.8 changes only manifest metadata and keeps runtime behavior frozen.

## COMPLETE

- Existing automated tests, CLI validation, exact-package installation and hardware acceptance are recorded in [TEST-REPORT.md](TEST-REPORT.md).
- The v1.1.8 SDK 3/DRM candidate passes all automated tests and current CLI validation. Maker Console recognizes SDK 3 and DRM; runtime files are unchanged.
- Current Elgato requirements checked: [requirements and sources](../marketplace/REQUIREMENTS.md).
- Final [listing fields, support and AI disclosure](../marketplace/LISTING.md), [description](../marketplace/description.txt), [release notes](../marketplace/release-notes.txt), and [version/package identity](../marketplace/PACKAGE.md).
- Saved the final description and support/setup links in the existing FiO Networks draft; uploaded the final icon and thumbnail. No version was submitted.
- Marketplace [288 px app icon](../marketplace/assets/app-icon-288.png) and [1920 × 960 thumbnail](../marketplace/assets/thumbnail-1920x960.png).
- Three editable gallery layouts with marked placeholders in [templates](../marketplace/templates/).
- Concise [real-capture and hardware-video checklist](../marketplace/CAPTURE-CHECKLIST.md).

## REQUIRES CHRIS

- Real Stream Deck + / TotalMix / Property Inspector screenshots and photos, including mute, Mono and active states.
- Hardware-integration demo: 1920 × 1080 MP4; under 50 MB per the live Maker Console upload limit.
- Authorization to delete the obsolete rejected 0.9 draft, which owns the name but is bound to legacy UUID `com.fionetworks.rme-totalmix-macos`.
- One installed-package smoke check of the exact v1.1.8 candidate.
- Final media/provenance review and explicit permission before submission/publication.

## MAKER CONSOLE

- Follow [the Console handoff](../marketplace/MAKER-CONSOLE.md) for the live account findings and exact remaining steps.
- Delete the obsolete draft only after Chris approves, then create a clean product using the current UUID and v1.1.8 candidate.
- Complete listing and media uploads; verify preview, support links and disclosure.
- Turn off automatic publication and stop before Submit for review until Chris approves.

Gallery layouts are complete; gallery media is not. Do not upload placeholder previews. A broad hardware retest is unnecessary; only the exact v1.1.8 package needs a short smoke check because its runtime is unchanged.
