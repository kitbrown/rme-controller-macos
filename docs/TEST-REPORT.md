# Software QC Report

Build: `RME Controller for macOS 1.1.4.0`  
Plugin UUID: `com.fionetworks.rme-globalosc` (side-by-side QC UUID)  
Target runtime: Stream Deck Node.js `24.13.1`
Native host: Stream Deck `7.5.1` build `22901` on macOS

## Passed

- JavaScript syntax checks for plugin and Property Inspector
- Manifest schema and Elgato CLI validation with zero warnings
- Package creation and archive integrity inspection
- Ten consecutive integration-test runs under Stream Deck's bundled Node 24.13.1
- OSC float, integer, T/F, bundle, and malformed-packet handling
- State-before-input gate; no guessed fader or toggle values
- 25 ms encoder command coalescing
- 100 ms display-update throttle
- Stale/out-of-order UDP feedback guard and expected-echo handling
- Post-command state reconciliation
- Debounced `/sendall` synchronization: simultaneous actions produce one bulk request per endpoint
- Adaptive missing-state retry at 750 ms, 1.5 seconds, and 3 seconds
- Simultaneous independent receive ports
- Safe settings reconfiguration and action cleanup
- Stream Deck WebSocket reconnect and re-registration
- All six requested fader preset mappings
- All six requested button preset mappings
- Encoder mute/unmute, muted-turn blocking, and red muted display
- Snapshot active/changed feedback
- Embedded button/snapshot artwork validation: active and inactive PNG payloads are present and byte-distinct
- Ten consecutive sandbox visual/state runs and ten consecutive race/reconnect runs
- High-resolution icon variants
- Native Stream Deck 7.5.1 load and `Plugin connected` confirmation
- Native bidirectional UDP loopback on ports 7008/9008: `/sendall` request and `/controlroom/dim 0` feedback
- Live Fireface UCX II / TotalMix FX 2.10 beta 4 command test: `/controlroom/dim` on and off
- Live physical Stream Deck button test after `/sendall` initialization
- Clean-restart physical DIM test: PASS — the first press after restarting Stream Deck enabled DIM without manual state priming
- Live Global OSC trace confirmed software-playback faders use `/mix/pb/...`; production path and regression fixture corrected
- Isolated live `/sendall` probe received 1,769 messages, including 421 `/mix/...` fader values
- Live `/sendchan/output/0` and `/sendchan/input/0` probes returned 75 and 40 channel-state messages respectively
- Clean Stream Deck restart populated all six encoder displays from TotalMix without touching a control
- Consolidated physical test exercised all six requested encoders: correct fader paths, mute/unmute paths, and muted-turn guards passed
- Consolidated physical button test passed Main Mute, Phones Mute, Mic Mute, and Dim with matching state feedback
- Fresh profile actions visibly render red active/muted states on buttons and encoder touch-strip displays
- First positive encoder tick from TotalMix's `-300` silence sentinel wakes directly to `-64.5 dB`

## Intentionally deferred safety/audio checks

- The stereo 48V command and state logic pass automated tests, and live readback showed both channels active. Automated QC does not switch phantom power on connected inputs.
- Talkback + Dim multi-path enable/disable passes automated tests. Its audible routing and configured dim depth remain dependent on the user's TotalMix routing.
- Long-duration unplug/replug soak testing remains operational monitoring rather than a release blocker.

The packaged QC build is `outputs/com.fionetworks.rme-globalosc.streamDeckPlugin`.
