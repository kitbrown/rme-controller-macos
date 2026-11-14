# v1.1.9 portable evidence

`hardware-results.json` preserves all bounded per-control result records and original raw-file hashes, including failed attempts. It omits full mixer state, feedback images and private profile backups. Original local evidence is outside this repository under `submission-evidence/v1.1.9-restored-profiles/`; a fresh clone does not need that private data to test source or verify the shipped package.

`*.mjs.txt` are unchanged historical harness sources, retained as text for audit, not automation entrypoints. They contain original Mac paths and write/restore real TotalMix parameters; do not execute without a separately authorized safe hardware session, device checks, exclusive UDP ownership, backups and restoration verification. Port-conflict, instrumentation buffer-shape and infinity-sentinel expectation failures are historical harness failures, not silently converted to passes. The failed exercise result has no successful bounded result set; the subsequent bounded run is separate evidence.

`node24-original-test.txt` is the original Node 24 test output. Current reconciliation outputs are also retained as text after execution. These are software checks, not new hardware acceptance. See [validation](../VALIDATION.md) and the existing [state ledger](../../../docs/STATE_LEDGER.md) for exact scope and remaining gaps.

Final media in `../media/` is byte-for-byte copied from completed Marketplace media. The video is 16:9 1920x1080; gallery files are 1920x960. It demonstrates unchanged controls, not new processing-feature certification. No user profile backup, credentials or raw operational capture is included. Original file hashes permit local custodians to verify provenance without publishing those captures.
