import type { BatchPrintLayout } from "@shared/batchPrintLayout";

export type PrintPaperSize = "a4" | "letter" | "a5" | "receipt80";
export type { BatchPrintLayout };

const printRules: Record<PrintPaperSize, { page: string; margin: string; documentWidth?: string; documentPadding?: string }> = {
  a4: { page: "A4 portrait", margin: "10mm" },
  letter: { page: "Letter portrait", margin: "10mm" },
  a5: { page: "A5 portrait", margin: "8mm" },
  receipt80: { page: "80mm auto", margin: "3mm", documentWidth: "74mm", documentPadding: "3mm" },
};

export function printInvoice(paperSize: PrintPaperSize) {
  const rule = printRules[paperSize];
  document.getElementById("invoice-print-rules")?.remove();
  const style = document.createElement("style");
  style.id = "invoice-print-rules";
  style.textContent = `
    @media print {
      @page { size: ${rule.page}; margin: ${rule.margin}; }
      #invoice-document {
        width: ${rule.documentWidth || "auto"} !important;
        max-width: ${rule.documentWidth || "none"} !important;
        padding: ${rule.documentPadding || "0"} !important;
        box-shadow: none !important;
        border: none !important;
      }
    }
  `;
  document.head.appendChild(style);
  window.print();
  window.setTimeout(() => style.remove(), 1_000);
}

export function printInvoiceBatch(paperSize: PrintPaperSize, layout: BatchPrintLayout) {
  const rule = printRules[paperSize];
  document.getElementById("invoice-batch-print-rules")?.remove();
  const style = document.createElement("style");
  style.id = "invoice-batch-print-rules";
  style.textContent = `
    @media print {
      @page { size: ${rule.page}; margin: ${rule.margin}; }
      body > * { visibility: hidden !important; }
      #invoice-batch-print, #invoice-batch-print * { visibility: visible !important; }
      #invoice-batch-print {
        display: block !important;
        position: absolute !important;
        inset: 0 auto auto 0 !important;
        width: 100% !important;
      }
      #invoice-batch-print .batch-page {
        break-after: page !important;
        page-break-after: always !important;
      }
      #invoice-batch-print .batch-page:last-child {
        break-after: auto !important;
        page-break-after: auto !important;
      }
      #invoice-batch-print .batch-document {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        overflow: hidden !important;
      }
      #invoice-batch-print .invoice-paper { box-shadow: none !important; border: none !important; max-width: none !important; }
      #invoice-batch-print.layout-two .batch-page-compact {
        display: grid !important;
        grid-template-rows: repeat(2, minmax(0, 1fr)) !important;
        gap: 4mm !important;
        height: 277mm !important;
      }
      #invoice-batch-print.layout-two .batch-page-compact .batch-document {
        min-height: 0 !important;
        border-bottom: 0.25mm dashed #cbd5e1 !important;
      }
      #invoice-batch-print.layout-two .batch-page-compact .batch-document:last-child { border-bottom: none !important; }
      #invoice-batch-print.layout-two .invoice-paper--compact {
        width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 4mm !important;
      }
    }
  `;
  document.head.appendChild(style);
  window.print();
  window.setTimeout(() => style.remove(), 1_000);
}
