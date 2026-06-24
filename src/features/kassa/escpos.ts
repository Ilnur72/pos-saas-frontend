// ESC/POS encoder — thermal printer protocol

export class EscPos {
  private buf: number[] = [];

  init()  { this.buf.push(0x1B, 0x40); return this; }

  align(a: 'left' | 'center' | 'right') {
    this.buf.push(0x1B, 0x61, { left: 0, center: 1, right: 2 }[a]);
    return this;
  }

  bold(on: boolean)  { this.buf.push(0x1B, 0x45, on ? 1 : 0); return this; }
  underline(on: boolean) { this.buf.push(0x1B, 0x2D, on ? 1 : 0); return this; }

  size(w: 1 | 2, h: 1 | 2) {
    // GS ! n  — width bits 4-7, height bits 0-3
    this.buf.push(0x1D, 0x21, ((w - 1) << 4) | (h - 1));
    return this;
  }

  text(s: string) {
    // Encode UTF-8 bytes manually for Uzbek Latin (mostly ASCII)
    const bytes = new TextEncoder().encode(s);
    bytes.forEach((b) => this.buf.push(b));
    return this;
  }

  nl(n = 1) { for (let i = 0; i < n; i++) this.buf.push(0x0A); return this; }

  dashedLine(cols = 32) { return this.text('-'.repeat(cols)).nl(); }

  // Ikkita ustun: chap va o'ng (jami cols)
  twoCol(left: string, right: string, cols = 32) {
    const gap = Math.max(1, cols - left.length - right.length);
    return this.text(left + ' '.repeat(gap) + right).nl();
  }

  // Qog'ozni kesish
  cut() { this.buf.push(0x1D, 0x56, 0x41, 0x05); return this; }

  // 3 ta bo'sh qator + kesish
  feedAndCut(lines = 3) {
    this.buf.push(0x1B, 0x64, lines); // ESC d — feed n lines
    this.cut();
    return this;
  }

  encode(): Uint8Array { return new Uint8Array(this.buf); }
}

export function buildReceipt(
  order: any,
  change: number,
  tenantName: string,
  cols = 32,
): Uint8Array {
  const fmt = (n: number) => new Intl.NumberFormat('uz-UZ').format(Math.round(n));
  const enc = new EscPos();

  enc.init()
    .align('center').bold(true).size(2, 2).text(tenantName).nl().size(1, 1)
    .bold(false).text('KASSA CHEKI').nl()
    .text(new Date().toLocaleString('uz-UZ')).nl()
    .align('left').dashedLine(cols);

  for (const item of order.items ?? []) {
    const name = (item.product?.name ?? 'Mahsulot').slice(0, cols - 2);
    enc.text(name).nl();
    const detail = `  ${item.qty} x ${fmt(item.unitPrice)}`;
    enc.twoCol(detail, fmt(item.totalPrice) + " so'm", cols);
  }

  enc.dashedLine(cols)
    .twoCol('JAMI:', fmt(order.totalAmount) + " so'm", cols);

  if (order.discountAmount > 0) {
    enc.twoCol('Chegirma:', '-' + fmt(order.discountAmount) + " so'm", cols);
  }
  if (change > 0) {
    enc.twoCol('Qaytim:', fmt(change) + " so'm", cols);
  }

  enc.dashedLine(cols)
    .align('center')
    .text('Chek: ' + order.orderNumber).nl()
    .nl()
    .text('Xarid uchun rahmat!').nl()
    .feedAndCut(3);

  return enc.encode();
}
