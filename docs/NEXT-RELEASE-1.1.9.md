# RME Controller for macOS — v1.1.9.0 Engineering Candidate

Status: **UNRELEASED, hardware acceptance pending.** Existing v1.1.8.0 Marketplace submission and earlier live hardware baseline are not modified. Branch `feature/console-ui-improvements` is separate from the prior development branch.

## Lock-state ledger: user-requested five quality targets

| Target | Confirmed implementation in development branch | Limitations |
|---|---|---|
| 1. Premium graphics | CONFIRMED: existing mixer-console key art, custom rotary feedback, unified state colors, and deterministic FiO console icon generation for 256/512px plugin + 288px Marketplace | UNKNOWN: physical icon appearance, user visual acceptance; generated design does **not** claim RME endorsement |
| 2. Channel selection and configuration | CONFIRMED: preset/custom mapping, feedback-driven actual TotalMix channel name detection, UI channel picker and optional live-name labels | UNKNOWN: number and names of channels your TotalMix build actually reports |
| 3. Professional fader behavior | CONFIRMED: bidirectional dB values, muted rotation guard, command coalescing and causal guard, 1–4-key actual audio peak meter, output/mix balance control | UNKNOWN: physical layout smoothness and timing; pan mapping requires device validation |
| 4. Routing, EQ, dynamics, FX | CONFIRMED: new Processor and Routing dial with explicit OSC path allowlist for submix pan, output balance, EQ gains/frequencies, compressor threshold/ratio/makeup and reverb/echo volume; Channel EQ/Dynamics/Low Cut/Auto Level and Reverb/Echo state-aware enable toggles | UNKNOWN: feature availability, behavior and clipping/value ranges per Fireface UCX II channel and Global OSC beta; unsupported functions remain blocked until numeric state arrives |
| 5. Profiles, setup and diagnostics | CONFIRMED: OSC Connection Monitor displays real UDP RX freshness, read-only refresh on press, setup help, default layout recipe, validation tests | UNKNOWN: real OSC hardware handshake; an installable `.streamDeckProfile` must be exported from the Stream Deck app before it can be bundled. Never fabricate an unverified profile export |

## Configuration

All actions use default `127.0.0.1`, TotalMix receive UDP `7008`, plugin receive UDP `9008`. On the **same** enabled TotalMix controller, choose **Global OSC**; enable **Send changes** and **Send status**. Audio peak meters require **Send Level Data**. For specific processing functions the interface must publish the exact OSC parameter first. The plugin does not assume a parameter exists merely because the UI offers it.

### Suggested key page

The existing Stream Deck pages are preserved unless you deliberately change them. Recommended page 3:

- Column A, three stacked keys: **Live Audio Peak Meter** configured as one continuous bottom-to-top 3-key meter (top position 3, center 2, bottom 1; source and dBFS range identical)
- Another key: **OSC Connection Monitor** (press for read-only `/sendall`)
- Additional available keys: feedback-driven EQ enable, Dynamics enable, Reverb enable, and snapshots
- Encoder positions: Main output, Input Mic 1, Software Playback, or separate Processor and Routing dials for chosen confirmed parameters

This is an **installation recipe**, **not** a device-exported `.streamDeckProfile`.

### Processor and Routing safety

- A dial writes **nothing** until the exact Global OSC numeric parameter has been observed for the selected bus/index.
- No silent fallback to an unknown parameter, no inferred hardware support, and no automatic processing activation.
- All numeric parameters are clipped by client-side guard ranges; device-specific legal ranges may be narrower.
- A processing toggle requires confirmed boolean feedback before it can send a change.
- The current File/Stream Deck implementation never alters unrelated mixer settings.

### OSC Connection Monitor

Green **RX LIVE** means a packet arrived on that feedback UDP port in the past five seconds. Yellow **NO DATA/STALE** means it did not. This is a local receive indicator, **not** cryptographic verification that the packet came from TotalMix, and does not prove actual audio I/O or an OSC parameter.

## Acceptance gates

1. GitHub Actions Node 24 automated and UI regression suites pass.
2. Current Elgato CLI validation and packaging pass.
3. Locally install the distinct `1.1.9.0` test candidate after exporting existing profile; confirm new actions appear.
4. Fireface UCX II hardware-test Main, Phones, input gain, all supported processing paths, per-channel live names, actual audio meter, status and refresh. **Do not apply unknown phantom-power or processing settings to active equipment.**
5. Confirm all old actions/keys 1–2 still work, design and state colors unchanged.
6. Export a real Stream Deck + XL profile from Stream Deck Preferences for safe bundling if desired; must validate before adding to manifest.
7. Only after review accept new Marketplace copy/version and authorize review submission separately.

## Protocol provenance

RME Global OSC alpha thread (manufacturer): https://forum.rme-audio.de/viewtopic.php?id=43075

Current Elgato SDK: https://docs.elgato.com/streamdeck/sdk/references/manifest/ and https://docs.elgato.com/streamdeck/sdk/guides/profiles/

Independent address cross-check (not manufacturer hardware certification): https://github.com/bitfocus/companion-module-rme-totalmix/blob/main/src/protocol/controller.ts

## Rejections

- DISPROVEN: Original meter displayed fader position rather than actual audio amplitude; corrected in v1.1.8.2 and retained here.
- REJECTED: Reshaping previously approved key art or status layout.
- REJECTED: Copying other plugins' proprietary artwork or representing this plugin as official RME/Elgato software.
- REJECTED: Publishing over production v1.1.8 or auto-installing an invented profile.
