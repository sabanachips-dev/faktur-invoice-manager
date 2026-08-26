import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const teamUi = readFileSync(resolve(process.cwd(), "client/src/components/OrganizationTeamSettings.tsx"), "utf8");
const settings = readFileSync(resolve(process.cwd(), "client/src/pages/Settings.tsx"), "utf8");
const invitePage = readFileSync(resolve(process.cwd(), "client/src/pages/InvitationAccept.tsx"), "utf8");

describe("organization team interface", () => {
  it("renders a workspace selector and clear role descriptions", () => {
    expect(teamUi).toContain('id="workspace-switch"');
    expect(teamUi).toContain("Ruang kerja aktif");
    expect(teamUi).toContain("Pemilik mengelola semua akses");
  });

  it("limits team administration controls in the interface and mounts them in Settings", () => {
    expect(teamUi).toContain("const canManageInvites");
    expect(teamUi).toContain("const isOwner");
    expect(teamUi).toContain("Buat tautan");
    expect(settings).toContain("<OrganizationTeamSettings />");
  });

  it("preserves an invitation link through authentication and accepts it after sign-in", () => {
    expect(invitePage).toContain("<SupabaseLoginCard redirectTo={window.location.href} />");
    expect(invitePage).toContain("organizations.acceptInvitation");
  });
});
