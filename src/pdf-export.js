import { jsPDF } from 'jspdf';

export function exportPDF(manager, name) {
  const { baseWidth: w, baseHeight: h } = manager;
  // multiplicador para ~3500px en el lado largo: calidad de impresión sin reventar memoria
  const multiplier = Math.min(4, Math.max(1, 3500 / Math.max(w, h)));
  const dataUrl = manager.toDataURL({ multiplier });

  const landscape = w >= h;
  const pdf = new jsPDF({ orientation: landscape ? 'l' : 'p', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const scale = Math.min(pageW / w, pageH / h);
  const imgW = w * scale;
  const imgH = h * scale;
  pdf.addImage(dataUrl, 'JPEG', (pageW - imgW) / 2, (pageH - imgH) / 2, imgW, imgH);

  const fecha = new Date().toISOString().slice(0, 10);
  const safeName = name.replace(/[^\p{L}\p{N} _-]/gu, '').trim() || 'ficha';
  pdf.save(`${safeName}-${fecha}.pdf`);
}
