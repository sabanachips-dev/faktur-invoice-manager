export type BatchPrintLayout = "one" | "two";

export type BatchPrintDocument<T> = {
  data: T;
  copyLabel: string;
};

export type BatchPrintPage<T> = {
  mode: "full" | "compact";
  documents: BatchPrintDocument<T>[];
};

type DocumentWithItems = { items: unknown[] };

export function groupBatchPrintPages<T extends DocumentWithItems>(documents: BatchPrintDocument<T>[], layout: BatchPrintLayout): BatchPrintPage<T>[] {
  if (layout === "one") return documents.map(document => ({ mode: "full", documents: [document] }));

  const pages: BatchPrintPage<T>[] = [];
  let compactDocuments: BatchPrintDocument<T>[] = [];
  const flushCompactPage = () => {
    if (compactDocuments.length) pages.push({ mode: "compact", documents: compactDocuments });
    compactDocuments = [];
  };

  for (const document of documents) {
    if (document.data.items.length >= 3) {
      flushCompactPage();
      pages.push({ mode: "full", documents: [document] });
      continue;
    }
    compactDocuments.push(document);
    if (compactDocuments.length === 2) flushCompactPage();
  }
  flushCompactPage();
  return pages;
}
