import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { extractDependencies } from '@/lib/analyzer';
import { fetchFile, fetchTree, parseGitHubUrl } from '@/lib/github';
import { checkRateLimit } from '@/lib/ratelimit';
import { GraphEdge, GraphNode, GraphResponse } from '@/types';

const RequestSchema = z.object({
  repoUrl: z
    .string()
    .url()
    .refine((url) => {
      try {
        const parsed = new URL(url);
        const segments = parsed.pathname.split('/').filter(Boolean);
        return parsed.hostname === 'github.com' && segments.length === 2 && !url.endsWith('/');
      } catch {
        return false;
      }
    }, 'Invalid GitHub URL'),
});

const ALWAYS_CONNECTED = ['app', 'src', 'pages'];
const SOMETIMES_CONNECTED = ['lib', 'utils', 'helpers', 'services'];

function layoutNodes(ids: string[], startX: number, startY: number, cols: number): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};

  ids.forEach((id, index) => {
    positions[id] = {
      x: startX + (index % cols) * 220,
      y: startY + Math.floor(index / cols) * 120,
    };
  });

  return positions;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rateLimit = await checkRateLimit(req);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again in 1 hour.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });
  }

  try {
    const { owner, repo } = parseGitHubUrl(parsed.data.repoUrl);
    const [files, packageJsonContent] = await Promise.all([
      fetchTree(owner, repo),
      fetchFile(owner, repo, 'package.json'),
    ]);

    const { dependencies } = extractDependencies(packageJsonContent);

    const topDirs = [
      ...new Set(
        files
          .filter((file) => file.type === 'tree' && !file.path.includes('/'))
          .map((file) => file.path)
          .filter((path) => !['node_modules', '.git', '.next', 'dist', 'build'].includes(path))
      ),
    ].slice(0, 12);

    const topDeps = Object.keys(dependencies).slice(0, 10);

    const dirPositions = layoutNodes(topDirs, 0, 0, 4);
    const depPositions = layoutNodes(topDeps, 0, 320, 5);

    const nodes: GraphNode[] = [
      ...topDirs.map((dir) => ({
        id: `dir-${dir}`,
        data: { label: `/${dir}`, type: 'directory' as const },
        position: dirPositions[dir],
      })),
      ...topDeps.map((dep) => ({
        id: `dep-${dep}`,
        data: { label: dep, type: 'dependency' as const },
        position: depPositions[dep],
      })),
    ];

    const edges: GraphEdge[] = [];

    for (const dir of topDirs) {
      const dirName = dir.replace(/^\//, '');

      if (ALWAYS_CONNECTED.includes(dirName)) {
        topDeps.forEach((dep) => {
          edges.push({
            id: `${dir}-${dep}`,
            source: `dir-${dir}`,
            target: `dep-${dep}`,
            animated: true,
          });
        });
      } else if (SOMETIMES_CONNECTED.includes(dirName)) {
        topDeps.slice(0, 5).forEach((dep) => {
          edges.push({
            id: `${dir}-${dep}`,
            source: `dir-${dir}`,
            target: `dep-${dep}`,
            animated: false,
          });
        });
      }
    }

    const response: GraphResponse = { nodes, edges };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    console.error('[/api/graph]', detail);

    return NextResponse.json({ error: 'Graph generation failed', detail }, { status: 500 });
  }
}
