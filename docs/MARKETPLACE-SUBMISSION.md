# Marketplace Submission — RME Controller for macOS

Updated 2026-10-11. v1.1.7 is functionally accepted on real hardware. Maker Console exposed a concrete SDK 3/DRM blocker; v1.1.8 changes only manifest metadata and keeps runtime behavior frozen.

## COMPLETE

- Existing automated tests, CLI validation, exact-package installation and hardware acceptance are recorded in [TEST-REPORT.md](TEST-REPORT.md).
- The v1.1.8 SDK 3/DRM candidate passes all automated tests and current CLI validation. Maker Console recognizes SDK 3 and DRM; runtime files are unchanged.
- Current Elgato requirements checked: [requirements and sources](../marketplace/REQUIREMENTS.md).
- Final [listing fields, support and AI disclosure](../marketplace/LISTING.md), [description](../marketplace/description.txt), [release notes](../marketplace/release-notes.txt), and [version/package identity](../marketplace/PACKAGE.md).
- With Chris's approval, permanently deleted the obsolete rejected 0.9 product and created the replacement FiO Networks draft for current UUID `com.fionetworks.rme-globalosc`.
- Saved the final description, English/Audio/Free details and support/setup links in the replacement draft; uploaded the final icon and thumbnail. No version was submitted.
- Installed files match the v1.1.8 candidate archive file-for-file. Stream Deck 7.5.1 launched version `1.1.8.0`, logged `Plugin connected`, and the plugin bound UDP feedback port 9008.
- Marketplace [288 px app icon](../marketplace/assets/app-icon-288.png) and [1920 × 960 thumbnail](../marketplace/assets/thumbnail-1920x960.png).
- Three editable gallery layouts with marked placeholders in [templates](../marketplace/templates/).
- Concise [real-capture and hardware-video checklist](../marketplace/CAPTURE-CHECKLIST.md).

## REQUIRES CHRIS

- Real Stream Deck + / TotalMix / Property Inspector screenshots and photos, including mute, Mono and active states.
- Hardware-integration demo: 1920 × 1080 MP4; under 50 MB per the live Maker Console upload limit.
- One physical dial and key confirmation during media capture; package startup and OSC socket smoke checks are complete.
- Final media/provenance review and explicit permission before submission/publication.

## MAKER CONSOLE

- Follow [the Console handoff](../marketplace/MAKER-CONSOLE.md) for the live account findings and exact remaining steps.
- Replacement draft: `4805d54d-4d34-4f36-b392-e4f86172c12b`. Add the completed real gallery/video, then create version 1.1.8 from the candidate.
- Verify preview, support links and disclosure.
- Turn off automatic publication and stop before Submit for review until Chris approves.

Gallery layouts are complete; gallery media is not. Do not upload placeholder previews. The exact v1.1.8 package now passes the startup and feedback-socket smoke check. Confirm one physical dial and key during capture; a broad hardware retest is unnecessary because runtime files are unchanged.
