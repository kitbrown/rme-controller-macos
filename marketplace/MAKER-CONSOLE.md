# Current release: v1.1.9

Use [the v1.1.9 handoff](v1.1.9/MAKER-CONSOLE-UPLOAD.md), [validation](v1.1.9/VALIDATION.md), and [exact package identity](PACKAGE.md). The prior v1.1.8 notes below are historical.

# Maker Console — observed state and remaining steps

Checked live on 2026-10-11 after Chris signed in.

## COMPLETE

- Organization **FiO Networks** exactly matches the manifest author.
- Chris approved permanent deletion of the rejected 0.9 product, and it was deleted. The legacy UUID `com.fionetworks.rme-totalmix-macos`, obsolete media and name collision are gone.
- A replacement **RME Controller for macOS** draft was created at [product `4805d54d-4d34-4f36-b392-e4f86172c12b`](https://maker.elgato.com/8e915638-e18c-4e54-a55d-3b2f206fa00a/products/4805d54d-4d34-4f36-b392-e4f86172c12b) for current UUID `com.fionetworks.rme-globalosc`.
- General: final description saved, including requirements, independence wording and AI-use disclosure; Support and Setup Guide links saved. English, Audio and Free are set.
- Media: final 288 px icon and 1920 × 960 thumbnail uploaded successfully. No placeholder gallery item was uploaded.
- The original v1.1.7 package exposed three actual blockers: Stream Deck ID mismatch, SDK 2 incompatibility and DRM disabled.
- A minimal v1.1.8 candidate changes only the manifest version and `SDKVersion` to 3. Maker Console now reports SDK 3 and DRM enabled. Automated tests and CLI validation pass; runtime files are unchanged.
- The replacement draft was saved before the gallery and version stages. It currently has no submitted version.
- Installed files match the exact v1.1.8 candidate archive file-for-file. Stream Deck 7.5.1 launched it as `1.1.8.0`, logged `Plugin connected`, and the runtime bound UDP port 9008.
- **Submit for review was not clicked.** No version was submitted or published.

## REQUIRES CHRIS

- Capture three current gallery images and a functional hardware demo using [CAPTURE-CHECKLIST.md](CAPTURE-CHECKLIST.md).
- Confirm one physical dial and one key while capturing the real media. Startup and feedback-socket smoke checks are complete; the runtime is unchanged, so a broad hardware retest is unnecessary.
- Review final media and AI provenance; approve submission explicitly when ready.

## Exact remaining MAKER CONSOLE steps

1. Open the [replacement draft](https://maker.elgato.com/8e915638-e18c-4e54-a55d-3b2f206fa00a/products/4805d54d-4d34-4f36-b392-e4f86172c12b) → Media. Upload at least three completed real captures/video. Use 1920 × 960 PNGs under 10 MB each and 1920 × 1080 MP4 **under 50 MB**. Do not upload the marked template previews.
2. Versions → Create version. Upload `marketplace/candidate/com.fionetworks.rme-globalosc.streamDeckPlugin`; confirm UUID `com.fionetworks.rme-globalosc`, version `1.1.8.0`, SDK 3 and DRM Yes, and paste `release-notes.txt`.
3. Check **Automatically publish after being approved** is OFF. A freshly opened form defaulted to ON, so recheck every time.
4. Review the preview, description, support/setup links, all gallery items and the AI disclosure. Use the fuller disclosure in `LISTING.md` if Elgato requests reviewer notes; no separate AI field was visible in the inspected forms.
5. Stop before **Submit for review** until Chris explicitly approves. Only then submit. After approval by Elgato, obtain Chris’s separate authorization before **Publish**.

No review submission or publication was performed. The replacement product is only a saved draft; its version table is empty.
