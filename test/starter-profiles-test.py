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
    def test_preserved_runtime_and_action_contracts(self):
        original = json.loads(subprocess.check_output(
            ['git', 'show', '9f0a413b5b7a5b6c8b61e7159c9764afff45eacd:com.fionetworks.rme-globalosc.sdPlugin/manifest.json'], cwd=ROOT))
        current = json.loads(json.dumps(MANIFEST))
        current.pop('Profiles')
        self.assertEqual(current.pop('Version'), '1.1.10.3')
        self.assertEqual(current.pop('SupportURL'), 'https://github.com/kitbrown/rme-controller-macos#install')
        snapshot = next(a for a in current['Actions'] if a['UUID'].endswith('.snapshot'))
        for state in snapshot['States']:
            self.assertEqual(state.pop('TitleAlignment'), 'bottom')
            self.assertEqual(state.pop('FontSize'), 10)
        recipe = next(a for a in current['Actions'] if a['UUID'] == UUID + '.processingrecipe')
        self.assertEqual(recipe['Controllers'], ['Keypad'])
        self.assertTrue((PLUGIN / recipe['PropertyInspectorPath']).is_file())
        current['Actions'].remove(recipe)
        original.pop('Version')
        self.assertEqual(current, original)
        for folder in ('bin', 'ui', 'imgs'):
            for path in (PLUGIN / folder).rglob('*'):
                if path.name in ('console-art.js', 'console-strip.json', 'console.css', 'plugin.js', 'common.js',
                                 'processing-recipe.js', 'processing-recipe.html'):
                    continue
                if path.is_file() and path.name not in ('plugin.png', 'plugin@2x.png'):
                    old = subprocess.check_output(['git', 'show', '9f0a413b5b7a5b6c8b61e7159c9764afff45eacd:' + str(path.relative_to(ROOT))], cwd=ROOT)
                    actual = path.read_bytes()
                    if path.suffix == '.html':
                        actual = actual.replace(b'<link rel="stylesheet" href="console.css">', b'')
                    if path.name == "toggle-advanced.html":
                        old = old.replace(b"Channel Low Cut", b"Channel HPF")
                    self.assertEqual(actual, old, str(path))

    def test_new_icons_match_validated_ci_build(self):
        expected = {
            'plugin.png': 'e2e8b6d292359bf15d3af9eabe53ab88062341ae9d585fc68ba7e9fe56d3c1fd',
            'plugin@2x.png': '57026663997c0aec4a1afca203f48d9a769f95bab89c1d891514f4d5c93742ed',
        }
        for name, digest in expected.items():
            self.assertEqual(hashlib.sha256((PLUGIN / 'imgs' / name).read_bytes()).hexdigest(), digest)

    def test_all_profiles_resolve_fit_and_preserve_control_settings(self):
        self.assertEqual({p['DeviceType'] for p in MANIFEST['Profiles']}, set(MODELS))
        self.assertEqual(len(MANIFEST['Profiles']), 12)
        for device in MODELS:
            group = [p for p in MANIFEST['Profiles'] if p['DeviceType'] == device]
            self.assertEqual(sorted(p['AutoInstall'] for p in group), [False, True])
        ids = set()
        for profile in MANIFEST['Profiles']:
            with self.subTest(profile=profile['Name']):
                workflow = 'rme-workflow-' in profile['Name']
                self.assertEqual(profile['AutoInstall'], not workflow)
                if not workflow:
                    path = PLUGIN / (profile['Name'] + '.streamDeckProfile')
                    self.assertEqual(path.read_bytes(), subprocess.check_output(
                        ['git', 'show', 'v1.1.9:' + str(path.relative_to(ROOT))], cwd=ROOT))
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
                    titles = []
                    recipes = []
                    library = {"EQ": [], "Compression": []}
                    for page_id in pages['Pages']:
                        page = json.loads(archive.read(root.rsplit('/', 1)[0] + '/Profiles/' + page_id.upper() + '/manifest.json'))
                        titles.append(page['Name'].split()[0])
                        for controller in page['Controllers']:
                            encoder = controller['Type'] == 'Encoder'
                            if workflow and not encoder and not dials:
                                for offset, direction in [(2, 'previous'), (1, 'next')]:
                                    index = cols * rows - offset
                                    nav = controller['Actions'][f'{index % cols},{index // cols}']
                                    self.assertEqual(nav['UUID'], 'com.elgato.streamdeck.page.' + direction)
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
                                    if workflow:
                                        kind = spec['UUID'].rsplit('.', 1)[1]
                                        if encoder and titles[-1] == 'Processing':
                                            self.assertEqual(kind, 'parameter')
                                            self.assertEqual(settings['paramKey'], (
                                                'eq1Gain','eq2Gain','eq3Gain','compThreshold','compRatio','makeupGain')[x])
                                            self.assertEqual((settings['paramBus'], settings['sourceIndex']), ('input', 0))
                                        if kind == 'processingrecipe':
                                            self.assertEqual(settings['channel'], 1)
                                            if titles[-1] == 'Recipes':
                                                recipes.append(tuple(settings.get(k) for k in (
                                                    'preset','frequency','gain','threshold','ratio')))
                                            else:
                                                library[titles[-1]].append(settings['keyLabel'])
                                        if kind == 'snapshot':
                                            snapshots.add(settings['snapshot'])
                                        if kind == 'levelkey':
                                            presets.add((settings['preset'], settings['keyMode']))
                                        if kind == 'toggle':
                                            toggles.add(settings['preset'])
                                        continue
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
                    if workflow:
                        self.assertEqual(list(dict.fromkeys(titles)), ['Monitor','Mix','Processing','Snapshots','Recipes','EQ','Compression'])
                        self.assertEqual(library['EQ'], ['HPF','LOW BST','1K CUT','HI LIFT','HI AIR','LPF'])
                        self.assertEqual(library['Compression'], ['DEEP VOX','LITE VOX','OH DRUMS','MID TOMS','KICK','GUITAR','BASS','EXP'])
                        self.assertEqual(recipes, [('eq',250,-2,None,None), ('eq',3000,2,None,None),
                                                   ('compressor',None,None,-18,2)])
                        self.assertEqual(presets, {(p, m) for p in ('mic1','playback12','spdif') for m in ('down','up')})
                        self.assertEqual(toggles, {'mainMute','dim','mono','phonesMute','eqEnable','dynEnable','lowcutEnable','autoLevelEnable'})
                        continue
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
