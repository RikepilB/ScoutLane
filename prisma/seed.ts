import { faker } from "@faker-js/faker";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const STAGE_NAMES = [
  "Applied",
  "Screening",
  "Assessment",
  "Interview",
  "Offer",
  "Hired",
  "Rejected",
];

const STAGE_COLORS = [
  "#0f172a", "#0369a1", "#7c3aed", "#f59e0b", "#16a34a", "#15803d", "#b91c1c",
];

const STAGE_STATUS_MAP: Record<string, "NEW" | "REVIEWING" | "SHORTLISTED" | "INTERVIEW" | "OFFERED" | "REJECTED" | "WITHDRAWN"> = {
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

function generateParsedData() {
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

async function main() {
  console.log("Seeding ScoutLane — all features...\n");

  // ── Organization ──────────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: { name: "Acme Corp", slug: "acme-corp" },
  });
  console.log(`  Org: ${org.name}`);

  // ── Users ─────────────────────────────────────────────────────────────────
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL ?? "admin@scoutlane.local";
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { organizationId: org.id, role: "ADMIN" },
    create: { email: adminEmail, name: "Admin User", organizationId: org.id, role: "ADMIN" },
  });

  const recruiter = await prisma.user.upsert({
    where: { email: "recruiter@scoutlane.local" },
    update: { organizationId: org.id, role: "RECRUITER" },
    create: { email: "recruiter@scoutlane.local", name: "Maya Recruiter", organizationId: org.id, role: "RECRUITER" },
  });

  const hiringManager = await prisma.user.upsert({
    where: { email: "hiring@scoutlane.local" },
    update: { organizationId: org.id, role: "HIRING_MANAGER" },
    create: { email: "hiring@scoutlane.local", name: "Alex Manager", organizationId: org.id, role: "HIRING_MANAGER" },
  });

  console.log(`  Users: ${admin.email}, ${recruiter.email}, ${hiringManager.email}`);

  // ── Templates ─────────────────────────────────────────────────────────────
  const fullTemplate = await prisma.jobTemplate.upsert({
    where: { id: "seed-template-full" },
    update: {},
    create: {
      id: "seed-template-full",
      name: "Software Engineer (Standard)",
      description: "Standard pipeline for software engineering roles with technical assessment.",
      title: "Software Engineer",
      jobDescription: `# About the role

We are looking for a talented **Software Engineer** to join our growing team.

## Responsibilities

- Design and implement scalable services
- Collaborate with cross-functional teams
- Participate in code reviews and mentoring

## Requirements

- 3+ years of experience in software development
- Strong understanding of data structures and algorithms
- Excellent communication skills`,
      location: "Remote",
      type: "Full-time",
      salary: "120k--180k",
      stageNames: STAGE_NAMES,
      questions: [
        "What relevant experience do you have for this role?",
        "Why are you interested in this position?",
        "What are your salary expectations?",
        "What is your earliest start date?",
      ],
      organizationId: org.id,
      createdById: admin.id,
    },
  });

  const minimalTemplate = await prisma.jobTemplate.upsert({
    where: { id: "seed-template-minimal" },
    update: {},
    create: {
      id: "seed-template-minimal",
      name: "Intern / Entry Level",
      description: "Lightweight template for internship and graduate roles.",
      title: "Intern",
      jobDescription: `## Internship Program\n\nJoin us for a meaningful internship experience.`,
      location: "On-site",
      type: "Internship",
      salary: "Stipend",
      stageNames: ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"],
      questions: [
        "What year are you in your studies?",
        "What technologies are you familiar with?",
      ],
      organizationId: org.id,
      createdById: admin.id,
    },
  });

  console.log(`  Templates: ${fullTemplate.name}, ${minimalTemplate.name}`);

  // ── Jobs ──────────────────────────────────────────────────────────────────
  const jobsData = [
    {
      title: "Senior Frontend Engineer",
      slug: "senior-frontend-engineer",
      description:
        "Lead the frontend experience for ScoutLane — a modern recruitment platform built with Next.js, TypeScript, and a deeply data-driven admin dashboard.",
      location: "San Francisco, CA",
      type: "Full-time",
      salary: "$150k--$200k",
      published: true,
      archived: false,
      customFields: [
        { id: "portfolio", label: "Portfolio URL", type: "text", required: true, placeholder: "https://" },
        { id: "github", label: "GitHub profile", type: "text", required: false, placeholder: "https://github.com/" },
        { id: "years_experience", label: "Years of React experience", type: "text", required: true, placeholder: "5+" },
      ],
    },
    {
      title: "Backend Platform Engineer",
      slug: "backend-platform-engineer",
      description:
        "Design resilient APIs, asynchronous resume-processing workflows, and internal tooling that powers the hiring pipeline at scale.",
      location: "Remote · Americas",
      type: "Full-time",
      salary: "$140k--$190k",
      published: true,
      archived: false,
      customFields: [
        { id: "system_design", label: "Link to a system design you're proud of", type: "text", required: false },
        { id: "years_experience", label: "Years of backend experience", type: "text", required: true },
      ],
    },
    {
      title: "Product Designer",
      slug: "product-designer",
      description:
        "Shape the public application experience and internal recruiting workspace used by hiring managers every day.",
      location: "New York, NY",
      type: "Full-time",
      salary: "$130k--$170k",
      published: false,
      archived: true,
      customFields: [],
    },
    {
      title: "DevOps Engineer",
      slug: "devops-engineer",
      description:
        "Build and maintain the cloud infrastructure that keeps ScoutLane fast, secure, and scalable.",
      location: "Remote",
      type: "Contract",
      salary: "$100/hr--$150/hr",
      published: false,
      archived: false,
      customFields: [
        { id: "cloud_certs", label: "Cloud certifications", type: "text", required: false },
        { id: "available_hours", label: "Weekly availability", type: "text", required: true },
      ],
    },
    {
      title: "Data Scientist",
      slug: "data-scientist",
      description:
        "Use machine learning and statistical analysis to improve candidate-job matching and hiring predictions.",
      location: "Boston, MA",
      type: "Full-time",
      salary: "$160k--$220k",
      published: true,
      archived: false,
      customFields: [
        { id: "thesis", label: "Thesis or publication link", type: "text", required: false },
      ],
    },
  ];

  // Clear existing seed data (order respects FK constraints)
  await prisma.stageTransition.deleteMany();
  await prisma.integrationLog.deleteMany();
  await prisma.webhookLog.deleteMany();
  await prisma.jobIntegration.deleteMany();
  await prisma.applicant.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.webhook.deleteMany();
  await prisma.jobTemplate.deleteMany();

  // ── Webhook ───────────────────────────────────────────────────────────────
  const webhook = await prisma.webhook.create({
    data: {
      id: "seed-webhook-1",
      url: "https://webhook.site/demo-endpoint",
      secret: "demo-secret-key",
      events: ["applicant.status_changed", "applicant.created"],
      active: true,
    },
  });
  console.log(`  Webhook: ${webhook.url}`);

  let totalApplicants = 0;
  let totalTransitions = 0;

  for (const jobData of jobsData) {
    const job = await prisma.job.upsert({
      where: { slug: jobData.slug },
      update: {
        ...jobData,
        organizationId: org.id,
        createdById: recruiter.id,
      },
      create: {
        ...jobData,
        organizationId: org.id,
        createdById: recruiter.id,
      },
    });

    await prisma.pipelineStage.createMany({
      data: STAGE_NAMES.map((name, i) => ({
        jobId: job.id, name, order: i, color: STAGE_COLORS[i],
      })),
    });

    const stages = await prisma.pipelineStage.findMany({
      where: { jobId: job.id },
      orderBy: { order: "asc" },
      select: { id: true, name: true },
    });

    // ── Job Integration for Interview stage ────────────────────────────────
    if (job.published && !job.archived) {
      const interviewStage = stages.find((s) => s.name === "Interview");
      if (interviewStage) {
        await prisma.jobIntegration.upsert({
          where: { stageId: interviewStage.id },
          update: {},
          create: {
            jobId: job.id,
            stageId: interviewStage.id,
            endpointUrl: "https://assessment-api.demo/start",
            apiKey: "sk-demo-integration-key",
            includeQuestions: true,
            active: true,
          },
        });
      }
    }

    // ── Webhook log (one per active job) ──────────────────────────────────
    if (job.published) {
      await prisma.webhookLog.create({
        data: {
          webhookId: webhook.id,
          event: "applicant.created",
          status: 200,
          request: JSON.stringify({ jobId: job.id, title: job.title }),
          response: JSON.stringify({ ok: true }),
          createdAt: faker.date.recent({ days: 10 }),
        },
      });
    }

    // ── Applicants ─────────────────────────────────────────────────────────
    const applicantCount = job.published && !job.archived ? 12 : 4;

    for (let i = 0; i < applicantCount; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const createdAt = faker.date.recent({ days: 45 });

      // Distribute applicants across stages with bias toward early stages
      const stageIndex = Math.min(
        Math.floor(Math.random() * stages.length * 0.7),
        stages.length - 1,
      );
      const stage = stages[stageIndex];
      const status = STAGE_STATUS_MAP[stage.name] ?? "REVIEWING";

      // Add some withdrawn/rejected for realism
      const finalStatus = i === 0
        ? "WITHDRAWN"
        : i === 1 && stageIndex > 0
        ? "REJECTED"
        : status;

      const parsed = generateParsedData();

      const applicant = await prisma.applicant.create({
        data: {
          jobId: job.id,
          pipelineStageId: stage.id,
          name: `${firstName} ${lastName}`,
          email: faker.internet.email({ firstName, lastName }).toLowerCase(),
          phone: faker.phone.number({ style: "international" }),
          resumeUrl: `https://storage.googleapis.com/demo-bucket/resumes/${job.slug}-${i}.pdf`,
          status: finalStatus,
          score: faker.number.float({ min: 62, max: 98, fractionDigits: 1 }),
          notes: faker.lorem.sentence(),
          data: parsed,
          parsedData: parsed,
          parsingStatus: faker.helpers.arrayElement(["COMPLETED", "COMPLETED", "COMPLETED", "PENDING"] as const),
          createdAt,
          lastStageChangeAt: createdAt,
        },
      });

      // ── Stage Transitions ────────────────────────────────────────────────
      // Create transition history: from NEW to their current stage
      const statusOrder = ["NEW", "REVIEWING", "SHORTLISTED", "INTERVIEW", "OFFERED", "REJECTED", "WITHDRAWN"];
      const currentIdx = statusOrder.indexOf(finalStatus);

      if (currentIdx > 0) {
        for (let t = 0; t < currentIdx; t++) {
          const transitionDate = new Date(createdAt.getTime() + (t + 1) * 86400000 * faker.number.int({ min: 1, max: 5 }));
          await prisma.stageTransition.create({
            data: {
              applicantId: applicant.id,
              jobId: job.id,
              fromStage: t === 0 ? null : statusOrder[t],
              toStage: statusOrder[t + 1],
              changedById: faker.helpers.arrayElement([admin.id, recruiter.id]),
              createdAt: transitionDate,
            },
          });
          totalTransitions++;
        }
      }

      totalApplicants++;
    }

    console.log(`  Job: ${job.title.padEnd(30)} ${job.published ? "active" : !job.archived ? "draft " : "closed"}  ${applicantCount} applicants`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n  Seeded:`);
  console.log(`    Organization ········· ${org.name}`);
  console.log(`    Users ················ ${admin.email}, ${recruiter.email}, ${hiringManager.email}`);
  console.log(`    Templates ············ ${fullTemplate.name}, ${minimalTemplate.name}`);
  console.log(`    Jobs ················· ${jobsData.length}`);
  console.log(`    Applicants ··········· ${totalApplicants}`);
  console.log(`    Stage transitions ···· ${totalTransitions}`);
  console.log(`    Webhooks ············· 1`);
  console.log(`    Job integrations ····· 3 (active jobs only)`);
  console.log(`    Webhook logs ········· 3`);
  console.log("\nDone.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
