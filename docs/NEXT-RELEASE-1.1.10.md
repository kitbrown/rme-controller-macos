# v1.1.10 preparation — Stream Deck 7.6.1

## Current candidate 1.1.10.1 · November 22, 2026

The optional workflow profile for each model now ends with **Recipes**. The new **Apply Input Processing** action reads the selected input on each press, writes only changed values, waits for each acknowledgment and enables the processor last. A second read verifies the result after writes. Configuration and presets are described in the [setup guide](../README.md#one-touch-processing). The shipped starter profile files retain their original bytes.

Local checks passed on Node 24.22.1: nine runtime suites, four profile tests including deterministic regeneration, browser settings form edit/validation, CLI validation and pack, [candidate checksum](../marketplace/v1.1.10/candidate/SHA256SUMS) and source parity for 49 files. The retained v1.1.9 package and inventory passed their independent check. Simulated feedback covered both EQ shapes, compressor write ordering and types, missing feedback, double presses, idempotence, timeout after a partial write, wrong source, competing recipe keys, disconnect, reconfiguration, removal and final readback disagreement.

**Hardware session.** Use a spare input. Record its band 2 frequency/gain/shape/width, EQ enable, compressor threshold/ratio and Dynamics enable before pressing a recipe. Observe each target in TotalMix, repeat for MATCHES, check unrelated settings and routes, audition at a suitable level, and restore the recorded values and switches. Confirm actual interface rounding, timeout behavior and available feedback. The native profile, display and recovery checks below also remain open. The earlier v1.1.10.0 package is recoverable from commit `1545d94`.

## Historical candidate 1.1.10.0 · November 21, 2026

Chris authorized implementation and hardware-free verification. The draft contains typography and artwork refinements, touch-strip and inspector polish, the setup help button and six optional workflow profiles. The headless [comparison sheet](evidence/v1.1.10-candidate/key-preview.png) shows the actual SVG renderer with sample data. DIN Alternate uses local font resolution with Helvetica Neue and Arial fallbacks. Short key tokens retain the 24-unit maximum, longer tokens use 18 and status uses 12–15 on the original 144-unit canvas. Snapshots reserve the lower rail for Stream Deck’s title and edited marker. The six original starters match the shipped bytes.

**Verified offline.** Eight runtime suites passed on the host’s Node 24.22.1. Four profile/contract tests passed, including deterministic regeneration. A headless Chromium check measured the bounds of the 12-wide-letter channel label. The Elgato CLI validated and packed the [candidate](https://github.com/kitbrown/rme-controller-macos/tree/1545d94/marketplace/v1.1.10/candidate), and its [checksum](https://github.com/kitbrown/rme-controller-macos/blob/1545d94/marketplace/v1.1.10/candidate/SHA256SUMS) and all 47 files match the checkout after the CLI’s manifest newline removal. Run `npm test`, `python3 test/starter-profiles-test.py`, `python3 tools/verify-candidate.py` and `python3 tools/verify-shipped-release.py` from a full clone.

**Next hardware session.** Back up the active setup, install this exact package and import the matching optional workflow profile. Compare original page and control mappings before/after. Check all page transitions, key and touch-strip text at viewing distance, native snapshot titles including the edited marker, receiving and losing feedback, actual stereo peaks, and safe dial/button operations with restoration. Verify reconnect and sleep/wake separately. Record the tested models and leave the other [physical validation gaps](STATE_LEDGER.md) open.

## Historical November 20 preparation record

The following records the scope and results before implementation authorization.

Updated: 2026-11-20. **PREPARATION ONLY — no implementation or release authorization.**

The authoritative shipped baseline remains [STATE_LEDGER.md](STATE_LEDGER.md): public v1.1.9, manifest 1.1.9.1, Git main/tag `488256a94fd2218f868dfb2b2096f23cd7d0e33c`. This document scopes future work; it does not supersede the shipped validation record or authorize a new upload.

## Authorization and stop boundary

Chris allowed work toward v1.1.10 with GitHub kept up to date, while explicitly requiring no changes without his authorization and reporting no connected RME hardware. This checkpoint is limited to source/vendor review, read-only local observations, isolated software tests, planning documentation and a separate draft PR.

Do not modify plugin runtime/UI/manifest, icons, profiles, installed user configuration or shipped artifacts at this stage. Do not bump the package version, merge this preparation into main, build/install a candidate, run live TotalMix harnesses, change pricing/listing/publication settings or submit a version. Wait for Chris's explicit implementation scope. No background continuation or new monitor is authorized by this plan.

## Current evidence

| Classification | Finding | Practical limit |
|---|---|---|
| CONFIRMED locally | Stream Deck 7.6.1, build 23033 is installed and was running on 2026-11-20 | One Mac/environment; not a universal compatibility claim |
| CONFIRMED locally | Installed plugin reports 1.1.9.1, SDK 3, Node 24, six profiles; all 40 archived package files match installed bytes | Does not prove hardware control or native profile reinstallation |
| CONFIRMED existing log | Stream Deck startup and `[com.fionetworks.rme-globalosc] Plugin connected` | Existing host-session observation; no restart induced and no claim of TotalMix handshake |
| CONFIRMED software checks | All eight runtime suites pass under host-bundled Node 24.22.1; three read-only profile tests pass; shipped artifact verifier passes | Isolated/synthetic loopback OSC plus source/archive checks, not RME hardware acceptance |
| USER REPORTED | Three Marketplace sales as of 2026-11-20 | No customer identities, revenue, current price or account state queried |
| UNKNOWN | Physical controls, rendering, audio peak responsiveness and disconnect/sleep recovery on 7.6.1 | RME hardware unavailable; no new physical or end-to-end acceptance |

Evidence: [environment observation](evidence/v1.1.10-preparation-2026-11-20/environment-observation.json), [Node tests](evidence/v1.1.10-preparation-2026-11-20/node24-runtime-tests.txt), [profile checks](evidence/v1.1.10-preparation-2026-11-20/profile-contract-tests.txt), [artifact verification](evidence/v1.1.10-preparation-2026-11-20/shipped-artifact-verification.txt). Runtime tests deliberately use isolated test endpoints rather than production UDP 7008/9008. No profile regeneration test was run.

## Vendor changes and implications

Sources checked 2026-11-20:

- [Official Stream Deck 7.6.1 release notes](https://help.elgato.com/hc/en-us/articles/52643738310417-Elgato-Stream-Deck-7-6-1-Release-Notes): maintenance fixes include device initialization, malformed/missing Node manifest startup, second-state linked titles, category ordering persistence and macOS logout/shutdown crashes. These are host fixes, not confirmed defects in this plugin.
- [Official plugin runtime environment](https://docs.elgato.com/streamdeck/sdk/introduction/plugin-environment/): the 7.6 environment supports Node 24.22.1 and Chromium 140. The shipped plugin explicitly selects Node 24; no runtime migration is proposed.
- [Official SDK host changelog](https://docs.elgato.com/streamdeck/sdk/references/changelog/): 7.6 adds Neo Infobar support. This is an optional future feature, not a requirement or a committed v1.1.10 feature. The existing Neo starter profile remains a key layout.

Assessment: no mandatory migration or reproducible plugin defect was identified in this bounded review. A host patch alone does not justify inventing a plugin change or advertising a new release.

## Proposed scope for Chris to choose

1. **Compatibility/quality pass:** finish the focused host checks below, retain controls/artwork and onboard existing profiles without surprises. Only fix evidenced regressions. A clean result may require no plugin update.
2. **Optional support entry point:** source manifest currently has no root `SupportURL`. Assess adding the verified public setup/support link so customers can reach help from the Property Inspector. This is a usability proposal, not a missing Marketplace requirement or an implemented feature. Confirm destination and scope before editing.
3. **Defer expansion:** Neo Infobar, new controls, routing changes and redesign are not approved. Do not include them merely because the host supports them.

No selected implementation scope or finalized v1.1.10 release notes exist yet. Public v1.1.10 / manifest 1.1.10.0 is a possible version pairing, not a generated or installed candidate. Preserve the current minimum supported host/macOS versions unless an actual approved feature requires a change.

## Focused acceptance plan (not executed hardware tests)

| Area | Procedure when authorized and equipment is available | Pass evidence |
|---|---|---|
| Existing layouts | Export a private backup; compare action/settings/page mappings before/after a separately approved upgrade | Original user configuration preserved; bookkeeping/live state differences identified explicitly |
| Profile onboarding | In a controlled installation session, accept the matched profile; on upgrade, verify import instructions without replacing the user's working profile | Populated model-matched actions, navigation and dials; no duplicate/destructive profile change |
| Linked titles and key states | Observe inactive/active toggle and snapshot labels on the native device and Property Inspector | No second-state title loss, unwanted overlay or altered artwork; software tests alone are insufficient |
| Dials and meters | On safe selected channels verify values/feedback, muted-rotation guard, live names, actual audio peaks and observed response | Actual bidirectional acknowledgements and restored mixer state; meter follows audio, not fader position |
| Host/device recovery | Separately authorized host restart, USB reconnect and sleep/wake with saved configuration | Plugin reconnects, receives fresh feedback and resumes safely without stale writes |
| Processing | Test supported device/channel parameters only after exact feedback is observed | Numeric/boolean readiness gating remains intact; each change is acknowledged and restored |
| Broader acceptance | Carry forward [existing hardware gaps](STATE_LEDGER.md#remaining-hardware-validation-future-work-not-v118-release-tasks) | All eight real snapshot recalls, safe phantom power/Talkback and other physical models remain UNKNOWN until specifically tested |

Avoid destructive operations on active audio routes. Do not recall user mixes, toggle phantom power or change system power/USB state without a suitable authorized test session. Use original scoped result/restoration records as reference, not as proof that a different host or device passed.

## Engineering prerequisites for an authorized implementation

- Branch from current remote main, reconfirm clean state and preserve original shipped files, retained media and the `v1.1.9` tag. Keep the exact 134,106-byte archive immutable.
- Current `tools/verify-shipped-release.py` intentionally compares the working plugin to v1.1.9, and the baseline-pinned profile test requires manifest 1.1.9.1. Once a future candidate is explicitly approved, update validation deliberately to distinguish immutable old-release integrity from new-candidate source parity. Do not weaken/remove the old checksum or silently normalize additional differences to make CI pass.
- Preserve full Git history: profile regression tests read baseline `9f0a413`. CI already uses `fetch-depth: 0` and performs no packaging/rendering.
- Use Node 24 software regressions first. Add tests only for actual changed behavior; retain legacy OSC/mute guards, processing gates, snapshot numbers, existing artwork and six model profiles.
- A new candidate needs its own versioned package/validation/copy and a specifically authorized packaging/installation session. Current preparation creates none.
- Keep GitHub updated with bounded commits and accurate draft PR status. Merge, Marketplace submission and publication require later explicit authorization.

## Reproduce the completed read-only checks

From a full clone, use Node 24 (local host used 24.22.1):

```sh
node --version
npm test
python3 tools/verify-shipped-release.py
python3 test/starter-profiles-test.py StarterProfiles.test_existing_runtime_ui_and_actions_unchanged StarterProfiles.test_new_icons_match_validated_ci_build StarterProfiles.test_all_profiles_resolve_fit_and_preserve_control_settings
```

Do not run `test_rebuild_is_reproducible` in this no-regeneration checkpoint; it invokes the profile builder. No new tests or code fixes were necessary for this preparation.
