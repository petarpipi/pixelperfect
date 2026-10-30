"""Inspect source/rendered typography bounds; no source images are modified."""
from PIL import Image, ImageChops, ImageStat
from pathlib import Path
import json

project = Path(__file__).resolve().parent.parent
pairs = [
    ('01 Desktop Dashboard.png', 'dashboard-desktop-1440.png'),
    ('02 Transactions.png', 'transactions-desktop-1440.png'),
    ('03 Analytics.png', 'analytics-desktop-1440.png'),
    ('04 Mobile Dashboard.png', 'dashboard-mobile-390.png'),
]
results = []
for reference, rendered in pairs:
    original = Image.open(project / 'docs/reference' / reference).convert('RGB')
    implementation = Image.open(project / 'docs/screenshots' / rendered).convert('RGB')
    if original.size != implementation.size:
        raise ValueError(f'Size mismatch: {reference}')
    difference = ImageChops.difference(original, implementation)
    results.append({'reference': reference, 'rendered': rendered, 'size': original.size,
                    'mean_absolute_rgb_channel_difference_0_to_255': ImageStat.Stat(difference).mean})
    regions = [(248,110,450,145), (268,237,450,278), (272,385,395,417)] if original.width == 1440 else [(36,157,300,197), (34,280,175,312), (20,548,190,576)]
    print(reference)
    for region in regions:
        bounds = []
        for image in [original, implementation]:
            mask = image.crop(region).convert('L').point(lambda value: 255 if value < 100 else 0)
            bounds.append(mask.getbbox())
        print('  Dark pixel bounds within', region, ':', bounds)
out = project / 'docs/screenshots/reference-comparison.json'
out.write_text(json.dumps({'method': 'Unaligned raw RGB difference, includes text rasterization and icon differences; not a fidelity percentage or pass threshold.', 'frames': results}, indent=2) + '\n')
