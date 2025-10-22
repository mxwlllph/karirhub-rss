/**
 * Data Aggregator Module
 * Aggregates and enriches data from multiple API calls
 * Handles data transformation and content generation
 */

import { CONFIG, CONTENT_FORMATTING } from '../config/environment.js';

/**
 * Data Aggregator Class
 */
export class DataAggregator {
  /**
   * Constructor
   * @param {APIFetcher} apiFetcher - API fetcher instance
   * @param {CacheManager} cacheManager - Cache manager instance
   */
  constructor(apiFetcher, cacheManager) {
    this.apiFetcher = apiFetcher;
    this.cacheManager = cacheManager;
  }

  /**
   * Aggregate job data with full details
   * @param {number} maxJobs - Maximum number of jobs to aggregate
   * @returns {Promise<Array>} - Array of enriched job objects
   */
  async aggregateJobData(maxJobs = CONFIG.MAX_JOBS_PER_FEED) {
    try {
      console.log(`🚀 Starting job data aggregation for max ${maxJobs} jobs`);
      console.log(`📝 Configuration:`, {
        maxJobs,
        cacheEnabled: !!this.cacheManager?.cacheEnabled,
        apiUrl: this.apiFetcher?.baseURL
      });

      // Fetch job listings
      const listings = await this.fetchJobListingsWithCache(maxJobs);
      if (!listings || listings.length === 0) {
        console.warn('⚠️ No job listings found - this could indicate API issues');
        return [];
      }

      console.log(`📝 Found ${listings.length} job listings, starting enrichment process...`);
      console.log(`🔍 Sample job listing:`, {
        id: listings[0]?.id,
        title: listings[0]?.job_title,
        company: listings[0]?.company_name,
        city: listings[0]?.city_name
      });

      // Enrich each job with detailed information
      const enrichedJobs = await this.enrichJobListings(listings);
      console.log(`✨ Enriched ${enrichedJobs.length} jobs with detailed information`);

      // Filter and sort jobs
      const filteredJobs = this.filterAndSortJobs(enrichedJobs);
      console.log(`🎯 After filtering: ${filteredJobs.length} jobs ready for RSS`);

      if (filteredJobs.length > 0) {
        console.log(`📋 Sample enriched job:`, {
          id: filteredJobs[0]?.id,
          title: filteredJobs[0]?.title,
          company: filteredJobs[0]?.company_name,
          hasDescription: !!filteredJobs[0]?.detail?.description,
          salary: filteredJobs[0]?.salary_range
        });
      }

      console.log(`🎉 Successfully aggregated ${filteredJobs.length} enriched jobs`);
      return filteredJobs;

    } catch (error) {
      console.error('💥 Job data aggregation failed:', error);
      console.error('📍 Stack trace:', error.stack);
      throw new Error(`Failed to aggregate job data: ${error.message}`);
    }
  }

  /**
   * Fetch job listings with caching
   * @param {number} limit - Number of jobs to fetch
   * @returns {Promise<Array>} - Job listings array
   */
  async fetchJobListingsWithCache(limit) {
    const cacheKey = `job_listings_${limit}`;
    console.log(`🔍 Fetching job listings with limit=${limit}, cacheKey=${cacheKey}`);

    // Try to get from cache first
    const cached = await this.cacheManager.get(cacheKey, 'job_listings');
    if (cached) {
      console.log(`✅ Job listings served from cache: ${cached.data?.length || 0} items`);
      return cached.data || [];
    }

    console.log(`🌐 Cache miss, fetching fresh data from API...`);
    // Fetch fresh data
    const response = await this.apiFetcher.fetchJobListings(1, limit);

    console.log(`📊 API response received:`, {
      hasData: !!response.data,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      dataLength: response.data?.length,
      responseKeys: Object.keys(response)
    });

    if (!response.data || !Array.isArray(response.data)) {
      console.error(`❌ Invalid job listings response format. Expected array, got:`, {
        data: response.data,
        type: typeof response.data,
        isArray: Array.isArray(response.data)
      });
      return [];
    }

    const listings = response.data;
    console.log(`📋 Retrieved ${listings.length} job listings from API`);

    // Cache the result
    try {
      await this.cacheManager.set(cacheKey, { data: listings }, 'job_listings');
      console.log(`💾 Cached ${listings.length} job listings successfully`);
    } catch (cacheError) {
      console.warn(`⚠️ Failed to cache job listings:`, cacheError.message);
    }

    return listings;
  }

