export interface RepoMetadata {
  name: string;
  full_name: string;
  description: string | null;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  license: string | null;
  createdAt: string;
  updatedAt: string;
  defaultBranch: string;
}

export interface CommitActivity {
  commitsLast30Days: number;
  commitsLast90Days: number;
  lastCommitDate: string | null;
}

export interface Contributor {
  login: string;
  contributions: number;
}

export interface ContributorData {
  totalContributors: number; // Approximate if large
  topContributors: Contributor[];
}

export interface LanguageData {
  [language: string]: number; // Bytes per language
}

export interface RepoStructure {
  hasReadme: boolean;
  hasLicense: boolean;
  hasTests: boolean;
  hasCi: boolean;
  hasLint: boolean;
  hasTypecheck: boolean;
  hasDependencyLock: boolean;
  hasSecurityPolicy: boolean;
}

export interface RepoQualityScores {
  activity: number;
  maintainability: number;
  reliability: number;
  documentation: number;
  structure: number;
}

export interface FinalScore {
  final: number;
  breakdown: RepoQualityScores;
}

export interface RepoAnalysisData {
  metadata: RepoMetadata;
  activity: CommitActivity;
  contributors: ContributorData;
  languages: LanguageData;
  structure: RepoStructure;
  quality: RepoQualityScores;
  score: FinalScore;
}

export interface ApiResponse {
  status: 'success' | 'error';
  cached?: boolean;
  data?: RepoAnalysisData;
  code?: string;
  message?: string;
}
