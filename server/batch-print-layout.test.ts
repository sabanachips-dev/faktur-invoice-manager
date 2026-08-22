import { describe, expect, it } from "vitest";
import { groupBatchPrintPages } from "../shared/batchPrintLayout";

const document = (id: string, itemCount: number) => ({ data: { id, items: Array.from({ length: itemCount }) }, copyLabel: `Copy ${id}` });

describe("batch print A4 layout", () => {
  it("places only invoices with at most two items on each compact A4 page", () => {
    const pages = groupBatchPrintPages([document("1", 1), document("2", 3), document("3", 2)], "two");
    expect(pages).toEqual([
      { mode: "compact", documents: [document("1", 1)] },
      { mode: "full", documents: [document("2", 3)] },
      { mode: "compact", documents: [document("3", 2)] },
    ]);
  });

  it("keeps invoices with three or more items on a dedicated full page to prevent truncation", () => {
    const pages = groupBatchPrintPages([document("1", 1), document("2", 3), document("3", 1)], "two");
    expect(pages.map(page => ({ mode: page.mode, count: page.documents.length }))).toEqual([
      { mode: "compact", count: 1 },
      { mode: "full", count: 1 },
      { mode: "compact", count: 1 },
    ]);
  });

  it("keeps the two-up safety limit deterministic for invoice three items", () => {
    const pages = groupBatchPrintPages([document("1", 3), document("2", 1)], "two");
    expect(pages.map(page => ({ mode: page.mode, count: page.documents.length }))).toEqual([
      { mode: "full", count: 1 },
      { mode: "compact", count: 1 },
    ]);
  });

  it("keeps one-invoice layout as one complete document per page", () => {
    const pages = groupBatchPrintPages([document("1", 1), document("2", 5)], "one");
    expect(pages.map(page => ({ mode: page.mode, count: page.documents.length }))).toEqual([
      { mode: "full", count: 1 },
      { mode: "full", count: 1 },
    ]);
  });
});
