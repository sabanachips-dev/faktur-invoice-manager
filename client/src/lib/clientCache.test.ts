import { describe, expect, it } from "vitest";
import { reconcileCreatedClient } from "./clientCache";

describe("created client cache reconciliation", () => {
  it("replaces temporary data with the authoritative server row without a reload", () => {
    const result = reconcileCreatedClient([{ id: -1, name: "PT Cepat", createdAt: new Date(0) }], -1, { id: 41, name: "PT Cepat", createdAt: new Date("2026-08-20") });
    expect(result).toEqual([{ id: 41, name: "PT Cepat", createdAt: new Date("2026-08-20") }]);
  });
});
