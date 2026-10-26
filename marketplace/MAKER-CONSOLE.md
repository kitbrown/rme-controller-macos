# Maker Console checkpoint — 2026-10-26

Product: [RME Controller for macOS](https://maker.elgato.com/8e915638-e18c-4e54-a55d-3b2f206fa00a/products/4805d54d-4d34-4f36-b392-e4f86172c12b), organization FiO Networks.

## Prepared

- Revised candidate: public 1.1.8, build 1.1.8.1, UUID `com.fionetworks.rme-globalosc`; see `PACKAGE.md` for size/hash.
- Six editable starter profiles added. Native upgrade, native clean-install prompt, + XL population/live feedback, baseline integrity and regression checks are recorded in `docs/STARTER-PROFILES.md`.
- Description updated and saved with starter-profile installation/selection instructions. Existing requirements, AI disclosure, English/Audio/Free metadata, support and setup links retained.
- Existing icon, branded thumbnail, gallery cover, three finalized gallery PNGs and demonstration video were uploaded before this revision; no media recreated.
- Revised release notes entered in the current Create version form.
- Automatically publish after being approved is OFF.

## External blocker

The revised 62.1 KB package reached the upload form, but package analysis returned:

```json
{"code":1,"error":"Get \"http://product-django-svc:8000/product/extensions/plugins\": read tcp 10.2.42.248:58358->172.20.117.221:8000: read: connection reset by peer"}
```

One replacement attempt showed the identical error. The form has not displayed parsed build, SDK/DRM or default-profile details for this revision. Those properties must not be reported as verified by Maker Console. Local manifest is SDK 3 and CLI validation passes; the former 1.1.8.0 candidate was previously recognized as DRM Yes.

Before upload, Safari's file picker left Upload disabled; restarting Safari and restoring its prior tabs resolved that separate picker problem. The exact candidate was then uploaded from `/tmp/rme-marketplace-tested/com.fionetworks.rme-globalosc.streamDeckPlugin`, hash identical to the repository candidate.

## Resume

1. Reopen the saved product's Versions tab if the existing form has expired. Create version, disable automatic publication, upload the exact `marketplace/candidate/` package and paste `release-notes.txt`.
2. After Elgato's service recovers, confirm UUID, build **1.1.8.1**, SDK **3**, DRM **Yes**, and included default profiles **Yes**.
3. Recheck media and any preview available, then stop before **Submit for review**.

**Nothing submitted or published.** The version table remains empty; the prepared Create version form is not a saved/submitted version.
