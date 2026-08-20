import { describe, expect, it } from "vitest";
import { getInvoiceCopyLabel } from "../shared/print";

describe("invoice print copy labels", () => {
  it("labels the first printed document as original and following documents as copies", () => {
    expect([0, 1, 2, 3, 12, 98].map(getInvoiceCopyLabel)).toEqual(["Faktur Asli", "Copy 1", "Copy 2", "Copy 3", "Copy 12", "Copy 98"]);
  });
});
