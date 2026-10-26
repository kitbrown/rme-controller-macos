"""Validate portable profile contents against real plugin contracts and baseline."""
import hashlib
import json
from pathlib import Path
import subprocess
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PLUGIN = ROOT / 'com.fionetworks.rme-globalosc.sdPlugin'
UUID = 'com.fionetworks.rme-globalosc'
MANIFEST = json.loads((PLUGIN / 'manifest.json').read_text())
MODELS = {0: ('20GAA9902', 5, 3, 0), 1: ('20GAI9901', 3, 2, 0),
          2: ('20GAT9902', 8, 4, 0), 7: ('20GBD9901', 4, 2, 4),
          9: ('20GBJ9901', 4, 2, 0), 13: ('20GBX9901', 9, 4, 6)}


class StarterProfiles(unittest.TestCase):
    def test_existing_runtime_ui_and_actions_unchanged(self):
        original = json.loads(subprocess.check_output(
            ['git', 'show', '0c250b3a835c564261a939a32f10d1f30ef66c92:com.fionetworks.rme-globalosc.sdPlugin/manifest.json'], cwd=ROOT))
        current = dict(MANIFEST)
        current.pop('Profiles')
        self.assertEqual(current.pop('Version'), '1.1.8.1')
        original.pop('Version')
        self.assertEqual(current, original)
        for folder in ('bin', 'ui', 'imgs'):
            for path in (PLUGIN / folder).rglob('*'):
                if path.is_file():
                    old = subprocess.check_output(['git', 'show', '0c250b3a835c564261a939a32f10d1f30ef66c92:' + str(path.relative_to(ROOT))], cwd=ROOT)
                    self.assertEqual(path.read_bytes(), old, str(path))

    def test_all_profiles_resolve_fit_and_preserve_control_settings(self):
        self.assertEqual({p['DeviceType'] for p in MANIFEST['Profiles']}, set(MODELS))
        ids = set()
        for profile in MANIFEST['Profiles']:
            with self.subTest(profile=profile['Name']):
                self.assertTrue(profile['AutoInstall'])
                self.assertTrue(profile['DontAutoSwitchWhenInstalled'])
                self.assertFalse(profile['Readonly'])
                model, cols, rows, dials = MODELS[profile['DeviceType']]
                with zipfile.ZipFile(PLUGIN / (profile['Name'] + '.streamDeckProfile')) as archive:
                    names = archive.namelist()
                    self.assertTrue(all(n.endswith('/manifest.json') and '..' not in n for n in names))
                    root = next(n for n in names if n.count('/') == 1)
                    metadata = json.loads(archive.read(root))
                    self.assertEqual(metadata['Device'], {'Model': model, 'UUID': ''})
                    self.assertEqual(metadata['Version'], '3.0')
                    pages = metadata['Pages']
                    self.assertEqual(pages['Current'], pages['Pages'][0])
                    self.assertEqual(pages['Default'], pages['Pages'][0])
                    snapshots, toggles, presets = set(), set(), set()
                    for page_id in pages['Pages']:
                        page = json.loads(archive.read(root.rsplit('/', 1)[0] + '/Profiles/' + page_id.upper() + '/manifest.json'))
                        for controller in page['Controllers']:
                            encoder = controller['Type'] == 'Encoder'
                            if encoder:
                                self.assertEqual(len(controller['Actions']), dials)
                            for coordinate, action in controller['Actions'].items():
                                x, y = map(int, coordinate.split(','))
                                self.assertTrue(0 <= x < (dials if encoder else cols))
                                self.assertTrue(0 <= y < (1 if encoder else rows))
                                self.assertNotIn(action['ActionID'], ids)
                                ids.add(action['ActionID'])
                                if action['UUID'].startswith(UUID + '.'):
                                    spec = next(a for a in MANIFEST['Actions'] if a['UUID'] == action['UUID'])
                                    self.assertIn(controller['Type'], spec['Controllers'])
                                    self.assertEqual(len(action['States']), len(spec['States']))
                                    self.assertEqual(action['Plugin']['UUID'], UUID)
                                    settings = action['Settings']
                                    self.assertEqual((settings['host'], settings['sendPort'], settings['receivePort']), ('127.0.0.1', 7008, 9008))
                                    self.assertNotIn('path', settings)
                                    self.assertNotEqual(settings.get('preset'), 'mic48v')
                                    if encoder:
                                        self.assertTrue(settings['muteOnPress'])
                                        self.assertEqual(settings['stepDb'], 0.5)
                                        presets.add((action['UUID'].rsplit('.', 1)[1], settings['preset']))
                                    elif action['UUID'].endswith('.snapshot'):
                                        snapshots.add(settings['snapshot'])
                                    else:
                                        toggles.add(settings['preset'])
                                else:
                                    self.assertIn(action['UUID'], ('com.elgato.streamdeck.page.next', 'com.elgato.streamdeck.page.previous'))
                    self.assertEqual(snapshots, set(range(1, 9)))
                    self.assertEqual(toggles, {'mainMute', 'dim', 'mono', 'micMute', 'tvSpdifMute', 'spdifOutMute', 'talkback', 'phonesMute'})
                    if dials:
                        self.assertEqual(presets, {('mixfader', 'playback12'), ('mixfader', 'mic1'), ('mixfader', 'spdif'), ('outputvolume', 'main'), ('outputvolume', 'spdif'), ('outputvolume', 'phones1')})

    def test_rebuild_is_reproducible(self):
        def hashes():
            return {p.name: hashlib.sha256(p.read_bytes()).hexdigest()
                    for p in (PLUGIN / 'profiles').glob('*.streamDeckProfile')}
        before = hashes()
        subprocess.check_call(['python3', 'tools/build-starter-profiles.py'], cwd=ROOT)
        self.assertEqual(before, hashes())


if __name__ == '__main__':
    unittest.main()
