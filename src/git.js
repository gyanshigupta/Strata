import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

export function git(repositoryPath, args) {
  try {
    return execFileSync('git', ['-C', resolve(repositoryPath), ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim();
  } catch (error) {
    const detail = error.stderr?.toString().trim();
    throw new Error(detail || 'Unable to read Git data from this directory.');
  }
}

export function isGitRepository(repositoryPath) {
  try {
    return git(repositoryPath, ['rev-parse', '--is-inside-work-tree']) === 'true';
  } catch {
    return false;
  }
}
