import { ApplicationForm } from "@/components/public/ApplicationForm";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function JobApplicationPage({ params }: Props) {
  const { slug } = await params;

  return (
    <main className="min-h-screen bg-background">
      <div className="container py-12">
        <ApplicationForm jobSlug={slug} />
      </div>
    </main>
  );
}
