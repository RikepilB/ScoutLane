"use client";

import { useState } from "react";
import { Plus, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface QuestionObject {
  text: string;
  maxDurationSeconds: number;
  maxAttempts: number;
}

interface QuestionsEditorProps {
  defaultValue: unknown;
  inputName?: string;
}

const DEFAULT_QUESTIONS: QuestionObject[] = [
  { text: "What relevant experience do you have for this role?", maxDurationSeconds: 120, maxAttempts: 1 },
  { text: "Why are you interested in this position?", maxDurationSeconds: 120, maxAttempts: 1 },
  { text: "What are your salary expectations?", maxDurationSeconds: 120, maxAttempts: 1 },
  { text: "What is your earliest start date?", maxDurationSeconds: 120, maxAttempts: 1 },
];

const MAX_QUESTIONS = 12;

function normalizeQuestions(raw: unknown): QuestionObject[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string" && item.trim()) {
        return { text: item.trim(), maxDurationSeconds: 120, maxAttempts: 1 };
      }
      if (item && typeof item === "object" && "text" in item) {
        const o = item as Record<string, unknown>;
        return {
          text: typeof o.text === "string" ? o.text.trim() : "",
          maxDurationSeconds:
            typeof o.maxDurationSeconds === "number" ? o.maxDurationSeconds : 120,
          maxAttempts: typeof o.maxAttempts === "number" ? o.maxAttempts : 1,
        };
      }
      return null;
    })
    .filter((q): q is QuestionObject => q !== null && q.text.length > 0);
}

export function QuestionsEditor({ defaultValue, inputName = "questions" }: QuestionsEditorProps) {
  const [questions, setQuestions] = useState<QuestionObject[]>(() => {
    const parsed = normalizeQuestions(defaultValue);
    if (parsed.length > 0) return parsed.slice(0, MAX_QUESTIONS);
    return DEFAULT_QUESTIONS.slice(0, MAX_QUESTIONS);
  });

  function handleTextChange(index: number, value: string) {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], text: value };
      return next;
    });
  }

  function handleDurationChange(index: number, value: string) {
    const num = parseInt(value, 10);
    if (Number.isNaN(num)) return;
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], maxDurationSeconds: Math.max(10, Math.min(600, num)) };
      return next;
    });
  }

  function handleAttemptsChange(index: number, value: string) {
    const num = parseInt(value, 10);
    if (Number.isNaN(num)) return;
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], maxAttempts: Math.max(1, Math.min(10, num)) };
      return next;
    });
  }

  function addQuestion() {
    setQuestions((prev) => {
      if (prev.length >= MAX_QUESTIONS) return prev;
      return [...prev, { text: "", maxDurationSeconds: 120, maxAttempts: 1 }];
    });
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  const serialized = JSON.stringify(
    questions.filter((q) => q.text.trim().length > 0),
  );

  return (
    <div className="space-y-2">
      <input type="hidden" name={inputName} value={serialized} />
      <label className="text-sm font-medium">Assessment questions</label>
      <div className="space-y-3">
        {questions.map((question, index) => (
          <div
            key={index}
            className="flex flex-col gap-2 rounded-xl border border-border/60 bg-white p-3"
          >
            <div className="flex items-start gap-2">
              <GripVertical className="mt-2 h-4 w-4 shrink-0 text-muted-foreground/50" />
              <span className="mt-2 w-5 shrink-0 text-right text-xs text-muted-foreground">
                {index + 1}.
              </span>
              <Input
                value={question.text}
                onChange={(e) => handleTextChange(index, e.target.value)}
                placeholder="Enter a question"
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeQuestion(index)}
                aria-label={`Remove question ${index + 1}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-3 pl-11">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Max duration
                <input
                  type="number"
                  value={question.maxDurationSeconds}
                  onChange={(e) => handleDurationChange(index, e.target.value)}
                  min={10}
                  max={600}
                  className="w-16 rounded-md border border-border/60 px-2 py-1 text-xs outline-none focus:border-sky-500"
                />
                s
              </label>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Max attempts
                <input
                  type="number"
                  value={question.maxAttempts}
                  onChange={(e) => handleAttemptsChange(index, e.target.value)}
                  min={1}
                  max={10}
                  className="w-14 rounded-md border border-border/60 px-2 py-1 text-xs outline-none focus:border-sky-500"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        {questions.length < MAX_QUESTIONS && (
          <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
            <Plus className="h-4 w-4" />
            Add question
          </Button>
        )}
        <span className="text-xs text-muted-foreground">
          {questions.length} / {MAX_QUESTIONS}
        </span>
      </div>
      <span className="block text-xs font-normal text-muted-foreground">
        Each question includes a max recording duration and number of attempts for video assessment integrations.
      </span>
    </div>
  );
}
