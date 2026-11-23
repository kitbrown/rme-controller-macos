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


def workflow_pages():
    monitor = [('toggle', {'preset': p}) for p in ('mainMute', 'dim', 'mono', 'phonesMute')]
    monitor += [('peakmeter', {'target': 'output', 'preset': 'main', 'stackSegments': 1,
                              'stackPosition': 1, 'meterChannels': 'stereo'}),
                ('diagnostic', {})]
    mix = [('levelkey', {'target': 'mix', 'preset': p, 'keyMode': mode, 'stepDb': 0.5})
           for p in ('mic1', 'playback12', 'spdif') for mode in ('down', 'up')]
    processing = [('toggle', {'preset': p, 'processingBus': 'input', 'processingIndex': 0})
                  for p in ('eqEnable', 'dynEnable', 'lowcutEnable', 'autoLevelEnable')]
    recipes = [('processingrecipe', {'preset': 'eq', 'frequency': 250, 'gain': -2, 'channel': 1}),
               ('processingrecipe', {'preset': 'eq', 'frequency': 3000, 'gain': 2, 'channel': 1}),
               ('processingrecipe', {'preset': 'compressor', 'threshold': -18, 'ratio': 2, 'channel': 1})]
    def recipe(label, mode, **settings):
        return ('processingrecipe', {'channel': 1, 'keyLabel': label, 'preset': mode, **settings})

    eq = [recipe('LOW CUT', 'hpf', frequency=70),
          recipe('LOW BST', 'lowShelf', frequency=100, gain=2),
          recipe('1K CUT', 'eq', frequency=1000, gain=-1.5),
          recipe('HI LIFT', 'eq', frequency=3000, gain=2),
          recipe('HI AIR', 'highShelf', frequency=12000, gain=2),
          recipe('HIGH CUT', 'lpf', frequency=4500)]
    compression = [recipe(label, 'timedComp', threshold=t, ratio=r, attack=a, release=ms)
                   for label, t, r, a, ms in [
                       ('DEEP VOX', -18, 3, 20, 180), ('LITE VOX', -16, 2, 15, 150),
                       ('OH DRUMS', -14, 1.5, 30, 250), ('MID TOMS', -16, 3, 20, 180),
                       ('KICK', -14, 4, 25, 120), ('GUITAR', -18, 2.5, 15, 160),
                       ('BASS', -18, 3, 25, 220)]]
    recipes[0][1]['keyLabel'] = 'MID CUT'
    recipes[1][1]['keyLabel'] = 'HI LIFT'
    return [('Monitor', monitor), ('Mix', mix), ('Processing', processing),
            ('Snapshots', [('snapshot', {'snapshot': n}) for n in range(1, 9)]), ('Recipes', recipes),
            ('EQ', eq), ('Compression', compression)]


def build():
    manifest = json.loads((PLUGIN / 'manifest.json').read_text())
    actions = {a['UUID'].rsplit('.', 1)[1]: a for a in manifest['Actions']}
    profiles = []
    for device in DEVICES:
        for workflow in (False, True):
            profiles.append(build_profile(manifest, actions, device, workflow))
    manifest['Profiles'] = profiles
    (PLUGIN / 'manifest.json').write_bytes(encode(manifest))


def build_profile(manifest, actions, device, workflow):
    slug, model_name, device_type, model, cols, rows, dials = device
    family = 'workflow' if workflow else 'starter'
    identity_slug = 'workflow/' + slug if workflow else slug
    def action(kind, settings, identity):
        spec = actions[kind]
        return {
            'ActionID': uid(f'{identity_slug}/{identity}'), 'LinkedTitle': True,
            'Name': spec['Name'],
            'Plugin': {'Name': manifest['Name'], 'UUID': manifest['UUID'],
                       'Version': manifest['Version'] if workflow else '1.1.9.1'},
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
    navigation = not dials and (workflow or len(keys) > capacity)
    page_capacity = capacity - 2 if navigation else capacity
    chunks = [keys[i:i+page_capacity] for i in range(0, len(keys), page_capacity)]
    names = ['Controls' if i == 0 else f'Snapshots / controls {i + 1}' for i in range(len(chunks))]
    if workflow:
        chunks, names = [], []
        for name, group in workflow_pages():
            for start in range(0, len(group), page_capacity):
                chunks.append(group[start:start + page_capacity])
                names.append(name if not start else f'{name} {1 + start // page_capacity}')
    page_ids = [uid(f'{identity_slug}/page/{i}') for i in range(len(chunks))]
    root = uid(f'{identity_slug}/profile').upper() + '.sdProfile'
    files = {f'{root}/manifest.json': encode({
        'Device': {'Model': model, 'UUID': ''},
        'Name': f'RME {family.title()} — {model_name}',
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
                    'ActionID': uid(f'{identity_slug}/{page}/{direction}'),
                    'LinkedTitle': True, 'Name': direction.title() + ' Page',
                    'Resources': None, 'Settings': {}, 'State': 0,
                    'States': [{}], 'UUID': 'com.elgato.streamdeck.page.' + direction,
                }
        controllers = [{'Type': 'Keypad', 'Actions': keypad}]
        if dials:
            dial_specs = DIALS if dials == 6 else (
                DIALS[:4] if page == 0 else [DIALS[4], DIALS[5], DIALS[0], DIALS[3]])
            if workflow:
                # Put the relevant group on the left, where four-dial models can reach it.
                ordered = DIALS if names[page] == 'Mix' else DIALS[3:] + DIALS[:3]
                dial_specs = ordered[:dials]
            bindings = [(kind, {'preset': preset, 'stepDb': 0.5, 'minDb': -65,
                                'maxDb': 6, 'muteOnPress': True}) for kind, preset in dial_specs]
            if workflow and names[page] == 'Processing':
                bindings = [('parameter', {'paramKey': key, 'paramBus': 'input', 'sourceIndex': 0})
                            for key in ('eq1Gain', 'eq2Gain', 'eq3Gain', 'compThreshold',
                                        'compRatio', 'makeupGain')[:dials]]
            controllers.append({'Type': 'Encoder', 'Actions': {
                f'{i},0': action(kind, settings, f'{page}/dial/{i}')
                for i, (kind, settings) in enumerate(bindings)}})
        files[f'{root}/Profiles/{page_ids[page].upper()}/manifest.json'] = encode({
            'Controllers': controllers, 'Icon': '',
            'Name': names[page],
        })
    target = PLUGIN / 'profiles' / f'rme-{family}-{slug}.streamDeckProfile'
    target.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as archive:
        for name, content in sorted(files.items()):
            entry = zipfile.ZipInfo(name, (2026, 10, 26, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.external_attr = 0o100644 << 16
            archive.writestr(entry, content)
    return {'Name': f'profiles/rme-{family}-{slug}', 'DeviceType': device_type,
            'AutoInstall': not workflow, 'DontAutoSwitchWhenInstalled': True,
            'Readonly': False}


if __name__ == '__main__':
    build()
