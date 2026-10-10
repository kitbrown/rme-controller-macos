# Default Stream Deck + XL Layout

## Primary controls

### Encoders

1. Core Audio — Analog 1/2 Playback
2. Mic 1
3. TV — SPDIF Input
4. Control Room — Main
5. SPDIF Output
6. Control Room — Phones 1 / spare configurable output

All encoders default to 0.5 dB per tick. Pressing an encoder toggles mute for its source or output. Rotation is blocked while muted.

### Keys

1. Main Mute
2. Dim
3. Mono
4. Mic 1 Mute
5. TV SPDIF Input Mute
6. SPDIF Output Mute
7. Talkback + Dim — momentary hold

## Secondary controls

- Snapshots 1–4 as the preferred first snapshot page
- Snapshots 5–8 available when needed
- Analog 1/2 phantom power remains available but is not part of the normal daily-use page
- Phones Mute remains available as a preset

## Signal-flow assumptions

- Core Audio arrives on Software Playback Analog 1/2.
- Mic 1 is Hardware Input 1 / Global OSC input index 0.
- TV audio arrives on the SPDIF hardware input / Global OSC input index 8.
- Main L/R is the primary Control Room output / Global OSC output index 0.
- SPDIF is the secondary hardware output / Global OSC output index 8.
- Talkback is momentary and commands Talkback + Dim together.

The legacy generic presets remain available so this layout does not remove earlier functionality.
