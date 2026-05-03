// One-off generator: SVG Q-mark → PNG favicons + apple-touch-icon + OG image.
// Run via `pnpm icons`. Re-run any time `public/favicon.svg` or this file changes.
//
// Fonts: scripts/fonts/{Inter,NotoSerif}.ttf are gitignored. If missing, run
//   curl -fLo scripts/fonts/NotoSerif.ttf 'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserif/NotoSerif%5Bwdth%2Cwght%5D.ttf'
//   curl -fLo scripts/fonts/Inter.ttf    'https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf'
// (build-time only — runtime fonts come from Google Fonts CDN per BaseLayout)

import { readFile, writeFile, access } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';

const SVG_PATH = new URL('../public/favicon.svg', import.meta.url);
const PUBLIC_DIR = new URL('../public/', import.meta.url);
const FONTS_DIR = new URL('./fonts/', import.meta.url);

function stripSvgWrapper(svg) {
  return svg.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function buildPaddedSvg(svg, size, bg = '#FAFAF8', padding = 0.18) {
  const inner = size * (1 - padding * 2);
  const offset = size * padding;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${bg}"/>
  <g transform="translate(${offset} ${offset}) scale(${inner / 200})">${stripSvgWrapper(svg)}</g>
</svg>`;
}

function buildBareSvg(svg, size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <g transform="scale(${size / 200})">${stripSvgWrapper(svg)}</g>
</svg>`;
}

// 1200×630 OG card: warm bg, large Q-mark left, wordmark + tagline right,
// thin amber bottom stripe (5–10 % accent rule from DESIGN_BRIEF).
function buildOgSvg(qMark) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#F7F5F1"/>
  <g transform="translate(96 175) scale(1.4)">${stripSvgWrapper(qMark)}</g>
  <text x="500" y="295" font-family="Noto Serif" font-size="92" font-weight="600" fill="#1A1A1A" letter-spacing="-1.5">QuConsult</text>
  <text x="500" y="355" font-family="Inter" font-size="28" font-weight="400" fill="#555555">Praktické AI poradenství pro české firmy.</text>
  <text x="500" y="395" font-family="Inter" font-size="28" font-weight="400" fill="#555555">Bez hype, bez buzzwordů.</text>
  <rect x="0" y="618" width="1200" height="12" fill="#D97706"/>
  <text x="96" y="558" font-family="Inter" font-size="20" font-weight="500" fill="#888888" letter-spacing="2">QUCONSULT.CZ</text>
</svg>`;
}

async function loadFontsIfPresent() {
  const files = ['NotoSerif.ttf', 'Inter.ttf'];
  const buffers = [];
  for (const f of files) {
    const p = new URL(f, FONTS_DIR);
    try {
      await access(p);
      buffers.push(await readFile(p));
    } catch {
      // Font missing — resvg will fall back to its default font.
      // OG image text will look generic. See header for download instructions.
    }
  }
  return buffers;
}

async function rasterize(svgString, outName, fitWidth, opts = {}) {
  const resvg = new Resvg(svgString, {
    fitTo: { mode: 'width', value: fitWidth },
    background: opts.background ?? 'rgba(0,0,0,0)',
    font: opts.fontFiles
      ? { fontBuffers: opts.fontFiles, loadSystemFonts: false }
      : undefined,
  });
  const png = resvg.render().asPng();
  const out = new URL(outName, PUBLIC_DIR);
  await writeFile(out, png);
  console.log(`✓ ${outName} (${(png.byteLength / 1024).toFixed(1)} KB)`);
}

const svg = await readFile(SVG_PATH, 'utf8');
const fontFiles = await loadFontsIfPresent();

if (fontFiles.length < 2) {
  console.warn('⚠  scripts/fonts/{NotoSerif,Inter}.ttf missing — OG image text will use fallback font. See script header for download URLs.');
}

await rasterize(buildPaddedSvg(svg, 180), 'apple-touch-icon.png', 180);
await rasterize(buildBareSvg(svg, 32), 'favicon-32x32.png', 32);
await rasterize(buildBareSvg(svg, 16), 'favicon-16x16.png', 16);
await rasterize(buildOgSvg(svg), 'og-default.png', 1200, { fontFiles });

console.log('Done.');
