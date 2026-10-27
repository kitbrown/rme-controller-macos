# RME Console Surface — Unreleased Test Build 1.1.8.4

Production version **1.1.8.0** remains unchanged and under Marketplace review. This branch is an independent candidate with a higher **test-only** version to prevent same-version installation conflicts; it is not a new public release.

## Status color palette — graphics unchanged

- **CONFIRMED:** Snapshot keys (1–8) use violet `#c88cff` while inactive.
- **CONFIRMED:** Mute keys (including custom OSC paths ending in `/mute`) use cyan `#38d9ff` while inactive.
- **CONFIRMED:** Other toggle controls (Dim, Mono, Talkback, 48V, custom non-mute controls) use green `#58e6a9` while inactive.
- **CONFIRMED:** All key categories display red `#ff5d69` when active, preserving their original shapes, text, SVG positioning, and OSC logic.
- **CONFIRMED:** Automated cases assert every snapshot, preset class, custom mute and non-mute appearance, and active red.
- **UNKNOWN:** Visual appearance and readability on physical Stream Deck keys until hardware acceptance.
- **REJECTED:** Any redesign of key imagery, typography, layouts or changes to the submitted Marketplace version.

## State ledger

| Evidence | Statement |
|---|---|
| CONFIRMED | `feature/console-surface-next` contains the premium mixer-console key artwork, custom dial feedback and new Live Channel Fader action. |
| CONFIRMED | **Live audio meter** now uses TotalMix Global OSC **audio peak** paths: `/level/out/N`, `/level/in/N`, `/level/pb/N`. The previous `/output/N/volume` fader-position implementation is rejected. |
| CONFIRMED | The selected channel and output/mix preset remain configurable per button; all OSC transport defaults are unchanged (`127.0.0.1`, `7008`, `9008`). |
| CONFIRMED | The live meter draws a continuous, unlabeled vertical fill across 1–4 keys, bottom key position 1; the top is 0 dBFS, configurable meter floor defaults to -60 dBFS. |
| CONFIRMED | Optional stereo mode displays the higher instantaneous peak of two consecutive absolute OSC channels. Selected channel-only mode remains available. |
| CONFIRMED | Audio signal amplitude is separate from fader settings and mute states. A genuine 0 dBFS peak indicates clipping and turns the meter red. |
| CONFIRMED | Visual meter actions are read-only and never send fader or mute commands. |
| CONFIRMED | CI covers direct UDP /level readings, independent input/playback/output selectors, stereo aggregation, 3/4-key artwork, read-only safety, and original OSC regressions. |
| CONFIRMED | Elgato CLI validation and packaging run through GitHub Actions on macOS. |
| UNKNOWN | Actual device peak feedback rate, values, timing, image alignment and activity on this user's UCX II with the current TotalMix version. |
| UNKNOWN | User acceptance of the new artwork and installed Property Inspector configuration. |
| REJECTED | Displaying fader position as an audio meter, synthetic audio amplitude, per-key labels, or separate meters in the vertical stack. |
| REJECTED | Publication or merge before device acceptance and explicit authorization. |

## Required TotalMix setup

Open **TotalMix FX → Options → Settings → OSC** for the **same** Global OSC remote controller configured with local incoming port **7008** and outgoing port **9008**. In **Details**, enable **Send Level Messages** (also referred to as Send Peak Level Data in some interfaces). Leave **Send changes** and **Send status** enabled. Enable OSC control from TotalMix Options.

The meter depends on real streaming level feedback; static fader-state replies and `/sendall` are insufficient. No audio waveform capture or CoreAudio loopback is used.

## Three-key Live Audio Peak Meter

1. Export/back up the current Stream Deck profile. Installing the test candidate keeps the same plugin UUID and may replace the locally installed plugin.
2. Install the CI-generated **UNRELEASED** candidate `1.1.8.4` when ready for hardware acceptance.
3. On Page 3, place three **Live Channel Fader** actions on consecutive vertically aligned keys.
4. For each: **Channel type** = Hardware output, **Preset** = Control Room — Main (or choose another source independently), **On key press** = Live audio peak meter, **Stack height** = 3, **Meter floor** = -60 dBFS, and **Meter channels** = Selected channel (or select Selected + next channel for stereo maximum). The three buttons must use matching source, meter floor, channels and transport settings.
5. Set **Position in stack** to **3 top, 2 middle, 1 bottom**.
6. Play audio and confirm meter animation follows the live audio, regardless of the fader's value (except when fader changes affect the actual post-fader output audio). Test stop/silence and near-clip, compare TotalMix's source/output peak meters, and test one/right stereo channel independently if stereo is selected.
7. Verify the three meter buttons are read-only; no OSC control command is emitted when touched.
8. Compare hardware update latency, key-to-key color continuity, and stability for 30 minutes before approving a candidate release.

## Other actions

Live Channel Fader also retains fader +step/−step/mute modes; only the display-only meter mode reads the peak OSC stream. Existing output volume dials, submix dials, toggles and snapshots keep their previously accepted OSC behavior.

## Release and acceptance

Automated simulation proves that correct OSC audio-peak packets drive the meter; it does **not** prove that a particular TotalMix installation is configured to send them. Confirm with the real Fireface UCX II before release. The new application icon remains a candidate for design/branding review. Do not merge, publish or submit without authorization.
