export interface TemplateData {
  id: string;
  name: string;
  description: string | null;
  title: string;
  jobDescription: string | null;
  descriptionUrl: string | null;
  location: string | null;
  type: string | null;
  salary: string | null;
  department: string | null;
  whatYouWillDo: string | null;
  requirements: string[] | null;
  toolsAndSkills: string[] | null;
  stageNames: string[];
  questions: unknown;
  customFields: unknown;
}

export type CustomFieldRow = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  required: boolean;
  options?: string[];
};
