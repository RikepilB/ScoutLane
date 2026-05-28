import "dotenv/config";
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
  const templateSeeds = [
    {
      id: "seed-template-ai-engineer",
      name: "AI Engineer",
      description: "Production AI/ML engineer building LLM, RAG, and classical ML systems for enterprise workflows.",
      title: "AI Engineer",
      department: "Engineering",
      location: "Remote · Americas",
      type: "Full-time",
      salary: "$160k--$220k",
      jobDescription: `# AI Engineer

Build autonomous and semi-autonomous AI systems for risk, security, and operational workflows. This is a production engineering role at the intersection of LLM application development, classical ML, data engineering, and secure enterprise delivery.`,
      whatYouWillDo: `- Design, build, and optimize AI/ML solutions in Python or TypeScript for risk, audit, and security workflows.
- Develop LLM and RAG-powered systems using OpenAI, Anthropic, Cohere, or Llama, with vector search in pgvector, Milvus, or Pinecone.
- Deploy and monitor classical ML models such as XGBoost and Isolation Forest for anomaly detection, data quality, and trend analysis.
- Engineer scalable data pipelines and APIs using Spark, Databricks, Airflow, FastAPI, REST, or GraphQL.
- Integrate AI and automation services with enterprise systems on AWS, Azure, or on-prem.
- Build reusable SDKs, plug-ins, and modules for security automation and operational workflows.
- Apply secure coding, CI/CD, observability, and MLOps practices across the delivery lifecycle.`,
      requirements: [
        "Bachelor's degree or equivalent experience in Computer Science, Software Engineering, or a related field.",
        "2-4 years of software engineering experience.",
        "Strong Python and/or TypeScript experience; Java or Go is a plus.",
        "Hands-on production experience with LLMs, RAG, classical ML, vector databases, and MLOps tooling.",
        "Strong experience with data engineering, APIs, Docker, Kubernetes, and CI/CD pipelines.",
        "Familiarity with cloud platforms and enterprise integrations such as Archer GRC or ServiceNow IRM.",
        "Awareness of security, compliance, and risk frameworks like NIST, ISO, or SOX/ITGC.",
      ],
      toolsAndSkills: [
        "Python", "TypeScript", "FastAPI", "Airflow", "Spark",
        "Databricks", "Docker", "Kubernetes", "GitHub Actions",
        "PostgreSQL", "MongoDB", "Prometheus", "Grafana", "pgvector",
      ],
      questions: [
        "Describe a production AI/ML system you have shipped end-to-end.",
        "How do you evaluate the quality and safety of an LLM-powered workflow?",
        "What is your experience deploying models behind APIs at scale?",
        "Why are you interested in this role?",
      ],
    },
    {
      id: "seed-template-frontend-engineer",
      name: "Senior Frontend Engineer",
      description: "Senior React/TypeScript engineer for data-heavy product surfaces.",
      title: "Senior Frontend Engineer",
      department: "Engineering",
      location: "Remote · Worldwide",
      type: "Full-time",
      salary: "$150k--$200k",
      jobDescription: `# Senior Frontend Engineer

Lead the design and implementation of the dashboards, workflows, and public experiences that users touch every day. Strong React, TypeScript, and Next.js practice required.`,
      whatYouWillDo: `- Lead the architecture and delivery of feature-rich admin dashboards.
- Build reusable component libraries shared across admin and public surfaces.
- Partner with product designers to ship pixel-perfect, accessible interfaces.
- Own performance: bundle size, Core Web Vitals, perceived latency.
- Mentor junior engineers on React patterns, testing, and code review.`,
      requirements: [
        "5+ years of professional frontend experience.",
        "Deep expertise with React, TypeScript, and Next.js (App Router).",
        "Experience building data-heavy dashboards with real-time updates.",
        "Strong CSS skills with Tailwind, CSS Modules, or styled-components.",
        "Track record of improving Core Web Vitals in production.",
      ],
      toolsAndSkills: [
        "React", "TypeScript", "Next.js", "Tailwind CSS",
        "Recharts", "Vitest", "Playwright", "GraphQL",
      ],
      questions: [
        "Share a frontend project you are proud of and your role on it.",
        "How do you approach performance optimization in a large Next.js app?",
        "Describe your testing strategy for a complex form or table.",
        "What is your earliest start date?",
      ],
    },
    {
      id: "seed-template-backend-engineer",
      name: "Backend Platform Engineer",
      description: "Backend engineer for APIs, queues, and database-heavy systems.",
      title: "Backend Platform Engineer",
      department: "Engineering",
      location: "Remote · Americas",
      type: "Full-time",
      salary: "$140k--$190k",
      jobDescription: `# Backend Platform Engineer

Design resilient APIs, asynchronous workflows, and the persistence layer that powers the product. Strong Node.js or Go preferred.`,
      whatYouWillDo: `- Design and ship REST and GraphQL APIs serving the product.
- Architect asynchronous job queues for parsing, dispatch, and integrations.
- Implement caching strategies and database optimizations for high-throughput endpoints.
- Build internal tooling and developer infrastructure that speeds up product velocity.
- Own the PostgreSQL schema and the Prisma ORM layer.`,
      requirements: [
        "5+ years of backend engineering experience.",
        "Strong proficiency with Node.js and TypeScript; Go a plus.",
        "Production experience with PostgreSQL and Prisma (or similar ORM).",
        "Familiarity with background job queues (pg-boss, BullMQ, SQS, Temporal).",
        "Experience designing APIs consumed by frontend and partner teams.",
      ],
      toolsAndSkills: [
        "Node.js", "TypeScript", "PostgreSQL", "Prisma",
        "pg-boss", "Docker", "AWS", "Redis",
      ],
      questions: [
        "Walk me through a backend system you designed from scratch.",
        "How do you debug a slow query in production?",
        "Describe how you handle retries and idempotency for queued jobs.",
        "What is your earliest start date?",
      ],
    },
    {
      id: "seed-template-product-designer",
      name: "Product Designer",
      description: "End-to-end product designer for B2B SaaS dashboards.",
      title: "Product Designer",
      department: "Product",
      location: "New York, NY · Hybrid",
      type: "Full-time",
      salary: "$130k--$170k",
      jobDescription: `# Product Designer

Shape the workflows recruiters use every day. Own design end-to-end from research through high-fidelity delivery and Figma handoff.`,
      whatYouWillDo: `- Design end-to-end workflows from public careers pages to admin dashboards.
- Create high-fidelity mockups and interactive prototypes in Figma.
- Conduct user research with recruiters and hiring managers.
- Build and maintain a design system used across product surfaces.
- Partner with engineering on polished, accessible implementations.`,
      requirements: [
        "3+ years of product design experience, ideally in B2B SaaS.",
        "Strong portfolio showing data-heavy dashboard design.",
        "Proficiency with Figma and modern prototyping tools.",
        "Experience running user research and usability testing.",
        "Understanding of accessibility standards (WCAG 2.1 AA).",
      ],
      toolsAndSkills: [
        "Figma", "Prototyping", "Design Systems",
        "User Research", "HTML/CSS", "Accessibility",
      ],
      questions: [
        "Share two case studies from your portfolio.",
        "How do you balance qualitative research with quantitative product data?",
        "Describe a design system you have helped build or maintain.",
        "What is your earliest start date?",
      ],
    },
    {
      id: "seed-template-data-engineer",
      name: "Data Engineer",
      description: "Data engineer for analytics pipelines, warehousing, and reverse ETL.",
      title: "Data Engineer",
      department: "Data Science",
      location: "Remote · Americas",
      type: "Full-time",
      salary: "$140k--$190k",
      jobDescription: `# Data Engineer

Build and operate the pipelines, warehouses, and tooling that power analytics, product insights, and downstream ML workflows.`,
      whatYouWillDo: `- Design and own ELT pipelines from product data into the warehouse.
- Model curated data marts that analytics and ML teams build on top of.
- Operate the warehouse: cost, performance, freshness, and reliability.
- Wire reverse ETL into product surfaces and operational tools.
- Partner with analysts and ML engineers on shared data contracts.`,
      requirements: [
        "3+ years of data engineering experience.",
        "Strong SQL and Python skills.",
        "Production experience with at least one warehouse (BigQuery, Snowflake, Redshift).",
        "Experience with orchestration (Airflow, Dagster, Prefect) and dbt.",
        "Comfort with CI/CD, infrastructure as code, and observability.",
      ],
      toolsAndSkills: [
        "SQL", "Python", "dbt", "Airflow",
        "BigQuery", "Snowflake", "Terraform", "Docker",
      ],
      questions: [
        "Describe a pipeline you have built end-to-end.",
        "How do you approach data quality and freshness monitoring?",
        "Walk me through a recent warehouse cost or performance issue you fixed.",
        "What is your earliest start date?",
      ],
    },
  ];

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
  const jobsData = [
    {
      title: "Senior Frontend Engineer",
      slug: "senior-frontend-engineer",
      department: "Engineering",
      description:
        "Lead the frontend experience for ScoutLane — a modern recruitment platform built with Next.js, TypeScript, and a deeply data-driven admin dashboard.",
      whatYouWillDo:
        "## What you'll do\n\n- Lead the architecture and development of ScoutLane's applicant tracking dashboard\n- Build reusable component libraries used across the admin and public experiences\n- Collaborate with product designers to implement pixel-perfect, accessible interfaces\n- Optimize bundle size, Core Web Vitals, and perceived performance\n- Mentor junior engineers on React patterns and testing best practices",
      requirements: ["5+ years of professional frontend experience", "Deep expertise with React, TypeScript, and Next.js", "Experience building data-heavy dashboards with real-time features", "Strong CSS skills — Tailwind, CSS Modules, or styled-components", "Track record of improving Core Web Vitals in production"],
      toolsAndSkills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "D3.js / Recharts", "Vitest", "Playwright", "GraphQL"],
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
      department: "Engineering",
      description:
        "Design resilient APIs, asynchronous resume-processing workflows, and internal tooling that powers the hiring pipeline at scale.",
      whatYouWillDo:
        "## What you'll do\n\n- Design and build scalable REST and GraphQL APIs serving the ScoutLane platform\n- Architect asynchronous job queues for resume parsing and webhook dispatch\n- Implement caching strategies and database optimizations for high-throughput endpoints\n- Build internal tooling and developer infrastructure to accelerate product velocity\n- Own the PostgreSQL schema and Prisma ORM layer",
      requirements: ["5+ years of backend engineering experience", "Strong proficiency with Node.js and TypeScript", "Experience with PostgreSQL and Prisma ORM", "Familiarity with job queues (pg-boss, Bull, or similar)", "Experience designing APIs consumed by frontend teams"],
      toolsAndSkills: ["Node.js", "TypeScript", "PostgreSQL", "Prisma", "pg-boss", "Docker", "AWS", "Redis"],
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
      department: "Product",
      description:
        "Shape the public application experience and internal recruiting workspace used by hiring managers every day.",
      whatYouWillDo:
        "## What you'll do\n\n- Design end-to-end workflows for the ScoutLane platform, from public careers pages to admin dashboards\n- Create high-fidelity mockups and interactive prototypes in Figma\n- Conduct user research with hiring managers and recruiters to inform design decisions\n- Build and maintain a design system used across all product surfaces\n- Partner with engineering to ensure polished, accessible implementations",
      requirements: ["3+ years of product design experience", "Strong portfolio showing data-heavy dashboard design", "Proficiency with Figma and prototyping tools", "Experience conducting user research and usability testing", "Understanding of accessibility standards (WCAG 2.1)"],
      toolsAndSkills: ["Figma", "Prototyping", "Design Systems", "User Research", "HTML/CSS", "Accessibility"],
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
      department: "Engineering",
      description:
        "Build and maintain the cloud infrastructure that keeps ScoutLane fast, secure, and scalable.",
      whatYouWillDo:
        "## What you'll do\n\n- Manage cloud infrastructure on AWS using Infrastructure as Code\n- Set up and maintain CI/CD pipelines with GitHub Actions\n- Implement monitoring, alerting, and observability with Datadog and Sentry\n- Manage PostgreSQL databases including replication, backups, and performance tuning\n- Own security posture — secrets management, IAM, network policies",
      requirements: ["3+ years of DevOps/SRE experience", "Strong AWS knowledge (ECS, RDS, Lambda, VPC)", "Experience with Docker and container orchestration", "Proficiency with Terraform or Pulumi", "Experience managing PostgreSQL in production"],
      toolsAndSkills: ["AWS", "Docker", "Terraform", "GitHub Actions", "PostgreSQL", "Datadog", "Sentry", "Bash"],
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
      department: "Data Science",
      description:
        "Use machine learning and statistical analysis to improve candidate-job matching and hiring predictions.",
      whatYouWillDo:
        "## What you'll do\n\n- Build and iterate on candidate-job matching models using NLP and structured data\n- Analyze hiring funnel data to identify patterns and recommend process improvements\n- Design A/B tests to measure the impact of matching algorithm changes\n- Collaborate with engineering to deploy models as API services\n- Build dashboards for the product team to track matching quality and pipeline health",
      requirements: ["3+ years of applied ML/data science experience", "Strong proficiency with Python and SQL", "Experience with NLP techniques (transformers, embeddings, classification)", "Track record of deploying models to production", "Ability to communicate technical findings to non-technical stakeholders"],
      toolsAndSkills: ["Python", "PyTorch", "scikit-learn", "SQL", "Pandas", "OpenAI API", "AWS SageMaker", "Jupyter"],
      location: "Boston, MA",
      type: "Full-time",
      salary: "$160k--$220k",
      published: true,
      archived: false,
      customFields: [
        { id: "thesis", label: "Thesis or publication link", type: "text", required: false },
      ],
    },
    {
      title: "Applied Machine Learning Scientist",
      slug: "applied-ml-scientist",
      department: "Data Science",
      description: "Research and deploy cutting-edge ML models for resume parsing, skill extraction, and job-candidate matching.",
      whatYouWillDo:
        "## What you'll do\n\n- Research and implement state-of-the-art NLP models for information extraction from resumes\n- Fine-tune large language models for domain-specific hiring tasks\n- Develop evaluation frameworks to measure model accuracy and fairness\n- Publish findings internally and contribute to the ML community\n- Work with product to translate model capabilities into user-facing features",
      requirements: ["PhD or MS in ML, NLP, or related field", "Publication record in top-tier venues (NeurIPS, ICML, ACL, EMNLP)", "Experience fine-tuning and deploying LLMs in production", "Strong Python and deep learning framework skills", "Understanding of bias and fairness in ML systems"],
      toolsAndSkills: ["Python", "PyTorch", "Transformers", "Hugging Face", "DeepSpeed", "CUDA", "Weights & Biases", "AWS"],
      location: "Germany; Ireland; London; United Kingdom",
      type: "Full-time",
      salary: "$180k--$250k",
      published: true,
      archived: false,
    },
    {
      title: "Machine Learning Engineer (Remote)",
      slug: "ml-engineer-remote",
      department: "Data Science",
      description: "Build and productionize ML pipelines that power ScoutLane's intelligent hiring features.",
      whatYouWillDo:
        "## What you'll do\n\n- Design and implement scalable ML inference pipelines\n- Build feature stores and model serving infrastructure\n- Optimize model latency and throughput for real-time scoring\n- Implement monitoring and drift detection for production models\n- Collaborate with data scientists to accelerate model iteration cycles",
      requirements: ["3+ years of MLOps or ML engineering experience", "Strong backend engineering skills (Python or Go)", "Experience with ML serving frameworks (TensorFlow Serving, Triton, Ray Serve)", "Familiarity with feature stores and experiment tracking", "Experience with Kubernetes and container orchestration"],
      toolsAndSkills: ["Python", "Go", "Kubernetes", "MLflow", "Kubeflow", "AWS SageMaker", "Docker", "Ray"],
      location: "Alberta, Canada; British Columbia; Calgary, Alberta, Canada; California; New York; Ontario; Oregon; Seattle, WA",
      type: "Full-time",
      salary: "$160k--$210k",
      published: true,
      archived: false,
    },
    {
      title: "Sales Engineer",
      slug: "sales-engineer",
      department: "GTM",
      description: "Partner with the sales team to demonstrate ScoutLane's technical capabilities to prospective customers.",
      whatYouWillDo:
        "## What you'll do\n\n- Deliver compelling technical demos of the ScoutLane platform to enterprise prospects\n- Build custom proof-of-concept integrations for evaluation accounts\n- Respond to RFPs and security questionnaires\n- Gather product feedback from prospects and channel it to the product team\n- Create technical content (blog posts, whitepapers, demo videos)",
      requirements: ["3+ years in a sales engineering or solutions architect role", "Strong presentation and communication skills", "Technical background — can code basic integrations and read API docs", "Experience selling SaaS products to mid-market or enterprise", "Willingness to travel up to 25%"],
      toolsAndSkills: ["REST APIs", "JavaScript", "Postman", "Salesforce", "HubSpot", "Notion", "Loom", "Figma"],
      location: "New York, NY; San Francisco, CA; Remote",
      type: "Full-time",
      salary: "$130k--$180k + Commission",
      published: true,
      archived: false,
    },
    {
      title: "Product Manager",
      slug: "product-manager",
      department: "Product",
      description: "Define the product strategy and roadmap for ScoutLane's core recruiting platform.",
      whatYouWillDo:
        "## What you'll do\n\n- Define and prioritize the product roadmap based on customer feedback and market research\n- Write detailed product specs and work closely with engineering on implementation\n- Analyze product metrics to inform feature decisions and measure impact\n- Conduct customer interviews and usability testing sessions\n- Partner with GTM on product launches and enablement",
      requirements: ["4+ years of product management experience", "Experience with B2B SaaS products", "Strong analytical skills — comfortable with SQL and product analytics", "Excellent written and verbal communication", "Experience working with engineering teams in an agile environment"],
      toolsAndSkills: ["SQL", "Mixpanel / Amplitude", "Notion", "Figma", "Jira / Linear", "User Interviews"],
      location: "San Francisco, CA; New York, NY; Remote",
      type: "Full-time",
      salary: "$150k--$200k",
      published: true,
      archived: false,
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
      const interviewStage = stages.find((s: { id: string; name: string }) => s.name === "Interview");
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
