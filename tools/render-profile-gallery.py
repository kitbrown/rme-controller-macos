"""Render the archived + XL mappings and plugin display output into offline gallery proofs."""
from pathlib import Path
from html import escape
import json
import os
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PROFILE_DIR = ROOT / 'com.fionetworks.rme-globalosc.sdPlugin/profiles'
OUT = ROOT / 'marketplace/v1.1.10/gallery-preview'
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
COPY = {
    'Starter': ('Your starting mix', 'Eight control-room and mute keys, eight snapshot recalls and six hands-on level controls. Open slots are yours to assign.'),
    'Monitor': ('Monitor the room', 'Switch monitors to mono, dim the room, check stereo peaks and see whether the plugin is receiving OSC.'),
    'Mix': ('Balance three sources', 'Raise or lower the Mic 1, Core Audio and TV SPDIF sends to Main in half-decibel steps.'),
    'Processing': ('Shape an input', 'Switch EQ, dynamics, HPF and Auto Level. Six dials adjust three EQ bands, compressor threshold, ratio and makeup gain.'),
    'Snapshots': ('Recall a mix', 'Recall any of the eight snapshots already stored in TotalMix. The active slot lights red.'),
    'Recipes': ('Three starting points', 'Apply a low-mid cut, a presence lift or gentle compression to the hardware input selected on each key.'),
    'EQ': ('Shape the spectrum', 'Six starting points for filtering, shelving and tonal balance. Pick the hardware input in each key’s settings.'),
    'Compression': ('Control the dynamics', 'Seven source-specific compressor presets and an expander. Each key displays its assigned input by default.')
}


def read_profiles():
    pages = []
    for family in ('starter', 'workflow'):
        with zipfile.ZipFile(PROFILE_DIR / f'rme-{family}-plus-xl.streamDeckProfile') as archive:
            root = next(name for name in archive.namelist() if name.count('/') == 1)
            profile = json.loads(archive.read(root))
            ids = profile['Pages']
            assert ids['Default'] == ids['Pages'][0]
            for uid in ids['Pages']:
                member = f"{root.split('/')[0]}/Profiles/{uid.upper()}/manifest.json"
                page = json.loads(archive.read(member))
                page['label'] = 'Starter' if family == 'starter' else page['Name']
                pages.append(page)
    result = subprocess.run(['node', ROOT / 'tools/capture-profile-preview.mjs'],
                            input=json.dumps(pages), text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr)
    return json.loads(result.stdout)


def tile(action):
    if action is None:
        return '<div class="slot" aria-label="Unassigned"></div>'
    title = escape(action['title'])
    return (f'<div class="key"><img src="{escape(action["image"])}" alt="{escape(action["Name"])}">'
            f'<span>{title}</span></div>')


def strip(action):
    f = action['feedback']
    bar = f['indicator']
    return (f'<div class="dial" style="background:{f["title"]["background"]}"><b>{escape(f["title"]["value"])}</b>'
            f'<strong>{escape(f["value"]["value"])}</strong><i style="--fill:{bar["value"]:.1f}%;'
            f'--accent:{bar["bar_fill_c"]}"></i><small>{escape(f["status"]["value"])}</small></div>')


def controllers(page):
    return {c['Type']: c['Actions'] for c in page['Controllers']}


def board(page):
    c = controllers(page)
    keys = ''.join(tile(c['Keypad'].get(f'{x},{y}')) for y in range(4) for x in range(9))
    strips = ''.join(strip(c['Encoder'][f'{x},0']) for x in range(6))
    knobs = '<div class="knob"><i></i></div>' * 6
    return f'<div class="board"><div class="matrix">{keys}</div><div class="strip">{strips}</div><div class="knobs">{knobs}</div></div>'


def slide(page):
    label = page['label']
    heading, copy = COPY[label]
    family = 'Auto-install starter' if label == 'Starter' else 'Optional workflow'
    return (f'<section id="{label}"><article><div class="eyebrow">{family} &nbsp; / &nbsp; {page["Name"]}</div>'
            f'<h1>{heading}</h1><p>{copy}</p></article>{board(page)}</section>')


def library(pages):
    groups = []
    for label in ('EQ', 'Compression'):
        mapping = controllers(next(p for p in pages if p['label'] == label))['Keypad']
        keys = ''.join(tile(mapping[f'{x},0']) for x in range(len(mapping)))
        groups.append(f'<div class="group"><h2>{label}</h2><div class="keyrow">{keys}</div></div>')
    return ('<section id="Presets"><article><div class="eyebrow">Optional workflow &nbsp; / &nbsp; Two pages</div>'
            '<h1>Input presets</h1><p>The top caption names the input and preset. A red check marks a match with the mixer. LPF shows SETUP until you select the filter type.</p></article>'
            '<div class="library">' + ''.join(groups) + '</div></section>')


def workflows(pages):
    cards = []
    for page in pages[1:]:
        name = page['label']
        keys = ''.join(tile(action) for action in controllers(page)['Keypad'].values())
        cards.append(f'<div class="pagecard"><h2>{name}</h2><div>{keys}</div></div>')
    return ('<section id="Workflow"><article><div class="eyebrow">Optional workflow &nbsp; / &nbsp; Stream Deck + XL</div>'
            '<h1>Seven workflow pages</h1><p>Swipe the touch strip to switch pages. Each group shows the keys assigned on that page.</p></article>'
            '<div class="pagecards">' + ''.join(cards) + '</div></section>')


if __name__ == '__main__':
    pages = read_profiles()
    assert [p['label'] for p in pages] == list(COPY)
    options = list(COPY) + ['Workflow', 'Presets']
    nav = ''.join(f'<a href="#{k}">{k}</a>' for k in options)
    template = Path(__file__).with_name('profile-gallery.html').read_text()
    OUT.mkdir(parents=True, exist_ok=True)
    html = OUT / 'profiles.html'
    html.write_text(template.replace('<!--NAV-->', nav).replace('<!--VIEWS-->', ''.join(map(slide, pages)) + workflows(pages) + library(pages)))
    with tempfile.TemporaryDirectory() as tmp:
        for name, image in [('Starter', 'starter-plus-xl'), ('Workflow', 'workflow-pages'), ('Presets', 'processing-presets')]:
            subprocess.run([CHROME, '--headless', '--disable-gpu', '--hide-scrollbars',
                            '--no-first-run', f'--user-data-dir={tmp}', '--window-size=1920,960',
                            '--force-device-scale-factor=1', '--virtual-time-budget=1200',
                            f'--screenshot={OUT / (image + ".png")}', html.as_uri() + '?gallery#' + name],
                           check=True, stdout=subprocess.DEVNULL)
