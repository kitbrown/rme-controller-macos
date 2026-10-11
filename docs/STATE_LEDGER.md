# State Ledger

Updated: 2026-10-11

## Confirmed

- v1.1.7 is merged to `main` as commit `bb7b2d5df110079cd4486d8caa34f451cfecf621`.
- GitHub Actions run 19 passed the complete Node 24 automated test suite and current Elgato CLI validation for v1.1.7.
- Local release-candidate validation on 2026-10-11 passed all three Node test suites and `streamdeck validate` with the current Elgato CLI.
- The final v1.1.7 package was created from current `main`, inspected against the source tree, and installed on the Mac. It is 47,869 bytes with SHA-256 `0c8676a0f642f4ffbe0601c4209e4561b8cfa5aa8367dbe367989e608439a9c9`.
- The installed package reports version `1.1.7.0`; its manifest and runtime hashes match the package, all four actions are registered, the plugin connected after a clean Stream Deck 7.5.1 restart, and its UDP receiver is bound on port 9008 while TotalMix is running.
- The manifest plugin icons were corrected to the current required 256 × 256 and 512 × 512 PNG sizes before the final package was produced.
- v1.1.7 adds the FiO console-style visual system, semantic key/touch-strip colors, dynamic SVG key artwork, dedicated monochrome SVG category/action icons, and Property Inspector validation.
- No OSC routing, synchronization, or command semantics were intentionally changed in v1.1.7.
- v1.1.6 functionality remains included: Core Audio, Mic 1, TV SPDIF, SPDIF output, Mono, dedicated SPDIF mute controls, and momentary Talkback + Dim, while retaining the earlier general presets.

- This is the Global OSC product; the legacy page/bank implementation is rejected.
- The release uses direct TotalMix addressing with no bank switching or pre-command architecture.
- Bidirectional UDP OSC feedback is implemented.
- OSC float, integer, string, boolean, and bundle decoding is implemented locally.
- The runtime has no third-party dependencies or compilation step.
- Elgato CLI validation passes without warnings in CI.
- Prior live validation established Stream Deck / TotalMix startup, complete `/sendall` state, all six default encoder mappings, mute guards/red states, and Main/Phones/Mic/Dim button behavior.
- The default transport is `127.0.0.1`, TotalMix port `7008`, plugin port `9008`.

## Remaining release gate

- Restart Stream Deck once after the final icon-size-only package replacement and visually confirm all assigned controls leave `SYNCING`; the sandbox cannot inspect the rendered hardware state.
- Run the user's short live acceptance pass for the v1.1.7 visual changes and the new v1.1.6 controls that have not yet been physically rechecked.
- Capture the required Marketplace app icon, thumbnail, gallery media, and hardware-integration demonstration video from the real installed build, then complete Maker Console submission.

## Intentionally deferred

- Audible Talkback routing depends on the user's TotalMix routing and dim-depth configuration.
- Automated validation does not switch phantom power on connected equipment.
- Long-duration unplug/replug behavior remains a soak-test item rather than a release blocker.

## Source of truth

The validated implementation is `com.fionetworks.rme-globalosc.sdPlugin` on current `main`. Older `com.chris.*` and legacy `rme-totalmix-macos` bundles are not release baselines.
