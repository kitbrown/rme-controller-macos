# RME Controller for macOS

A bidirectional Stream Deck plugin for controlling RME TotalMix FX through Global OSC. Built by FiO Networks for macOS and Stream Deck + XL, with support for both keys and rotary encoders.

## Install

1. Download `release/com.fionetworks.rme-globalosc.streamDeckPlugin`.
2. Double-click the file and approve installation in Stream Deck.
3. In TotalMix FX, enable an OSC controller in **Global OSC** mode.
4. Use `127.0.0.1`, incoming port `7008`, and outgoing port `9008` in TotalMix.

The plugin actions default to the matching host and ports.

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

To validate or package with Elgato's CLI:

```sh
streamdeck validate com.fionetworks.rme-globalosc.sdPlugin
streamdeck pack com.fionetworks.rme-globalosc.sdPlugin --output release
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

Version 1.1.6.0. The plugin is free. Support: chris@fionetworks.com.

RME, TotalMix, Elgato, and Stream Deck are trademarks of their respective owners. This independent project is not affiliated with or endorsed by RME Audio or Elgato.
