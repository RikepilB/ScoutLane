"use client";

import { X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface SkillsMultiSelectProps {
  name: string;
  defaultValue?: string;
  availableSkills: string[];
}

export function SkillsMultiSelect({
  name,
  defaultValue,
  availableSkills,
}: SkillsMultiSelectProps) {
  const [selected, setSelected] = useState<string[]>(() => {
    if (!defaultValue) return [];
    return defaultValue
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = availableSkills.filter(
    (s) =>
      !selected.includes(s) &&
      s.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(skill: string) {
    setSelected((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  function remove(skill: string) {
    setSelected((prev) => prev.filter((s) => s !== skill));
  }

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={selected.join(",")} />
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex min-h-[34px] w-full items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-xs outline-none focus:border-sky-500 cursor-pointer hover:bg-muted/10"
      >
        {selected.length === 0 ? (
          <span className="text-muted-foreground">Any skills</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {selected.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-800"
              >
                {skill}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(skill);
                  }}
                  className="hover:text-sky-950"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-64 rounded-xl border border-border/70 bg-card shadow-lg">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border/50 bg-muted/20 px-3 py-1.5 text-xs outline-none focus:border-sky-500"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto border-t border-border/50 px-1 py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                {search ? "No matching skills" : "All skills selected"}
              </p>
            ) : (
              filtered.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggle(skill)}
                  className="w-full rounded-lg px-3 py-1.5 text-left text-xs hover:bg-muted/30"
                >
                  {skill}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