  /**
   * Enrich job listings with detailed information
   * @param {Array} listings - Basic job listings
   * @returns {Promise<Array>} - Enriched job listings
   */
  async enrichJobListings(listings) {
    const enrichedJobs = [];
    const batchSize = 5; // Process in batches to control API load

    console.log(`✨ Starting enrichment for ${listings.length} job listings`);

    for (let i = 0; i < listings.length; i += batchSize) {
      const batch = listings.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1} with ${batch.length} jobs`);

      const batchPromises = batch.map(job => this.enrichSingleJob(job));
      const batchResults = await Promise.allSettled(batchPromises);

      // Process results
      batchResults.forEach((result, index) => {
        const originalJob = batch[index];
        if (result.status === 'fulfilled' && result.value) {
          console.log(`✅ Successfully enriched job ${originalJob.id}: ${result.value.title}`);
          enrichedJobs.push(result.value);
        } else {
          console.warn(`❌ Failed to enrich job ${originalJob?.id}:`, result.reason?.message || result.reason);
          // Add basic job info even if enrichment fails
          if (originalJob) {
            const basicJob = this.createBasicJobObject(originalJob);
            console.log(`🔄 Using basic job object for ${originalJob.id}: ${basicJob.title}`);
            enrichedJobs.push(basicJob);
          }
        }
      });

      // Small delay between batches
      if (i + batchSize < listings.length) {
        await this.sleep(200);
      }
    }

    console.log(`🎉 Enrichment complete. ${enrichedJobs.length} out of ${listings.length} jobs processed`);
    return enrichedJobs;
  }

  /**
   * Enrich a single job with detailed information
   * @param {Object} job - Basic job object
   * @returns {Promise<Object>} - Enriched job object
   */
  async enrichSingleJob(job) {
    try {
      // Fetch job details
      const jobDetail = await this.fetchJobDetailWithCache(job.id);

      // Merge basic and detailed information
      const enrichedJob = {
        ...job,
        // Ensure consistent field naming
        title: job.title || job.job_title || jobDetail?.title,
        // Add derived fields
        detail: jobDetail,
        salary_range: this.formatSalaryRange(jobDetail?.salary),
        full_location: this.formatFullLocation(job),
        requirements_text: this.formatRequirements(jobDetail?.requirements),
        benefits_text: this.formatBenefits(jobDetail?.salary?.benefits),
        social_media_content: this.generateSocialMediaContent(job, jobDetail),
        content_html: this.generateFullContent(job, jobDetail),
        application_deadline_formatted: this.formatDeadline(jobDetail?.application_deadline),
        posted_date_formatted: this.formatDate(job.created_at || job.published_at || jobDetail?.posted_date)
      };

      return enrichedJob;

    } catch (error) {
      console.error(`Failed to enrich job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Fetch job detail with caching
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} - Job detail object
   */
  async fetchJobDetailWithCache(jobId) {
    const cacheKey = `job_detail_${jobId}`;

    // Try cache first
    const cached = await this.cacheManager.get(cacheKey, 'job_details');
    if (cached) {
      return cached.data;
    }

    // Fetch fresh data
    const response = await this.apiFetcher.fetchJobDetail(jobId);

    if (!response.data) {
      throw new Error(`No data found for job ${jobId}`);
    }

    const jobDetail = response.data;

    // Cache the result
    await this.cacheManager.set(cacheKey, { data: jobDetail }, 'job_details');

    return jobDetail;
  }

