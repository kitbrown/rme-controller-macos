# Changelog

## 1.1.6.0

- Added user-focused presets for Core Audio playback, Mic 1, TV SPDIF input, and SPDIF output.
- Added Mono, TV SPDIF input mute, and SPDIF output mute controls.
- Changed Talkback + Dim to momentary press/release behavior.
- Updated the default layout around the user's normal UCX II signal flow.
- Added regression coverage for the new controls and momentary Talkback.
- GitHub Actions Node 24 automated tests and Elgato CLI validation pass on the merged release candidate.
- Fresh packaging and live startup/state-sync verification remain the final release gate.


## 1.1.5.0

- Fixed new Control Toggle instances defaulting internally to Dim while the property inspector displayed Main Mute.
- Fixed Talkback + Dim being blocked when TotalMix did not publish a standalone Talkback state during initial synchronization.
- Added regression coverage for Main Mute initialization and Talkback + Dim command dispatch.
- Hardware revalidation required before marking this release fully validated.

## 1.1.4.0

- Added debounced Global OSC bulk-state synchronization.
- Fixed new-action initialization ordering.
- Confirmed all six encoder presets synchronize after a clean Stream Deck restart.
- Added live state probing and simultaneous-action regression coverage.
- Validated with Stream Deck 7.5.1 and its embedded Node.js 24.13.1 runtime.

## 1.1.3.0

- Corrected software playback routing to the `/mix/pb/...` Global OSC namespace.
- Added first-tick wake from TotalMix's `-300` silence sentinel.
- Added distinct red active and muted visual states.

## 1.1.0.0

- Added Global OSC control, bidirectional state feedback, encoder mute presses, button toggles, and the requested UCX II presets.
