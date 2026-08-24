import { Client } from "pg";
import dns from "node:dns";
import { describe, expect, it } from "vitest";

dns.setDefaultResultOrder("ipv4first");

describe("Supabase direct connection", () => {
  it("accepts the configured connection string and answers SELECT 1", async () => {
    const connectionString = process.env.SUPABASE_DIRECT_DATABASE_URL;
    expect(connectionString, "SUPABASE_DIRECT_DATABASE_URL must be configured").toBeTruthy();

    const hostname = new URL(connectionString).hostname;
    const [ipv4Address] = await dns.promises.resolve4(hostname);
    expect(ipv4Address, "Supabase host must provide an IPv4 address for this environment").toBeTruthy();

    const client = new Client({
      connectionString,
      host: ipv4Address,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();
    try {
      const result = await client.query<{ ready: number }>("select 1 as ready");
      expect(result.rows).toEqual([{ ready: 1 }]);
    } finally {
      await client.end();
    }
  }, 20_000);
});
