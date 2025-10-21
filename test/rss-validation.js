/**
 * RSS Feed Validation Script
 * Validates generated RSS feeds and provides detailed reports
 */

import { validateRSSXML, extractRSSMetadata, validateFeedCompatibility, generateValidationReport } from '../src/utils/xml-validator.js';
import { RSSGenerator } from '../src/modules/rss-generator.js';
import { DataAggregator } from '../src/modules/data-aggregator.js';
import { APIFetcher } from '../src/modules/api-fetcher.js';

/**
 * Validate RSS feed against real data
 */
async function validateRealRSSFeed() {
  console.log('🔍 RSS Feed Validation Test');
  console.log('='.repeat(60));

  try {
    // Generate RSS feed with real data
    const rssXML = await generateSampleRSS();
    if (!rssXML) {
      console.log('❌ Failed to generate RSS feed');
      return;
    }

    console.log(`📝 Generated RSS feed (${rssXML.length} characters)`);

    // Validate XML structure
    console.log('\n🧪 Validating XML Structure...');
    const validation = validateRSSXML(rssXML);

    console.log(`✓ Status: ${validation.valid ? 'VALID' : 'INVALID'}`);
    console.log(`✓ Items: ${validation.stats.items}`);
    console.log(`✓ Size: ${formatBytes(validation.stats.size)}`);
    console.log(`✓ Has Images: ${validation.stats.hasImages}`);
    console.log(`✓ Has CDATA: ${validation.stats.hasCDATA || false}`);

    if (validation.errors.length > 0) {
      console.log('\n❌ Errors:');
      validation.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    if (validation.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      validation.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }

    // Extract metadata
    console.log('\n📊 Extracting Metadata...');
    const metadata = extractRSSMetadata(rssXML);
    console.log(`✓ Title: ${metadata.title}`);
    console.log(`✓ Description: ${metadata.description?.substring(0, 100)}...`);
    console.log(`✓ Language: ${metadata.language || 'Not specified'}`);
    console.log(`✓ Generator: ${metadata.generator || 'Not specified'}`);
    console.log(`✓ Last Build Date: ${metadata.lastBuildDate || 'Not specified'}`);

    // Check compatibility
    console.log('\n🌐 Checking Feed Reader Compatibility...');
    const compatibility = validateFeedCompatibility(rssXML);

    console.log(`✓ Overall: ${compatibility.overall}`);
    console.log(`✓ Feedly: ${compatibility.feedly}`);
    console.log(`✓ FeedBurner: ${compatibility.feedburner}`);
    console.log(`✓ Apple Podcasts: ${compatibility.applePodcasts}`);
    console.log(`✓ Google News: ${compatibility.googleNews}`);

    // Generate detailed report
    console.log('\n📄 Generating Validation Report...');
    const report = generateValidationReport({
      ...validation,
      metadata,
      compatibility
    });

    console.log(report);

    // Save report to file (in a real environment)
    console.log('\n💾 Validation report generated successfully');

  } catch (error) {
    console.error('❌ RSS validation failed:', error.message);
    console.error(error.stack);
  }
}

/**
 * Generate sample RSS feed for testing
 */
async function generateSampleRSS() {
  try {
    // Mock cache manager for testing
    const mockCacheManager = {
      get: async () => null,
      set: async () => true,
      delete: async () => true
    };

    const apiFetcher = new APIFetcher();
    const aggregator = new DataAggregator(apiFetcher, mockCacheManager);
    const rssGenerator = new RSSGenerator();

    // Fetch real job data
    console.log('📡 Fetching job data for RSS validation...');
    const jobs = await aggregator.aggregateJobData(5); // Test with 5 jobs

    if (jobs.length === 0) {
      console.log('⚠️  No jobs available, creating mock data...');
      return createMockRSSFeed();
    }

    console.log(`✓ Found ${jobs.length} jobs for RSS validation`);
    return rssGenerator.generateRSS(jobs);

  } catch (error) {
    console.warn('Failed to generate RSS with real data, using mock data:', error.message);
    return createMockRSSFeed();
  }
}

/**
 * Create mock RSS feed for testing
 */
function createMockRSSFeed() {
  console.log('🔧 Creating mock RSS feed for testing...');

  const currentDate = new Date().toUTCString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Lowongan Kerja Terbaru - KarirHub Indonesia</title>
    <description>Feed lowongan kerja resmi dari Kementerian Ketenagakerjaan Indonesia</description>
    <link>https://api.kemnaker.go.id/karirhub</link>
    <language>id</language>
    <lastBuildDate>${currentDate}</lastBuildDate>
    <pubDate>${currentDate}</pubDate>
    <generator>Cloudflare Worker RSS Generator v1.0</generator>
    <webMaster>admin@karirhub.com</webMaster>
    <copyright>© 2025 Kementerian Ketenagakerjaan Indonesia</copyright>
    <ttl>30</ttl>

    <item>
      <title>🔥 Lowongan Software Engineer di PT Tech Indonesia - Jakarta</title>
      <description>💰 10-15jt • S1 • Full-time • Technology

#lowongankerja #karir #loker #jakarta #lowonganteknologi</description>
      <content:encoded><![CDATA[<h2>Software Engineer</h2>
<div class="job-company-info">
<h3>Perusahaan:</h3>
<p><strong>PT Tech Indonesia</strong> | Technology</p>
</div>
<div class="job-location">
<h3>Lokasi:</h3>
<p>Jakarta, Indonesia</p>
</div>
<div class="job-type">
<h3>Tipe Pekerjaan:</h3>
<p>Full-time</p>
</div>
<div class="job-salary">
<h3>Rentang Gaji:</h3>
<p><strong>Rp 10,000,000 - Rp 15,000,000</strong></p>
</div>
<div class="job-requirements">
<h3>Persyaratan:</h3>
<div><strong>Pendidikan:</strong> S1<br><strong>Usia Maksimal:</strong> 35 tahun<br><strong>Persyaratan:</strong><br>• 3+ years experience<br>• Strong programming skills<br>• Team player</div>
</div>
<div class="job-description">
<h3>Deskripsi Pekerjaan:</h3>
<div>Looking for experienced software engineer to join our dynamic team.</div>
</div>
<hr>
<div class="job-source">
<p><em>Sumber: Kementerian Ketenagakerjaan Indonesia - KarirHub</em></p>
<p><small>Dipublikasikan pada 20 Oktober 2025</small></p>
<p><small>Job ID: test-123</small></p>
</div>]]></content:encoded>
      <link>https://api.kemnaker.go.id/karirhub/vacancies/test-123</link>
      <guid isPermaLink="false">test-123</guid>
      <pubDate>Mon, 20 Oct 2025 10:00:00 GMT</pubDate>
      <dc:creator>PT Tech Indonesia</dc:creator>
      <category domain="industry">Technology</category>
      <category domain="location">Jakarta</category>
      <category domain="function">Engineering</category>
      <category domain="type">Full-time</category>
      <media:thumbnail url="https://example.com/company-logo.jpg" />
      <enclosure url="https://example.com/company-logo.jpg" type="image/jpeg" />
    </item>

    <item>
      <title>🔥 Lowongan Marketing Manager di PT Creative Agency - Surabaya</title>
      <description>💰 8-12jt • S1 • Full-time • Marketing

#lowongankerja #karir #loker #surabaya #lowonganmarketing</description>
      <content:encoded><![CDATA[<h2>Marketing Manager</h2>
<div class="job-company-info">
<h3>Perusahaan:</h3>
<p><strong>PT Creative Agency</strong> | Marketing & Advertising</p>
</div>
<div class="job-location">
<h3>Lokasi:</h3>
<p>Surabaya, Jawa Timur</p>
</div>
<div class="job-type">
<h3>Tipe Pekerjaan:</h3>
<p>Full-time</p>
</div>
<div class="job-salary">
<h3>Rentang Gaji:</h3>
<p><strong>Rp 8,000,000 - Rp 12,000,000</strong></p>
</div>
<div class="job-requirements">
<h3>Persyaratan:</h3>
<div><strong>Pendidikan:</strong> S1<br><strong>Usia Maksimal:</strong> 40 tahun<br><strong>Persyaratan:</strong><br>• 5+ years marketing experience<br>• Digital marketing expertise<br>• Creative thinking</div>
</div>
<div class="job-description">
<h3>Deskripsi Pekerjaan:</h3>
<div>Lead our marketing team and develop innovative campaigns.</div>
</div>
<hr>
<div class="job-source">
<p><em>Sumber: Kementerian Ketenagakerjaan Indonesia - KarirHub</em></p>
<p><small>Dipublikasikan pada 20 Oktober 2025</small></p>
<p><small>Job ID: test-456</small></p>
</div>]]></content:encoded>
      <link>https://api.kemnaker.go.id/karirhub/vacancies/test-456</link>
      <guid isPermaLink="false">test-456</guid>
      <pubDate>Mon, 20 Oct 2025 09:30:00 GMT</pubDate>
      <dc:creator>PT Creative Agency</dc:creator>
      <category domain="industry">Marketing</category>
      <category domain="location">Surabaya</category>
      <category domain="function">Marketing</category>
      <category domain="type">Full-time</category>
    </item>

    <item>
      <title>🔥 Lowongan Sales Executive di PT Automotive - Bandung</title>
      <description>💰 5-8jt • SMA • Full-time • Automotive

#lowongankerja #karir #loker #bandung #lowonganotomotif</description>
      <content:encoded><![CDATA[<h2>Sales Executive</h2>
<div class="job-company-info">
<h3>Perusahaan:</h3>
<p><strong>PT Automotive</strong> | Automotive</p>
</div>
<div class="job-location">
<h3>Lokasi:</h3>
<p>Bandung, Jawa Barat</p>
</div>
<div class="job-type">
<h3>Tipe Pekerjaan:</h3>
<p>Full-time</p>
</div>
<div class="job-salary">
<h3>Rentang Gaji:</h3>
<p><strong>Rp 5,000,000 - Rp 8,000,000</strong></p>
</div>
<div class="job-requirements">
<h3>Persyaratan:</h3>
<div><strong>Pendidikan:</strong> SMA<br><strong>Usia Maksimal:</strong> 30 tahun<br><strong>Persyaratan:</strong><br>• Sales experience preferred<br>• Good communication skills<br>• Target oriented</div>
</div>
<div class="job-description">
<h3>Deskripsi Pekerjaan:</h3>
<div>Sell automotive products and achieve sales targets.</div>
</div>
<hr>
<div class="job-source">
<p><em>Sumber: Kementerian Ketenagakerjaan Indonesia - KarirHub</em></p>
<p><small>Dipublikasikan pada 20 Oktober 2025</small></p>
<p><small>Job ID: test-789</small></p>
</div>]]></content:encoded>
      <link>https://api.kemnaker.go.id/karirhub/vacancies/test-789</link>
      <guid isPermaLink="false">test-789</guid>
      <pubDate>Mon, 20 Oct 2025 09:00:00 GMT</pubDate>
      <dc:creator>PT Automotive</dc:creator>
      <category domain="industry">Automotive</category>
      <category domain="location">Bandung</category>
      <category domain="function">Sales</category>
      <category domain="type">Full-time</category>
      <category domain="education">SMA</category>
    </item>

  </channel>
</rss>`;
}

/**
 * Test RSS with different feed sizes
 */
async function testRSSFeedSizes() {
  console.log('\n📏 Testing RSS Feed Sizes');
  console.log('='.repeat(40));

  const sizes = [1, 5, 10, 20, 50];
  const results = [];

  for (const size of sizes) {
    console.log(`\n🧪 Testing with ${size} items...`);

    try {
      const startTime = Date.now();
      const rssXML = createMockRSSFeedWithSize(size);
      const generationTime = Date.now() - startTime;

      const validation = validateRSSXML(rssXML);
      const metadata = extractRSSMetadata(rssXML);

      const result = {
        size,
        itemCount: metadata.itemCount,
        xmlSize: rssXML.length,
        generationTime,
        valid: validation.valid,
        errors: validation.errors.length,
        warnings: validation.warnings.length
      };

      results.push(result);

      console.log(`  ✓ Items: ${result.itemCount}`);
      console.log(`  ✓ XML Size: ${formatBytes(result.xmlSize)}`);
      console.log(`  ✓ Generation Time: ${result.generationTime}ms`);
      console.log(`  ✓ Valid: ${result.valid ? 'Yes' : 'No'}`);
      console.log(`  ✓ Errors: ${result.errors}`);
      console.log(`  ✓ Warnings: ${result.warnings}`);

    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}`);
      results.push({
        size,
        error: error.message,
        valid: false
      });
    }
  }

  // Print size comparison
  console.log('\n📊 Size Comparison Summary:');
  console.log('Items | XML Size | Gen Time | Status | Errors');
  console.log('-'.repeat(50));

  results.forEach(result => {
    const status = result.valid ? '✅' : '❌';
    const xmlSize = result.xmlSize ? formatBytes(result.xmlSize) : 'N/A';
    const genTime = result.generationTime ? `${result.generationTime}ms` : 'N/A';
    const errors = result.errors || result.error || '0';

    console.log(`${result.size.toString().padEnd(5)} | ${xmlSize.padEnd(8)} | ${genTime.padEnd(7)} | ${status} | ${errors}`);
  });
}

