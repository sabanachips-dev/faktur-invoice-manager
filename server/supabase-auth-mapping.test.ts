import { describe, expect, it } from "vitest";
import { toSupabaseAppUser } from "../client/src/_core/hooks/useSupabaseAuth";

describe("Supabase user mapping", () => {
  it("uses the profile name when Supabase user metadata provides one", () => {
    expect(toSupabaseAppUser({ id: "auth-1", email: "owner@example.com", user_metadata: { full_name: "Pemilik Faktur" } } as never)).toEqual({
      id: "auth-1",
      name: "Pemilik Faktur",
      email: "owner@example.com",
    });
  });

  it("falls back to the email prefix when no profile name is set", () => {
    expect(toSupabaseAppUser({ id: "auth-2", email: "admin@contoh.id", user_metadata: {} } as never)).toEqual({
      id: "auth-2",
      name: "admin",
      email: "admin@contoh.id",
    });
  });
});
