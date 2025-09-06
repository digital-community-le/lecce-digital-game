#!/usr/bin/env node

/**
 * Script per analizzare le performance dei test
 * Confronta test mirati vs test completi
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';

const STATS_FILE = 'test-performance-stats.json';

/**
 * Esegue test e misura le performance
 */
function measureTestPerformance(testType, command) {
  console.log(`\n📊 Measuring ${testType} performance...`);
  const startTime = Date.now();
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      env: { ...process.env, CI: 'true' }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Estrai statistiche dall'output di Vitest
    const testMatch = output.match(/Tests\s+(\d+)\s+passed/);
    const fileMatch = output.match(/Test Files\s+(\d+)\s+passed/);
    
    const stats = {
      type: testType,
      duration: duration,
      testsRun: testMatch ? parseInt(testMatch[1]) : 0,
      filesRun: fileMatch ? parseInt(fileMatch[1]) : 0,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    console.log(`✅ ${testType}: ${duration}ms, ${stats.testsRun} tests, ${stats.filesRun} files`);
    return stats;
    
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const stats = {
      type: testType,
      duration: duration,
      testsRun: 0,
      filesRun: 0,
      timestamp: new Date().toISOString(),
      success: false,
      error: error.message
    };
    
    console.log(`❌ ${testType}: Failed after ${duration}ms`);
    return stats;
  }
}

/**
 * Salva le statistiche su file
 */
function saveStats(stats) {
  let allStats = [];
  
  if (existsSync(STATS_FILE)) {
    try {
      allStats = JSON.parse(readFileSync(STATS_FILE, 'utf8'));
    } catch (error) {
      console.log('⚠️  Could not read existing stats, starting fresh');
    }
  }
  
  allStats.push(stats);
  
  // Mantieni solo le ultime 50 esecuzioni
  if (allStats.length > 50) {
    allStats = allStats.slice(-50);
  }
  
  writeFileSync(STATS_FILE, JSON.stringify(allStats, null, 2));
}

/**
 * Genera report delle performance
 */
function generateReport() {
  if (!existsSync(STATS_FILE)) {
    console.log('📊 No performance data available yet');
    return;
  }
  
  const allStats = JSON.parse(readFileSync(STATS_FILE, 'utf8'));
  const targetedStats = allStats.filter(s => s.type === 'targeted' && s.success);
  const fullStats = allStats.filter(s => s.type === 'full' && s.success);
  
  if (targetedStats.length === 0 || fullStats.length === 0) {
    console.log('📊 Insufficient data for comparison');
    return;
  }
  
  const avgTargeted = targetedStats.reduce((sum, s) => sum + s.duration, 0) / targetedStats.length;
  const avgFull = fullStats.reduce((sum, s) => sum + s.duration, 0) / fullStats.length;
  const speedup = avgFull / avgTargeted;
  
  console.log('\n📈 Performance Report:');
  console.log(`   Targeted tests avg: ${Math.round(avgTargeted)}ms`);
  console.log(`   Full tests avg: ${Math.round(avgFull)}ms`);
  console.log(`   Speedup: ${speedup.toFixed(2)}x faster`);
  console.log(`   Time saved: ${Math.round(avgFull - avgTargeted)}ms per run`);
  
  const recentTargeted = targetedStats.slice(-5);
  const recentFull = fullStats.slice(-5);
  
  if (recentTargeted.length > 0 && recentFull.length > 0) {
    const recentAvgTargeted = recentTargeted.reduce((sum, s) => sum + s.duration, 0) / recentTargeted.length;
    const recentAvgFull = recentFull.reduce((sum, s) => sum + s.duration, 0) / recentFull.length;
    const recentSpeedup = recentAvgFull / recentAvgTargeted;
    
    console.log('\n📊 Recent Performance (last 5 runs):');
    console.log(`   Targeted: ${Math.round(recentAvgTargeted)}ms`);
    console.log(`   Full: ${Math.round(recentAvgFull)}ms`);
    console.log(`   Speedup: ${recentSpeedup.toFixed(2)}x faster`);
  }
}

/**
 * Principale funzione
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--report')) {
    generateReport();
    return;
  }
  
  if (args.includes('--help')) {
    console.log(`
📊 Test Performance Analyzer

Usage:
  npm run test:perf                 # Run both targeted and full tests
  npm run test:perf -- --targeted   # Run only targeted tests
  npm run test:perf -- --full       # Run only full tests
  npm run test:perf -- --report     # Show performance report
  
The script measures execution time and saves statistics for comparison.
`);
    return;
  }
  
  console.log('🔬 Starting test performance analysis...');
  
  const runTargeted = !args.includes('--full');
  const runFull = !args.includes('--targeted');
  
  if (runTargeted) {
    const targetedStats = measureTestPerformance('targeted', 'npm run test:changed');
    saveStats(targetedStats);
  }
  
  if (runFull) {
    const fullStats = measureTestPerformance('full', 'npm run test:run');
    saveStats(fullStats);
  }
  
  generateReport();
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
