// =====================================================
// pdfExport.js — PDF export (single, separate, ZIP, print)
// =====================================================

import { showToast } from './ui.js';

/**
 * Get all rendered permit DOM elements
 */
function getPermitElements() {
  return Array.from(document.querySelectorAll('.permit-doc'));
}

/**
 * Capture a single permit element as a canvas then add to jsPDF
 */
async function capturePermit(el, pdf, addPage) {
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: 900,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();

  // Scale to fit page width
  const imgW = canvas.width;
  const imgH = canvas.height;
  const ratio = pdfW / imgW;
  const scaledH = imgH * ratio;

  if (addPage) pdf.addPage();

  // If taller than page, scale to fit height
  if (scaledH > pdfH) {
    const hRatio = pdfH / scaledH;
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfW * hRatio, pdfH, '', 'FAST');
  } else {
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, scaledH, '', 'FAST');
  }
}

/**
 * Export all permits as a single PDF
 */
export async function exportSinglePDF(progressCb) {
  const elements = getPermitElements();
  if (!elements.length) { showToast('Generate permits first!', 'error'); return; }

  showToast('Generating single PDF...', '');
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

  for (let i = 0; i < elements.length; i++) {
    if (progressCb) progressCb(i + 1, elements.length);
    await capturePermit(elements[i], pdf, i > 0);
  }

  pdf.save('TN_Mining_Permits_All.pdf');
  showToast('Single PDF downloaded!', 'success');
}

/**
 * Export each permit as a separate PDF, then trigger downloads
 */
export async function exportSeparatePDFs(progressCb) {
  const elements = getPermitElements();
  if (!elements.length) { showToast('Generate permits first!', 'error'); return; }

  showToast('Generating separate PDFs...', '');
  const { jsPDF } = window.jspdf;

  for (let i = 0; i < elements.length; i++) {
    if (progressCb) progressCb(i + 1, elements.length);
    const el = elements[i];
    const serialNo = el.getAttribute('data-permit-id') || `permit_${i + 1}`;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    await capturePermit(el, pdf, false);
    pdf.save(`Permit_${serialNo}.pdf`);
    // Small delay to prevent browser download blocking
    await new Promise(r => setTimeout(r, 200));
  }

  showToast('All separate PDFs downloaded!', 'success');
}

/**
 * Export all permits as individual PDFs bundled in a ZIP
 */
export async function exportZIP(progressCb) {
  const elements = getPermitElements();
  if (!elements.length) { showToast('Generate permits first!', 'error'); return; }

  showToast('Building ZIP file...', '');
  const { jsPDF } = window.jspdf;
  const zip = new JSZip();

  for (let i = 0; i < elements.length; i++) {
    if (progressCb) progressCb(i + 1, elements.length);
    const el = elements[i];
    const serialNo = el.getAttribute('data-permit-id') || `permit_${i + 1}`;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    await capturePermit(el, pdf, false);
    const pdfBytes = pdf.output('arraybuffer');
    zip.file(`Permit_${serialNo}.pdf`, pdfBytes);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, 'TN_Mining_Permits.zip');
  showToast('ZIP file downloaded!', 'success');
}

/**
 * Print all permits using browser print dialog
 */
export function printPermits() {
  const elements = getPermitElements();
  if (!elements.length) { showToast('Generate permits first!', 'error'); return; }
  window.print();
}

/**
 * Initialize export buttons
 */
export function initExport() {
  const setProgress = (current, total) => {
    const bar = document.getElementById('export-progress-bar');
    const txt = document.getElementById('export-progress-text');
    if (bar) bar.style.width = `${(current / total) * 100}%`;
    if (txt) txt.textContent = `Processing ${current} / ${total}...`;
  };

  const wrapExport = async (fn) => {
    const wrap = document.getElementById('export-progress-wrap');
    if (wrap) wrap.style.display = 'block';
    try {
      await fn(setProgress);
    } catch (e) {
      showToast('Export error: ' + e.message, 'error');
    }
    if (wrap) wrap.style.display = 'none';
  };

  document.getElementById('btn-export-single')?.addEventListener('click', () => wrapExport(exportSinglePDF));
  document.getElementById('btn-export-separate')?.addEventListener('click', () => wrapExport(exportSeparatePDFs));
  document.getElementById('btn-export-zip')?.addEventListener('click', () => wrapExport(exportZIP));
  document.getElementById('btn-print')?.addEventListener('click', printPermits);
}
