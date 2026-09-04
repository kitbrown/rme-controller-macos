# State Ledger

Updated: 2026-09-04

## Confirmed

- This is the new Global OSC product; the legacy page/bank implementation is rejected.
- The release uses direct TotalMix addressing with no bank switching or pre-command architecture.
- Bidirectional UDP OSC feedback is implemented.
- OSC float, integer, string, boolean, and bundle decoding is implemented locally.
- The runtime has no third-party dependencies or compilation step.
- Stream Deck's Node.js 24.13.1 runtime passes ten consecutive integration and race-test cycles.
- Elgato CLI validation passes without warnings.
- The plugin loads in Stream Deck 7.5.1 on macOS.
- TotalMix FX 2.10 beta 4 returns complete state on `/sendall`; a live probe received 421 mix-fader values.
- All six default encoder mappings, mute presses, muted-turn guards, and red states passed physical testing.
- Main Mute, Phones Mute, Mic Mute, and Dim passed physical testing with feedback.
- The default transport is `127.0.0.1`, TotalMix port `7008`, plugin port `9008`.

## Intentionally deferred

- Audible Talkback routing depends on the user's TotalMix routing and dim-depth configuration.
- Automated validation does not switch phantom power on connected equipment.
- Long-duration unplug/replug behavior remains a soak-test item rather than a release blocker.

## Source of truth

The validated implementation is `com.fionetworks.rme-globalosc.sdPlugin`. Older `com.chris.*` and legacy `rme-totalmix-macos` bundles are not release baselines.
