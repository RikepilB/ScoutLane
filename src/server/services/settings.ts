"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import {
  organizationSettingsSchema,
  teamMemberRoleSchema,
  userProfileSelfSchema,
} from "@/schemas/settings";
import { getCurrentUserWithOrganization } from "./current-user";
import { requireRole } from "@/server/services/_lib/validate-session";

export interface SettingsActionResult {
  error?: string;
  success: boolean;
}

export async function updateMyProfile(
  formData: FormData,
): Promise<SettingsActionResult> {
  const user = await getCurrentUserWithOrganization();
  if (!user) return { success: false, error: "Not authenticated" };
  if (user.role === "GUEST") return { success: false, error: "Guests have read-only access." };

  const parsed = userProfileSelfSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid profile",
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, phone: parsed.data.phone },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function updateOrganizationSettings(
  formData: FormData,
): Promise<SettingsActionResult> {
  const user = await getCurrentUserWithOrganization();
  if (!user) return { success: false, error: "Not authenticated" };
  try {
    requireRole(user, ["ADMIN"]);
  } catch {
    return { success: false, error: "Only admins can update settings" };
  }

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
  try {
    requireRole(user, ["ADMIN"]);
  } catch {
    return { success: false, error: "Only admins can manage team roles" };
  }

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
