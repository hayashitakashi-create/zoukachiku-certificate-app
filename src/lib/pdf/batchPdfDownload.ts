import type { Certificate } from '@/lib/store';
import { generatePdfForCertificate } from './generatePdfForCertificate';

export async function batchDownloadPdfs(
  certificates: Certificate[],
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  const total = certificates.length;
  if (total === 0) return;

  // Single certificate: download directly without zip
  if (total === 1) {
    onProgress?.(1, 1);
    const { pdfBytes, fileName } = await generatePdfForCertificate(certificates[0]);
    const blob = new Blob([new Uint8Array(pdfBytes) as BlobPart], { type: 'application/pdf' });
    downloadBlob(blob, fileName);
    return;
  }

  // Multiple certificates: bundle into ZIP
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const errors: string[] = [];

  for (let i = 0; i < certificates.length; i++) {
    onProgress?.(i + 1, total);
    try {
      const { pdfBytes, fileName } = await generatePdfForCertificate(certificates[i]);
      zip.file(fileName, pdfBytes);
    } catch (err) {
      console.error(`PDF generation failed for ${certificates[i].id}:`, err);
      errors.push(certificates[i].applicantName || certificates[i].id);
    }
  }

  if (zip.files && Object.keys(zip.files).length === 0) {
    throw new Error('すべてのPDF生成に失敗しました');
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const zipFileName = `certificates_${new Date().toISOString().slice(0, 10)}.zip`;
  downloadBlob(zipBlob, zipFileName);

  if (errors.length > 0) {
    alert(`以下の証明書のPDF生成をスキップしました:\n${errors.join('\n')}`);
  }
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
