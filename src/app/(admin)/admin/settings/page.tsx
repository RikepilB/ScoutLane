import { Building2, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserWithOrganization } from "@/server/services/current-user";
import {
  updateOrganizationSettings,
  updateTeamMemberRole,
} from "@/server/services/settings";

export const dynamic = "force-dynamic";

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  RECRUITER: "Recruiter",
  HIRING_MANAGER: "Hiring manager",
};

export default async function SettingsPage() {
  const user = await getCurrentUserWithOrganization();
  const organization = user?.organization;

  const team = organization
    ? await prisma.user.findMany({
        where: { organizationId: organization.id },
        orderBy: [{ role: "asc" }, { email: "asc" }],
      })
    : [];

  const canManage = user?.role === "ADMIN";
  async function updateOrganizationAction(formData: FormData) {
    "use server";

    await updateOrganizationSettings(formData);
  }

  async function updateRoleAction(formData: FormData) {
    "use server";

    await updateTeamMemberRole(formData);
  }

  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
        <header className="space-y-1">
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Settings</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Organization settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage workspace identity and team access for ScoutLane admins.
          </p>
        </header>

        <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold tracking-tight">Workspace</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The organization slug is used internally to keep jobs, templates, and team members
                scoped together.
              </p>
            </div>
          </div>

          <form action={updateOrganizationAction} className="mt-6 grid gap-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="space-y-2 text-sm font-medium">
              Organization name
              <Input
                name="name"
                defaultValue={organization?.name ?? "ScoutLane"}
                disabled={!canManage}
                required
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Slug
              <Input
                name="slug"
                defaultValue={organization?.slug ?? "scoutlane"}
                disabled={!canManage}
                required
              />
            </label>
            <Button type="submit" disabled={!canManage}>
              Save
            </Button>
          </form>
        </section>

        <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold tracking-tight">Team management</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Review team members and update roles for people in this organization.
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-border/70">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Member</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Access</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {team.map((member) => (
                  <tr key={member.id}>
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-950">
                        {member.name ?? member.email.split("@")[0]}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{member.email}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      <form action={updateRoleAction} className="flex items-center gap-2">
                        <input type="hidden" name="userId" value={member.id} />
                        <select
                          name="role"
                          defaultValue={member.role}
                          disabled={!canManage}
                          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          {Object.entries(roleLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <Button type="submit" variant="outline" size="sm" disabled={!canManage}>
                          Update
                        </Button>
                      </form>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {member.role === "ADMIN" ? "Full workspace control" : "Hiring workflow"}
                    </td>
                    <td className="px-5 py-4">
                      {member.id === user?.id ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          You
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!canManage ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Admin role is required to change organization settings or team roles.
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
