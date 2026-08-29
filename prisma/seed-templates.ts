export const templateSeeds = [
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