  /**
   * Create a basic job object for fallback
   * @param {Object} job - Basic job listing
   * @returns {Object} - Basic job object
   */
  createBasicJobObject(job) {
    return {
      ...job,
      // Ensure consistent field naming
      title: job.title || job.job_title,
      detail: null,
      salary_range: 'Gaji nego',
      full_location: this.formatFullLocation(job),
      requirements_text: 'Informasi persyaratan tidak tersedia',
      benefits_text: 'Informasi benefit tidak tersedia',
      social_media_content: this.generateBasicSocialMediaContent(job),
      content_html: this.generateBasicContent(job),
      application_deadline_formatted: 'Informasi deadline tidak tersedia',
      posted_date_formatted: this.formatDate(job.created_at || job.published_at)
    };
  }

  /**
   * Format salary range for display
   * @param {Object} salary - Salary object
   * @returns {string} - Formatted salary range
   */
  formatSalaryRange(salary) {
    if (!salary || typeof salary !== 'object') {
      return 'Gaji nego';
    }

    const formatter = new Intl.NumberFormat('id-ID', CONTENT_FORMATTING.currency);

    if (salary.min && salary.max) {
      return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}`;
    } else if (salary.min) {
      return `${formatter.format(salary.min)}+`;
    } else if (salary.max) {
      return `Hingga ${formatter.format(salary.max)}`;
    }

    return 'Gaji nego';
  }

  /**
   * Format full location string
   * @param {Object} job - Job object
   * @returns {string} - Formatted location
   */
  formatFullLocation(job) {
    const parts = [];

    if (job.city_name) {
      parts.push(job.city_name);
    }

    if (job.province_name && job.province_name !== job.city_name) {
      parts.push(job.province_name);
    }

    return parts.length > 0 ? parts.join(', ') : 'Lokasi tidak disebutkan';
  }

  /**
   * Format requirements text
   * @param {Object} requirements - Requirements object
   * @returns {string} - Formatted requirements
   */
  formatRequirements(requirements) {
    if (!requirements || typeof requirements !== 'object') {
      return 'Informasi persyaratan tidak tersedia';
    }

    let text = '';

    if (requirements.education_min) {
      text += `**Pendidikan:** ${requirements.education_min}\n\n`;
    }

    if (requirements.age_max) {
      text += `**Usia Maksimal:** ${requirements.age_max} tahun\n\n`;
    }

    if (requirements.gender) {
      text += `**Jenis Kelamin:** ${requirements.gender}\n\n`;
    }

    if (requirements.experience) {
      text += `**Pengalaman:** ${requirements.experience}\n\n`;
    }

    if (requirements.requirements && Array.isArray(requirements.requirements)) {
      text += '**Persyaratan:**\n';
      requirements.requirements.forEach(req => {
        text += `• ${req}\n`;
      });
      text += '\n';
    }

    if (requirements.skills && Array.isArray(requirements.skills)) {
      text += '**Skill yang Dibutuhkan:**\n';
      requirements.skills.forEach(skill => {
        text += `• ${skill}\n`;
      });
    }

    return text.trim() || 'Informasi persyaratan tidak lengkap';
  }

  /**
   * Format benefits text
   * @param {Array} benefits - Benefits array
   * @returns {string} - Formatted benefits
   */
  formatBenefits(benefits) {
    if (!benefits || !Array.isArray(benefits) || benefits.length === 0) {
      return 'Informasi benefit tidak tersedia';
    }

    let text = '**Benefit yang Ditawarkan:**\n';
    benefits.forEach(benefit => {
      text += `• ${benefit}\n`;
    });

    return text;
  }

  /**
   * Generate social media content
   * @param {Object} job - Basic job object
   * @param {Object} detail - Job detail object
   * @returns {Object} - Social media content object
   */
  generateSocialMediaContent(job, detail) {
    const location = job.city_name || 'Indonesia';
    const salary = detail?.salary ? this.formatSalaryRange(detail.salary) : 'Gaji nego';
    const jobType = detail?.job_type || 'Full-time';
    const education = detail?.requirements?.education_min || 'Tidak disebutkan';
    const industry = job.industry_name || 'General';

    return {
      twitter: this.generateTwitterContent(job, detail, location, salary, jobType, education, industry),
      facebook: this.generateFacebookContent(job, detail, location, salary, jobType, education, industry),
      linkedin: this.generateLinkedInContent(job, detail, location, salary, jobType, education, industry)
    };
  }

  /**
   * Generate Twitter content (280 chars max)
   */
  generateTwitterContent(job, detail, location, salary, jobType, education, industry) {
    const hashtags = this.generateHashtags(job, industry, location);
    const title = `🔥 Lowongan ${job.title} di ${job.company_name} - ${location}`;

    let content = `${title}\n\n💰 ${salary}\n📍 ${location}\n📋 ${education} • ${jobType}\n🏭 ${industry}\n\n${hashtags}`;

    // Truncate if too long
    if (content.length > 280) {
      const allowedLength = 277; // Leave room for "..."
      content = content.substring(0, allowedLength);
      const lastSpace = content.lastIndexOf(' ');
      if (lastSpace > 0) {
        content = content.substring(0, lastSpace);
      }
      content += '...';
    }

    return content;
  }

  /**
   * Generate Facebook content
   */
  generateFacebookContent(job, detail, location, salary, jobType, education, industry) {
    const hashtags = this.generateHashtags(job, industry, location);
    const requirements = detail?.requirements?.experience || 'Pengalaman relevan';

    return `💼 **Lowongan Kerja: ${job.title}**

🏢 **Perusahaan:** ${job.company_name}
📍 **Lokasi:** ${location}
💰 **Gaji:** ${salary}
📋 **Persyaratan:** ${education}, ${requirements}
🏭 **Industri:** ${industry}

📝 **Deskripsi:** ${detail?.description?.substring(0, 200) || 'Deskripsi tidak tersedia'}...

🎁 **Benefit:** ${detail?.salary?.benefits?.slice(0, 3).join(', ') || 'Benefit kompetitif'}

📅 **Deadline:** ${this.formatDeadline(detail?.application_deadline)}

🔗 **Info lebih lanjut:** KarirHub Kemnaker

${hashtags}`;
  }

  /**
   * Generate LinkedIn content
   */
  generateLinkedInContent(job, detail, location, salary, jobType, education, industry) {
    const hashtags = this.generateHashtags(job, industry, location, true);
    const experience = detail?.requirements?.experience || 'Relevant experience';

    return `🚀 **Career Opportunity: ${job.title}**

**Company:** ${job.company_name} | ${industry}
**Location:** ${location}
**Employment Type:** ${jobType}
**Salary Range:** ${salary}

**Requirements:**
• ${education}
• ${experience}
• Team player with good communication skills

**About the Role:**
${detail?.description?.substring(0, 300) || 'Join our dynamic team!'}...

**Benefits Offered:**
${detail?.salary?.benefits?.slice(0, 3).map(b => `• ${b}`).join('\n') || '• Competitive salary\n• Professional development\n• Career growth opportunities'}

**Application Deadline:** ${this.formatDeadline(detail?.application_deadline)}

${hashtags}

#jobopportunity #hiring #careers`;
  }

