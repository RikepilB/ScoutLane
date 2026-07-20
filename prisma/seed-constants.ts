import { faker } from "@faker-js/faker";

export const STAGE_NAMES = [
  "Applied",
  "Screening",
  "Assessment",
  "Interview",
  "Offer",
  "Hired",
  "Rejected",
];

export const STAGE_COLORS = [
  "#0f172a", "#0369a1", "#7c3aed", "#f59e0b", "#16a34a", "#15803d", "#b91c1c",
];

export const STAGE_STATUS_MAP: Record<string, "NEW" | "REVIEWING" | "SHORTLISTED" | "INTERVIEW" | "OFFERED" | "REJECTED" | "WITHDRAWN"> = {
  Applied: "NEW",
  Screening: "REVIEWING",
  Assessment: "SHORTLISTED",
  Interview: "INTERVIEW",
  Offer: "OFFERED",
  Hired: "OFFERED",
  Rejected: "REJECTED",
};

const institutions = [
  "MIT", "Stanford University", "UC Berkeley", "Carnegie Mellon",
  "University of Washington", "Georgia Tech", "University of Michigan",
  "Caltech", "Cornell University", "University of Illinois Urbana-Champaign",
];

const programs = [
  "Computer Science", "Software Engineering", "Data Science",
  "Electrical Engineering", "Information Systems", "Computer Engineering",
  "Mathematics", "Physics", "Business Administration",
];

const companies = [
  "Google", "Meta", "Amazon", "Microsoft", "Apple",
  "Stripe", "Airbnb", "Uber", "Spotify", "Netflix",
];

const skills = [
  "TypeScript", "React", "Next.js", "Node.js", "Python",
  "PostgreSQL", "Prisma", "GraphQL", "Docker", "AWS",
  "Kubernetes", "CI/CD", "Terraform", "Redis", "Kafka",
];

export function generateParsedData() {
  const educationCount = faker.number.int({ min: 1, max: 2 });
  const education = Array.from({ length: educationCount }, () => ({
    institution: faker.helpers.arrayElement(institutions),
    degree: faker.helpers.arrayElement(["Bachelor's", "Master's", "PhD"]),
    field: faker.helpers.arrayElement(programs),
    graduationYear: faker.number.int({ min: 2018, max: 2026 }),
  }));

  const workCount = faker.number.int({ min: 1, max: 3 });
  const work = Array.from({ length: workCount }, (_, i) => ({
    company: faker.helpers.arrayElement(companies),
    title: faker.person.jobTitle(),
    duration: `${faker.number.int({ min: 6, max: 48 })} months`,
    startDate: `${2020 - i}-0${faker.number.int({ min: 1, max: 9 })}`,
  }));

  const applicantSkills = faker.helpers.arrayElements(skills, faker.number.int({ min: 3, max: 8 }));

  return { education, work, skills: applicantSkills };
}
