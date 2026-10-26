# Marketplace candidate package

Use `marketplace/candidate/com.fionetworks.rme-globalosc.streamDeckPlugin`.

- Public version: 1.1.8; manifest build: 1.1.8.1.
- UUID: `com.fionetworks.rme-globalosc`; author: FiO Networks.
- Size: 63,553 bytes.
- SHA-256: `11942c248624dcb8990756bd51e0f765914a959ff007dc54a32be2282511ebd1`.
- Includes six editable device-specific starter profiles, with automatic installation offered and no automatic switch away from an existing profile.
- All runtime, Property Inspector and image files are byte-identical to main baseline `0c250b3a835c564261a939a32f10d1f30ef66c92` and its accepted v1.1.7 runtime.

Build revision 1.1.8.1 allows Stream Deck to upgrade an installed 1.1.8.0 candidate. The public version remains 1.1.8. Never upload the incompatible v1.1.7 archive in `release/`.

Validation: all three existing runtime suites, profile integrity/reproducibility tests, CLI validation and packaging pass. A native upgrade and clean install were completed on Stream Deck 7.5.1. The first-install profile prompt added the matching + XL layout; its 16 keys and six dials populated and displayed live TotalMix feedback. Installed package files match the candidate exactly. Original user profile contents are preserved, apart from Stream Deck updating the recorded plugin version on existing actions.

Other device variants have automated geometry/settings/archive checks, but have not been installed onto their physical device models. See `docs/STARTER-PROFILES.md` for the exact scope.
