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

function printTwoUpInDedicatedWindow() {
  const sourcePages = Array.from(document.querySelectorAll<HTMLElement>("#invoice-batch-print .batch-page"));
  const printWindow = window.open("", "_blank", "popup=yes,width=980,height=900");
  if (!printWindow || !sourcePages.length) return false;

  const stylesheetLinks = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
    .map(link => `<link rel="stylesheet" href="${link.href}">`)
    .join("");
  const pagesMarkup = sourcePages.map((page, pageIndex) => {
    const documents = Array.from(page.querySelectorAll<HTMLElement>(".batch-document"));
    const isCompact = page.classList.contains("batch-page-compact");
    return `<section class="dedicated-print-sheet ${isCompact ? "dedicated-print-sheet--two" : "dedicated-print-sheet--full"}" data-page="${pageIndex}">${documents.map(document => `<div class="dedicated-print-document">${document.innerHTML}</div>`).join("")}</section>`;
  }).join("");

  printWindow.document.open();
  printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Cetak invoice</title>${stylesheetLinks}<style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; }
    html, body { width: 210mm; min-height: 297mm; margin: 0; padding: 0; background: #fff; }
    body { color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .dedicated-print-sheet { width: 190mm; height: 277mm; overflow: hidden; break-after: page; page-break-after: always; }
    .dedicated-print-sheet:last-child { break-after: auto; page-break-after: auto; }
    .dedicated-print-sheet--two { display: grid; grid-template-rows: 132mm 132mm; gap: 5mm; background: #fff; }
    .dedicated-print-document { position: relative; min-height: 0; height: 132mm; overflow: hidden; }
    .dedicated-print-sheet--two .dedicated-print-document:first-child::after { content: ""; position: absolute; right: 0; bottom: 1.5mm; left: 0; border-bottom: 0.4mm solid #cbd5e1; }
    .dedicated-print-document .invoice-paper { width: 100% !important; height: 132mm !important; max-width: none !important; margin: 0 !important; overflow: hidden !important; box-shadow: none !important; border-inline: none !important; }
    .dedicated-print-document .invoice-paper--compact { display: flex !important; flex-direction: column !important; }
    .dedicated-print-document .invoice-paper--compact > section:last-child { margin-top: auto !important; }
    .dedicated-print-sheet--full .dedicated-print-document { height: auto; min-height: 277mm; overflow: visible; }
    .dedicated-print-sheet--full .dedicated-print-document .invoice-paper { height: auto !important; min-height: 277mm; }
    @media print { html, body { overflow: hidden !important; } .dedicated-print-sheet { break-inside: avoid; page-break-inside: avoid; } }
  </style></head><body>${pagesMarkup}</body></html>`);
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 250);
  return true;
}

export function printInvoiceBatch(paperSize: PrintPaperSize, layout: BatchPrintLayout) {
  if (paperSize === "a4" && layout === "two" && printTwoUpInDedicatedWindow()) return;
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
        break-after: auto !important;
        page-break-after: auto !important;
      }
      #invoice-batch-print .batch-page:not(:last-child) {
        break-after: page !important;
        page-break-after: always !important;
      }
      #invoice-batch-print .batch-document {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        overflow: hidden !important;
      }
      #invoice-batch-print .invoice-paper { box-shadow: none !important; border: none !important; max-width: none !important; }
      #invoice-batch-print.layout-two .batch-page-compact {
        display: block !important;
        position: relative !important;
        height: 270mm !important;
        max-height: 270mm !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
      #invoice-batch-print.layout-two .batch-page-compact .batch-document {
        position: absolute !important;
        inset-inline: 0 !important;
        height: 132mm !important;
        max-height: 132mm !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        break-inside: auto !important;
        page-break-inside: auto !important;
        border-bottom: 0.25mm dashed #cbd5e1 !important;
      }
      #invoice-batch-print.layout-two .batch-page-compact .batch-document:first-child { top: 0 !important; }
      #invoice-batch-print.layout-two .batch-page-compact .batch-document:nth-child(2) { top: 137mm !important; }
      #invoice-batch-print.layout-two .batch-page-compact .batch-document:last-child { border-bottom: none !important; }
      #invoice-batch-print.layout-two .batch-page-compact .invoice-paper--compact {
        width: 100% !important;
        height: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        box-sizing: border-box !important;
      }
    }
  `;
  document.head.appendChild(style);
  window.print();
  window.setTimeout(() => style.remove(), 1_000);
}
