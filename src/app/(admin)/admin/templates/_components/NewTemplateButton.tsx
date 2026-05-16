"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createTemplate } from "@/server/services/templates";

interface NewTemplateButtonProps {
  variant?: "default" | "secondary";
  label?: string;
}

export function NewTemplateButton({
  variant = "default",
  label = "New template",
}: NewTemplateButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const { id } = await createTemplate();
      router.push(`/admin/templates/${id}`);
      router.refresh();
    });
  }

  return (
    <Button type="button" variant={variant} onClick={handleClick} disabled={isPending}>
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
      {label}
    </Button>
  );
}
