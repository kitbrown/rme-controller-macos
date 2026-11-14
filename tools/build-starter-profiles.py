#!/usr/bin/env python3
"""Build portable, deterministic Stream Deck 7.1+ RME starter profiles.

Device models come from Elgato Stream Deck's shipped macOS default profiles.
Only RME actions and built-in page navigation are included; no user profile,
device identity, external resource, or application association is copied.
"""
import json
from pathlib import Path
import uuid
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PLUGIN = ROOT / 'com.fionetworks.rme-globalosc.sdPlugin'
NAMESPACE = uuid.UUID('37ddc063-6f2c-4e17-ad6a-fac2c03952e7')
DEVICES = [
    ('stream-deck', 'Stream Deck', 0, '20GAA9902', 5, 3, 0),
    ('mini', 'Stream Deck Mini', 1, '20GAI9901', 3, 2, 0),
    ('xl', 'Stream Deck XL', 2, '20GAT9902', 8, 4, 0),
    ('plus', 'Stream Deck +', 7, '20GBD9901', 4, 2, 4),
    ('neo', 'Stream Deck Neo', 9, '20GBJ9901', 4, 2, 0),
    ('plus-xl', 'Stream Deck + XL', 13, '20GBX9901', 9, 4, 6),
]
CONTROLS = ['mainMute', 'dim', 'mono', 'micMute', 'tvSpdifMute',
            'spdifOutMute', 'talkback', 'phonesMute']
DIALS = [('mixfader', 'playback12'), ('mixfader', 'mic1'),
         ('mixfader', 'spdif'), ('outputvolume', 'main'),
         ('outputvolume', 'spdif'), ('outputvolume', 'phones1')]


def uid(key):
    return str(uuid.uuid5(NAMESPACE, key))


def encode(value):
    return (json.dumps(value, indent=2, ensure_ascii=False) + '\n').encode()


def build():
    manifest = json.loads((PLUGIN / 'manifest.json').read_text())
    actions = {a['UUID'].rsplit('.', 1)[1]: a for a in manifest['Actions']}
    profiles = []
    for slug, model_name, device_type, model, cols, rows, dials in DEVICES:
        def action(kind, settings, identity):
            spec = actions[kind]
            return {
                'ActionID': uid(f'{slug}/{identity}'), 'LinkedTitle': True,
                'Name': spec['Name'],
                'Plugin': {'Name': manifest['Name'], 'UUID': manifest['UUID'],
                           'Version': manifest['Version']},
                'Resources': None, 'Settings': {
                    'host': '127.0.0.1', 'sendPort': 7008, 'receivePort': 9008,
                    **settings},
                'State': 0, 'States': [{} for _ in spec['States']],
                'UUID': spec['UUID'],
            }

        keys = [('toggle', {'preset': p}) for p in CONTROLS]
        keys += [('snapshot', {'snapshot': n}) for n in range(1, 9)]
        # Dial models navigate by swiping the touch strip. Key-only models
        # reserve two keys for previous/next when more than one page is needed.
        capacity = cols * rows
        navigation = not dials and len(keys) > capacity
        page_capacity = capacity - 2 if navigation else capacity
        chunks = [keys[i:i+page_capacity] for i in range(0, len(keys), page_capacity)]
        page_ids = [uid(f'{slug}/page/{i}') for i in range(len(chunks))]
        root = uid(f'{slug}/profile').upper() + '.sdProfile'
        files = {f'{root}/manifest.json': encode({
            'Device': {'Model': model, 'UUID': ''},
            'Name': f'RME Starter — {model_name}',
            'Pages': {'Current': page_ids[0], 'Default': page_ids[0],
                      'Pages': page_ids}, 'Version': '3.0',
        })}
        for page, chunk in enumerate(chunks):
            keypad = {f'{i % cols},{i // cols}': action(kind, settings, f'{page}/key/{i}')
                      for i, (kind, settings) in enumerate(chunk)}
            if navigation:
                for offset, direction in [(2, 'previous'), (1, 'next')]:
                    i = capacity - offset
                    keypad[f'{i % cols},{i // cols}'] = {
                        'ActionID': uid(f'{slug}/{page}/{direction}'),
                        'LinkedTitle': True, 'Name': direction.title() + ' Page',
                        'Resources': None, 'Settings': {}, 'State': 0,
                        'States': [{}], 'UUID': 'com.elgato.streamdeck.page.' + direction,
                    }
            controllers = [{'Type': 'Keypad', 'Actions': keypad}]
            if dials:
                dial_specs = DIALS if dials == 6 else (
                    DIALS[:4] if page == 0 else [DIALS[4], DIALS[5], DIALS[0], DIALS[3]])
                controllers.append({'Type': 'Encoder', 'Actions': {
                    f'{i},0': action(kind, {'preset': preset, 'stepDb': 0.5,
                                          'minDb': -65, 'maxDb': 6, 'muteOnPress': True},
                                      f'{page}/dial/{i}')
                    for i, (kind, preset) in enumerate(dial_specs)}})
            files[f'{root}/Profiles/{page_ids[page].upper()}/manifest.json'] = encode({
                'Controllers': controllers, 'Icon': '',
                'Name': 'Controls' if page == 0 else f'Snapshots / controls {page + 1}',
            })
        target = PLUGIN / 'profiles' / f'rme-starter-{slug}.streamDeckProfile'
        target.parent.mkdir(exist_ok=True)
        with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as archive:
            for name, content in sorted(files.items()):
                entry = zipfile.ZipInfo(name, (2026, 10, 26, 0, 0, 0))
                entry.compress_type = zipfile.ZIP_DEFLATED
                entry.external_attr = 0o100644 << 16
                archive.writestr(entry, content)
        profiles.append({'Name': f'profiles/rme-starter-{slug}', 'DeviceType': device_type,
                         'AutoInstall': True, 'DontAutoSwitchWhenInstalled': True,
                         'Readonly': False})
        print(f'{model_name}: {len(chunks)} pages, {len(keys)} key actions, {dials} dials/page')
    manifest['Profiles'] = profiles
    (PLUGIN / 'manifest.json').write_bytes(encode(manifest))


if __name__ == '__main__':
    build()
