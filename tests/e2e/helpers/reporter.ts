/**
 * KRISHI SETU - ANSI Test Reporter
 * Formatted tables, status badges, and execution statistics for CLI output.
 */

import { SuiteReport, TestResult } from './types';

// ANSI escape codes for formatting
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const WHITE = '\x1b[37m';
const BG_GREEN = '\x1b[42m';
const BG_RED = '\x1b[41m';

export function printSuiteHeader(suiteName: string) {
  console.log(`\n${BOLD}${CYAN}▶ RUNNING SUITE: ${WHITE}${suiteName}${RESET}`);
  console.log(`${DIM}--------------------------------------------------------------------------------${RESET}`);
}

export function printTestProgress(result: TestResult) {
  const icon = result.passed ? `${GREEN}✔ PASS${RESET}` : `${RED}✖ FAIL${RESET}`;
  const duration = `${DIM}(${result.durationMs}ms)${RESET}`;
  console.log(`  ${icon} ${BOLD}${result.id}${RESET}: ${result.name} ${duration}`);
  if (!result.passed && result.error) {
    console.log(`    ${RED}↳ Error: ${result.error}${RESET}`);
  }
}

export function printSummaryTable(reports: SuiteReport[], totalDurationSec: string) {
  console.log(`\n\n${BOLD}${CYAN}================================================================================${RESET}`);
  console.log(`${BOLD}${WHITE}                   🌾 KRISHI SETU E2E TEST EXECUTION SUMMARY                    ${RESET}`);
  console.log(`${BOLD}${CYAN}================================================================================${RESET}\n`);

  const colTierWidth = 36;
  const colTotalWidth = 8;
  const colPassWidth = 8;
  const colFailWidth = 8;
  const colTimeWidth = 12;

  // Header row
  const header =
    `┌${'─'.repeat(colTierWidth)}┬${'─'.repeat(colTotalWidth)}┬${'─'.repeat(colPassWidth)}┬${'─'.repeat(colFailWidth)}┬${'─'.repeat(colTimeWidth)}┐\n` +
    `│ ${BOLD}${'Test Tier / Suite'.padEnd(colTierWidth - 2)}${RESET} │ ${BOLD}${'Total'.padEnd(colTotalWidth - 2)}${RESET} │ ${BOLD}${'Pass'.padEnd(colPassWidth - 2)}${RESET} │ ${BOLD}${'Fail'.padEnd(colFailWidth - 2)}${RESET} │ ${BOLD}${'Time (s)'.padEnd(colTimeWidth - 2)}${RESET} │\n` +
    `├${'─'.repeat(colTierWidth)}┼${'─'.repeat(colTotalWidth)}┼${'─'.repeat(colPassWidth)}┼${'─'.repeat(colFailWidth)}┼${'─'.repeat(colTimeWidth)}┤`;

  console.log(header);

  let grandTotal = 0;
  let grandPassed = 0;
  let grandFailed = 0;

  for (const rep of reports) {
    grandTotal += rep.total;
    grandPassed += rep.passed;
    grandFailed += rep.failed;

    const tierName = rep.tierName.padEnd(colTierWidth - 2);
    const totalStr = String(rep.total).padEnd(colTotalWidth - 2);
    const passStr = `${GREEN}${String(rep.passed).padEnd(colPassWidth - 2)}${RESET}`;
    const failStr = rep.failed > 0
      ? `${RED}${BOLD}${String(rep.failed).padEnd(colFailWidth - 2)}${RESET}`
      : `${DIM}0${RESET}       `;
    const timeStr = `${(rep.durationMs / 1000).toFixed(2)}s`.padEnd(colTimeWidth - 2);

    console.log(`│ ${tierName} │ ${totalStr} │ ${passStr} │ ${failStr} │ ${timeStr} │`);
  }

  // Footer row
  const footer =
    `├${'─'.repeat(colTierWidth)}┼${'─'.repeat(colTotalWidth)}┼${'─'.repeat(colPassWidth)}┼${'─'.repeat(colFailWidth)}┼${'─'.repeat(colTimeWidth)}┤\n` +
    `│ ${BOLD}${'TOTAL'.padEnd(colTierWidth - 2)}${RESET} │ ${BOLD}${String(grandTotal).padEnd(colTotalWidth - 2)}${RESET} │ ${GREEN}${BOLD}${String(grandPassed).padEnd(colPassWidth - 2)}${RESET} │ ${grandFailed > 0 ? RED + BOLD : ''}${String(grandFailed).padEnd(colFailWidth - 2)}${RESET} │ ${BOLD}${totalDurationSec}s`.padEnd(colTimeWidth + 7) + ` │\n` +
    `└${'─'.repeat(colTierWidth)}┴${'─'.repeat(colTotalWidth)}┴${'─'.repeat(colPassWidth)}┴${'─'.repeat(colFailWidth)}┴${'─'.repeat(colTimeWidth)}┘`;

  console.log(footer);

  // Overall verdict card
  if (grandFailed === 0) {
    console.log(`\n${BG_GREEN}${WHITE}${BOLD}  ✔ ALL TESTS PASSED (100% Pass Rate across ${grandTotal} test cases)  ${RESET}\n`);
  } else {
    console.log(`\n${BG_RED}${WHITE}${BOLD}  ✖ SOME TESTS FAILED (${grandFailed} failed out of ${grandTotal} test cases)  ${RESET}\n`);
  }
}
