"""Compare the packed v1.1.10 candidate to this checkout, including profile archives."""
import hashlib
import json
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parents[1]
plugin = root / 'com.fionetworks.rme-globalosc.sdPlugin'
folder = root / 'marketplace/v1.1.10/candidate'
package = folder / 'com.fionetworks.rme-globalosc.streamDeckPlugin'
expected = (folder / 'SHA256SUMS').read_text().strip().split()
if expected != [hashlib.sha256(package.read_bytes()).hexdigest(), package.name]:
    raise SystemExit('Candidate checksum mismatch')
manifest = json.loads((plugin / 'manifest.json').read_bytes())
if (manifest['Version'], manifest['SDKVersion'], manifest['UUID']) != (
        '1.1.10.4', 3, 'com.fionetworks.rme-globalosc'):
    raise SystemExit('Candidate identity mismatch')
files = {p.relative_to(root).as_posix(): p for p in plugin.rglob('*')
         if p.is_file() and p.name not in {'.sdignore', '.DS_Store'}}
with zipfile.ZipFile(package) as archive:
    members = [item.filename for item in archive.infolist() if not item.is_dir()]
    if sorted(members) != sorted(files):
        raise SystemExit('Candidate file list mismatch')
    for name, path in files.items():
        data = path.read_bytes()
        if path == plugin / 'manifest.json':
            data = data.removesuffix(b'\n')
        if data != archive.read(name):
            raise SystemExit('Candidate differs from checkout: ' + name)
print(f'PASS: {manifest["Version"]}, {len(files)} packaged files and SHA-256 verified')
