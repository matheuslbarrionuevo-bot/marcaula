// Gera o ícone da ficha (512, quadrado cheio — a Play aplica o próprio
// arredondamento) e a imagem de destaque (feature graphic 1024x500).
// Uso: node scripts/gen-play-assets.mjs   (dentro de app/; usa sharp)
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const INDIGO = "#4F46E5";
const WHATS = "#25D366";

// arte da marca: M em traço + tique (mesma do ícone do app)
const marca = (escala = 1) => `
  <polyline points="128,330 128,150 256,300 384,150 384,330"
    stroke="#ffffff" stroke-width="50" fill="none"
    stroke-linecap="round" stroke-linejoin="round" transform="scale(${escala})"/>
  <polyline points="300,402 352,452 448,332"
    stroke="${WHATS}" stroke-width="40" fill="none"
    stroke-linecap="round" stroke-linejoin="round" transform="scale(${escala})"/>`;

const dir = "../play-assets";
mkdirSync(dir, { recursive: true });

// ícone da ficha: quadrado CHEIO (sem cantos transparentes)
const icone = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect width="512" height="512" fill="${INDIGO}"/>
  ${marca()}
</svg>`;
await sharp(Buffer.from(icone)).png().toFile(`${dir}/icon-512.png`);
console.log("play-assets/icon-512.png (512x512, quadrado cheio)");

// feature graphic 1024x500
const destaque = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500">
  <defs>
    <radialGradient id="g" cx="0.88" cy="0.08" r="0.9">
      <stop offset="0" stop-color="${INDIGO}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${INDIGO}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="500" fill="#191645"/>
  <rect width="1024" height="500" fill="url(#g)"/>
  <svg x="90" y="145" width="210" height="210" viewBox="0 0 512 512">
    <rect width="512" height="512" rx="113" fill="${INDIGO}"/>
    ${marca()}
  </svg>
  <text x="340" y="245" font-family="Arial, sans-serif" font-size="96" font-weight="800" fill="#ffffff">Marcaula</text>
  <text x="344" y="300" font-family="Arial, sans-serif" font-size="31" fill="#c7d2fe">Marque, dê e cobre suas aulas.</text>
  <text x="344" y="345" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#7ef2a8">marcaula.vercel.app</text>
</svg>`;
await sharp(Buffer.from(destaque)).png().toFile(`${dir}/feature-graphic.png`);
console.log("play-assets/feature-graphic.png (1024x500)");
