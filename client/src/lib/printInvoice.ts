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
      body > :not(#invoice-batch-print) { display: none !important; }
      #invoice-batch-print {
        display: block !important;
        position: static !important;
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
        display: block !important;
        height: 277mm !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
      #invoice-batch-print.layout-two .batch-page-compact .batch-document {
        position: relative !important;
        height: 136.5mm !important;
        overflow: hidden !important;
        margin-bottom: 4mm !important;
        border-bottom: 0.25mm dashed #cbd5e1 !important;
      }
      #invoice-batch-print.layout-two .batch-page-compact .batch-document:last-child { margin-bottom: 0 !important; border-bottom: none !important; }
      #invoice-batch-print.layout-two .batch-page-compact .invoice-paper {
        width: 200% !important;
        max-width: 200% !important;
        margin: 0 !important;
        transform: scale(.5) !important;
        transform-origin: top left !important;
      }
    }
  `;
  document.head.appendChild(style);
  window.print();
  window.setTimeout(() => style.remove(), 1_000);
}
