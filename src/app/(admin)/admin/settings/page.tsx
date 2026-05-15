import { Bell, Building2, Info, ShieldCheck, UserCircle, Users } from "lucide-react";
import type { User } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserWithOrganization } from "@/server/services/current-user";
import {
  updateMyProfile,
  updateOrganizationSettings,
  updateTeamMemberRole,
} from "@/server/services/settings";

export const dynamic = "force-dynamic";

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  RECRUITER: "Recruiter",
  HIRING_MANAGER: "Hiring manager",
};

const roleDescriptions: Record<string, string> = {
  RECRUITER:
    "You can manage applicants and pipelines for jobs assigned to you. Organization settings are managed by admins.",
  HIRING_MANAGER:
    "You can review applicants and leave feedback for your assigned jobs. Organization settings are managed by admins.",
};

export default async function SettingsPage() {
  const user = await getCurrentUserWithOrganization();
  const organization = user?.organization;
  const isAdmin = user?.role === "ADMIN";

  const team: User[] = isAdmin && organization
    ? await prisma.user.findMany({
        where: { organizationId: organization.id },
        orderBy: [{ role: "asc" }, { email: "asc" }],
      })
    : [];

  async function updateProfileAction(formData: FormData) {
    "use server";
    await updateMyProfile(formData);
  }

  async function updateOrganizationAction(formData: FormData) {
    "use server";
    await updateOrganizationSettings(formData);
  }

  async function updateRoleAction(formData: FormData) {
    "use server";
    await updateTeamMemberRole(formData);
  }

  if (!isAdmin) {
    return (
      <main className="flex-1 bg-background">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
          <header className="space-y-1">
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Account</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              My account
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your profile and notification preferences.
            </p>
          </header>

          {/* Profile */}
          <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                <UserCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold tracking-tight">My profile</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Display name and phone for your account ({user?.email}).
                </p>
              </div>
            </div>

            <form action={updateProfileAction} className="mt-6 grid gap-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <label className="space-y-2 text-sm font-medium">
                Name
                <Input name="name" defaultValue={user?.name ?? ""} />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Phone
                <Input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Optional"
                  defaultValue={user?.phone ?? ""}
                />
              </label>
              <Button type="submit">Save profile</Button>
            </form>
          </section>

          {/* Notifications */}
          <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Bell className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold tracking-tight">Notifications</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose which emails you receive about your jobs and candidates.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="mt-0.5 h-4 w-4 rounded border-input accent-slate-950"
                />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Candidate reaches Interview stage
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Email me when a candidate on my jobs moves to Interview.
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-input accent-slate-950"
                />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Daily new-applicant summary
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Email me a daily digest of new applicants on my jobs.
                  </p>
                </div>
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="button" variant="outline" size="sm">
                Save preferences
              </Button>
            </div>
          </section>

          {/* Access summary */}
          <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Info className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold tracking-tight">Access summary</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your role and what you can do in this workspace.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                {roleLabels[user?.role ?? ""] ?? user?.role}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {roleDescriptions[user?.role ?? ""] ??
                "Contact your workspace admin if you need different access."}
            </p>
          </section>
        </div>
      </main>
    );
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
            Manage workspace identity, team roles, and your own profile.
          </p>
        </header>

        {/* Profile */}
        <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <UserCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold tracking-tight">Your profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Display name and phone for your account ({user?.email}). Sign-in email is managed by
                your identity provider.
              </p>
            </div>
          </div>

          <form action={updateProfileAction} className="mt-6 grid gap-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="space-y-2 text-sm font-medium">
              Name
              <Input name="name" defaultValue={user?.name ?? ""} />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Phone
              <Input
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="Optional"
                defaultValue={user?.phone ?? ""}
              />
            </label>
            <Button type="submit">Save profile</Button>
          </form>
        </section>

        {/* Workspace */}
        <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold tracking-tight">Workspace</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The organization slug scopes jobs, templates, and team members together.
              </p>
            </div>
          </div>

          <form action={updateOrganizationAction} className="mt-6 grid gap-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="space-y-2 text-sm font-medium">
              Organization name
              <Input
                name="name"
                defaultValue={organization?.name ?? "ScoutLane"}
                required
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Slug
              <Input
                name="slug"
                defaultValue={organization?.slug ?? "scoutlane"}
                required
              />
            </label>
            <Button type="submit">Save</Button>
          </form>
        </section>

        {/* Team management */}
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
                          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          {Object.entries(roleLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <Button type="submit" variant="outline" size="sm">
                          Update
                        </Button>
                      </form>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {member.role === "ADMIN"
                        ? "Full workspace control"
                        : member.role === "HIRING_MANAGER"
                          ? "Review & feedback"
                          : "Hiring workflow"}
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
        </section>
      </div>
    </main>
  );
}
