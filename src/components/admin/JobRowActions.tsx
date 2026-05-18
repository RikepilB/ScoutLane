"use client";

import { useTransition, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Trash2, Loader2, FileEdit } from "lucide-react";
import { updateJob } from "@/server/services/jobs/update";
import { deleteJob } from "@/server/services/jobs/delete";

type JobStatus = "active" | "draft" | "closed";
type UserRole = "ADMIN" | "RECRUITER" | "HIRING_MANAGER" | undefined;

interface JobRowActionsProps {
  jobId: string;
  status: JobStatus;
  role?: UserRole;
}

export function JobRowActions({ jobId, status, role }: JobRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  function handleTransition(target: JobStatus) {
    startTransition(async () => {
      const payload =
        target === "active"
          ? { published: true, archived: false }
          : target === "closed"
            ? { published: false, archived: true }
            : { published: false, archived: false };

      await updateJob(jobId, payload);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!window.confirm("Delete this job? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteJob(jobId);
      router.refresh();
    });
  }

  function closeMenu() {
    setOpen(false);
  }

  const isAdmin = role === "ADMIN";
  const isRecruiter = role === "RECRUITER";
  const isHiringManager = role === "HIRING_MANAGER";
  const canManage = isAdmin || isRecruiter;

  if (isHiringManager) return null;
  if (!isAdmin && !isRecruiter && role !== undefined) return null;

  const primaryLabel =
    status === "draft" ? "Publish" : status === "active" ? "Close" : "Reopen";

  const primaryTarget =
    status === "draft" ? "active" : status === "active" ? "closed" : "active";

  const primaryStyle =
    status === "active"
      ? "border border-amber-300 text-amber-700 hover:bg-amber-50"
      : "bg-emerald-600 text-white hover:bg-emerald-500";

  const hasDropdown =
    (status === "active" && isAdmin) || isAdmin || (status === "closed" && isAdmin);

  const dropdownItems: { label: string; action: () => void; dangerous?: boolean }[] = [];

  dropdownItems.push({
    label: "View details",
    action: () => {
      closeMenu();
      router.push(`/admin/jobs/${jobId}`);
    },
  });

  if (status === "active" && isAdmin) {
    dropdownItems.push({
      label: "View details",
      action: () => {
        closeMenu();
        router.push(`/admin/jobs/${jobId}`);
      },
    });
    dropdownItems.push({
      label: "Unpublish to draft",
      action: () => {
        closeMenu();
        handleTransition("draft");
      },
    });
  }

  if (isAdmin) {
    dropdownItems.push({
      label: "Delete job",
      action: () => {
        closeMenu();
        handleDelete();
      },
      dangerous: true,
    });
  }

  const showDropdown = hasDropdown && dropdownItems.length > 0;

  return (
    <div className="flex items-center gap-1.5" ref={menuRef}>
      {canManage && (
        <button
          onClick={() => handleTransition(primaryTarget)}
          disabled={isPending}
          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition disabled:opacity-50 ${primaryStyle}`}
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <>
              {status === "draft" ? null : null}
              {primaryLabel}
            </>
          )}
        </button>
      )}

      {showDropdown && (
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            disabled={isPending}
            className="inline-flex items-center rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          {open && (
            <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-border/70 bg-card shadow-lg">
              {dropdownItems.map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  disabled={isPending}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition hover:bg-muted/30 disabled:opacity-50 first:rounded-t-xl last:rounded-b-xl ${
                    item.dangerous ? "text-red-600" : "text-slate-700"
                  }`}
                >
                  {item.dangerous ? (
                    <Trash2 className="h-3.5 w-3.5" />
                  ) : (
                    <FileEdit className="h-3.5 w-3.5" />
                  )}
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
