# Maker Console — observed state and remaining steps

Checked live on 2026-10-11 after Chris signed in.

## COMPLETE

- Organization **FiO Networks** exactly matches the manifest author.
- Existing product **RME Controller for macOS** is **Draft**, with **Rejected · 0.9**, last updated August 3, 2026. No duplicate product was created.
- General: final description saved, including requirements, independence wording and AI-use disclosure; Support and Setup Guide links saved. English, Audio and Free retained.
- Media: new 288 px icon and 1920 × 960 thumbnail uploaded successfully.
- Versions → Create version: accepted package parsed as `com.fionetworks.rme-globalosc`, `1.1.7.0`, macOS 13+, Stream Deck 7.1+, SDK 2, dials supported, DRM disabled. No validation error was displayed. This is parsing, not Elgato review approval.
- Final release notes entered and automatic publication switched off in the open Create version form. **Submit for review was not clicked.** There is no separate Save draft button in this form; package/notes are staged in the open browser only and may need re-entry after navigation or refresh. The persisted version list remains 0.9. The Submit for review button remained disabled with no explanatory validation error visible; its cause is unconfirmed.

## REQUIRES CHRIS

- Capture three current gallery images and a functional hardware demo using [CAPTURE-CHECKLIST.md](CAPTURE-CHECKLIST.md).
- Locate the rejection email for 0.9 and ensure any applicable reviewer requests are addressed. The Console showed the status but no rejection reason. A focused connected-mail search found no matching message. An old description said a video had been emailed; it was not available here and does not establish acceptance of v1.1.7.
- Review final media and AI provenance; approve submission explicitly when ready.

## Exact remaining MAKER CONSOLE steps

1. Continue the [existing product](https://maker.elgato.com/8e915638-e18c-4e54-a55d-3b2f206fa00a/products/adcc2259-18ea-45d7-909d-ff79c90bb1b6). Do not create another product or rename the frozen UUID.
2. Media: replace the four legacy gallery items with the three finished real-capture images and the hardware demo. Existing images describe outdated visuals, a three-controller OSC setup and a one-second 48V hold; they must not accompany v1.1.7. They were left in place pending replacements; no placeholder gallery was uploaded.
3. Use 1920 × 960 PNGs under 10 MB each, and 1920 × 1080 MP4 **under 50 MB**, per the live form. The icon/thumbnail are already within their 2 MB / 5 MB limits. Do not rely on the looser 250 MB published video guideline.
4. Versions → Create version: if the staged form is gone, upload `release/com.fionetworks.rme-globalosc.streamDeckPlugin` again and paste `release-notes.txt`. Check the hash in `PACKAGE.md` and metadata above. Preserve DRM/package behavior unless Elgato reports a concrete blocker.
5. Check **Automatically publish after being approved** is OFF. A freshly opened form defaulted to ON, so recheck every time. Review description, support/setup links, all gallery items and the AI disclosure. Use the fuller disclosure in `LISTING.md` if Elgato requests reviewer notes; no separate AI field was visible in the inspected forms.
6. After replacing media and reviewing prior feedback, inspect any remaining reason the submission control is disabled; do not infer a runtime defect from the disabled control alone. Stop before **Submit for review** until Chris explicitly approves. Only then submit. After approval by Elgato, obtain Chris’s separate authorization before **Publish**.

No review submission or publication was performed. Draft metadata/media saves are separate from version submission.
