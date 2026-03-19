export interface AnalyzeRequest {
  repoUrl: string;
}

export interface RepoFile {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
}

export interface RepoMeta {
  owner: string;
  repo: string;
  defaultBranch: string;
  description: string | null;
  stars: number;
  language: string | null;
}

export interface SecurityIssue {
  file: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  line?: number;
  description: string;
}

export interface ReadinessScore {
  score: number;
  hasTests: boolean;
  hasCI: boolean;
  hasDockerfile: boolean;
  hasLinting: boolean;
  hasEnvExample: boolean;
}

export interface AnalysisData {
  owner: string;
  repo: string;
  files: RepoFile[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  detectedLanguages: string[];
  securityIssues: SecurityIssue[];
  readinessScore: ReadinessScore;
  readme: string;
  meta: RepoMeta;
}

export interface GeminiComponent {
  name: string;
  role: string;
  path: string;
}

export interface GeminiSummary {
  overview: string;
  architecture: string;
  components: GeminiComponent[];
  techStack: string[];
  observations: string[];
  productionScore: number;
}

export interface AnalyzeResponse {
  analysis: AnalysisData;
  summary: GeminiSummary;
}

export interface AnalyzeErrorResponse {
  error: string;
  detail?: string;
}

export interface GraphNode {
  id: string;
  data: { label: string; type: 'directory' | 'dependency' };
  position: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
