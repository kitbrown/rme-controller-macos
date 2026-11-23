# RME Controller for macOS

> **Current release: v1.1.9 (manifest build 1.1.9.1).** Chris confirmed Marketplace approval and the first paid sale on 2026-11-05. Start with the [state ledger](docs/STATE_LEDGER.md), [exact shipped package](marketplace/PACKAGE.md), and [validation with remaining hardware gaps](marketplace/v1.1.9/VALIDATION.md). Earlier v1.1.8 candidates and draft PRs are superseded.


A bidirectional Stream Deck plugin for controlling RME TotalMix FX through Global OSC. Built by FiO Networks for macOS and Stream Deck + XL, with support for both keys and rotary encoders.

## Install

1. Install through Elgato Marketplace. The exact retained shipped package is `marketplace/v1.1.9/candidate/com.fionetworks.rme-globalosc.streamDeckPlugin`; verify its checksum in [PACKAGE.md](marketplace/PACKAGE.md). `release/` contains an older historical package.
2. Double-click the file and approve installation in Stream Deck.
3. In TotalMix FX, enable an OSC controller in **Global OSC** mode.
4. Use `127.0.0.1`, incoming port `7008`, and outgoing port `9008` in TotalMix.

The plugin actions default to the matching host and ports.

**Getting feedback.** Enable Send Changes in TotalMix Global OSC. For audio meters, also enable Send Level Messages in that controller’s Details. Use the OSC diagnostic key to check for incoming messages.

**v1.1.10 candidate.** To try the workflow pages with the candidate installed, open Stream Deck Settings → Profiles → Import and choose the matching `rme-workflow-*.streamDeckProfile` from the [profiles directory](com.fionetworks.rme-globalosc.sdPlugin/profiles). Select **RME Workflow** in the profile selector. Your editable starter is a separate profile. Use the page arrows on key-only models or swipe the touch strip on dial models.

Monitor provides Main Mute, Dim, Mono, Phones Mute, a Main stereo peak meter and OSC diagnostics. Mix provides half-decibel down/up pairs for Mic 1, Core Audio and SPDIF feeding Main. Processing targets hardware input 1 by default. Check that assignment in the action settings before engaging EQ, dynamics, HPF or auto level. Processing dials on + models adjust EQ band gains and compressor settings. Snapshots recalls the eight existing TotalMix slots. Smaller devices split a group across pages when necessary.

### One-touch processing

Open **EQ** or **Compression** in the optional workflow profile. The original **Recipes** page also has a 250 Hz low-mid cut, a presence lift and a gentle compressor. To add the new pages to an earlier installation, import a fresh copy of the workflow profile. Select a hardware input in the key settings. All presets start on input 1. The upper key caption follows that assignment. For example, changing the expander to input 4 gives it the caption `IN 4 EXP`. Longer names such as `DEEP VOX` show the input on a separate line above the name. To use a fixed name such as `TOM EXP`, enter it in **Custom key label**. Existing custom labels stay fixed until cleared. The label describes the key. The hardware input setting selects its target.

| EQ key | Starting setting |
|---|---|
| HPF | 70 Hz, current slope |
| LOW BST | Band 1 low shelf, +2 dB at 100 Hz |
| 1K CUT | Band 2 bell, −1.5 dB at 1 kHz |
| HI LIFT | Band 2 presence bell, +2 dB at 3 kHz |
| HI AIR | Band 3 high shelf, +2 dB at 12 kHz |
| LPF | Band 3, 4.5 kHz, for auditioning a darker bass sound |

**LPF setup.** In TotalMix, open the input’s EQ band 3 Type menu. In the Stream Deck key settings, select the position where Low Pass appears. If your device does not list it in the supported positions, leave it unset. The key then shows SETUP and sends no commands. Recheck the position if switching interface models. Shelf keys target the second (Shelf) menu item. Each EQ key sets its own filter or band and keeps its current Q or slope. Keys using the same band replace that band’s prior setting. The 1 kHz dip is a tonal choice when a source sounds nasal.

| Compressor | Threshold | Ratio | Attack | Release |
|---|---:|---:|---:|---:|
| Deep vocal | −18 dB | 3:1 | 20 ms | 180 ms |
| Light vocal | −16 dB | 2:1 | 15 ms | 150 ms |
| Drum overheads | −14 dB | 1.5:1 | 30 ms | 250 ms |
| Mid toms | −16 dB | 3:1 | 20 ms | 180 ms |
| Kick | −14 dB | 4:1 | 25 ms | 120 ms |
| Guitar | −18 dB | 2.5:1 | 15 ms | 160 ms |
| Bass | −18 dB | 3:1 | 25 ms | 220 ms |

