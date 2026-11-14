"""Read-only verification of the retained v1.1.9 package, source and artifacts."""
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
RELEASE = ROOT / 'marketplace/v1.1.9'
PLUGIN = ROOT / 'com.fionetworks.rme-globalosc.sdPlugin'
PACKAGE = RELEASE / 'candidate/com.fionetworks.rme-globalosc.streamDeckPlugin'
EXPECTED = '8b2b0f08db4327d9b4796a41c7203503bf19b60bc2315789cb0afe87e3a8cb0f'


def require(condition, message):
    if not condition:
        raise SystemExit('FAIL: ' + message)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


require(PACKAGE.stat().st_size == 134106, 'shipped package size changed')
require(digest(PACKAGE) == EXPECTED, 'shipped package checksum changed')
with zipfile.ZipFile(PACKAGE) as archive:
    prefix = PLUGIN.name + '/'
    members = {n[len(prefix):]: archive.read(n) for n in archive.namelist()
               if n.startswith(prefix) and not n.endswith('/')}
    # Elgato omits its packaging-control file .sdignore from the installer.
    source = {str(p.relative_to(PLUGIN)): p.read_bytes()
              for p in PLUGIN.rglob('*') if p.is_file() and p.name not in ('.DS_Store', '.sdignore')}
    require(set(members) == set(source), 'source/archive file sets differ')
    for name, data in members.items():
        if name == 'manifest.json':
            # CLI strips only the final newline from manifest.json in this archive.
            require(source[name].rstrip(b'\n') == data.rstrip(b'\n'),
                    'source/archive manifest differs beyond final newline')
        else:
            require(source[name] == data, 'source/archive bytes differ: ' + name)
    manifest = json.loads(members['manifest.json'])
    require(manifest['Version'] == '1.1.9.1', 'wrong manifest build')
    require(manifest['UUID'] == 'com.fionetworks.rme-globalosc', 'wrong UUID')
    require(manifest['SDKVersion'] == 3, 'wrong SDK version')
    require(len(manifest['Profiles']) == 6, 'wrong starter profile count')
    require(all(p['AutoInstall'] and p['DontAutoSwitchWhenInstalled']
                and not p['Readonly'] for p in manifest['Profiles']),
            'starter profile installation settings changed')

inventory = RELEASE / 'ARTIFACTS.sha256'
seen = set()
for line in inventory.read_text().splitlines():
    expected, name = line.split('  ', 1)
    path = RELEASE / name
    require(path.resolve().is_relative_to(RELEASE.resolve()), 'unsafe inventory path')
    require(name not in seen, 'duplicate inventory member: ' + name)
    seen.add(name)
    require(path.is_file() and digest(path) == expected, 'artifact mismatch: ' + name)
required = {str(p.relative_to(RELEASE)) for folder in ['candidate', 'assets', 'media', 'evidence']
            for p in (RELEASE / folder).rglob('*') if p.is_file() and p.name not in ('.DS_Store', '.sdignore')}
required.update(['description.txt', 'release-notes.txt'])
require(seen == required, 'inventory is incomplete or contains unexpected files')
print(f'PASS: immutable v1.1.9.1 package; {len(source)} source files match (manifest final-newline normalization only); SDK 3; six auto-install profiles; {len(seen)} retained artifacts verified')
