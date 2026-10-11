# Marketplace publication kit — v1.1.8

Prepared 2026-10-11. v1.1.8 changes only manifest metadata needed for Marketplace SDK 3/DRM checks; accepted v1.1.7 behavior remains frozen. Start with [listing fields](LISTING.md), [capture checklist](CAPTURE-CHECKLIST.md), and [Maker Console steps](MAKER-CONSOLE.md).

## COMPLETE

- Current official requirements checked and linked in [REQUIREMENTS.md](REQUIREMENTS.md).
- Final description, release notes, support contact, independence wording, AI disclosure and version information.
- `assets/app-icon-288.png`: final 288 × 288 PNG.
- `assets/thumbnail-1920x960.png`: final 1920 × 960 PNG.
- Three editable 1920 × 960 gallery SVG layouts and matching PNG previews in `templates/`.
- Real screenshot/photo shot list and 1920 × 1080 demo sequence.
- Existing FiO Networks draft verified; final description/support/setup links saved and icon/thumbnail uploaded.
- SDK 3/DRM candidate packaged, checksummed, tested and accepted by the clean-product upload parser; see [PACKAGE.md](PACKAGE.md).

## REQUIRES CHRIS

- Capture real installed Stream Deck + controls, TotalMix feedback and Property Inspector, including mute/Mono/active states.
- Supply hardware demo footage; export 1920 × 1080 MP4.
- Review final captures and confirm media rights and AI disclosure accuracy.
- Locate prior 0.9 rejection feedback; it was not visible in the Console.
- Authorize permanent deletion of the obsolete 0.9 draft so the exact product name can be reused with the current UUID.
- Install and smoke-check the exact v1.1.8 candidate before submission.
- Explicit approval before submission, and before publication.

## MAKER CONSOLE

- Existing draft has rejected version 0.9 dated August 3, 2026 and owns the name but is bound to legacy UUID `com.fionetworks.rme-totalmix-macos`.
- Replace all four legacy gallery images with current captures and demo. They contain obsolete visuals/claims (including three OSC controllers and a one-second 48V hold).
- After Chris authorizes deletion, remove the obsolete draft and create a clean product from the v1.1.8 candidate. The clean wizard accepts its current UUID, SDK 3 and DRM status; only the duplicate name blocks continuation today.
- Verify support/setup links, tags, AI disclosure and preview.
- Disable automatic publication, save draft if available, stop before submission.

## Asset provenance and use

Assets reuse the current repository’s category SVG mixer symbol and FiO dark/cyan palette from the Property Inspector. They contain no official RME or Elgato logo, no synthetic hardware, and no simulated application UI. Native SVG composition sources are retained; `source/render-assets.cjs` renders PNGs with Node and `sharp`.

The icon and thumbnail are finished artwork. Templates are explicitly marked **TEMPLATE — NOT FOR UPLOAD** and must be filled with real captures. Older project artwork was inspected and excluded because it depicted an earlier interface; no usable current hardware captures were found in the inspected project folders. Chris’s media review remains necessary before submission.

For each gallery SVG, the capture box is x=80, y=290, width=1760, height=540. Place the real capture inside it with preserved proportions, remove the capture instructions and amber footer, and export at 1920 × 960 PNG. Keep original captures separately so they can be reframed without quality loss.
