import QRCode from 'qrcode';

// High-resolution QR images with a full quiet zone for reliable scanning.
export async function qrSvg(text: string) {
  return QRCode.toString(text, { type: 'svg', margin: 4, width: 360, errorCorrectionLevel: 'M' });
}

export async function qrPng(text: string) {
  return QRCode.toDataURL(text, { margin: 4, width: 1024, errorCorrectionLevel: 'M' });
}
