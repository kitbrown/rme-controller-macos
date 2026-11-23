# State Ledger

Updated: 2026-11-23 on the Stream Deck 8 compatibility branch. This is the current release authority; older candidate documents are historical.

## Current shipped baseline

- **CONFIRMED in source/artifact:** public v1.1.9, manifest 1.1.9.1, UUID `com.fionetworks.rme-globalosc`, Author FiO Networks; source `com.fionetworks.rme-globalosc.sdPlugin`.
- Final plugin source/profile/icon restoration: `a1c695d`; directly observed submission record: `c9ca040`. Both remain in Git history. Exact package and SHA-256: [PACKAGE.md](../marketplace/PACKAGE.md).
- **CONFIRMED submission observation, 2026-10-27:** same Maker Console product `4805d54d-4d34-4f36-b392-e4f86172c12b`, build 1.1.9.1 pending review; SDK 3+, DRM Yes, default profiles Yes. Automatic publication was OFF immediately before submission.
- **USER-CONFIRMED release outcome, 2026-11-05:** Chris reported Elgato approval and the first paid Marketplace sale. Approval/publication were not independently read from Maker Console because browser checks were blocked by lock/sign-in. The approval monitor was deleted after that report. Do not treat the historical pending-review snapshot as current.
- **UNKNOWN current account state:** price, exact publication timestamp, and current automatic-publication setting. No Marketplace/account changes are part of reconciliation.
- v1.1.8 publication/capture/profile tasks are **SUPERSEDED by v1.1.9**, not unfinished submission work. Historical PRs #4/#5/#6 are closed as superseded and must not be merged over this baseline.

## Stream Deck 8.0.0 beta compatibility work

