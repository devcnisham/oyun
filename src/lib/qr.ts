import QRCode from 'qrcode';

// SVG markup for a check-in QR code; the content is our own booking code
export async function qrSvg(text: string) {
  return QRCode.toString(text, { type: 'svg', margin: 1, width: 220, errorCorrectionLevel: 'M' });
}
