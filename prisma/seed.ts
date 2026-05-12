import { faker } from "@faker-js/faker";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const pipelineStages = [
  "Applied",
  "Screening",
  "Assessment",
  "Interview",
  "Offer",
  "Hired",
  "Rejected",
];

const jobsData = [
  {
    title: "Senior Frontend Engineer",
    slug: "senior-frontend-engineer-demo",
    description:
      "Lead the frontend experience for a modern recruitment platform built with Next.js, TypeScript, and a deeply data-driven admin dashboard.",
    published: true,
    archived: false,
  },
  {
    title: "Backend Platform Engineer",
    slug: "backend-platform-engineer-demo",
    description:
      "Design resilient APIs, asynchronous resume-processing workflows, and internal tooling that powers the hiring pipeline.",
    published: true,
    archived: false,
  },
  {
    title: "Product Designer",
    slug: "product-designer-demo",
    description:
      "Shape the public application experience and the internal recruiting workspace used by hiring managers every day.",
    published: false,
    archived: true,
  },
];

async function main() {
  console.log("Seeding ScoutLane review data...");

  const organization = await prisma.organization.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "Acme Corp",
      slug: "acme-corp",
    },
  });

  const adminEmail = process.env.INITIAL_ADMIN_EMAIL ?? "admin@scoutlane.local";
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      organizationId: organization.id,
      role: "ADMIN",
    },
    create: {
      email: adminEmail,
      name: "Admin User",
      organizationId: organization.id,
      role: "ADMIN",
    },
  });

  const recruiter = await prisma.user.upsert({
    where: { email: "recruiter@scoutlane.local" },
    update: {
      organizationId: organization.id,
      role: "RECRUITER",
    },
    create: {
      email: "recruiter@scoutlane.local",
      name: "Maya Recruiter",
      organizationId: organization.id,
      role: "RECRUITER",
    },
  });

  await prisma.pipelineStage.deleteMany();
  await prisma.applicant.deleteMany();

  const jobs = [];

  for (const [index, jobData] of jobsData.entries()) {
    const job = await prisma.job.upsert({
      where: { slug: jobData.slug },
      update: {
        ...jobData,
        organizationId: organization.id,
        createdById: recruiter.id,
      },
      create: {
        ...jobData,
        organizationId: organization.id,
        createdById: recruiter.id,
      },
    });

    jobs.push(job);

    await prisma.pipelineStage.createMany({
      data: pipelineStages.map((name, stageIndex) => ({
        jobId: job.id,
        name,
        order: stageIndex,
        color: ["#0f172a", "#0369a1", "#7c3aed", "#f59e0b", "#16a34a", "#15803d", "#b91c1c"][
          stageIndex
        ],
      })),
    });

    for (let applicantIndex = 0; applicantIndex < 10; applicantIndex += 1) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const createdAt = faker.date.recent({ days: 45 });

      await prisma.applicant.create({
        data: {
          jobId: job.id,
          name: `${firstName} ${lastName}`,
          email: faker.internet.email({ firstName, lastName }).toLowerCase(),
          phone: faker.phone.number({ style: "international" }),
          resumeUrl: `https://storage.googleapis.com/demo-bucket/resumes/${job.slug}-${index}-${applicantIndex}.pdf`,
          status: [
            "NEW",
            "REVIEWING",
            "SHORTLISTED",
            "INTERVIEW",
            "OFFERED",
            "REJECTED",
            "WITHDRAWN",
          ][applicantIndex % 7] as
            | "NEW"
            | "REVIEWING"
            | "SHORTLISTED"
            | "INTERVIEW"
            | "OFFERED"
            | "REJECTED"
            | "WITHDRAWN",
          score: faker.number.float({ min: 62, max: 98, fractionDigits: 1 }),
          notes: faker.lorem.sentence(),
          createdAt,
        },
      });
    }
  }

  console.log(`Organization: ${organization.name}`);
  console.log(`Admin: ${admin.email}`);
  console.log(`Recruiter: ${recruiter.email}`);
  console.log(`Jobs seeded: ${jobs.length}`);
  console.log("Applicants seeded: 30");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
