import "dotenv/config";
import { faker } from "@faker-js/faker";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { STAGE_NAMES, STAGE_COLORS, STAGE_STATUS_MAP, generateParsedData } from "./seed-constants";
import { templateSeeds } from "./seed-templates";
import { jobsData } from "./seed-jobs";
import { encryptSecret } from "../src/lib/security/integration-secrets";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL ?? "admin@scoutlane.dev";
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { organizationId: org.id, role: "ADMIN" },
    create: { email: adminEmail, name: "Admin User", organizationId: org.id, role: "ADMIN" },
  });

  const recruiter = await prisma.user.upsert({
    where: { email: "recruiter@scoutlane.dev" },
    update: { organizationId: org.id, role: "RECRUITER" },
    create: { email: "recruiter@scoutlane.dev", name: "Maya Recruiter", organizationId: org.id, role: "RECRUITER" },
  });

  const hiringManager = await prisma.user.upsert({
    where: { email: "hiring@scoutlane.dev" },
    update: { organizationId: org.id, role: "HIRING_MANAGER" },
    create: { email: "hiring@scoutlane.dev", name: "Alex Manager", organizationId: org.id, role: "HIRING_MANAGER" },
  });

  const guest = await prisma.user.upsert({
    where: { email: "guest@scoutlane.dev" },
    update: { organizationId: org.id, role: "GUEST" },
    create: { email: "guest@scoutlane.dev", name: "Guest", organizationId: org.id, role: "GUEST" },
  });

  console.log(`  Users: ${admin.email}, ${recruiter.email}, ${hiringManager.email}, ${guest.email}`);

  // ── Templates ─────────────────────────────────────────────────────────────
  const templateRecords: { id: string; name: string }[] = [];
  for (const t of templateSeeds) {
    const rec = await prisma.jobTemplate.upsert({
      where: { id: t.id },
      update: {
        name: t.name,
        description: t.description,
        title: t.title,
        department: t.department,
        location: t.location,
        type: t.type,
        salary: t.salary,
        jobDescription: t.jobDescription,
        whatYouWillDo: t.whatYouWillDo,
        requirements: t.requirements,
        toolsAndSkills: t.toolsAndSkills,
        stageNames: STAGE_NAMES,
        questions: t.questions,
        organizationId: org.id,
        createdById: admin.id,
      },
      create: {
        id: t.id,
        name: t.name,
        description: t.description,
        title: t.title,
        department: t.department,
        location: t.location,
        type: t.type,
        salary: t.salary,
        jobDescription: t.jobDescription,
        whatYouWillDo: t.whatYouWillDo,
        requirements: t.requirements,
        toolsAndSkills: t.toolsAndSkills,
        stageNames: STAGE_NAMES,
        questions: t.questions,
        organizationId: org.id,
        createdById: admin.id,
      },
    });
    templateRecords.push({ id: rec.id, name: rec.name });
  }

  console.log(`  Templates: ${templateRecords.map((t) => t.name).join(", ")}`);

  // ── Jobs ──────────────────────────────────────────────────────────────────
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
      secret: encryptSecret("demo-secret-key"),
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
        status: STAGE_STATUS_MAP[name] ?? "REVIEWING",
      })),
    });

    const stages = await prisma.pipelineStage.findMany({
      where: { jobId: job.id },
      orderBy: { order: "asc" },
      select: { id: true, name: true },
    });

    // ── Job Integration for Interview stage ────────────────────────────────
    if (job.published && !job.archived) {
      const interviewStage = stages.find((s: { id: string; name: string }) => s.name === "Interview");
      if (interviewStage) {
        await prisma.jobIntegration.upsert({
          where: { stageId: interviewStage.id },
          update: {},
          create: {
            jobId: job.id,
            stageId: interviewStage.id,
            endpointUrl: "https://assessment-api.demo/start",
            apiKey: encryptSecret("sk-demo-integration-key"),
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
    const applicantCount = job.published && !job.archived ? 25 : 6;

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
  console.log(`    Templates ············ ${templateRecords.map((t) => t.name).join(", ")}`);
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
