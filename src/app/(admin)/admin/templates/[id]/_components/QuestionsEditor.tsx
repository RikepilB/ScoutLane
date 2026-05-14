"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface QuestionsEditorProps {
  defaultValue: string[];
  inputName?: string;
}

const DEFAULT_QUESTIONS = [
  "What relevant experience do you have for this role?",
  "Why are you interested in this position?",
  "What are your salary expectations?",
  "What is your earliest start date?",
];

const MAX_QUESTIONS = 12;

export function QuestionsEditor({ defaultValue, inputName = "questions" }: QuestionsEditorProps) {
  const questionsOrDefault =
    defaultValue.length > 0 ? defaultValue : DEFAULT_QUESTIONS;
  const [questions, setQuestions] = useState<string[]>(questionsOrDefault.slice(0, MAX_QUESTIONS));

  function handleChange(index: number, value: string) {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function addQuestion() {
    setQuestions((prev) => {
      if (prev.length >= MAX_QUESTIONS) return prev;
      return [...prev, ""];
    });
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={inputName} value={questions.join("\n")} />
      <label className="text-sm font-medium">Screening questions</label>
      <div className="space-y-2">
        {questions.map((question, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="flex-shrink-0 text-xs text-muted-foreground w-5 text-right">
              {index + 1}.
            </span>
            <Input
              value={question}
              onChange={(e) => handleChange(index, e.target.value)}
              placeholder="Enter a screening question"
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
        These are stored with the template for the job form builder.
      </span>
    </div>
  );
}
