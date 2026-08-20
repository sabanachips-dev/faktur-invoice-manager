export type PrintPaperSize = "a4" | "letter" | "a5" | "receipt80";

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

