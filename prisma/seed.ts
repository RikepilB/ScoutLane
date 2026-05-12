import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding ScoutLane...");

  // ── Organization ──────────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "Acme Corp",
      slug: "acme-corp",
    },
  });
  console.log(`  ✔ Organization: ${org.name}`);

  // ── Admin User ────────────────────────────────────────────────────────────
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL ?? "admin@scoutlane.local";
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Admin User",
      email: adminEmail,
      role: "ADMIN",
      organizationId: org.id,
    },
  });
  console.log(`  ✔ Admin: ${admin.email}`);

  // ── Recruiter User ────────────────────────────────────────────────────────
  const recruiter = await prisma.user.upsert({
    where: { email: "recruiter@scoutlane.local" },
    update: {},
    create: {
      name: "Sarah Recruiter",
      email: "recruiter@scoutlane.local",
      role: "RECRUITER",
      organizationId: org.id,
    },
  });
  console.log(`  ✔ Recruiter: ${recruiter.email}`);

  // ── Jobs ──────────────────────────────────────────────────────────────────
  const jobsData = [
    {
      title: "Senior Frontend Engineer",
      slug: "senior-frontend-engineer",
      description:
        "We are looking for a senior frontend engineer to lead our web application team. You will work with React, TypeScript, and Next.js to build world-class user interfaces.",
      location: "San Francisco, CA (Remote)",
      type: "Full-time",
      salary: "$150k - $200k",
    },
    {
      title: "Backend Platform Engineer",
      slug: "backend-platform-engineer",
      description:
        "Join our platform team to build scalable APIs and microservices. Experience with Node.js, PostgreSQL, and cloud infrastructure is required.",
      location: "New York, NY (Hybrid)",
      type: "Full-time",
      salary: "$140k - $190k",
    },
    {
      title: "Product Designer",
      slug: "product-designer",
      description:
        "Design delightful experiences for our recruitment platform. You will own the end-to-end design process from user research to high-fidelity mockups.",
      location: "Remote (US)",
      type: "Full-time",
      salary: "$120k - $160k",
    },
    {
      title: "DevOps Engineer (Contract)",
      slug: "devops-engineer-contract",
      description:
        "Help us scale our infrastructure. Experience with AWS, Kubernetes, Terraform, and CI/CD pipelines is required. 6-month contract with possibility of extension.",
      location: "Remote",
      type: "Contract",
      salary: "$100 - $150 / hr",
    },
    {
      title: "Machine Learning Intern",
      slug: "ml-intern",
      description:
        "Work on cutting-edge ML models for resume parsing and candidate matching. Ideal for current MS/PhD students in CS, ML, or related fields.",
      location: "San Francisco, CA",
      type: "Internship",
      salary: "$8,000 / mo",
    },
  ];

  const jobs = [];
  for (const jobData of jobsData) {
    const job = await prisma.job.upsert({
      where: { slug: jobData.slug },
      update: {},
      create: {
        ...jobData,
        published: true,
        organizationId: org.id,
        createdById: recruiter.id,
      },
    });
    jobs.push(job);
    console.log(`  ✔ Job: ${job.title}`);
  }

  // ── Pipeline Stages for each job ──────────────────────────────────────────
  const stageNames = ["New", "Screening", "Interview", "Offer", "Hired"];
  const stageColors = ["#6366f1", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6"];

  for (const job of jobs) {
    for (let i = 0; i < stageNames.length; i++) {
      await prisma.pipelineStage.upsert({
        where: { id: `${job.id}-stage-${i}` },
        update: {},
        create: {
          id: `${job.id}-stage-${i}`,
          jobId: job.id,
          name: stageNames[i],
          order: i,
          color: stageColors[i],
        },
      });
    }
    console.log(`  ✔ Pipeline stages for: ${job.title}`);
  }

  // ── Sample Applicants ─────────────────────────────────────────────────────
  const candidateNames = [
    "Alice Johnson",
    "Bob Williams",
    "Carol Martinez",
    "David Brown",
    "Eva Garcia",
    "Frank Miller",
    "Grace Davis",
    "Henry Rodriguez",
  ];

  for (const job of jobs.slice(0, 3)) {
    for (let i = 0; i < candidateNames.length; i++) {
      const statuses = [
        "NEW",
        "REVIEWING",
        "SHORTLISTED",
        "INTERVIEW",
        "OFFERED",
        "REJECTED",
        "WITHDRAWN",
      ] as const;

      await prisma.applicant.create({
        data: {
          jobId: job.id,
          name: candidateNames[i],
          email: faker.internet.email(),
          phone: faker.phone.number(),
          status: statuses[i % statuses.length],
          score: Math.round((Math.random() * 40 + 60) * 10) / 10,
          notes: faker.lorem.sentence(),
        },
      });
    }
    console.log(`  ✔ ${candidateNames.length} applicants for: ${job.title}`);
  }

  console.log("\n✅ Seeding complete!");
  console.log(`   Organization: ${org.name}`);
  console.log(`   Jobs: ${jobs.length}`);
  console.log(`   Users: 2 (admin + recruiter)`);
  console.log(`   Applicants: ${candidateNames.length * 3}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
