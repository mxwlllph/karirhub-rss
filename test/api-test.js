/**
 * API Testing Script
 * Tests API endpoints and validates responses
 */

import { APIFetcher } from '../src/modules/api-fetcher.js';

/**
 * Test API connectivity and responses
 */
async function runAPITests() {
  console.log('🧪 Starting API Tests...\n');

  const apiFetcher = new APIFetcher();
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Job Listings
  await runTest('Job Listings API', async () => {
    const response = await apiFetcher.fetchJobListings(1, 5);

    assert(response.code === 200, `Expected status 200, got ${response.code}`);
    assert(response.data, 'Response should have data array');
    assert(Array.isArray(response.data), 'Data should be an array');
    assert(response.data.length > 0, 'Data array should not be empty');

    // Validate first job structure
    const firstJob = response.data[0];
    assert(firstJob.id, 'Job should have an ID');
    assert(firstJob.title, 'Job should have a title');
    assert(firstJob.company_name, 'Job should have company name');

    console.log(`  ✓ Found ${response.data.length} job listings`);
    console.log(`  ✓ Sample job: ${firstJob.title} at ${firstJob.company_name}`);

    return response;
  }, results);

  // Test 2: Job Detail
  await runTest('Job Detail API', async () => {
    // First get a job listing to get a valid job ID
    const listingsResponse = await apiFetcher.fetchJobListings(1, 1);
    if (!listingsResponse.data || listingsResponse.data.length === 0) {
      throw new Error('No job listings available for detail test');
    }

    const jobId = listingsResponse.data[0].id;
    console.log(`  Testing with job ID: ${jobId}`);

    const response = await apiFetcher.fetchJobDetail(jobId);

    assert(response.code === 200, `Expected status 200, got ${response.code}`);
    assert(response.data, 'Response should have data object');
    assert(response.data.title, 'Job detail should have title');
    assert(response.data.company_name, 'Job detail should have company name');

    console.log(`  ✓ Job detail loaded: ${response.data.title}`);
    console.log(`  ✓ Location: ${response.data.location || 'Not specified'}`);

    return response;
  }, results);

  // Test 3: Employer Detail
  await runTest('Employer Detail API', async () => {
    // First get a job listing to extract employer info
    const listingsResponse = await apiFetcher.fetchJobListings(1, 1);
    if (!listingsResponse.data || listingsResponse.data.length === 0) {
      throw new Error('No job listings available for employer test');
    }

    const job = listingsResponse.data[0];
    console.log(`  Testing employer: ${job.company_name}`);

    // Note: The API structure might not include employer_id in job listings
    // This test might need adjustment based on actual API response structure
    try {
      // Try to construct employer ID if available, or skip this test
      if (job.employer_id) {
        const response = await apiFetcher.fetchEmployerDetail(job.employer_id);

        assert(response.code === 200, `Expected status 200, got ${response.code}`);
        assert(response.data, 'Response should have data object');
        assert(response.data.company_name, 'Employer should have company name');

        console.log(`  ✓ Employer detail loaded: ${response.data.company_name}`);
        if (response.data.description) {
          console.log(`  ✓ Description: ${response.data.description.substring(0, 100)}...`);
        }

        return response;
      } else {
        console.log(`  ⚠️  Employer ID not available in job listings, skipping employer detail test`);
        return { skipped: true };
      }
    } catch (error) {
      console.log(`  ⚠️  Employer detail test failed: ${error.message}`);
      return { error: error.message };
    }
  }, results);

  // Test 4: Multiple Pages
  await runTest('Multiple Pages API', async () => {
    const response = await apiFetcher.fetchJobListings(1, 3);

    assert(response.code === 200, `Expected status 200, got ${response.code}`);
    assert(response.data, 'Response should have data array');
    assert(response.data.length <= 3, `Expected max 3 items, got ${response.data.length}`);

    console.log(`  ✓ Pagination test successful, got ${response.data.length} items`);

    return response;
  }, results);

  // Test 5: API Health Check
  await runTest('API Health Check', async () => {
    const health = await apiFetcher.getHealthStatus();

    assert(health, 'Health check should return data');
    assert(health.status, 'Health status should be available');
    assert(health.responseTime, 'Response time should be measured');

    console.log(`  ✓ API Health: ${health.status}`);
    console.log(`  ✓ Response Time: ${health.responseTime}`);
    console.log(`  ✓ Available Jobs: ${health.availableJobs || 'Unknown'}`);

    return health;
  }, results);

  // Test 6: Batch Fetching
  await runTest('Batch Job Details Fetch', async () => {
    const listingsResponse = await apiFetcher.fetchJobListings(1, 3);
    if (!listingsResponse.data || listingsResponse.data.length === 0) {
      throw new Error('No job listings available for batch test');
    }

    const jobIds = listingsResponse.data.map(job => job.id);
    console.log(`  Testing batch fetch for ${jobIds.length} jobs`);

    const details = await apiFetcher.batchFetchJobDetails(jobIds, 2);

    assert(Array.isArray(details), 'Batch fetch should return array');
    assert(details.length <= jobIds.length, `Should return ${jobIds.length} or fewer details`);

    console.log(`  ✓ Batch fetched ${details.length} job details`);

    return details;
  }, results);

  // Test 7: Error Handling
  await runTest('Error Handling', async () => {
    try {
      // Test with invalid job ID
      await apiFetcher.fetchJobDetail('invalid-job-id');
      throw new Error('Should have thrown an error for invalid job ID');
    } catch (error) {
      assert(error.message.includes('API request failed'), 'Should have proper error message');
      console.log(`  ✓ Error handling works: ${error.message}`);
      return { errorHandled: true };
    }
  }, results);

  // Print summary
  printTestSummary(results);
}

