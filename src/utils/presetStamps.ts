/**
 * Generates PNG Data URLs for predefined stamps using offscreen canvas.
 * This guarantees Hind Siliguri Bengali text rendering across all browsers.
 */
export function createPresetStampSvg(
  type: 'approved' | 'confidential' | 'draft' | 'urgent' | 'signed',
  lang: 'bn' | 'en' = 'bn'
): string {
  const isBn = lang === 'bn';

  const config = {
    approved: {
      text: isBn ? 'অনুমোদিত' : 'APPROVED',
      sub: isBn ? 'যাচাইকৃত নথি' : 'VERIFIED DOCUMENT',
      color: '#16a34a',
      bg: '#f0fdf4',
    },
    confidential: {
      text: isBn ? 'গোপনীয়' : 'CONFIDENTIAL',
      sub: isBn ? 'অননুমোদিত বিতরণ নিষিদ্ধ' : 'RESTRICTED ACCESS',
      color: '#dc2626',
      bg: '#fef2f2',
    },
    draft: {
      text: isBn ? 'খসড়া কপি' : 'DRAFT COPY',
      sub: isBn ? 'চূড়ান্ত নয়' : 'NOT FINAL',
      color: '#64748b',
      bg: '#f8fafc',
    },
    urgent: {
      text: isBn ? 'জরুরী নথি' : 'URGENT',
      sub: isBn ? 'অগ্রাধিকার ভিত্তি' : 'HIGH PRIORITY',
      color: '#ea580c',
      bg: '#fff7ed',
    },
    signed: {
      text: isBn ? 'স্বাক্ষরিত' : 'OFFICIALLY SIGNED',
      sub: isBn ? 'ডিজিটাল সত্যায়িত' : 'DIGITALLY VERIFIED',
      color: '#2563eb',
      bg: '#eff6ff',
    },
  }[type];

  if (typeof document === 'undefined') {
    return '';
  }

  const canvas = document.createElement('canvas');
  const scale = 2;
  const width = 360 * scale;
  const height = 130 * scale;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background box with rounded corners
  ctx.fillStyle = config.bg;
  ctx.strokeStyle = config.color;
  ctx.lineWidth = 6 * scale;
  ctx.setLineDash([10 * scale, 6 * scale]);

  const radius = 14 * scale;
  const x = 6 * scale;
  const y = 6 * scale;
  const w = width - 12 * scale;
  const h = height - 12 * scale;

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner solid border
  ctx.setLineDash([]);
  ctx.lineWidth = 2 * scale;
  const inPad = 8 * scale;
  ctx.strokeRect(x + inPad, y + inPad, w - inPad * 2, h - inPad * 2);

  // Main Text
  ctx.fillStyle = config.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${32 * scale}px 'Hind Siliguri', 'Inter', system-ui, sans-serif`;
  ctx.fillText(config.text, width / 2, height * 0.44);

  // Subtitle
  ctx.font = `500 ${14 * scale}px 'Hind Siliguri', 'Inter', system-ui, sans-serif`;
  ctx.fillText(`★ ${config.sub} ★`, width / 2, height * 0.76);

  return canvas.toDataURL('image/png');
}
