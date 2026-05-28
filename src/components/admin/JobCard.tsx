import Link from "next/link";
import { ExternalLink, Users, MapPin, Clock, Briefcase } from "lucide-react";
import type { JobStatus } from "@/schemas/job";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { JobRowActions } from "@/components/admin/JobRowActions";

interface JobCardProps {
  id: string;
  title: string;
  slug: string;
  status: JobStatus;
  applicantCount: number;
  location: string | null;
  type: string | null;
  createdAt: string;
  role?: "ADMIN" | "RECRUITER" | "HIRING_MANAGER";
}

export function JobCard({ id, title, slug, status, applicantCount, location, type, createdAt, role }: JobCardProps) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-[#d4d9df] bg-white p-5 shadow-[0_1px_3px_rgba(9,21,64,0.06),0_1px_2px_rgba(9,21,64,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(9,21,64,0.08),0_2px_4px_rgba(9,21,64,0.04)]">
      <div className="mb-3 flex items-start justify-between gap-2">
        <Link
          href={`/admin/jobs/${id}`}
          className="text-[15px] font-semibold leading-snug text-[#0c1529] transition-colors hover:text-[#1B2CC1]"
        >
          {title}
        </Link>
        <div className="shrink-0">
          <JobRowActions jobId={id} status={status} role={role} />
        </div>
      </div>

      <Link
        href={`/careers/${slug}`}
        target="_blank"
        rel="noreferrer"
        className="mb-4 inline-flex w-fit items-center gap-1 rounded-md bg-[#f1f5f9] px-2 py-0.5 text-[11px] text-[#5f8ea0] transition-colors hover:bg-[#d4d9df] hover:text-[#0c1529]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        /{slug}
        <ExternalLink className="h-2.5 w-2.5" />
      </Link>

      <div className="mb-4 flex items-center gap-2">
        <StatusBadge status={status} />
      </div>

      <div className="mt-auto grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[rgba(9,21,64,0.06)] pt-4">
        <div className="flex items-center gap-1.5 text-[12px] text-[#5f8ea0]">
          <Users className="h-3.5 w-3.5" />
          <span className="font-medium text-[#0c1529]">{applicantCount}</span>
          <span>applicant{applicantCount !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-[#5f8ea0]">
          <MapPin className="h-3.5 w-3.5" />
          <span>{location ?? <span className="text-[#5f8ea0]/50">—</span>}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-[#5f8ea0]">
          <Briefcase className="h-3.5 w-3.5" />
          <span>{type ?? <span className="text-[#5f8ea0]/50">—</span>}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-[#5f8ea0]">
          <Clock className="h-3.5 w-3.5" />
          <span>{createdAt}</span>
        </div>
      </div>
    </div>
  );
}
