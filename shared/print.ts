export function getInvoiceCopyLabel(copyIndex: number) {
  return copyIndex <= 0 ? "Faktur Asli" : `Copy ${copyIndex}`;
}
