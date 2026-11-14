# Starter profiles

The Marketplace candidate 1.1.9.1 includes six editable starter profiles.
On a fresh plugin installation, accept **Install Profile(s)**, then select
**RME Starter — [device]** from the Stream Deck profile selector. Existing
profiles and their control settings remain intact. The installer matches the
profile to connected hardware. An in-place update may not offer new profiles;
the `.streamDeckProfile` files in the plugin's `profiles/` directory can also
be imported through Stream Deck preferences.

| Device | Key grid | Pages | Dials per page |
|---|---|---|---|
| Stream Deck / MK.2 | 5 × 3 | 2 | 0 |
| Mini | 3 × 2 | 4 | 0 |
| XL | 8 × 4 | 1 | 0 |
| Neo | 4 × 2 | 3 | 0 |
| + | 4 × 2 | 2 | 4 |
| + XL | 9 × 4 | 1 | 6 |

All layouts provide Main Mute, Dim, Mono, Mic 1 Mute, TV/SPDIF Input Mute,
SPDIF Output Mute, momentary Talkback + Dim, Phones Mute, and snapshots 1–8.
Small key-only layouts reserve previous/next page keys. Dial models use
touch-strip swipes for pages. The + XL provides Core Audio, Mic 1, TV/SPDIF,
Main, SPDIF Output and Phones 1 dials. The four-dial + puts the first four on
Controls and SPDIF Output, Phones 1, Core Audio and Main on its second page.
Dial step is 0.5 dB, with the existing press-to-mute behavior.

Global OSC must be enabled in TotalMix. Transport defaults to localhost,
TotalMix receive port 7008 and plugin feedback port 9008. Presets assume the
documented UCX II mappings; other RME interfaces/routing may require changes
in the existing Property Inspectors. Profile installation does not set audio
levels, toggle mute, load snapshots, or switch phantom power. The 48V control
remains available in the action list and is deliberately absent from starters.

Build with `python3 tools/build-starter-profiles.py`. Archives use deterministic
identities, contain no user device identity or personal resources, and register
`AutoInstall: true`, `DontAutoSwitchWhenInstalled: true`, `Readonly: false`.
Device model identifiers follow Elgato's shipped macOS default profiles.

## Verification on 2026-10-26

- Existing runtime suites passed; executable, UI and image files are byte-identical
  to baseline main `0c250b3a835c564261a939a32f10d1f30ef66c92`.
- `python3 test/starter-profiles-test.py` checks every page reference, model,
  coordinate, action/controller contract, preset, snapshot, transport, unique
  action identity, and reproducible archive bytes.
- Elgato CLI validation and packing passed without bypasses.
- Native package upgrade to 1.1.9.1 passed and runtime reconnected.
- Native clean install showed the bundled-profile prompt. Accepting it created
  the matching + XL profile, attributed to this plugin. Stream Deck normalized
  it to a local profile with 16 key actions and six encoder actions.
- The exact bundled + XL archive also imported independently; a temporary
  duplicate populated all controls and live labels. That duplicate was removed.
- The installed bundled + XL profile was then displayed with all 16 keys,
  six dial labels/colors and live TotalMix feedback. No control was actuated
  during this profile-install test.
- Original profile comparison found only Stream Deck's recorded plugin-version
  updates; action settings, coordinates, state and other profile files persisted.
- Every installed plugin file matched the candidate archive byte-for-byte.

Only + XL hardware is connected. Other physical models' installation/rendering
and navigation have not been observed; their archive/settings/geometry checks
passed. These results do not claim a new physical key/dial, routing, 48V,
long-duration or unplug/replug acceptance test.

## Reviewer cases

Positive cases: fresh-install profile prompt adds the matching layout; + XL
shows 16 configured keys and six dials with live labels; snapshots 1–8 retain
their configured numbers; each model's coordinates remain within its canvas;
rebuilding profiles produces identical archives.

Negative cases: key-only profiles contain no encoder actions; no starter binds
48V; installation does not overwrite existing user action settings. Runtime
regression suites additionally check disconnected/readiness guards and malformed
OSC handling. Other model-specific native navigation remains unobserved.
