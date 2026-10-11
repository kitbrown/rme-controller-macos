# Marketplace Submission — RME Controller for macOS

Verified against current Elgato Marketplace and Stream Deck SDK guidance on 2026-10-11.

## Product identity

**Name:** RME Controller for macOS  
**Author / organization:** FiO Networks  
**Price:** Free  
**Platform:** macOS 13 or later  
**Stream Deck:** 7.1 or later  
**Primary hardware:** RME TotalMix FX interfaces with Global OSC, including Fireface UCX II

The plugin is independent and is not affiliated with or endorsed by RME Audio or Elgato.

## Marketplace description

RME Controller for macOS brings direct, bidirectional RME TotalMix FX control to Stream Deck and Stream Deck + using Global OSC. Adjust hardware outputs and source-to-output submix levels with dials, mute directly from the dial, control Main Mute, Dim, Mono, Talkback, phantom power and snapshots from keys, and see TotalMix state reflected immediately on the device.

The plugin is designed for macOS systems running a Global OSC-capable version of TotalMix FX. Default presets cover common Fireface UCX II workflows including Core Audio playback, Mic 1, TV/SPDIF input, Main output, SPDIF output and Phones. Custom source, output and boolean Global OSC paths remain available for more advanced setups.

State synchronization is feedback-driven rather than guessed. The plugin requests current TotalMix state at startup, reconciles changes after commands, protects against stale UDP feedback, coalesces rapid encoder movement and visually marks muted or active controls. Stream Deck + touch strips use source-specific accent colors and keys use dynamic SVG artwork with live ON/OFF indication.

Setup requires enabling one TotalMix Global OSC controller. The default local configuration is 127.0.0.1 with TotalMix receiving on UDP 7008 and the plugin receiving feedback on UDP 9008.

## Suggested release notes for 1.1.7

- New FiO console-style visual design.
- New dynamic SVG key artwork with per-control identity and live state.
- Source-specific Stream Deck + touch-strip accent colors.
- New Property Inspector validation and clearer configuration layout.
- User-focused presets for Core Audio, Mic 1, TV/SPDIF, Main and SPDIF output.
- Momentary Talkback + Dim behavior.
- Bidirectional TotalMix Global OSC synchronization and existing control logic retained.

## Media package still required

Before submission, prepare:

1. **Marketplace app icon:** 288 × 288 PNG.
2. **Thumbnail:** 1920 × 960 PNG.
3. **At least 3 gallery items:** each 1920 × 960 PNG, or supported 1920 × 1080 MP4 where appropriate.
4. Recommended gallery subjects:
   - Stream Deck + showing Main, Core Audio, Mic and TV/SPDIF controls with the new semantic colors.
   - Property Inspector showing the polished preset/configuration UI.
   - TotalMix FX and Stream Deck side by side demonstrating bidirectional state, mute and snapshot feedback.

Use only screenshots and visual assets we own or have permission to use. If using official Stream Deck device imagery, use Elgato-provided media assets.

## Plugin-package visual checks

Current Elgato guidance requires:

- Plugin manifest icon: PNG at 256 × 256 and 512 × 512 (@2x).
- Category icon: SVG is recommended; if PNG, 28 × 28 and 56 × 56. It must be monochrome white with transparent background.
- Action-list icon: SVG is recommended; if PNG, 20 × 20 and 40 × 40. It must be monochrome white with transparent background.
- Key state artwork: SVG/PNG/GIF; dynamic SVG is supported.
- Touch-strip UI should remain inside the 200 × 100 layout bounds.
- Visual feedback should reflect state changes and failed interactions should use Stream Deck alert feedback.

v1.1.7 now uses dedicated monochrome SVG category/action icons and dynamic SVG key state artwork.

## Property Inspector checks

- Boolean settings use checkboxes.
- Single-choice settings use select controls.
- Settings auto-save on change.
- v1.1.7 adds inline validation before saving invalid values.
- Keep configuration compact; no manual Save button is used.

## Submission checklist

- [ ] Run complete automated test suite on v1.1.7.
- [ ] Run current `streamdeck validate`.
- [ ] Run `streamdeck pack` and inspect the exact package.
- [ ] Install the exact packaged v1.1.7 build on the Mac.
- [ ] Confirm clean Stream Deck startup and initial TotalMix state synchronization.
- [ ] Perform short live acceptance check of the v1.1.7 visual changes and newly added controls.
- [ ] Verify manifest plugin PNG icon dimensions are exactly 256/512 px.
- [ ] Create Marketplace 288 × 288 app icon.
- [ ] Create 1920 × 960 thumbnail.
- [ ] Create at least three 1920 × 960 gallery images.
- [ ] Confirm FiO Networks exactly matches the organization name in Maker Console.
- [ ] Add support/contact link or email in Maker Console.
- [ ] Declare AI assistance in the submission as required by current Marketplace AI-use guidance.
- [ ] Upload the packaged plugin and release notes through Maker Console.
- [ ] Submit the new version for review.

## AI-use declaration draft

AI tools were used as development assistance for code review, test generation, documentation and visual-design iteration. The product architecture, intended functionality, hardware configuration, testing decisions and final acceptance are directed and reviewed by the Maker. The plugin is not an entirely AI-generated product.

## Current Elgato references

- Plugin guidelines: https://docs.elgato.com/guidelines/stream-deck/plugins/
- Product guidelines: https://docs.elgato.com/guidelines/products/
- Manifest reference: https://docs.elgato.com/streamdeck/sdk/references/manifest/
- Distribution: https://docs.elgato.com/streamdeck/sdk/introduction/distribution/
- Submitting products: https://docs.elgato.com/maker-console/submitting-products/
- Managing products: https://docs.elgato.com/maker-console/managing-products/
- Review process: https://docs.elgato.com/maker-console/review-process/
