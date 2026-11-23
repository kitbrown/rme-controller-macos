"""Compare exported plugin profiles with resources from a real macOS 8.0.0 app."""
import argparse
import io
import json
import plistlib
from pathlib import Path, PurePosixPath
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
SHIPPED = ROOT / 'marketplace/v1.1.9/candidate/com.fionetworks.rme-globalosc.streamDeckPlugin'
DEVICE_NAMES = {0: 'StreamDeck', 1: 'StreamDeckMini', 2: 'StreamDeckXL',
                7: 'StreamDeckPlus', 9: 'StreamDeckNeo', 13: 'StreamDeckPlusXL'}


def read_profile(archive, *, vendor_default=False):
    roots = [p for p in archive.namelist() if p.endswith('.sdProfile/manifest.json')]
    if len(roots) != 1:
        raise ValueError(f'Expected one profile root, found {roots}')
    metadata = json.loads(archive.read(roots[0]))
    folder = PurePosixPath(roots[0]).parent / 'Profiles'
    controllers = set()
    actions = set()
    if vendor_default:
        # Several Elgato format 2.0 defaults store pages under encoded directory names.
        pages = [n for n in archive.namelist() if PurePosixPath(n).parent.parent == folder
                 and PurePosixPath(n).name == 'manifest.json']
    else:
        pages = [str(folder / uid.upper() / 'manifest.json') for uid in metadata['Pages']['Pages']]
    if not pages:
        raise ValueError(f'No pages under {folder}')
    for name in pages:
        page = json.loads(archive.read(name))
        for controller in page['Controllers']:
            controllers.add(controller['Type'])
            if not vendor_default:
                actions.update(action['UUID'] for action in controller['Actions'].values())
    return metadata['Device']['Model'], controllers, actions


def check(app, package):
    contents = app / 'Contents'
    host = plistlib.loads((contents / 'Info.plist').read_bytes())
    if (host['CFBundleIdentifier'], host['CFBundleShortVersionString']) != ('com.elgato.StreamDeck', '8.0.0'):
        raise ValueError('Expected the Elgato Stream Deck 8.0.0 macOS app')
    print(f"Host {host['CFBundleShortVersionString']} build {host['CFBundleVersion']}")
    resources = contents / 'Resources'
    navigation = resources / 'Plugins/com.elgato.streamdeck.page.sdPlugin/manifest.json'
    builtin = {a['UUID'] for a in json.loads(navigation.read_bytes())['Actions']}
    with ZipFile(package) as plugin:
        prefix = 'com.fionetworks.rme-globalosc.sdPlugin/'
        manifest = json.loads(plugin.read(prefix + 'manifest.json'))
        own = {a['UUID'] for a in manifest['Actions']}
        profiles = manifest['Profiles']
        starters = [p['DeviceType'] for p in profiles if p.get('AutoInstall')]
        if sorted(starters) != sorted(DEVICE_NAMES):
            raise ValueError(f'Unexpected automatic starter device types: {starters}')
        print(f"Plugin {manifest['Version']} · {len(profiles)} profiles")
        for profile in profiles:
            device = DEVICE_NAMES[profile['DeviceType']]
            reference = resources / 'DefaultProfiles' / (device + '_macDefault.streamDeckProfile')
            with ZipFile(reference) as archive:
                model, supported, _ = read_profile(archive, vendor_default=True)
            with ZipFile(io.BytesIO(plugin.read(prefix + profile['Name'] + '.streamDeckProfile'))) as archive:
                actual, controllers, actions = read_profile(archive)
            missing = actions - own - builtin
            if actual != model or controllers - supported or missing:
                raise ValueError(f"{profile['Name']}: expected {model}, got {actual}; "
                                 f"unmatched controllers {controllers - supported}; unresolved actions {missing}")
            print(f"PASS {profile['Name']} · {model} · {', '.join(sorted(controllers))}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('app', type=Path, help='Installed or expanded Stream Deck.app')
    parser.add_argument('--package', type=Path, default=SHIPPED)
    args = parser.parse_args()
    check(args.app, args.package)
