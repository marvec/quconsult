// One-off generator: SVG Q-mark → PNG favicons + apple-touch-icon.
// Run via `pnpm icons`. Re-run any time `public/favicon.svg` changes.
import { readFile, writeFile } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';

const SVG_PATH = new URL('../public/favicon.svg', import.meta.url);
const PUBLIC_DIR = new URL('../public/', import.meta.url);

// Q-mark scaled into a padded 180×180 canvas with off-white bg
// (DESIGN_BRIEF: never pure white; #FAFAF8). 18 % padding so the mark
// breathes inside the iOS rounded-rect mask.
function buildPaddedSvg(svg, size, bg = '#FAFAF8', padding = 0.18) {
  const inner = size * (1 - padding * 2);
  const offset = size * padding;
  // Strip outer <svg> tag and re-wrap
  const body = svg.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${bg}"/>
  <g transform="translate(${offset} ${offset}) scale(${inner / 200})">${body}</g>
</svg>`;
}

function buildBareSvg(svg, size, transparent = true) {
  const body = svg.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const bg = transparent ? '' : '<rect width="' + size + '" height="' + size + '" fill="#FAFAF8"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bg}
  <g transform="scale(${size / 200})">${body}</g>
</svg>`;
}

async function rasterize(svgString, outName, fitWidth) {
  const resvg = new Resvg(svgString, {
    fitTo: { mode: 'width', value: fitWidth },
    background: 'rgba(0,0,0,0)',
  });
  const png = resvg.render().asPng();
  const out = new URL(outName, PUBLIC_DIR);
  await writeFile(out, png);
  console.log(`✓ ${outName} (${png.byteLength} bytes)`);
}

const svg = await readFile(SVG_PATH, 'utf8');

// Apple touch icon: 180×180 with off-white bg + padding (iOS masks corners)
await rasterize(buildPaddedSvg(svg, 180), 'apple-touch-icon.png', 180);

// PNG favicons (transparent bg, no padding) — modern browsers prefer SVG
// but older fallbacks need PNG
await rasterize(buildBareSvg(svg, 32), 'favicon-32x32.png', 32);
await rasterize(buildBareSvg(svg, 16), 'favicon-16x16.png', 16);

console.log('Done.');