/**
 * Create mock RSS feed with specified size
 * @param {number} itemCount - Number of items to generate
 */
function createMockRSSFeedWithSize(itemCount) {
  const currentDate = new Date().toUTCString();
  const items = [];

  for (let i = 1; i <= itemCount; i++) {
    const pubDate = new Date(Date.now() - (i * 60 * 60 * 1000)).toUTCString();

    items.push(`    <item>
      <title>🔥 Lowongan Job ${i} di Company ${i} - Location ${i}</title>
      <description>💰 5-10jt • S1 • Full-time • Industry ${i}

#lowongankerja #karir #loker</description>
      <content:encoded><![CDATA[<h2>Job ${i}</h2>
<div class="job-company-info">
<h3>Perusahaan:</h3>
<p><strong>Company ${i}</strong></p>
</div>
<div class="job-location">
<h3>Lokasi:</h3>
<p>Location ${i}</p>
</div>
<hr>
<div class="job-source">
<p><em>Sumber: Kementerian Ketenagakerjaan Indonesia - KarirHub</em></p>
<p><small>Job ID: test-${i}</small></p>
</div>]]></content:encoded>
      <link>https://api.kemnaker.go.id/karirhub/vacancies/test-${i}</link>
      <guid isPermaLink="false">test-${i}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>Company ${i}</dc:creator>
      <category domain="industry">Industry ${i}</category>
      <category domain="location">Location ${i}</category>
    </item>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Lowongan Kerja Terbaru - KarirHub Indonesia (${itemCount} items)</title>
    <description>Feed lowongan kerja resmi dari Kementerian Ketenagakerjaan Indonesia</description>
    <link>https://api.kemnaker.go.id/karirhub</link>
    <language>id</language>
    <lastBuildDate>${currentDate}</lastBuildDate>
    <pubDate>${currentDate}</pubDate>
    <generator>Cloudflare Worker RSS Generator v1.0</generator>
    <ttl>30</ttl>
${items.join('\n')}
  </channel>
</rss>`;
}

/**
 * Format bytes to human readable format
 * @param {number} bytes - Bytes to format
 * @returns {string} - Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Run comprehensive RSS validation tests
 */
async function runComprehensiveTests() {
  console.log('🧪 Comprehensive RSS Validation Tests');
  console.log('='.repeat(60));

  await validateRealRSSFeed();
  await testRSSFeedSizes();

  console.log('\n🎉 Comprehensive RSS validation tests completed!');
}

// Export for use in other modules
export {
  validateRealRSSFeed,
  testRSSFeedSizes,
  runComprehensiveTests,
  generateSampleRSS,
  createMockRSSFeed
};

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTests().catch(console.error);
}