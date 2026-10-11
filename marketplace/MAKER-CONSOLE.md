# Maker Console — observed state and remaining steps

Checked live on 2026-10-11 after Chris signed in.

## COMPLETE

- Organization **FiO Networks** exactly matches the manifest author.
- Existing product **RME Controller for macOS** is **Draft**, with **Rejected · 0.9**, last updated August 3, 2026. It is bound to legacy UUID `com.fionetworks.rme-totalmix-macos`.
- General: final description saved, including requirements, independence wording and AI-use disclosure; Support and Setup Guide links saved. English, Audio and Free retained.
- Media: new 288 px icon and 1920 × 960 thumbnail uploaded successfully.
- The original v1.1.7 package exposed three actual blockers: Stream Deck ID mismatch, SDK 2 incompatibility and DRM disabled.
- A minimal v1.1.8 candidate changes only the manifest version and `SDKVersion` to 3. Maker Console now reports SDK 3 and DRM enabled. Automated tests and CLI validation pass; runtime files are unchanged.
- In the legacy product, the remaining negative field is only the current UUID because it differs from 0.9. In a clean Create product wizard, the current UUID, SDK 3 and DRM all pass; only the duplicate product name is negative. This confirms the correct path is a clean product record after removing the obsolete draft.
- **Submit for review was not clicked.** Automatic publication is off in the old-product test form. The clean wizard was not continued past validation, so no duplicate draft was created.

## REQUIRES CHRIS

- Capture three current gallery images and a functional hardware demo using [CAPTURE-CHECKLIST.md](CAPTURE-CHECKLIST.md).
- Authorize permanent deletion of the rejected 0.9 draft so its exact name can be reused with `com.fionetworks.rme-globalosc`. Deletion has not been performed.
- Install the exact v1.1.8 candidate and smoke-check startup, feedback, one dial and one key. Its runtime is unchanged, so a broad hardware retest is unnecessary.
- Review final media and AI provenance; approve submission explicitly when ready.

## Exact remaining MAKER CONSOLE steps

1. After Chris explicitly approves permanent deletion, delete the [obsolete product](https://maker.elgato.com/8e915638-e18c-4e54-a55d-3b2f206fa00a/products/adcc2259-18ea-45d7-909d-ff79c90bb1b6). It cannot accept the current UUID, and its four gallery items contain outdated visuals and claims. This also removes the name collision.
2. Home → Create product → Plugin. Upload `marketplace/candidate/com.fionetworks.rme-globalosc.streamDeckPlugin`. Confirm UUID `com.fionetworks.rme-globalosc`, version `1.1.8.0`, SDK 3 and DRM Yes, then continue with the exact name **RME Controller for macOS** and Free pricing.
3. Use 1920 × 960 PNGs under 10 MB each, and 1920 × 1080 MP4 **under 50 MB**, per the live form. The icon/thumbnail are already within their 2 MB / 5 MB limits. Do not rely on the looser 250 MB published video guideline.
4. Use `description.txt`, `release-notes.txt`, the icon/thumbnail, and the completed real-capture gallery/video. Add the Support and Setup Guide links from `LISTING.md`.
5. Check **Automatically publish after being approved** is OFF. A freshly opened form defaulted to ON, so recheck every time. Review description, support/setup links, all gallery items and the AI disclosure. Use the fuller disclosure in `LISTING.md` if Elgato requests reviewer notes; no separate AI field was visible in the inspected forms.
6. Stop before **Submit for review** until Chris explicitly approves. Only then submit. After approval by Elgato, obtain Chris’s separate authorization before **Publish**.

No review submission or publication was performed. Draft metadata/media saves are separate from version submission.
