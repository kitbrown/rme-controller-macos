# v1.1.9 submission validation — 2026-10-27

**Released per Chris's 2026-11-05 confirmation of approval and first paid sale.** Technical evidence below remains the bounded 2026-10-27 validation; release approval does not convert untested hardware cases into passes. See the [state ledger](../../docs/STATE_LEDGER.md). No rebuild, reinstall or new hardware test during 2026-11-14 reconciliation.

## Exact artifact

- Public release: 1.1.9; manifest build: 1.1.9.1.
- UUID: `com.fionetworks.rme-globalosc`; Author: FiO Networks.
- File: `marketplace/v1.1.9/candidate/com.fionetworks.rme-globalosc.streamDeckPlugin`.
- Size: 134,106 bytes.
- SHA-256: `8b2b0f08db4327d9b4796a41c7203503bf19b60bc2315789cb0afe87e3a8cb0f`.
- Source base: `9f0a413b5b7a5b6c8b61e7159c9764afff45eacd` (feature/console-ui-improvements).
- `bin/`, `ui/`, action definitions, and existing control artwork match that base byte-for-byte. Only the approved CI-generated main app icons, six restored profiles, and build revision change the plugin package.

## Automated and installation evidence

- Node 24.22.1: all eight `npm test` suites pass, including legacy mappings, race/reconnect/mute guards, snapshots, live-meter decoding, processing feedback gates, channel names and key colors.
- `python3 test/starter-profiles-test.py`: four tests pass, covering every model's complete mappings/page references, profile reproducibility, preserved runtime/UI/action contracts and exact CI icon hashes.
- `streamdeck validate ... --no-update-check`: pass.
- `streamdeck pack ... --no-update-check`: pass.
- Native Stream Deck 7.6.0 upgrade: AllOk; runtime connected. Installed files equal the exact candidate archive.
- Native import of bundled + XL profile: all 16 keys and six dials populate, then real TotalMix values appear. Temporary imported copy removed afterward.
- Existing user profile configurations remain unchanged. Stream Deck updated plugin version bookkeeping, serialized controller arrays in a different order on restart, and persisted live action State values; the final comparison normalized those three runtime details and found no configuration changes. User-added pages/actions remain present.
- Profiles for the other five device models have automated contract/layout coverage; those physical models were not available.

## Real hardware scope

Fireface UCX II, TotalMix Global OSC, local UDP 7008/9008. Production candidate runtime and actual hardware traffic were used with a test bridge supplying Stream Deck events. This is real hardware protocol integration, not certification of physical button/encoder actuation.

- Six retained faders: command, hardware acknowledgement and restoration passed (Main, Phones, SPDIF output, Mic, playback, SPDIF input).
- All thirteen new parameters: command, acknowledgement and restoration passed (submix pan, output balance, three EQ gains, three EQ frequencies, compressor threshold/ratio/makeup, reverb/echo volumes).
- Seven retained toggles: hardware acknowledgement and restoration passed (Main/Mic/TV-SPDIF/SPDIF-output/Phones mute, Dim, Mono).
- Six processing switches: acknowledgement and restoration passed (EQ, dynamics, low cut, auto level on unused input 2; reverb and echo global enable).
- Real varying audio peaks received on `/level/in`, `/level/pb`, `/level/out`; observed Mic -34.59 dBFS, playback -8.05 dBFS and Main -25.59 dBFS in one bounded sample. These are observations, not calibration claims.
- 28 hardware channel names received; OSC Connection Monitor rendered RX LIVE.
- Native Stream Deck was restarted and returned to real feedback. Existing vertical peak meter rendered in the preserved working profile.
- Enabled TotalMix's previously-off Send Level Data option, as required for the actual peak meter.
- Every modified mixer value was restored and acknowledged by hardware; 19 numeric changes/restorations were independently checked against recorded results with <0.001 tolerance.

Not repeated: phantom-power switching, snapshot recall of all user mixes, physical USB unplug/replug, sleep/wake, and two-minute manual physical actuation. These are not claimed as current acceptance. Existing regression suites cover their relevant software paths; old physical acceptance remains historical.

Portable result records, historical harness sources and hashes are retained in [evidence/](evidence/README.md). Original raw local evidence and initial failed attempts remain outside the repository in `../submission-evidence/v1.1.9-restored-profiles/`; private user-profile backups and mixer-state dumps are intentionally not published. Initial harness failures were a developer-mode-only CLI stop refusal/port conflict, a test instrumentation buffer-shape error, and an incorrect test expectation for TotalMix's -300 dB infinity sentinel. They were not plugin defects and were preserved before the bounded successful tests. No runtime code was changed to resolve them.

## Maker Console preparation

Existing FiO Networks product reused. Console recognized build 1.1.9.1, SDK 3 or later, DRM Yes, + dials Yes, and default profiles Yes. Automatic publication OFF. Release notes entered. Description updated with profile installation instructions and AI disclosure. New 288px icon uploaded; matching 1920x960 thumbnail/gallery cover updated. Three completed real hardware gallery photographs and 16:9 demonstration video retained for unchanged controls; they are not labeled as new-feature footage.

## Reviewer cases

Positive cases: install the device-matched starter profile; observe live Main/Phones/submix values; change a fader and confirm bidirectional feedback; enable Send Level Data and observe actual peaks; use a feedback-confirmed processing dial and channel-name picker.

Negative cases: an unknown processing path must remain gated; muted fader rotation must not change level; disconnected/stale feedback must block unsafe controls and recover after feedback returns. Automated suites pass these cases; finite live checks above provide the specifically stated hardware evidence.

Submission directly confirmed: **Pending review · 1.1.9.1**, after the successful upload notification. Automatic publication was OFF at submission; no publish action was performed. See MAKER-CONSOLE-UPLOAD.md.

## Reconciliation checks — 2026-11-14

No plugin, profile, icon or package regeneration. Run `python3 tools/verify-shipped-release.py` for source/archive file-set and byte parity (excluding packaging-control `.sdignore` and the CLI-stripped manifest final newline) plus SDK/version/profile metadata and retained-media/evidence SHA-256 checks. Runtime regressions use `npm test` under Node 24. Profile checks without rebuilding profiles:

```sh
python3 test/starter-profiles-test.py StarterProfiles.test_existing_runtime_ui_and_actions_unchanged
python3 test/starter-profiles-test.py StarterProfiles.test_new_icons_match_validated_ci_build
python3 test/starter-profiles-test.py StarterProfiles.test_all_profiles_resolve_fit_and_preserve_control_settings
```

The original reproducibility test regenerates profiles, so it is intentionally not rerun for this no-rebuild reconciliation. Historical four-test success is retained above. CI runs only the three read-only profile checks, runtime regressions and immutable artifact verification. It never packages, installs, renders or publishes.

Reconciliation result: PASS under Node 24.22.3 (all eight suites), PASS for all three read-only profile tests, and PASS for local Elgato CLI validation with `--no-update-check`. Shipped plugin/profile/icon/package/copy files are unchanged from `c9ca040`. Source/archive parity excludes only packaging-control `.sdignore` and normalizes the CLI-stripped final newline of manifest.json; all packaged runtime/UI/icon/profile bytes match exactly. No regeneration, installation, Marketplace change or new hardware test was performed. Retained output: `evidence/reconciliation-*.txt`.