  /**
   * Generate basic social media content (fallback)
   * @param {Object} job - Basic job object
   * @returns {Object} - Basic social media content
   */
  generateBasicSocialMediaContent(job) {
    const location = job.city_name || 'Indonesia';
    const industry = job.industry_name || 'General';
    const hashtags = this.generateHashtags(job, industry, location);

    const content = `🔥 Lowongan ${job.title} di ${job.company_name} - ${location}

📍 ${location}
🏭 ${industry}
📅 Lowongan terbaru

${hashtags}`;

    return {
      twitter: content.length > 280 ? content.substring(0, 277) + '...' : content,
      facebook: content,
      linkedin: content
    };
  }

  /**
   * Generate hashtags for social media
   * @param {Object} job - Job object
   * @param {string} industry - Industry name
   * @param {string} location - Location name
   * @param {boolean} isProfessional - Whether to use professional hashtags
   * @returns {string} - Hashtag string
   */
  generateHashtags(job, industry, location, isProfessional = false) {
    const hashtags = isProfessional
      ? ['#jobopportunity', '#hiring', '#careers']
      : ['#lowongankerja', '#karir', '#loker'];

    // Add location hashtag
    if (location) {
      const locationTag = `#${location.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}`;
      hashtags.push(locationTag);
    }

    // Add industry hashtag
    if (industry && industry !== 'General') {
      const industryTag = isProfessional
        ? `#${industry.toLowerCase().replace(/\s+/g, '')}`
        : `#loker${industry.toLowerCase().replace(/\s+/g, '')}`;
      hashtags.push(industryTag);
    }

    // Add job function hashtag
    if (job.job_function_name) {
      const functionTag = `#${job.job_function_name.toLowerCase().replace(/\s+/g, '')}`;
      hashtags.push(functionTag);
    }

    // Limit hashtags
    return hashtags.slice(0, 8).join(' ');
  }

