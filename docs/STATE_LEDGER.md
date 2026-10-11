# State Ledger

Updated: 2026-10-11

## Confirmed

- v1.1.7 is merged to `main` as commit `bb7b2d5df110079cd4486d8caa34f451cfecf621`.
- GitHub Actions run 19 passed the complete Node 24 automated test suite and current Elgato CLI validation for v1.1.7.
- Local release-candidate validation on 2026-10-11 passed all three Node test suites and `streamdeck validate` with the current Elgato CLI.
- The corrected v1.1.7 package was created from the release source, inspected against the source tree, and installed on the Mac. It is 48,030 bytes with SHA-256 `c4b3dbc654cd5b2a591b4327f10862daa71109757b794c6190e366d56160bcfe`.
- The corrected installed files report version `1.1.7.0`, and their runtime matches the corrected package. A clean Stream Deck 7.5.1 restart on 2026-10-11 loaded and verified the preceding Mono/overflow correction; the final semantic-label package is installed on disk and requires one plugin reload.
- The manifest plugin icons were corrected to the current required 256 × 256 and 512 × 512 PNG sizes before the final package was produced.
- v1.1.7 adds the FiO console-style visual system, semantic key/touch-strip colors, dynamic SVG key artwork, dedicated monochrome SVG category/action icons, and Property Inspector validation.
- The Mono preset now uses TotalMix's `/controlroom/mainmono` address. The previously configured `/controlroom/mono` address never received initial feedback and caused Stream Deck's error alert on the third key.
- Control Toggle keys clear Stream Deck's separate title overlay and use the compact label already rendered in their dynamic SVG artwork, preventing long labels from spilling outside the key.
- Key state captions are semantic: mute controls show `MUTE OFF` or `MUTED`; Mono shows `STEREO` or `MONO`; Dim shows `FULL` or `DIMMED`; 48V, Talkback, and snapshots use similarly explicit states.
- After the final plugin reload on 2026-10-11, the user confirmed the visible controls work, including the corrected labels; no Mono alert, overflowing toggle label, or control stuck on `SYNCING` was reported.
- Other OSC routing, synchronization, and command semantics are unchanged.
- v1.1.6 functionality remains included: Core Audio, Mic 1, TV SPDIF, SPDIF output, Mono, dedicated SPDIF mute controls, and momentary Talkback + Dim, while retaining the earlier general presets.

- This is the Global OSC product; the legacy page/bank implementation is rejected.
- The release uses direct TotalMix addressing with no bank switching or pre-command architecture.
- Bidirectional UDP OSC feedback is implemented.
- OSC float, integer, string, boolean, and bundle decoding is implemented locally.
- The runtime has no third-party dependencies or compilation step.
- Elgato CLI validation passes without warnings in CI.
- Prior live validation established Stream Deck / TotalMix startup, complete `/sendall` state, all six default encoder mappings, mute guards/red states, and Main/Phones/Mic/Dim button behavior.
- The default transport is `127.0.0.1`, TotalMix port `7008`, plugin port `9008`.

## Remaining Marketplace work

- Capture the required Marketplace app icon, thumbnail, gallery media, and hardware-integration demonstration video from the real installed build, then complete Maker Console submission.

## Intentionally deferred

- Audible Talkback routing depends on the user's TotalMix routing and dim-depth configuration.
- Automated validation does not switch phantom power on connected equipment.
- Long-duration unplug/replug behavior remains a soak-test item rather than a release blocker.

## Source of truth

The validated implementation is `com.fionetworks.rme-globalosc.sdPlugin` on current `main`. Older `com.chris.*` and legacy `rme-totalmix-macos` bundles are not release baselines.
