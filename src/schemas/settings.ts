import { z } from "zod";

export const organizationSettingsSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(120, "Organization name must be 120 characters or fewer"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(80, "Slug must be 80 characters or fewer")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens"),
});

export const teamMemberRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["ADMIN", "RECRUITER", "HIRING_MANAGER"]),
});

export type OrganizationSettingsInput = z.infer<typeof organizationSettingsSchema>;
export type TeamMemberRoleInput = z.infer<typeof teamMemberRoleSchema>;
