import { git, isGitRepository } from './git.js';

const FIELD = '%H%x1f%an%x1f%ae%x1f%aI%x1e';

function parseCommits(raw) {
  return raw.split('\x1e').filter(Boolean).map((line) => {
    const [hash, author, email, date] = line.split('\x1f');
    return { hash, author, email, date };
  });
}

function tally(items, key) {
  const counts = new Map();
  for (const item of items) counts.set(item[key], (counts.get(item[key]) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function fileChanges(repositoryPath) {
  const output = git(repositoryPath, ['log', '--name-only', '--pretty=format:']);
  return output.split('\n').filter(Boolean);
}

function coChanges(repositoryPath) {
  const raw = git(repositoryPath, ['log', '--format=%x1e', '--name-only']);
  const groups = raw.split('\x1e').map((group) => group.split('\n').filter(Boolean));
  const pairs = new Map();
  for (const files of groups) {
    const unique = [...new Set(files)].sort();
    for (let i = 0; i < unique.length; i++) for (let j = i + 1; j < unique.length; j++) {
      const pair = `${unique[i]} + ${unique[j]}`;
      pairs.set(pair, (pairs.get(pair) || 0) + 1);
    }
  }
  return [...pairs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([files, commits]) => ({ files, commits }));
}

export function analyzeRepository(repositoryPath) {
  if (!isGitRepository(repositoryPath)) throw new Error(`Not a Git repository: ${repositoryPath}`);
  const commitOutput = git(repositoryPath, ['log', `--pretty=format:${FIELD}`]);
  const commits = parseCommits(commitOutput);
  const branch = git(repositoryPath, ['branch', '--show-current']) || 'detached HEAD';
  const files = fileChanges(repositoryPath);
  const contributors = tally(commits, 'author').slice(0, 5).map(([name, count]) => ({
    name, commits: count, percent: commits.length ? Math.round((count / commits.length) * 100) : 0
  }));
  const changes = tally(files.map((file) => ({ file })), 'file').slice(0, 5)
    .map(([file, count]) => ({ file, changes: count }));
  const dates = commits.map((commit) => new Date(commit.date)).filter((date) => !Number.isNaN(date));
  const monthly = new Map();
  for (const date of dates) {
    const key = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    monthly.set(key, (monthly.get(key) || 0) + 1);
  }
  return {
    generatedAt: new Date().toISOString(), repositoryPath, branch,
    overview: {
      totalCommits: commits.length,
      totalContributors: new Set(commits.map((commit) => commit.email)).size,
      totalFiles: new Set(files).size,
      timeRange: dates.length ? {
        from: new Date(Math.min(...dates)).toISOString(),
        to: new Date(Math.max(...dates)).toISOString()
      } : null
    },
    contributors, mostChangedFiles: changes, filesModifiedTogether: coChanges(repositoryPath),
    commitsOverTime: [...monthly.entries()].map(([month, commits]) => ({ month, commits }))
  };
}
