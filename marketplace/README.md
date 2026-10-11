# Marketplace publication kit — v1.1.8

Prepared 2026-10-11. v1.1.8 changes only manifest metadata needed for Marketplace SDK 3/DRM checks; accepted v1.1.7 behavior remains frozen. Start with [listing fields](LISTING.md), [capture checklist](CAPTURE-CHECKLIST.md), and [Maker Console steps](MAKER-CONSOLE.md).

## COMPLETE

- Current official requirements checked and linked in [REQUIREMENTS.md](REQUIREMENTS.md).
- Final description, release notes, support contact, independence wording, AI disclosure and version information.
- `assets/app-icon-288.png`: final 288 × 288 PNG.
- `assets/thumbnail-1920x960.png`: final 1920 × 960 PNG.
- Three editable 1920 × 960 gallery SVG layouts and matching PNG previews in `templates/`.
- Real screenshot/photo shot list and 1920 × 1080 demo sequence.
- Obsolete rejected 0.9 product deleted after Chris approved its permanent removal.
- Replacement FiO Networks draft created for UUID `com.fionetworks.rme-globalosc`; final description, English/Audio/Free details, support/setup links, icon and thumbnail are saved.
- SDK 3/DRM candidate packaged, checksummed, tested and accepted by the clean-product upload parser; see [PACKAGE.md](PACKAGE.md).
- Installed files match the exact v1.1.8 candidate archive file-for-file; Stream Deck 7.5.1 started it as version `1.1.8.0`, logged `Plugin connected`, and the plugin bound UDP feedback port 9008.

## REQUIRES CHRIS

- Capture real installed Stream Deck + controls, TotalMix feedback and Property Inspector, including mute/Mono/active states.
- Supply hardware demo footage; export 1920 × 1080 MP4.
- Review final captures and confirm media rights and AI disclosure accuracy.
- Confirm one physical dial and one key while producing the real capture set; startup and OSC socket smoke checks are complete.
- Explicit approval before submission, and before publication.

## MAKER CONSOLE

- Replacement draft: `4805d54d-4d34-4f36-b392-e4f86172c12b` at the current UUID. The old product and its obsolete gallery were permanently removed.
- Add at least three current real gallery items and the demo video; no placeholder preview was uploaded.
- Create version 1.1.8 from the candidate, add the final release notes, and recheck SDK 3 / DRM Yes.
- Verify support/setup links, AI disclosure and preview.
- Disable automatic publication and stop before submission.

## Asset provenance and use

Assets reuse the current repository’s category SVG mixer symbol and FiO dark/cyan palette from the Property Inspector. They contain no official RME or Elgato logo, no synthetic hardware, and no simulated application UI. Native SVG composition sources are retained; `source/render-assets.cjs` renders PNGs with Node and `sharp`.

The icon and thumbnail are finished artwork. Templates are explicitly marked **TEMPLATE — NOT FOR UPLOAD** and must be filled with real captures. Older project artwork was inspected and excluded because it depicted an earlier interface; no usable current hardware captures were found in the inspected project folders. Prior 0.9 rejection feedback was not visible before that obsolete product was deleted. Chris’s media review remains necessary before submission.

For each gallery SVG, the capture box is x=80, y=290, width=1760, height=540. Place the real capture inside it with preserved proportions, remove the capture instructions and amber footer, and export at 1920 × 960 PNG. Keep original captures separately so they can be reframed without quality loss.
