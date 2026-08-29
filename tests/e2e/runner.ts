/**
 * KRISHI SETU - Master E2E Test Suite Runner
 * Problem Statement ID: 26032 | Smart India Hackathon 2026
 *
 * Usage:
 *   npx tsx tests/e2e/runner.ts
 *   npx tsx tests/e2e/runner.ts --tier=1
 *   npx tsx tests/e2e/runner.ts --tier=2
 *   npx tsx tests/e2e/runner.ts --filter=TC-T1-R1-01
 */

import { runTier1FeatureCoverage } from './tiers/tier1_features.test';
import { runTier2BoundaryCases } from './tiers/tier2_boundaries.test';
import { runTier3CrossFeature } from './tiers/tier3_pairwise.test';
import { runTier4RealWorldWorkflows } from './tiers/tier4_workflows.test';
import { printSummaryTable } from './helpers/reporter';
import { SuiteReport } from './helpers/types';

function parseArgs(): { tier: string; filter?: string; help: boolean } {
  const args = process.argv.slice(2);
  let tier = 'all';
  let filter: string | undefined = undefined;
  let help = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      help = true;
    } else if (arg.startsWith('--tier=')) {
      tier = arg.split('=')[1].toLowerCase();
    } else if (arg === '-t' && i + 1 < args.length) {
      tier = args[++i].toLowerCase();
    } else if (arg.startsWith('--filter=')) {
      filter = arg.split('=')[1];
    } else if (arg === '-f' && i + 1 < args.length) {
      filter = args[++i];
    }
  }

  return { tier, filter, help };
}

function printUsage() {
  console.log(`
🌾 KRISHI SETU - E2E Test Runner CLI Options:
  --tier=1,2,3,4,all   Specify test tier to execute (default: all)
  --filter=<string>    Filter tests matching ID or title substring
  --help, -h           Show this help message

Examples:
  npx tsx tests/e2e/runner.ts
  npx tsx tests/e2e/runner.ts --tier=1
  npx tsx tests/e2e/runner.ts --filter=TC-T1-R1
`);
}

export async function main() {
  const { tier, filter, help } = parseArgs();

  if (help) {
    printUsage();
    process.exit(0);
  }

  const BOLD = '\x1b[1m';
  const CYAN = '\x1b[36m';
  const WHITE = '\x1b[37m';
  const GREEN = '\x1b[32m';
  const RESET = '\x1b[0m';

  console.log(`\n${BOLD}${GREEN}================================================================================${RESET}`);
  console.log(`${BOLD}${WHITE}       🌾 KRISHI SETU - OPAQUE-BOX END-TO-END TEST SUITE RUNNER       ${RESET}`);
  console.log(`${BOLD}${CYAN}       SIH 2026 Problem Statement ID: 26032 | Target: http://localhost:3000     ${RESET}`);
  console.log(`${BOLD}${GREEN}================================================================================${RESET}`);
  console.log(`Mode: Tier Selection [${tier.toUpperCase()}] | Filter: [${filter || 'NONE'}]\n`);

  const startTime = Date.now();
  const reports: SuiteReport[] = [];

  try {
    if (tier === 'all' || tier === '1') {
      reports.push(await runTier1FeatureCoverage(filter));
    }
    if (tier === 'all' || tier === '2') {
      reports.push(await runTier2BoundaryCases(filter));
    }
    if (tier === 'all' || tier === '3') {
      reports.push(await runTier3CrossFeature(filter));
    }
    if (tier === 'all' || tier === '4') {
      reports.push(await runTier4RealWorldWorkflows(filter));
    }

    const totalDurationSec = ((Date.now() - startTime) / 1000).toFixed(2);
    printSummaryTable(reports, totalDurationSec);

    const hasFailures = reports.some(r => r.failed > 0);
    const totalTests = reports.reduce((acc, r) => acc + r.total, 0);

    if (hasFailures) {
      console.error(`\n❌ TEST SUITE FAILED with errors. Exit Code: 1\n`);
      process.exit(1);
    } else {
      console.log(`\n✅ ALL ${totalTests} TEST CASES COMPLETED SUCCESSFULLY (100% Pass Rate). Exit Code: 0\n`);
      process.exit(0);
    }
  } catch (err: any) {
    console.error('\n💥 FATAL TEST RUNNER EXCEPTION:', err);
    process.exit(1);
  }
}

if (require.main === module || !module.parent) {
  main();
}