  /**
   * Generate full HTML content for WordPress
   * @param {Object} job - Basic job object
   * @param {Object} detail - Job detail object
   * @returns {string} - HTML content
   */
  generateFullContent(job, detail) {
    let content = `<h2>${job.title}</h2>`;

    // Company information
    content += `<div class="job-company-info">
      <h3>Perusahaan:</h3>
      <p><strong>${job.company_name}</strong>`;

    if (job.industry_name) {
      content += ` | ${job.industry_name}`;
    }

    content += `</p></div>`;

    // Location
    content += `<div class="job-location">
      <h3>Lokasi:</h3>
      <p>${this.formatFullLocation(job)}</p>
    </div>`;

    // Job details
    if (detail) {
      if (detail.job_type) {
        content += `<div class="job-type">
          <h3>Tipe Pekerjaan:</h3>
          <p>${detail.job_type}</p>
        </div>`;
      }

      if (detail.salary) {
        content += `<div class="job-salary">
          <h3>Rentang Gaji:</h3>
          <p>${this.formatSalaryRange(detail.salary)}</p>
        </div>`;
      }

      // Requirements
      const requirementsText = this.formatRequirements(detail.requirements);
      if (requirementsText && requirementsText !== 'Informasi persyaratan tidak tersedia') {
        content += `<div class="job-requirements">
          <h3>Persyaratan:</h3>
          <div>${requirementsText.replace(/\n/g, '<br>')}</div>
        </div>`;
      }

      // Description
      if (detail.description) {
        content += `<div class="job-description">
          <h3>Deskripsi Pekerjaan:</h3>
          <div>${detail.description}</div>
        </div>`;
      }

      // Benefits
      const benefitsText = this.formatBenefits(detail.salary?.benefits);
      if (benefitsText && benefitsText !== 'Informasi benefit tidak tersedia') {
        content += `<div class="job-benefits">
          ${benefitsText.replace(/\n/g, '<br>')}
        </div>`;
      }

      // Application deadline
      if (detail.application_deadline) {
        content += `<div class="job-deadline">
          <h3>Batas Lamaran:</h3>
          <p><strong>${this.formatDeadline(detail.application_deadline)}</strong></p>
        </div>`;
      }
    }

    // Source attribution
    content += `<hr>
      <div class="job-source">
        <p><em>Sumber: Kementerian Ketenagakerjaan Indonesia - KarirHub</em></p>
        <p><small>Lowongan ini dipublikasikan pada ${this.formatDate(job.created_at)}</small></p>
      </div>`;

    return content;
  }