These FiO starting points are editable. Adjust the threshold against the actual performance and gain-reduction meter. Dynamics enables the whole section, including any configured expander and makeup gain. Attack and release are shared with the expander. For hardware details see [RME’s UCX II manual, sections 25.3.2 and 25.3.4](https://rme-audio.de/downloads/fface_ucx2_e.pdf).

**EXP** on the Compression page reduces quieter drum bleed. Its editable starting point is −40 dB, 2:1. Press to apply. When the key shows **ON**, press again to bypass expansion at 1:1. Enabling EXP engages channel Dynamics; bypassing EXP leaves the compressor running if it was running. Both operations preserve the shared timing, compressor parameters and makeup gain.

**Reading the keys.** A red curve and check mark mean the function is active. Recipe keys show **ON** when the mixer reports the preset values and an enabled processor, **OFF** when bypassed, or **READY** when the processor is on with different values. Changes reported by TotalMix update the keys. Pressing an already matched EQ or compressor preset keeps it applied. Use the HPF, EQ or DYN switch on Processing to bypass a whole section.

**SYNC** waits for mixer values. Each press requests a fresh read before writing. **NO DATA** means the key received insufficient feedback to start. **CHECK MIX** means a write was attempted and its result could not be verified. Inspect the channel before retrying.

## Encoder presets

- Core Audio — Analog 1/2 Playback
- Mic 1
- TV — SPDIF Input
- Control Room — Main
- SPDIF Output
- Control Room — Phones 1
- Hardware Inputs — Analog 1/2
- Hardware Inputs — Analog 3/4

Press an encoder to mute or unmute its source/output. Rotation is ignored while muted. The encoder display turns red and reads `MUTED`.

## Button presets

- Main Mute
- Dim
- Mono
- Mic 1 Mute
- TV SPDIF Input Mute
- SPDIF Output Mute
- Phones 1 Mute
- Analog 1/2 — 48V
- Talkback + Dim (momentary)
- Snapshots 1–8

Buttons follow TotalMix feedback. Talkback + Dim is push-and-hold: press enables both paths and release disables both. Stereo 48V remains a linked two-path toggle.

## Visual system

The visual system introduced in v1.1.7 provides a purpose-built FiO console theme. Key artwork is generated dynamically as SVG so each control is immediately recognizable and reflects live on/off state. Stream Deck + touch-strip feedback uses semantic accents for major sources and outputs while mute always overrides to a red warning state. Property Inspectors use a consistent dark console layout with inline validation.

## Synchronization

- OSC state is applied when its UDP message arrives.
- Encoder bursts are accumulated for 25 ms before the final value is sent.
- Stream Deck display updates are limited to one per 100 ms per action.
- Contradictory feedback is guarded for 250 ms after a local command.
- Targeted reconciliation occurs after 350 ms.
- Missing initial state retries after 750 ms, 1.5 seconds, and then every 3 seconds.
- Simultaneous bulk-state requests collapse into one `/sendall` request per endpoint.

Global OSC packets contain no timestamps or sequence numbers. The plugin treats TotalMix as the state authority and combines optimistic updates, expected-echo protection, and state reconciliation.

## Development and testing

The runtime has no third-party dependencies or build step. Stream Deck supplies Node.js 24.

```sh
npm test
```

To validate with Elgato's CLI, or package an explicitly authorized future candidate (never overwrite the retained shipped package):

```sh
streamdeck validate com.fionetworks.rme-globalosc.sdPlugin
streamdeck pack com.fionetworks.rme-globalosc.sdPlugin --output dist
```

See the [state ledger](docs/STATE_LEDGER.md), [default layout](docs/DEFAULT-LAYOUT.md), [QC report](docs/TEST-REPORT.md), and [hardware test notes](docs/HARDWARE-TEST.md) for validation details.

## Compatibility

- macOS 13 or later
- Stream Deck 7.1 or later
- Stream Deck models with keys; encoder actions require a model with dials
- A Global OSC-capable TotalMix FX release

## Safety

Phantom power can damage or stress incompatible connected equipment. Verify the attached microphone or device before using the 48V action.

## Status

Marketplace release v1.1.9. Support: chris@fionetworks.com.

RME, TotalMix, Elgato, and Stream Deck are trademarks of their respective owners. This independent project is not affiliated with or endorsed by RME Audio or Elgato.

## Release continuity

Run `python3 tools/verify-shipped-release.py` to verify immutable package/source and retained assets. CI validates without rebuilding. See the [Marketplace kit](marketplace/README.md) for media and the [state ledger](docs/STATE_LEDGER.md) before planning a next version. Use a full Git clone for tests that reference historical commits.
