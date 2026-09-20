import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const c = { reset: '\x1b[0m', purple: '\x1b[38;5;183m', dim: '\x1b[38;5;110m', line: '\x1b[38;5;60m', white: '\x1b[97m' };
const paint = (color, text) => `${c[color]}${text}${c.reset}`;
const divider = (width = 74) => paint('line', '─'.repeat(width));
const date = (value) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));

function table(rows, columns) {
  const widths = columns.map((column, index) => Math.max(column.label.length, ...rows.map((row) => String(row[index]).length)) + 2);
  const header = columns.map((column, index) => String(column.label).padEnd(widths[index])).join('');
  const body = rows.map((row) => row.map((cell, index) => String(cell).padEnd(widths[index])).join('')).join('\n');
  return `${paint('dim', header)}\n${body || paint('dim', 'No data available.')}`;
}

export function terminalReport(data) {
  const { overview } = data;
  const range = overview.timeRange ? `${date(overview.timeRange.from)} – ${date(overview.timeRange.to)}` : 'No commits yet';
  const chart = data.commitsOverTime.slice(-10).map(({ month, commits }) => `${month.padEnd(9)} ${paint('purple', '█'.repeat(Math.min(commits, 28)))} ${commits}`).join('\n') || paint('dim', 'No commit history available.');
  return [
    '', paint('purple', 'Strata'), paint('dim', 'Git Repository Analyzer'), divider(),
    `${paint('purple', 'Repository Overview')}  ${paint('dim', data.repositoryPath)}`,
    `Branch              ${paint('white', data.branch)}`,
    `Total commits       ${overview.totalCommits}`,
    `Total contributors  ${overview.totalContributors}`,
    `Tracked files       ${overview.totalFiles}`,
    `Time range          ${range}`, '',
    paint('purple', 'Commits Over Time'), chart, '',
    paint('purple', 'Top Contributors'), table(data.contributors.map((x, i) => [i + 1, x.name, x.commits, `${x.percent}%`]), [{ label: '#' }, { label: 'Developer' }, { label: 'Commits' }, { label: '%' }]), '',
    paint('purple', 'Most Changed Files'), table(data.mostChangedFiles.map((x, i) => [i + 1, x.file, x.changes]), [{ label: '#' }, { label: 'File' }, { label: 'Changes' }]), '',
    paint('purple', 'Files Often Modified Together'), table(data.filesModifiedTogether.map((x, i) => [i + 1, x.files, x.commits]), [{ label: '#' }, { label: 'Files' }, { label: 'Common commits' }]), divider()
  ].join('\n');
}

export function saveJson(data, destination) {
  mkdirSync(destination, { recursive: true });
  const file = join(destination, 'strata-report.json');
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  return file;
}

export function saveHtml(data, destination) {
  mkdirSync(destination, { recursive: true });
  const file = join(destination, 'strata-report.html');
  const rows = (items, render) => items.map(render).join('') || '<tr><td colspan="3">No data available.</td></tr>';
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Strata Report</title><style>body{background:#090b13;color:#e8e9ff;font:15px ui-monospace,monospace;max-width:1000px;margin:48px auto;padding:0 24px}h1,h2{color:#c58aff}h1{margin-bottom:4px}.muted{color:#9da6d8}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px}.card{border:1px solid #31375d;border-radius:10px;padding:20px;margin:16px 0;background:#0e1220}table{width:100%;border-collapse:collapse}td,th{padding:9px;text-align:left;border-bottom:1px solid #252b48}th{color:#b6c1f3}</style></head><body><h1>Strata</h1><p class="muted">Git Repository Analysis · ${data.repositoryPath}</p><div class="grid"><section class="card">Commits<br><strong>${data.overview.totalCommits}</strong></section><section class="card">Contributors<br><strong>${data.overview.totalContributors}</strong></section><section class="card">Tracked files<br><strong>${data.overview.totalFiles}</strong></section></div><section class="card"><h2>Top Contributors</h2><table><tr><th>Developer</th><th>Commits</th><th>Share</th></tr>${rows(data.contributors, x => `<tr><td>${x.name}</td><td>${x.commits}</td><td>${x.percent}%</td></tr>`)}</table></section><section class="card"><h2>Most Changed Files</h2><table><tr><th>File</th><th>Changes</th></tr>${rows(data.mostChangedFiles, x => `<tr><td>${x.file}</td><td>${x.changes}</td></tr>`)}</table></section></body></html>`;
  writeFileSync(file, html);
  return file;
}
