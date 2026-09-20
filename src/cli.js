#!/usr/bin/env node
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { resolve } from 'node:path';
import { analyzeRepository } from './analyzer.js';
import { saveHtml, saveJson, terminalReport } from './report.js';

const args = process.argv.slice(2);
const usage = `Usage: strata [command] [repository-path]\n\nCommands:\n  analyze [path]       Show an analysis report\n  export-json [path]   Save a JSON report to ./reports\n  export-html [path]   Save an HTML report to ./reports\n  help                 Show this help`;
const target = resolve(args.find((arg) => !['analyze', 'export-json', 'export-html', 'help'].includes(arg)) || '.');

function run(command) {
  if (command === 'help') return console.log(usage);
  const data = analyzeRepository(target);
  if (command === 'export-json') return console.log(`Saved JSON report: ${saveJson(data, resolve('reports'))}`);
  if (command === 'export-html') return console.log(`Saved HTML report: ${saveHtml(data, resolve('reports'))}`);
  console.log(terminalReport(data));
}

async function menu() {
  const rl = createInterface({ input, output });
  console.log('\nStrata — Git Repository Analyzer\nUnderstand your code. From the ground up.');
  console.log('\n1. Analyze repository\n2. Export JSON\n3. Export HTML\n4. Exit');
  const choice = await rl.question('\nstrata> ');
  rl.close();
  run({ '1': 'analyze', '2': 'export-json', '3': 'export-html', '4': 'help' }[choice] || 'help');
}

try { args.length ? run(args[0]) : await menu(); } catch (error) { console.error(`\nStrata error: ${error.message}`); process.exitCode = 1; }
