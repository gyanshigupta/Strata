# Strata

Strata is a Node.js command-line Git repository analyzer. It transforms local commit history into a clear terminal report with contributor, file-change, and co-change insights.

## Features

- Repository overview: branch, commits, contributors, files, and time range
- Commit-volume chart grouped by month
- Top contributors and most changed files
- Files frequently modified together
- JSON and self-contained HTML exports
- Interactive menu or direct commands

## Requirements

Node.js 18 or later and Git must be installed.

## Run

```bash
npm start
node src/cli.js analyze /path/to/repository
node src/cli.js export-json /path/to/repository
node src/cli.js export-html /path/to/repository
```

Exports are saved to `reports/` in the current directory. Run `node src/cli.js help` to see the command reference.