Branch `compat/streamdeck-8.0.0-beta` starts at GitHub main `488256a94fd2218f868dfb2b2096f23cd7d0e33c` with the shipped plugin 1.1.9.1. The 8.0.0 version identifies the Elgato host. The v1.1.10.4 candidate remains on [draft PR #8](https://github.com/kitbrown/rme-controller-macos/pull/8) at `09a601b21cb0a218ceb75e7d75a4ea0bad3bee3a` for the comparison below.

**CONFIRMED offline on 2026-11-23.** The official macOS beta installer had SHA-256 `154eb9003882b7b62f780526a58b07e23da67c3407d8337640cf6019372342e2`. macOS reported a trusted notarization and Corsair installer signature. The extracted app reported bundle ID `com.elgato.StreamDeck`, version `8.0.0`, build `24357`. Inspection used the extracted files. The installed host reported 7.6.1. [Elgato beta changelog and installer](https://help.elgato.com/hc/en-us/articles/52924584789009-Stream-Deck-8-0-Beta-Changelog)

All six packaged v1.1.9 starter profiles matched device model IDs and controller types present in the beta’s factory profiles. Every assigned action resolved to the plugin manifest or the host’s built-in page navigation manifest. The same independent check passed for the six starters and six workflow profiles in the v1.1.10.4 candidate archive. Negative checks detected a 7.6.1 host and a missing next-page action. These checks inspect packaged data. Actual import, upgrade behavior and rendering require a running 8.0.0 host.

To repeat, download the macOS installer linked above. Use a fresh temporary directory for the expansion.

```sh
pkgutil --check-signature Stream_Deck_8.0.0.24357.pkg
beta_dir=$(mktemp -d)
pkgutil --expand-full Stream_Deck_8.0.0.24357.pkg "$beta_dir/expanded"
beta_app="$beta_dir/expanded/Stream_Deck.pkg/Payload/Applications/Stream Deck.app"
python3 tools/check-streamdeck-8-profiles.py "$beta_app"
```

From the repository root the checker defaults to the retained v1.1.9 package. Pass `--package "/path/to/candidate.streamDeckPlugin"` to check another archive. Separately, the eight shipped runtime suites passed with Node 24.22.1 using simulated Stream Deck and OSC events. All four profile tests, Elgato CLI manifest validation and the shipped-artifact verifier passed.

**UNKNOWN in the running beta.** Next, use a separate macOS test environment or a backed-up test installation. Record the host and plugin builds for each run.

1. Start the beta with an existing v1.1.9 profile and verify assignments, saved settings and plugin registration after restart. On a clean test profile, verify that the starter installs and opens with the expected keys and dials.
2. Open, edit and reopen a key and dial inspector. Check the saved target, snapshot captions and encoder strip against the profile. Capture startup errors or a rendering mismatch before changing anything.
3. On the UCX II and + XL, verify physical actuation, meter feedback and recovery on the beta. To compare v1.1.10.4, use its workflow profile and spare-input restoration procedure in PR #8. Record results for each plugin build independently.

## Completed evidence

See [v1.1.9 validation](../marketplace/v1.1.9/VALIDATION.md): eight Node 24 suites; four original profile tests; CLI validation/package checks; exact installed-package parity; native + XL profile population; 32 actual UCX II protocol control checks with acknowledged restoration, live audio peaks and channel names. Protocol checks supplied Stream Deck events through a test bridge and are not physical-actuation certification.

Final Marketplace photos/video, existing icon/thumbnail, descriptions/release notes and portable evidence are in `marketplace/v1.1.9/`. Media demonstrates unchanged controls and does not prove new-feature hardware acceptance.

## Remaining hardware validation (future work, not v1.1.8 release tasks)

- Physical key/encoder actuation and sustained interaction across all new processing controls; two-minute manual interaction and longer endurance/latency/visual-continuity checks were not repeated.
- Physical USB disconnect/reconnect and sleep/wake recovery were not repeated.
- Actual snapshot recalls for all eight user mixes were not repeated; software coverage is not hardware evidence.
- Phantom-power switching was not exercised; arrange a safe, explicit equipment-specific test before doing so. Audible Talkback still depends on actual routing/dim setup.
- Five other device models have automated layout/contract coverage, without equivalent native physical installation/rendering observation.
- Processing support/ranges remain device/channel specific. Numeric/boolean feedback gating must remain intact; finite UCX II checks do not certify every RME interface or channel.

Owner: next authorized engineer with Chris and appropriate connected equipment. Record exact environment, actions, observations and restorations in the existing validation record; keep UNKNOWN where untested. No new hardware tests were performed during reconciliation.

## Next authorized release workflow

1. Start from GitHub `main`, read this ledger, [validation](../marketplace/v1.1.9/VALIDATION.md), [profiles](STARTER-PROFILES.md) and [package identity](../marketplace/PACKAGE.md).
2. Verify retained shipped package/source/media with `python3 tools/verify-shipped-release.py`; run `npm test` under Node 24. Read-only profile checks are documented in validation. No build is needed to recover v1.1.9.
3. Retain immutable v1.1.9 package and versioned assets. Do not upload `release/` or root `marketplace/candidate/` historical packages. Do not run the historical hardware harnesses without an authorized safe hardware session.
4. For an explicitly requested future version, use a new branch, preserve existing controls/profiles, choose an authorized version, validate impact and record hardware gaps honestly. Never re-upload the shipped artifact as a new release or enable automatic publication without authorization.
5. CI validates source/tests and immutable package parity; it does not render icons or package/install/publish. A future release must explicitly update its versioned records and packaging procedure.

## Reconciliation, 2026-11-14

User authorized documentation/source integration into main, GitHub updates and closure of superseded drafts; no rebuild or Marketplace changes. Preserve the shipped source/package byte-for-byte. Reconciliation checks: all eight suites pass under Node 24.22.3; three read-only profile tests pass; CLI validation passes. Package SHA-256 and original plugin tree remain unchanged. Source/archive parity excludes packaging-control `.sdignore` and accounts only for the CLI-stripped manifest final newline. Existing source history is merged, not squashed, so baseline-pinned profile tests remain reproducible in a full clone. PR #7 merged as `cddab6eb88e6c3e9f7f0d7622a281999632513db`; drafts #4/#5/#6 closed as superseded. Both branch and PR CI passed the runtime, immutable-artifact and read-only profile checks. Remote verification is recorded in the reconciliation PR and final chat handoff. The release tag `v1.1.9` identifies the reconciled source/records; it does not represent another Marketplace upload.

---

# Historical ledger — 2026-10-11 (superseded)

The entries below are dated provenance, not current tasks, release status or upload instructions.

# State Ledger

Updated: 2026-10-11

## Confirmed

- v1.1.7 is merged to `main` as commit `bb7b2d5df110079cd4486d8caa34f451cfecf621`.
- GitHub Actions run 19 passed the complete Node 24 automated test suite and current Elgato CLI validation for v1.1.7.
- Local release-candidate validation on 2026-10-11 passed all three Node test suites and `streamdeck validate` with the current Elgato CLI.
- The corrected v1.1.7 package was created from the release source, inspected against the source tree, and installed on the Mac. It is 48,030 bytes with SHA-256 `c4b3dbc654cd5b2a591b4327f10862daa71109757b794c6190e366d56160bcfe`.
- The corrected installed files report version `1.1.7.0`, and their runtime matches the corrected package. A clean Stream Deck 7.5.1 restart on 2026-10-11 loaded and verified the preceding Mono/overflow correction; the final semantic-label package was subsequently reloaded and accepted by the user, as recorded below.
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
- Maker Console rejected the v1.1.7 manifest as SDK 2 / DRM disabled. The v1.1.8 candidate changes only `Version` and `SDKVersion`; all runtime and UI files are unchanged.
- v1.1.8 passes all three automated suites and Stream Deck CLI 1.9.0 validation. Maker Console recognizes SDK 3 and DRM enabled.
- Chris approved permanent removal of the obsolete rejected 0.9 Marketplace product, and it was deleted. A replacement draft now exists for current UUID `com.fionetworks.rme-globalosc` as Maker Console product `4805d54d-4d34-4f36-b392-e4f86172c12b`.
- The replacement draft has the final description, English/Audio/Free details, support/setup links, icon and thumbnail. Its gallery and version table remain incomplete; no submission or publication occurred.
- Installed files match the v1.1.8 candidate archive file-for-file. Stream Deck 7.5.1 launched it as version `1.1.8.0`, logged `Plugin connected`, and the plugin bound UDP port 9008.

## Remaining Marketplace work

- COMPLETE: publication copy, support/non-affiliation wording, AI disclosure, version/package identity, 288 px icon, 1920 × 960 thumbnail, three gallery templates and capture/video shot list are prepared in `marketplace/`.
- REQUIRES CHRIS: real captures, hardware demo, final media/provenance review and explicit submission/publication approval.
- COMPLETE in Maker Console: FiO Networks account verified; obsolete 0.9 product deleted with authorization; clean current-UUID draft created; listing and support/setup links saved; icon/thumbnail uploaded; v1.1.8 SDK 3/DRM compatibility verified. No submission.
- COMPLETE locally: exact v1.1.8 startup, Stream Deck connection and UDP 9008 binding smoke checks.
- REQUIRES CHRIS: confirm one physical dial and key during capture, then complete real gallery/video and final media/provenance review.
- MAKER CONSOLE remaining: add current gallery/video, create the 1.1.8 version, disable automatic publication, and submit only with Chris approval; see `marketplace/MAKER-CONSOLE.md`.
- Accepted v1.1.7 runtime behavior remains unchanged; v1.1.8 contains manifest metadata only.

## Intentionally deferred

- Audible Talkback routing depends on the user's TotalMix routing and dim-depth configuration.
- Automated validation does not switch phantom power on connected equipment.
- Long-duration unplug/replug behavior remains a soak-test item rather than a release blocker.

## Source of truth

The validated implementation is `com.fionetworks.rme-globalosc.sdPlugin`. v1.1.8 adds Marketplace-only manifest metadata to the accepted v1.1.7 runtime. Older `com.chris.*` and legacy `rme-totalmix-macos` bundles are not release baselines.
