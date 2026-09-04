# UCX II / TotalMix Hardware Test Gate

Do not upload this build as the Marketplace update until every stage passes.

## 1. Connection and initial synchronization

- Connect the UCX II and start TotalMix FX with Global OSC enabled.
- TotalMix receives on `7008`; its remote target is `127.0.0.1:9008`.
- Disable automatic re-send options during testing.
- Confirm every assigned action leaves `SYNCING` without touching a control.
- Restart TotalMix and confirm all actions recover without restarting Stream Deck.

## 2. Encoder mapping and feedback

Test each default independently:

- Hardware Inputs — Analog 1/2
- Hardware Inputs — Analog 3/4
- Software Playback — Analog 1/2
- Hardware Inputs — SPDIF
- Control Room — Phones 1
- Control Room — Main

For each encoder:

- Turn slowly and rapidly in both directions.
- Confirm the Stream Deck value and TotalMix value agree to 0.1 dB.
- Change the fader in TotalMix and confirm Stream Deck follows.
- Press to mute; confirm red `MUTED` display and that turns do nothing.
- Press again to unmute and confirm the previous level remains intact.
- Verify the lower limit displays `-∞ dB` and the upper limit does not overshoot.

## 3. Button behavior

Test two presses and external TotalMix changes for:

- Main Mute
- Dim
- Analog 1/2 — 48V
- Phones 1 Mute
- Analog 1/2 — Mute
- Talkback + Dim

Pass criteria: first press enables, second press disables, and button state follows changes made directly in TotalMix. For Talkback, verify both talkback and dim activate. For 48V, disconnect or mute sensitive equipment first and confirm both channels follow the intended stereo-pair behavior.

## 4. Snapshots and recovery

- Recall snapshots 1–8.
- Confirm active and changed indications.
- Restart Stream Deck while TotalMix stays open.
- Restart TotalMix while Stream Deck stays open.
- Disconnect/reconnect the UCX II.
- Confirm controls block unsafe input while state is unknown and recover automatically.

## 5. Load and endurance

- Move several faders rapidly for at least two minutes.
- Operate buttons while fader feedback is active.
- Confirm no lag buildup, oscillation, feedback ping-pong, stuck mute, or incorrect dB state.
- Review Stream Deck logs for plugin errors.

