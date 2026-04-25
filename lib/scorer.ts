import { CommitActivity, ContributorData, RepoStructure, RepoQualityScores, FinalScore } from './types';

function calculateActivity(activity: CommitActivity): number {
  // Normalize commit frequency (0-100 scale)
  // Let's say 50 commits in 30 days is a perfect score for frequency (scale is arbitrary but logical)
  let score = Math.min((activity.commitsLast30Days / 50) * 100, 100);

  // Penalize inactivity (>30 days no commits)
  if (activity.lastCommitDate) {
    const lastCommit = new Date(activity.lastCommitDate);
    const daysSinceLastCommit = (new Date().getTime() - lastCommit.getTime()) / (1000 * 3600 * 24);
    if (daysSinceLastCommit > 30) {
      // 1 point penalty per day inactive past 30 days
      score -= (daysSinceLastCommit - 30);
    }
  } else {
    score = 0;
  }
  return Math.max(Math.round(score), 0);
}

function calculateMaintainability(contributors: ContributorData): number {
  // Higher score for distributed contributions
  let score = 50; // Base score
  
  if (contributors.totalContributors > 1) {
    score += Math.min(contributors.totalContributors * 5, 50); // Up to +50 points for multiple contributors
  }
  
  if (contributors.topContributors.length > 0) {
     const top1 = contributors.topContributors[0].contributions;
     const totalTop10 = contributors.topContributors.reduce((sum, c) => sum + c.contributions, 0);
     if (totalTop10 > 0) {
       const top1Percentage = top1 / totalTop10;
       // Penalize single-contributor dominance if they do > 80% of top 10's work
       if (top1Percentage > 0.8 && contributors.totalContributors > 1) {
         score -= 20;
       }
     }
  }
  return Math.max(Math.min(Math.round(score), 100), 0);
}

function calculateReliability(structure: RepoStructure): number {
  // Deterministic weighted scoring across test automation and guardrails.
  let score = 0;
  if (structure.hasTests) score += 45;
  if (structure.hasCi) score += 25;
  if (structure.hasLint) score += 10;
  if (structure.hasTypecheck) score += 10;
  if (structure.hasDependencyLock) score += 5;
  if (structure.hasSecurityPolicy) score += 5;
  return score;
}

function calculateDocumentation(structure: RepoStructure): number {
  // Binary scoring, can be expanded if we check README size or sections
  let score = 0;
  if (structure.hasReadme) score += 100;
  return score;
}

function calculateStructure(structure: RepoStructure): number {
  let score = 0;
  if (structure.hasReadme) score += 25;
  if (structure.hasLicense) score += 25;
  if (structure.hasTests) score += 25;
  if (structure.hasCi) score += 25;
  return score;
}

export function generateScore(
  activity: CommitActivity,
  contributors: ContributorData,
  structure: RepoStructure
): FinalScore {
  const quality: RepoQualityScores = {
    activity: calculateActivity(activity),
    maintainability: calculateMaintainability(contributors),
    reliability: calculateReliability(structure),
    documentation: calculateDocumentation(structure),
    structure: calculateStructure(structure),
  };

  // Formula from FRD:
  // final_score = (activity * 0.30) + (reliability * 0.25) + (maintainability * 0.20) + (documentation * 0.15) + (structure * 0.10)
  const finalScore = (quality.activity * 0.30) +
                     (quality.reliability * 0.25) +
                     (quality.maintainability * 0.20) +
                     (quality.documentation * 0.15) +
                     (quality.structure * 0.10);

  return {
    final: Math.round(finalScore),
    breakdown: quality,
  };
}