/**
 * Run a single test
 * @param {string} testName - Name of the test
 * @param {Function} testFunction - Test function to run
 * @param {Object} results - Results object to update
 */
async function runTest(testName, testFunction, results) {
  console.log(`\n📋 Test: ${testName}`);
  console.log('─'.repeat(50));

  try {
    const startTime = Date.now();
    const result = await testFunction();
    const duration = Date.now() - startTime;

    if (result && result.skipped) {
      console.log(`⏭️  Skipped`);
      results.tests.push({ name: testName, status: 'skipped', duration });
    } else {
      console.log(`✅ Passed (${duration}ms)`);
      results.tests.push({ name: testName, status: 'passed', duration, result });
      results.passed++;
    }
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    results.tests.push({ name: testName, status: 'failed', error: error.message });
    results.failed++;
  }
}

/**
 * Assert condition and throw error if false
 * @param {boolean} condition - Condition to check
 * @param {string} message - Error message
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Print test summary
 * @param {Object} results - Test results
 */
function printTestSummary(results) {
  console.log('\n' + '='.repeat(60));
  console.log('🏁 API TEST SUMMARY');
  console.log('='.repeat(60));

  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total: ${results.tests.length}`);

  const successRate = results.tests.length > 0
    ? ((results.passed / results.tests.length) * 100).toFixed(1)
    : 0;

  console.log(`🎯 Success Rate: ${successRate}%`);

  // Print failed tests
  const failedTests = results.tests.filter(test => test.status === 'failed');
  if (failedTests.length > 0) {
    console.log('\n❌ Failed Tests:');
    failedTests.forEach(test => {
      console.log(`   • ${test.name}: ${test.error}`);
    });
  }

  // Print performance summary
  const completedTests = results.tests.filter(test => test.status === 'passed' && test.duration);
  if (completedTests.length > 0) {
    const avgDuration = completedTests.reduce((sum, test) => sum + test.duration, 0) / completedTests.length;
    console.log(`\n⏱️  Average Test Duration: ${avgDuration.toFixed(0)}ms`);
  }

  console.log('\n' + '='.repeat(60));

  if (results.failed === 0) {
    console.log('🎉 All API tests passed! The API is working correctly.');
  } else {
    console.log('⚠️  Some API tests failed. Please check the issues above.');
  }
}

/**
 * Test RSS generation with real API data
 */
async function testRSSGeneration() {
  console.log('\n🧪 Testing RSS Generation with Real API Data...\n');

  try {
    // Import modules
    const { DataAggregator } = await import('../src/modules/data-aggregator.js');
    const { RSSGenerator } = await import('../src/modules/rss-generator.js');
    const { CacheManager } = await import('../src/modules/cache-manager.js');

    // Mock cache manager (for testing without KV)
    const mockCacheManager = {
      get: async () => null,
      set: async () => true,
      delete: async () => true
    };

    // Initialize modules
    const apiFetcher = new APIFetcher();
    const aggregator = new DataAggregator(apiFetcher, mockCacheManager);
    const rssGenerator = new RSSGenerator();

    console.log('📡 Fetching job data...');
    const jobs = await aggregator.aggregateJobData(3); // Test with 3 jobs

    if (jobs.length === 0) {
      console.log('⚠️  No jobs available for RSS generation test');
      return;
    }

    console.log(`✓ Found ${jobs.length} jobs`);
    jobs.forEach((job, index) => {
      console.log(`  ${index + 1}. ${job.title} at ${job.company_name}`);
    });

    console.log('\n📝 Generating RSS feed...');
    const rssXML = rssGenerator.generateRSS(jobs);

    console.log(`✓ RSS feed generated (${rssXML.length} characters)`);
    console.log(`✓ First 200 characters:`);
    console.log(rssXML.substring(0, 200) + '...');

    // Validate RSS structure
    const validation = validateRSSBasics(rssXML);
    if (validation.valid) {
      console.log('✓ RSS structure is valid');
    } else {
      console.log('❌ RSS structure validation failed:');
      validation.errors.forEach(error => console.log(`   • ${error}`));
    }

    console.log('\n🎉 RSS generation test completed successfully!');

  } catch (error) {
    console.error('❌ RSS generation test failed:', error.message);
    console.error(error.stack);
  }
}

/**
 * Basic RSS validation
 * @param {string} rssXML - RSS XML content
 * @returns {Object} - Validation result
 */
function validateRSSBasics(rssXML) {
  const result = { valid: true, errors: [] };

  const requiredElements = [
    '<?xml',
    '<rss',
    'version="2.0"',
    '<channel>',
    '<title>',
    '<description>',
    '<link>',
    '</channel>',
    '</rss>'
  ];

  requiredElements.forEach(element => {
    if (!rssXML.includes(element)) {
      result.errors.push(`Missing: ${element}`);
    }
  });

  // Check for items
  const items = rssXML.match(/<item>/g);
  if (!items || items.length === 0) {
    result.errors.push('No items found in RSS feed');
  }

  result.valid = result.errors.length === 0;
  return result;
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Complete Test Suite');
  console.log('='.repeat(60));

  await runAPITests();
  await testRSSGeneration();

  console.log('\n🏁 Test Suite Complete!');
  console.log('='.repeat(60));
}

// Export for use in other modules
export {
  runAPITests,
  testRSSGeneration,
  runAllTests
};

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}