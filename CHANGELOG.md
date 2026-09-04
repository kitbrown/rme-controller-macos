# Changelog

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
