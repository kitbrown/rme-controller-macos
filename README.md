# RME Global OSC Stream Deck v1

A clean-room macOS Stream Deck plugin for TotalMix FX 2.1 Global OSC.

## Baseline verified 2026-08-07
- TotalMix FX 2.1 beta 4 is current public beta.
- RME Global OSC protocol is beta 2.
- Elgato SDK requires Node.js 24+ and Stream Deck 7.1+ for current development.
- RME recommends separate controller ports such as 7008/9008 for Stream Deck.
- This plugin does NOT use legacy page/bank OSC.

## Actions
1. Output Volume dial — `/output/N/volume`; dial press `/output/N/mute`.
2. Submix Fader dial — `/mix/in|playback/SRC/OUT/fader`.
3. Global OSC Toggle — default `/controlroom/dim`, configurable for other verified boolean paths.
4. Snapshot — `/snapshot/load/N`, with current-state feedback.

## Build
```bash
npm install
npm run build
npm install -g @elgato/cli
streamdeck validate com.chris.rme-globalosc.sdPlugin
```

## Development install/test
Use Elgato's supported CLI workflow:
```bash
npm run watch
```
The watch script restarts `com.chris.rme-globalosc` automatically.

## TotalMix FX setup
Use TotalMix FX 2.1 beta with OSC Compatibility/Mode = Global OSC.
Use an available controller instance and mark it In Use.
Recommended dedicated ports:
- TotalMix incoming: 7008
- TotalMix outgoing to plugin: 9008
- Remote Controller Address: 127.0.0.1 for same-Mac operation

Avoid `sendall` for Stream Deck. This v1 uses targeted `sendchan` where possible and `/sendstate` for current global/control state.

## Important
RME's Global OSC protocol is still beta. Do not substitute legacy OSC addresses. Before changing mappings, verify against the newest RME Global OSC protocol table.
