import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export async function downloadInvoicePdf(element: HTMLElement, invoiceNumber: string) {
  const canvas = await html2canvas(element, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
    logging: false,
  });
  const image = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const pageHeight = 297;
  const imageHeight = (canvas.height * pageWidth) / canvas.width;
  let remainingHeight = imageHeight;
  let position = 0;

  pdf.addImage(image, "PNG", 0, position, pageWidth, imageHeight, undefined, "FAST");
  remainingHeight -= pageHeight;
  while (remainingHeight > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(image, "PNG", 0, position, pageWidth, imageHeight, undefined, "FAST");
    remainingHeight -= pageHeight;
  }
  pdf.save(`${invoiceNumber}.pdf`);
}

