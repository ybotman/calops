// run-actual-import.js
// Execute the BTC import in non-dry-run mode for a single day
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Configuration
const config = {
  // Date to import (default to today + 90 days if not specified)
  testDate: process.env.TEST_DATE || null,
  
  // Turn off dry run mode
  dryRun: false,
  
  // Output directory for logs
  outputDir: path.join(rootDir, 'import-results'),
  
  // Main import script
  importScript: path.join(rootDir, 'btc-import.js'),
  
  // Authentication token (REQUIRED for event creation)
  authToken: process.env.AUTH_TOKEN || null
};

// Create output directory if it doesn't exist
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Get test date (today + 90 days if not specified)
function getTestDate() {
  if (config.testDate) {
    return config.testDate;
  }
  
  // Default to today + 90 days
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + 90);
  
  return futureDate.toISOString().split('T')[0];
}

/**
 * Checks if authentication token is available
 */
function checkAuthentication() {
  if (!config.authToken) {
    console.log('\n❌ ERROR: Authentication token is required for actual imports.');
    console.log('Please provide an authentication token via the AUTH_TOKEN environment variable:');
    console.log('\nExample:');
    console.log('  export AUTH_TOKEN=your_token_here');
    console.log('  # OR directly with the command:');
    console.log('  AUTH_TOKEN=your_token_here node scripts/btc-import/run-actual-import.js');
    console.log('\n⚠️ The previous run failed with authentication errors (401).');
    console.log('Without a valid token, events cannot be created in TangoTiempo.');
    return false;
  }
  
  console.log('✅ Authentication token is available.');
  console.log('Note: Token validity will be verified during the import process.');
  return true;
}

/**
 * Run the BTC import in non-dry-run mode
 */
async function runActualImport() {
  const testDate = getTestDate();
  
  console.log('========================================================');
  console.log(' BTC Actual Import - PRODUCTION MODE (NON-DRY-RUN)');
  console.log('========================================================');
  console.log(`Date: ${testDate}`);
  console.log(`Output directory: ${config.outputDir}`);
  console.log('Dry run: FALSE (CAUTION: ACTUAL DATA WILL BE CREATED)');
  console.log('--------------------------------------------------------');
  
  // Verify authentication
  if (!checkAuthentication()) {
    process.exit(1);
  }
  
  // Confirmation dialog
  if (process.argv.indexOf('--confirm') === -1) {
    console.log('\n❗ WARNING: This will DELETE existing events and CREATE new ones.');
    console.log('This action cannot be easily undone. Please confirm to proceed.');
    console.log('To bypass this confirmation, rerun with the --confirm flag.\n');
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    try {
      const answer = await new Promise((resolve) => {
        readline.question('Type "CONFIRM" to proceed with the actual import: ', resolve);
      });
      
      if (answer.trim().toUpperCase() !== 'CONFIRM') {
        console.log('Import cancelled by user.');
        process.exit(0);
      }
    } finally {
      readline.close();
    }
  } else {
    console.log('Running with --confirm flag. Bypassing confirmation dialog.');
  }
  
  // Execute the import script with non-dry-run mode
  const env = {
    ...process.env,
    DRY_RUN: 'false',
    TEST_DATE: testDate,
    OUTPUT_DIR: config.outputDir,
    AUTH_TOKEN: config.authToken
  };
  
  // Run the import script as a child process
  const importProcess = spawn('node', [config.importScript], {
    env,
    stdio: 'inherit',
    shell: true
  });
  
  // Handle process completion
  importProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ Actual import completed successfully.');
      console.log(`Results available in: ${config.outputDir}`);
      
      // Read the assessment file to check if we reached the Go/No-Go threshold
      const assessmentFile = path.join(config.outputDir, `go-nogo-assessment-${testDate}.json`);
      if (fs.existsSync(assessmentFile)) {
        try {
          const assessment = JSON.parse(fs.readFileSync(assessmentFile, 'utf8'));
          
          console.log('\nFinal Assessment:');
          console.log(`Status: ${assessment.canProceed ? 'GO ✅' : 'NO-GO ❌'}`);
          
          console.log('\nMetrics:');
          console.log(`- Entity Resolution Rate: ${(assessment.metrics.entityResolutionRate * 100).toFixed(1)}% (Threshold: ${(assessment.thresholds.minimumResolutionRate * 100).toFixed(1)}%)`);
          console.log(`- Validation Rate: ${(assessment.metrics.validationRate * 100).toFixed(1)}% (Threshold: ${(assessment.thresholds.minimumValidationRate * 100).toFixed(1)}%)`);
          console.log(`- Overall Success Rate: ${(assessment.metrics.overallSuccessRate * 100).toFixed(1)}% (Threshold: ${(assessment.thresholds.minimumOverallRate * 100).toFixed(1)}%)`);
          
          if (assessment.recommendations && assessment.recommendations.length > 0) {
            console.log('\nRecommendations:');
            assessment.recommendations.forEach((rec, i) => {
              console.log(`${i+1}. ${rec}`);
            });
          }
          
          if (assessment.canProceed) {
            console.log('\n✅ Next steps:');
            console.log('1. Review imported events in TangoTiempo to verify data quality');
            console.log('2. Prepare for Phase 3: Historical data cleanup');
            console.log('3. Update PMR documentation with results');
          } else {
            console.log('\n❌ Import did not meet Go/No-Go criteria. Please address issues before proceeding.');
          }
        } catch (error) {
          console.error('Error reading assessment file:', error.message);
        }
      }
    } else {
      console.error(`\n❌ Import failed with exit code ${code}.`);
      console.log(`Check logs in: ${config.outputDir}`);
      console.log('\nPossible issues:');
      console.log('1. Authentication token is invalid or expired');
      console.log('2. API server is not running or reachable');
      console.log('3. Permission issues with event creation');
      console.log('\nFor detailed error information, check the error log files in the output directory.');
    }
  });
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runActualImport().catch(err => {
    console.error('Execution error:', err);
    process.exit(1);
  });
}

export { runActualImport };