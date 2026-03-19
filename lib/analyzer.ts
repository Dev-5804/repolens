import { AnalysisData, ReadinessScore, RepoFile, SecurityIssue } from '@/types';

export function extractDependencies(packageJson: string | null): {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
} {
  if (!packageJson) {
    return { dependencies: {}, devDependencies: {} };
  }

  try {
    const parsed = JSON.parse(packageJson);
    return {
      dependencies: parsed.dependencies ?? {},
      devDependencies: parsed.devDependencies ?? {},
    };
  } catch {
    return { dependencies: {}, devDependencies: {} };
  }
}

const LANGUAGE_MAP: Record<string, string> = {
  ts: 'TypeScript',
  tsx: 'TypeScript',
  js: 'JavaScript',
  jsx: 'JavaScript',
  py: 'Python',
  go: 'Go',
  rs: 'Rust',
  rb: 'Ruby',
  java: 'Java',
  cs: 'C#',
  cpp: 'C++',
  c: 'C',
  php: 'PHP',
  swift: 'Swift',
  kt: 'Kotlin',
};

export function detectLanguages(files: RepoFile[]): string[] {
  const found = new Set<string>();

  for (const file of files) {
    const extension = file.path.split('.').pop()?.toLowerCase();
    if (extension && LANGUAGE_MAP[extension]) {
      found.add(LANGUAGE_MAP[extension]);
    }
  }

  return [...found];
}

export function scoreReadiness(files: RepoFile[]): ReadinessScore {
  const paths = files.map((file) => file.path);

  const hasTests = paths.some((path) =>
    /(__tests__|\/tests?\/|\.test\.(js|jsx|ts|tsx)$|\.spec\.(js|jsx|ts|tsx)$|vitest\.config\.|jest\.config\.|playwright\.config\.|cypress\.config\.)/i.test(
      path
    )
  );
  const hasCI = paths.some((path) =>
    /(\.github\/workflows\/|\.gitlab-ci\.yml$|azure-pipelines\.ya?ml$|circle\.yml$)/i.test(path)
  );
  const hasDockerfile = paths.some((path) => path === 'Dockerfile' || path.endsWith('/Dockerfile'));
  const hasLinting = paths.some((path) =>
    /((^|\/)\.eslintrc(\.[a-z]+)?$|(^|\/)eslint\.config\.(js|cjs|mjs|ts)$|(^|\/)\.prettierrc(\.[a-z]+)?$|(^|\/)prettier\.config\.(js|cjs|mjs|ts)$|(^|\/)biome\.json$|(^|\/)rome\.json$)/i.test(
      path
    )
  );
  const hasEnvExample = paths.some((path) => /((^|\/)\.env\.example$|(^|\/)\.env\.sample$|(^|\/)\.env\.template$)/i.test(path));

  const score = [hasTests, hasCI, hasDockerfile, hasLinting, hasEnvExample].filter(Boolean).length * 20;

  return { score, hasTests, hasCI, hasDockerfile, hasLinting, hasEnvExample };
}

const BINARY_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
  'ico',
  'woff',
  'woff2',
  'ttf',
  'eot',
  'pdf',
  'zip',
  'tar',
  'gz',
  'mp4',
  'mp3',
  'wav',
  'lock',
]);

const SECRET_PATTERNS = [
  {
    type: 'api-key',
    severity: 'high' as const,
    regex: /(?:api[_-]?key|apikey)\s*[:=]\s*['"`]([a-zA-Z0-9_\-]{20,})['"`]/i,
  },
  {
    type: 'password',
    severity: 'high' as const,
    regex: /(?:password|passwd|pwd)\s*[:=]\s*['"`](.{8,})['"`]/i,
  },
  { type: 'aws-key', severity: 'critical' as const, regex: /AKIA[0-9A-Z]{16}/ },
  {
    type: 'private-key',
    severity: 'critical' as const,
    regex: /-----BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY-----/,
  },
  {
    type: 'jwt-secret',
    severity: 'high' as const,
    regex: /(?:jwt[_-]?secret|secret[_-]?key)\s*[:=]\s*['"`](.+)['"`]/i,
  },
  {
    type: 'database-url',
    severity: 'high' as const,
    regex: /(?:mongodb|postgres|mysql|redis):\/\/.+:.+@/i,
  },
  { type: 'github-token', severity: 'critical' as const, regex: /ghp_[a-zA-Z0-9]{36}/ },
  { type: 'stripe-key', severity: 'critical' as const, regex: /sk_(live|test)_[a-zA-Z0-9]{24,}/ },
  { type: 'stripe-pub', severity: 'low' as const, regex: /pk_(live|test)_[a-zA-Z0-9]{24,}/ },
  { type: 'slack-token', severity: 'high' as const, regex: /xox[baprs]-[a-zA-Z0-9-]{10,}/ },
  {
    type: 'slack-webhook',
    severity: 'high' as const,
    regex: /https:\/\/hooks\.slack\.com\/services\/[A-Z0-9/]+/,
  },
  {
    type: 'bearer-token',
    severity: 'medium' as const,
    regex: /bearer\s+[a-zA-Z0-9\-._~+/]+=*/i,
  },
  {
    type: 'sendgrid-key',
    severity: 'critical' as const,
    regex: /SG\.[a-zA-Z0-9_-]{22,}\.[a-zA-Z0-9_-]{43,}/,
  },
  { type: 'twilio-sid', severity: 'high' as const, regex: /AC[a-f0-9]{32}/ },
  { type: 'npm-token', severity: 'high' as const, regex: /npm_[a-zA-Z0-9]{36}/ },
];

export function scanForSecrets(files: RepoFile[], fileContents: Record<string, string>): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  for (const file of files) {
    if (file.type !== 'blob') {
      continue;
    }

    const extension = file.path.split('.').pop()?.toLowerCase();
    if (extension && BINARY_EXTENSIONS.has(extension)) {
      continue;
    }

    if (file.path.endsWith('.env') || file.path.endsWith('.env.local')) {
      continue;
    }

    const content = fileContents[file.path];
    if (!content) {
      continue;
    }

    const lines = content.split('\n');
    for (const pattern of SECRET_PATTERNS) {
      lines.forEach((line, index) => {
        if (pattern.regex.test(line)) {
          issues.push({
            file: file.path,
            type: pattern.type,
            severity: pattern.severity,
            line: index + 1,
            description: `Potential ${pattern.type} found`,
          });
        }
      });
    }
  }

  return issues;
}

export function runAnalysis(params: {
  owner: string;
  repo: string;
  files: RepoFile[];
  packageJson: string | null;
  readme: string;
  fileContents: Record<string, string>;
}): AnalysisData {
  const { owner, repo, files, packageJson, readme, fileContents } = params;
  const { dependencies, devDependencies } = extractDependencies(packageJson);

  return {
    owner,
    repo,
    files,
    dependencies,
    devDependencies,
    detectedLanguages: detectLanguages(files),
    securityIssues: scanForSecrets(files, fileContents),
    readinessScore: scoreReadiness(files),
    readme,
    meta: {
      owner,
      repo,
      defaultBranch: 'HEAD',
      description: null,
      stars: 0,
      language: null,
    },
  };
}
