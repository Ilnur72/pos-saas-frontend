// EAN-13 barcode encoding and SVG rendering — no external dependencies

const L = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
const G = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
const R = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];
// First digit of EAN-13 determines L/G encoding pattern for left 6 digits
const STRUCTURE = ['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];

export function ean13CheckDigit(s: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(s[i]) * (i % 2 === 0 ? 1 : 3);
  return (10 - (sum % 10)) % 10;
}

// Prefix 200–299 is reserved by GS1 for internal/store use — safe for non-branded products
export function generateInternalEAN13(): string {
  const rand = Math.floor(Math.random() * 999_999_998) + 1;
  const base = '200' + String(rand).padStart(9, '0');
  return base + ean13CheckDigit(base);
}

export function isValidEAN13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  return ean13CheckDigit(code.slice(0, 12)) === parseInt(code[12]);
}

function encodeEAN13Bits(code: string): string {
  const structure = STRUCTURE[parseInt(code[0])];
  let bits = '101'; // start guard
  for (let i = 0; i < 6; i++) {
    const d = parseInt(code[i + 1]);
    bits += structure[i] === 'L' ? L[d] : G[d];
  }
  bits += '01010'; // center guard
  for (let i = 0; i < 6; i++) bits += R[parseInt(code[i + 7])];
  bits += '101'; // end guard
  return bits; // 95 modules total
}

export interface EAN13RenderOpts {
  name?: string;
  price?: string;
  moduleWidth?: number; // px per module, default 2
  barHeight?: number;   // px, default 48
}

export function renderEAN13SVG(code: string, opts: EAN13RenderOpts = {}): string {
  if (!isValidEAN13(code)) return `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="30"><text y="20" font-size="10" fill="red">Invalid EAN-13</text></svg>`;

  const MW = opts.moduleWidth ?? 2;
  const BH = opts.barHeight ?? 48;
  const QUIET = 7;
  const GUARD_EXT = 5; // guard bars extend below data bars
  const FS = 9;        // font size for digit labels
  const NUM_H = 13;
  const LABEL_H = opts.name ? 12 : 0;
  const PRICE_H = opts.price ? 12 : 0;
  const W = (95 + QUIET * 2) * MW;
  const H = BH + GUARD_EXT + NUM_H + LABEL_H + PRICE_H + 2;

  const bits = encodeEAN13Bits(code);
  // Guard bar module indices: start(0-2), center(45-49), end(92-94)
  const guardIdx = new Set([0,1,2,45,46,47,48,49,92,93,94]);

  let rects = '';
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === '1') {
      const x = (QUIET + i) * MW;
      const h = guardIdx.has(i) ? BH + GUARD_EXT : BH;
      rects += `<rect x="${x}" y="0" width="${MW}" height="${h}" fill="#000"/>`;
    }
  }

  // Digit text labels below bars
  const dy = BH + GUARD_EXT + FS + 1;
  const d = code.split('');
  // First digit sits to the left of the start guard
  let texts = `<text x="${(QUIET - 1) * MW}" y="${dy}" text-anchor="end" font-family="monospace" font-size="${FS}">${d[0]}</text>`;
  // Left 6 digits: module index of left half starts at 3; digit i center = 3 + i*7 + 3
  for (let i = 0; i < 6; i++) {
    const cx = (QUIET + 3 + i * 7 + 3) * MW;
    texts += `<text x="${cx}" y="${dy}" text-anchor="middle" font-family="monospace" font-size="${FS}">${d[i + 1]}</text>`;
  }
  // Right 6 digits: right half starts at module 50; digit j center = 50 + j*7 + 3
  for (let j = 0; j < 6; j++) {
    const cx = (QUIET + 50 + j * 7 + 3) * MW;
    texts += `<text x="${cx}" y="${dy}" text-anchor="middle" font-family="monospace" font-size="${FS}">${d[j + 7]}</text>`;
  }

  let extras = '';
  const nameY = BH + GUARD_EXT + NUM_H + 10;
  const priceY = nameY + (opts.name ? 12 : 0);
  if (opts.name) {
    const label = opts.name.length > 28 ? opts.name.slice(0, 27) + '…' : opts.name;
    extras += `<text x="${W / 2}" y="${nameY}" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#444">${label}</text>`;
  }
  if (opts.price) {
    extras += `<text x="${W / 2}" y="${priceY}" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="#000">${opts.price}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${rects}${texts}${extras}</svg>`;
}

export function printBarcodeLabels(
  items: { name: string; barcode: string; price: string; qty: number }[],
) {
  const labels = items.flatMap(({ name, barcode, price, qty }) =>
    Array.from({ length: qty }, () =>
      renderEAN13SVG(barcode, { name, price }),
    ),
  );

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Barcode Labels</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #fff; }
    .grid { display: flex; flex-wrap: wrap; gap: 3mm; padding: 5mm; }
    .label { border: 0.5px solid #ccc; padding: 2mm; display: inline-flex; align-items: center; justify-content: center; break-inside: avoid; }
    @media print { .label { border-color: #aaa; } @page { margin: 5mm; } }
  </style>
</head>
<body>
  <div class="grid">
    ${labels.map((svg) => `<div class="label">${svg}</div>`).join('\n')}
  </div>
  <script>window.addEventListener('load', function() { setTimeout(function() { window.print(); }, 300); });</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
