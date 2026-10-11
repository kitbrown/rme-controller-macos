# Marketplace candidate package

Use `marketplace/candidate/com.fionetworks.rme-globalosc.streamDeckPlugin` for the new Marketplace product.

- Version: `1.1.8.0`; public release: `1.1.8`.
- UUID: `com.fionetworks.rme-globalosc`.
- Size: 48,030 bytes.
- SHA-256: `37c1966c3e3b719f2787186b12760d7c1464b29d717e54ae5b10ce922d362bdc`.
- Runtime baseline: accepted v1.1.7 on main `d363ff66ec3cbcff994fd6032e7150bae7c14ab3`.

The only plugin change from v1.1.7 is manifest metadata: version `1.1.8.0` and `SDKVersion: 3`. The JavaScript runtime, Property Inspectors, icons, OSC mappings, and settings are byte-identical. All three automated suites and Stream Deck CLI 1.9.0 validation pass. Maker Console recognizes SDK 3 and DRM protection for this package. It does not read or modify packaged files at runtime, meeting the published DRM readiness constraints.

The existing `release/` archive remains the accepted v1.1.7 hardware baseline. Do not upload it to Marketplace: Maker Console marks SDK 2 and DRM disabled as incompatible. The v1.1.8 candidate still needs one installed-package smoke check before submission.
