import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

/**
 * Resume files are served from `/api/resumes/<objectName>` and contain candidate
 * PII. These helpers gate that route so a stored object is only readable by the
 * workspace that owns the applicant it belongs to.
 */

/**
 * Returns true when a resume or custom-field attachment resolves to `objectName`
 * and belongs to the given organization. Database/local-dev uploads use the
 * canonical `/api/resumes/<objectName>` URL; externally-hosted files are never
 * served by this route.
 */
export async function resumeObjectBelongsToOrg(
  objectName: string,
  organizationId: string,
): Promise<boolean> {
  if (!objectName || !organizationId) return false;

  const resumeMatch = await prisma.applicant.findFirst({
    where: {
      resumeUrl: `/api/resumes/${objectName}`,
      job: { is: { organizationId } },
    },
    select: { id: true },
  });

  if (resumeMatch) return true;

  const attachmentMatch = await prisma.applicantAttachment.findFirst({
    where: {
      objectName,
      applicant: { job: { is: { organizationId } } },
    },
    select: { id: true },
  });

  return attachmentMatch !== null;
}

export type ResumeAccess =
  | { ok: true; organizationId: string }
  | { ok: false; status: 401 | 403 | 404; error: string };

/**
 * Full authorization gate for a resume-serving request: requires a signed-in
 * user with an organization, and that the requested object belongs to that
 * organization. Returns 404 (not 403) for objects the org does not own so the
 * route never leaks the existence of another workspace's resume.
 */
export async function authorizeResumeRequest(objectName: string): Promise<ResumeAccess> {
  const session = await auth();
  if (!session?.user?.email) {
    return { ok: false, status: 401, error: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { organizationId: true },
  });
  if (!user?.organizationId) {
    return { ok: false, status: 403, error: "Not authorized" };
  }

  const owned = await resumeObjectBelongsToOrg(objectName, user.organizationId);
  if (!owned) {
    return { ok: false, status: 404, error: "Resume file not found." };
  }

  return { ok: true, organizationId: user.organizationId };
}
