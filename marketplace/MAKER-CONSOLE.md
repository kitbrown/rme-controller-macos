# Maker Console checkpoint — 2026-10-26 (retry successful)

Product: [RME Controller for macOS](https://maker.elgato.com/8e915638-e18c-4e54-a55d-3b2f206fa00a/products/4805d54d-4d34-4f36-b392-e4f86172c12b), organization FiO Networks.

## Prepared

- Revised candidate: public 1.1.8, build 1.1.8.1, UUID `com.fionetworks.rme-globalosc`; see `PACKAGE.md` for size/hash.
- Six editable starter profiles added. Native upgrade, native clean-install prompt, + XL population/live feedback, baseline integrity and regression checks are recorded in `docs/STARTER-PROFILES.md`.
- Description updated and saved with starter-profile installation/selection instructions. Existing requirements, AI disclosure, English/Audio/Free metadata, support and setup links retained.
- Existing icon, branded thumbnail, gallery cover, three finalized gallery PNGs and demonstration video were uploaded before this revision; no media recreated.
- Revised release notes entered in the current Create version form.
- Retry succeeded with the unchanged candidate hash. Maker Console parsed **1.1.8.1**, UUID `com.fionetworks.rme-globalosc`, **SDK Compatibility Version 3 or later**, **DRM protection enabled: Yes**, and **default profiles: Yes**. The Submit for review button is enabled but was not clicked.
- Automatically publish after being approved is OFF.

## Retained earlier failure — resolved on retry

The revised 62.1 KB package reached the upload form, but package analysis returned:

```json
{"code":1,"error":"Get \"http://product-django-svc:8000/product/extensions/plugins\": read tcp 10.2.42.248:58358->172.20.117.221:8000: read: connection reset by peer"}
```

The first replacement attempt showed the identical error. A later explicit user-authorized retry succeeded and displayed the parsed build, SDK 3, DRM Yes and default profiles Yes. The earlier failure remains historical evidence, not a current blocker. The package was hash-verified, not rebuilt.

Before upload, Safari's file picker left Upload disabled; restarting Safari and restoring its prior tabs resolved that separate picker problem. The exact candidate was then uploaded from `/tmp/rme-marketplace-tested/com.fionetworks.rme-globalosc.streamDeckPlugin`, hash identical to the repository candidate.

## Resume boundary

The current Safari Create version form contains the recognized package and revised release notes, and automatic publication is **OFF**. Stop before **Submit for review** until explicitly authorized. If this unsaved form expires, upload the exact `marketplace/candidate/` package, restore `release-notes.txt`, disable automatic publication again and recheck the parsed details.

**Nothing submitted or published.** The version table remains empty; the prepared Create version form is not a saved/submitted version. No rebuild or runtime change was made during the successful retry.
