# Marketplace listing — ready to paste

Prepared 2026-10-11 from main `d363ff66ec3cbcff994fd6032e7150bae7c14ab3`.

| Field | Value |
|---|---|
| Name | RME Controller for macOS |
| Organization / manifest author | FiO Networks (account match verified) |
| Price | Free |
| Product type | Stream Deck plugin |
| Public version / manifest version | 1.1.8 / 1.1.8.0 |
| UUID | com.fionetworks.rme-globalosc |
| Minimum platform | macOS 13; Stream Deck software 7.1 |
| Hardware evidence | Fireface UCX II; Stream Deck 7.5.1; TotalMix FX 2.10 beta 4 |
| Compatibility | Key actions on Stream Deck models with keys; dial actions on Stream Deck +. Other RME interfaces require Global OSC and may need custom mappings. No Windows claim. |
| Support URL | https://github.com/kitbrown/rme-controller-macos/issues |
| Setup URL | https://github.com/kitbrown/rme-controller-macos#install |
| Contact | chris@fionetworks.com (existing README contact) |

Use `description.txt` (1169 characters excluding trailing newline) and `release-notes.txt`. The first 250 characters are plain text. Suggested tags, only where offered: Audio, macOS, Stream Deck +. The replacement FiO Networks draft uses this exact product name. Live category is Audio, language English and monetization Free.

## Support text

For setup instructions, see the installation guide. For help or a bug report, open a GitHub issue or email chris@fionetworks.com. Include plugin, macOS, Stream Deck and TotalMix FX versions, your RME interface, the affected preset or OSC path, and steps to reproduce the issue. Remove personal details from screenshots and logs. Support is provided by FiO Networks.

## Independence wording

RME, TotalMix, Elgato and Stream Deck are trademarks of their respective owners. RME Controller for macOS is independent software by FiO Networks and is not affiliated with, sponsored by or endorsed by RME Audio or Elgato.

## AI-use disclosure

AI tools assisted with software development, code review, test generation, documentation, listing copy and visual-design/media preparation. The Maker directed the intended functionality and hardware configuration and performed real-hardware acceptance of v1.1.7. Marketplace media uses project artwork and will use real captures of the installed product; hardware photographs and live demonstration footage are not AI-generated. The product is not an entirely AI-generated product.

The short disclosure is already included in the public description. Also paste this fuller disclosure into any AI-use or reviewer-notes field offered by Maker Console. Chris must confirm the final provenance statement before submission. Do not claim Elgato eligibility is guaranteed; Elgato reviews AI usage at its discretion.

## Reviewer notes

The Marketplace package is v1.1.8.0; see `PACKAGE.md`. Its runtime is byte-identical to the accepted v1.1.7.0 build; only version and SDK 3 manifest metadata changed for DRM compatibility. Global OSC must be enabled in TotalMix FX. Default loopback transport: TotalMix receives UDP 7008, plugin receives UDP 9008. Video must show real Fireface UCX II integration and feedback in both directions. Audible Talkback depends on TotalMix routing and dim settings. Phantom-power switching was not part of automated hardware QC. Long-duration unplug/replug testing remains deferred; do not describe it as completed.