  /**
   * Generate basic HTML content (fallback)
   * @param {Object} job - Basic job object
   * @returns {string} - Basic HTML content
   */
  generateBasicContent(job) {
    return `<h2>${job.title}</h2>
      <div class="job-company-info">
        <h3>Perusahaan:</h3>
        <p><strong>${job.company_name}</strong></p>
      </div>
      <div class="job-location">
        <h3>Lokasi:</h3>
        <p>${this.formatFullLocation(job)}</p>
      </div>
      <div class="job-industry">
        <h3>Industri:</h3>
        <p>${job.industry_name || 'General'}</p>
      </div>
      <div class="job-function">
        <h3>Fungsi:</h3>
        <p>${job.job_function_name || 'General'}</p>
      </div>
      <hr>
      <div class="job-source">
        <p><em>Sumber: Kementerian Ketenagakerjaan Indonesia - KarirHub</em></p>
        <p><small>Lowongan ini dipublikasikan pada ${this.formatDate(job.created_at)}</small></p>
      </div>`;
  }

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date
   */
  formatDate(dateString) {
    if (!dateString) return 'Tanggal tidak tersedia';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', CONTENT_FORMATTING.date.options);
    } catch (error) {
      return 'Tanggal tidak valid';
    }
  }

  /**
   * Format deadline for display
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted deadline
   */
  formatDeadline(dateString) {
    if (!dateString) return 'Informasi deadline tidak tersedia';

    try {
      const date = new Date(dateString);
      const today = new Date();
      const diffTime = date - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const formatted = date.toLocaleDateString('id-ID', CONTENT_FORMATTING.date.options);

      if (diffDays < 0) {
        return `${formatted} (Deadline telah lewat)`;
      } else if (diffDays <= 3) {
        return `${formatted} (${diffDays} hari lagi)`;
      }

      return formatted;
    } catch (error) {
      return 'Deadline tidak valid';
    }
  }

  /**
   * Filter and sort jobs
   * @param {Array} jobs - Array of job objects
   * @returns {Array} - Filtered and sorted jobs
   */
  filterAndSortJobs(jobs) {
    console.log(`🔍 Filtering ${jobs.length} jobs...`);

    // Filter out jobs without required fields
    const filtered = jobs.filter((job, index) => {
      const isValid = job &&
             job.id &&
             (job.title || job.job_title) &&  // Handle both field names
             job.company_name &&
             (job.created_at || job.published_at);  // Handle both date fields

      if (!isValid) {
        console.warn(`❌ Job ${index} filtered out:`, {
          hasJob: !!job,
          hasId: !!job?.id,
          hasTitle: !!(job?.title || job?.job_title),
          hasCompany: !!job?.company_name,
          hasCreated: !!(job?.created_at || job?.published_at),
          jobKeys: job ? Object.keys(job) : 'null'
        });
      }

      return isValid;
    });

    console.log(`✅ Filtered to ${filtered.length} valid jobs`);

    // Sort by creation date (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || a.published_at);
      const dateB = new Date(b.created_at || b.published_at);
      return dateB - dateA;
    });

    console.log(`📊 Final job list ready for RSS generation:`);
    filtered.slice(0, 3).forEach((job, index) => {
      console.log(`  ${index + 1}. ${job.title} at ${job.company_name}`);
    });

    return filtered;
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get aggregation statistics
   * @returns {Object} - Statistics object
   */
  getStats() {
    return {
      lastAggregation: new Date().toISOString(),
      cacheStatus: 'active',
      apiEndpoints: [
        `${CONFIG.API_BASE_URL}/industrial-vacancies`,
        `${CONFIG.API_BASE_URL}/vacancies/{id}`,
        `${CONFIG.API_BASE_URL}/employers/{id}`
      ]
    };
  }
}

export default DataAggregator;