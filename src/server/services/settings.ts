"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import {
  organizationSettingsSchema,
  teamMemberRoleSchema,
} from "@/schemas/settings";
import { getCurrentUserWithOrganization } from "./current-user";

export interface SettingsActionResult {
  error?: string;
  success: boolean;
}

function requireAdmin(user: { role: string }) {
  return user.role === "ADMIN";
}

export async function updateOrganizationSettings(
  formData: FormData,
): Promise<SettingsActionResult> {
  const user = await getCurrentUserWithOrganization();
  if (!user) return { success: false, error: "Not authenticated" };
  if (!requireAdmin(user)) return { success: false, error: "Only admins can update settings" };

  const parsed = organizationSettingsSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid organization settings",
    };
  }

  const existingSlug = await prisma.organization.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  });

  if (existingSlug && existingSlug.id !== user.organizationId) {
    return { success: false, error: "That organization slug is already in use" };
  }

  await prisma.organization.update({
    where: { id: user.organizationId ?? "" },
    data: parsed.data,
  });

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function updateTeamMemberRole(
  formData: FormData,
): Promise<SettingsActionResult> {
  const user = await getCurrentUserWithOrganization();
  if (!user) return { success: false, error: "Not authenticated" };
  if (!requireAdmin(user)) return { success: false, error: "Only admins can manage team roles" };

  const parsed = teamMemberRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid role" };
  }

  await prisma.user.updateMany({
    where: {
      id: parsed.data.userId,
      organizationId: user.organizationId,
    },
    data: { role: parsed.data.role },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}
