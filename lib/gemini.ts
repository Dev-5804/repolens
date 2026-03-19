import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

import { AnalysisData, GeminiSummary } from '@/types';

const GeminiSummarySchema = z.object({
  overview: z.string().min(10),
  architecture: z.string().min(3),
  components: z
    .array(
      z.object({
        name: z.string(),
        role: z.string(),
        path: z.string(),
      })
    )
    .max(12),
  techStack: z.array(z.string()).max(20),
  observations: z.array(z.string()).min(1).max(8),
  productionScore: z.number().int().min(0).max(100),
});

function buildPayload(data: AnalysisData): string {
  const topLevelDirectories = [
    ...new Set(data.files.filter((file) => file.type === 'tree').map((file) => file.path.split('/')[0])),
  ].slice(0, 20);

  const keyFiles = data.files
    .filter((file) => file.type === 'blob')
    .map((file) => file.path)
    .filter((path) => !path.includes('node_modules') && !path.includes('.git'))
    .slice(0, 60);

  return JSON.stringify({
    owner: data.owner,
    repo: data.repo,
    topLevelDirectories,
    keyFiles,
    dependencies: Object.keys(data.dependencies).slice(0, 30),
    devDependencies: Object.keys(data.devDependencies).slice(0, 20),
    detectedLanguages: data.detectedLanguages,
    readinessScore: data.readinessScore,
    readmeExcerpt: data.readme.slice(0, 1500),
  });
}

const SYSTEM_PROMPT = `You are a senior software architect analyzing a GitHub repository.
Return ONLY a valid JSON object and no markdown.
The JSON must exactly match this schema:
{
  "overview": string,
  "architecture": string,
  "components": [{ "name": string, "role": string, "path": string }],
  "techStack": string[],
  "observations": string[],
  "productionScore": number
}`;

const DEFAULT_MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
];

function getModelCandidates(): string[] {
  const configured = process.env.GEMINI_MODEL?.trim();
  if (!configured) {
    return DEFAULT_MODEL_CANDIDATES;
  }

  return [configured, ...DEFAULT_MODEL_CANDIDATES.filter((model) => model !== configured)];
}

function isModelUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes('404') || message.includes('not found') || message.includes('not supported');
}

export async function analyzeRepo(data: AnalysisData): Promise<GeminiSummary> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const prompt = `${SYSTEM_PROMPT}\n\nRepository data:\n${buildPayload(data)}`;
  const candidates = getModelCandidates();

  let resultText = '';
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      const model = genAI.getGenerativeModel({ model: candidate });
      const result = await model.generateContent(prompt);
      resultText = result.response.text();
      lastError = undefined;
      break;
    } catch (error) {
      lastError = error;
      if (!isModelUnavailableError(error)) {
        throw error;
      }
    }
  }

  if (!resultText) {
    if (lastError instanceof Error) {
      throw new Error(`No compatible Gemini model available. Last error: ${lastError.message}`);
    }
    throw new Error('No compatible Gemini model available.');
  }
  const raw = resultText;

  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${cleaned.slice(0, 200)}`);
  }

  const validated = GeminiSummarySchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(`Gemini response failed validation: ${validated.error.message}`);
  }

  return validated.data;
}
