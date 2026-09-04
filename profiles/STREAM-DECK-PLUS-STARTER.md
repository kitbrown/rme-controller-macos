# Stream Deck+ Starter Profile Specification

Owner: FiO Network Solutions LLC
Managing Partner: Chris W. Brown
Target device: Stream Deck+ (DeviceType 7)

This file defines the intended bundled starter profile. Per Elgato SDK requirements, the actual `.streamDeckProfile` must be exported from the Stream Deck application before it can be registered in `manifest.json`.

## Page 1 — Core Control

### Keys
1. DIM — Global OSC Toggle, default path `/controlroom/dim`
2. Snapshot 1 — `/snapshot/load/1`
3. Snapshot 2 — `/snapshot/load/2`
4. Snapshot 3 — `/snapshot/load/3`
5. Snapshot 4 — `/snapshot/load/4`
6. Reserved for a future validated control
7. Reserved for a future validated control
8. Reserved for a future validated control

### Dials
1. Main Output — Output Volume, default output index 0, press = mute
2. Phones — Output Volume, configurable output index, press = mute
3. Submix A — Submix Fader, configurable source/output
4. Submix B — Submix Fader, configurable source/output

## Page 2 — Expansion

Use additional Output Volume, Submix Fader, Toggle, and Snapshot instances only after live validation confirms the current mappings and device indexing.

## Bundle settings when exported

- Name: `profiles/RME-Global-OSC-Stream-Deck-Plus`
- DeviceType: 7
- Readonly: false
- DontAutoSwitchWhenInstalled: false
- AutoInstall: true

Do not add the `Profiles` manifest entry until the exported `profiles/RME-Global-OSC-Stream-Deck-Plus.streamDeckProfile` file exists in the plugin bundle.
