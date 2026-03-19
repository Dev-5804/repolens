import AnalyzeClient from '@/components/AnalyzeClient';

type AnalyzePageProps = {
  searchParams: Promise<{ url?: string }>;
};

export default async function AnalyzePage({ searchParams }: AnalyzePageProps) {
  const params = await searchParams;
  const repoUrl = params.url ?? '';

  return <AnalyzeClient key={repoUrl} repoUrl={repoUrl} />;
}
