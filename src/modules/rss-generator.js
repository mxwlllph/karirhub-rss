/**
 * RSS Generator Module
 * Generates RSS 2.0 compliant XML feeds
 * Optimizes content for social media and WordPress integration
 */

import { CONFIG, RSS_FIELD_MAPPING } from '../config/environment.js';

/**
 * RSS Generator Class
 */
export class RSSGenerator {
  /**
   * Constructor
   */
  constructor() {
    this.currentDate = new Date().toUTCString();
  }

  /**
   * Generate complete RSS feed
   * @param {Array} jobs - Array of job objects
   * @returns {string} - RSS XML string
   */
  generateRSS(jobs) {
    if (!jobs || !Array.isArray(jobs)) {
      throw new Error('Invalid jobs data provided');
    }

    console.log(`Generating RSS feed with ${jobs.length} jobs`);

    const rssHeader = this.generateRSSHeader(jobs.length);
    const rssItems = jobs.map(job => this.generateRSSItem(job)).join('\n');
    const rssFooter = this.generateRSSFooter();

    const rssXML = `${rssHeader}${rssItems}${rssFooter}`;

    // Validate RSS structure
    this.validateRSS(rssXML);

    console.log('RSS feed generated successfully');
    return rssXML;
  }

  /**
   * Generate RSS header
   * @param {number} itemCount - Number of items in the feed
   * @returns {string} - RSS header XML
   */
  generateRSSHeader(itemCount = 0) {
    const lastBuildDate = this.currentDate;
    const publicationDate = this.currentDate;

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${this.escapeXML(CONFIG.RSS_TITLE)}</title>
    <description>${this.escapeXML(CONFIG.RSS_DESCRIPTION)}</description>
    <link>${CONFIG.BASE_URL}</link>
    <language>${CONFIG.RSS_LANGUAGE}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <pubDate>${publicationDate}</pubDate>
    <generator>${this.escapeXML(CONFIG.RSS_GENERATOR)}</generator>
    <webMaster>${this.escapeXML(CONFIG.RSS_WEBMASTER)}</webMaster>
    <copyright>${this.escapeXML(CONFIG.RSS_COPYRIGHT)}</copyright>
    <atom:link href="${CONFIG.BASE_URL}/rss" rel="self" type="application/rss+xml" />
    <docs>http://www.rssboard.org/rss-specification</docs>
    <ttl>30</ttl>
    <image>
      <title>${this.escapeXML(CONFIG.RSS_TITLE)}</title>
      <url>${CONFIG.BASE_URL}/logo.png</url>
      <link>${CONFIG.BASE_URL}</link>
      <width>144</width>
      <height>144</height>
      <description>${this.escapeXML(CONFIG.RSS_DESCRIPTION)}</description>
    </image>
`;
  }

  /**
   * Generate RSS footer
   * @returns {string} - RSS footer XML
   */
  generateRSSFooter() {
    return `  </channel>
</rss>`;
  }

  /**
   * Generate RSS item for a job
   * @param {Object} job - Job object
   * @returns {string} - RSS item XML
   */
  generateRSSItem(job) {
    try {
      const title = this.generateItemTitle(job);
      const description = this.generateItemDescription(job);
      const content = this.generateItemContent(job);
      const link = this.generateItemLink(job);
      const guid = job.id || `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const pubDate = this.formatPubDate(job.published_at || job.created_at);
      const categories = this.generateItemCategories(job);
      const author = this.escapeXML(job.company_name || 'Unknown Company');
      const mediaElements = this.generateMediaElements(job);

      return `    <item>
      <title>${title}</title>
      <description>${description}</description>
      <content:encoded><![CDATA[${content}]]></content:encoded>
      <link>${link}</link>
      <guid isPermaLink="false">${guid}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${author}</dc:creator>
      ${categories}
      ${mediaElements}
    </item>`;
    } catch (error) {
      console.error(`Failed to generate RSS item for job ${job.id}:`, error);
      return this.generateErrorItem(job, error.message);
    }
  }

  /**
   * Generate item title optimized for social media
   * @param {Object} job - Job object
   * @returns {string} - Formatted title
   */
  generateItemTitle(job) {
    const maxLength = RSS_FIELD_MAPPING.title.maxLength;
    const template = RSS_FIELD_MAPPING.title.template;
    const prefix = RSS_FIELD_MAPPING.title.prefix;

    // Add urgency indicator
    let emoji = '🔥';
    if (job.days_until_expiry !== null && job.days_until_expiry <= 3) {
      emoji = '⚠️'; // Urgent
    } else if (job.days_until_expiry !== null && job.days_until_expiry <= 7) {
      emoji = '📢'; // This week
    } else if (job.detail?.salary) {
      emoji = '💰'; // Has salary info
    }

    const location = job.city_name || job.province_name || 'Indonesia';

    // Clean and prepare variables
    const cleanTitle = this.cleanText(job.title, 50);
    const cleanCompany = this.cleanText(job.company_name, 30);
    const cleanLocation = this.cleanText(location, 25);
    const cleanSalary = this.cleanText(job.salary_range || 'Gaji Kompetitif', 20);
    const cleanAgeRange = this.cleanText(job.age_range || 'Usia bebas', 15);

    // Apply template
    let title = template
      .replace('{emoji}', emoji)
      .replace('{title}', cleanTitle)
      .replace('{company}', cleanCompany)
      .replace('{location}', cleanLocation)
      .replace('{salary}', cleanSalary)
      .replace('{age_range}', cleanAgeRange);

    // Add urgency indicator for expiring jobs
    if (job.days_until_expiry !== null && job.days_until_expiry <= 7) {
      title += ` (${job.days_until_expiry} hari lagi)`;
    }

    // Add prefix if not already present
    if (!title.startsWith('🔥') && !title.startsWith('💰') && !title.startsWith('⚠️') && !title.startsWith('📢')) {
      title = prefix + title;
    }

    // Truncate if too long
    if (title.length > maxLength) {
      title = title.substring(0, maxLength - 3) + '...';
    }

    return this.escapeXML(title);
  }

  /**
   * Generate item description optimized for social media
   * @param {Object} job - Job object
   * @returns {string} - Formatted description
   */
  generateItemDescription(job) {
    const maxLength = RSS_FIELD_MAPPING.description.maxLength;
    const template = RSS_FIELD_MAPPING.description.template;
    const includeHashtags = RSS_FIELD_MAPPING.description.hashtags;

    // Gather enhanced data
    const salary = job.salary_range || 'Gaji Kompetitif';
    const experienceLevel = job.experience_level || 'Pengalaman dibutuhkan';
    const location = job.city_name || 'Indonesia';
    const inclusiveWorkplace = job.inclusive_workplace ? '♿ Disabilitas-Friendly' : '';

    // Apply template
    let description = template
      .replace('{salary}', salary)
      .replace('{experience_level}', experienceLevel)
      .replace('{location}', location)
      .replace('{inclusive_workplace}', inclusiveWorkplace);

    // Add benefits if enabled
    if (RSS_FIELD_MAPPING.description.include_benefits) {
      const benefits = this.formatJobBenefits(job);
      if (benefits) {
        description += '\n📋 **Benefit:** ' + benefits;
      }
    }

    // Add hashtags if enabled
    if (includeHashtags) {
      const hashtags = this.generateEnhancedHashtags(job);
      description += '\n\n' + hashtags;
    }

    // Add deadline urgency if enabled
    if (RSS_FIELD_MAPPING.description.include_deadline_urgency) {
      if (job.days_until_expiry !== null && job.days_until_expiry <= 3) {
        description += '\n\n⏰ **Deadline ' + job.days_until_expiry + ' hari lagi!**';
      } else if (job.days_until_expiry !== null && job.days_until_expiry <= 7) {
        description += '\n\n⏰ Deadline: ' + job.days_until_expiry + ' hari lagi';
      }
    }

    // Add call-to-action
    description += '\n\n🔗 **Apply Link:** ' + job.frontend_url;
    description += '\n💡 **Share:** Bantu teman yang mencari kesempatan emas ini!';

    // Truncate if too long
    if (description.length > maxLength) {
      description = this.truncateText(description, maxLength);
    }

    return this.escapeXML(description);
  }

  /**
   * Generate full item content for WordPress
   * @param {Object} job - Job object
   * @returns {string} - HTML content
   */
  generateItemContent(job) {
    // Use pre-generated content if available
    if (job.content_html) {
      return job.content_html;
    }

    // Generate basic content structure
    let content = `<h2>${this.escapeXML(job.title)}</h2>`;

    // Company information
    content += `<div class="job-company-info">
      <h3>Perusahaan:</h3>
      <p><strong>${this.escapeXML(job.company_name)}</strong>`;

    if (job.industry_name) {
      content += ` | ${this.escapeXML(job.industry_name)}`;
    }

    content += `</p></div>`;

    // Location
    content += `<div class="job-location">
      <h3>Lokasi:</h3>
      <p>${this.escapeXML(job.full_location || job.city_name || 'Lokasi tidak disebutkan')}</p>
    </div>`;

    // Job details
    if (job.detail) {
      // Debug job type processing in RSS generator (always log)
      console.log('🔍 RSS Generator job type debug:', {
        hasDetail: !!job.detail,
        hasJobType: !!job.detail?.job_type,
        originalJobType: job.detail?.job_type,
        formattedJobType: job.detail?.job_type ? this.formatJobType(job.detail.job_type) : 'NO_JOB_TYPE',
        formattedType: typeof job.detail?.job_type
      });

      // Job type
      if (job.detail.job_type) {
        const formattedJobType = this.formatJobType(job.detail.job_type);
        content += `<div class="job-type">
          <h3>Tipe Pekerjaan:</h3>
          <p>${this.escapeXML(formattedJobType)}</p>
        </div>`;
      }

      // Salary
      if (job.salary_range && job.salary_range !== 'Gaji nego') {
        content += `<div class="job-salary">
          <h3>Rentang Gaji:</h3>
          <p><strong>${this.escapeXML(job.salary_range)}</strong></p>
        </div>`;
      }

      // Requirements
      if (job.requirements_text && job.requirements_text !== 'Informasi persyaratan tidak tersedia') {
        content += `<div class="job-requirements">
          <h3>Persyaratan:</h3>
          <div>${this.formatRequirementsForHTML(job.requirements_text)}</div>
        </div>`;
      }

      // Description
      if (job.detail.description) {
        content += `<div class="job-description">
          <h3>Deskripsi Pekerjaan:</h3>
          <div>${this.escapeXML(job.detail.description)}</div>
        </div>`;
      }

      // Benefits
      if (job.benefits_text && job.benefits_text !== 'Informasi benefit tidak tersedia') {
        content += `<div class="job-benefits">
          ${this.formatBenefitsForHTML(job.benefits_text)}
        </div>`;
      }

      // Deadline
      if (job.application_deadline_formatted && job.application_deadline_formatted !== 'Informasi deadline tidak tersedia') {
        content += `<div class="job-deadline">
          <h3>Batas Lamaran:</h3>
          <p><strong>${this.escapeXML(job.application_deadline_formatted)}</strong></p>
        </div>`;
      }
    }

    // Skills
    if (job.skills && Array.isArray(job.skills) && job.skills.length > 0) {
      content += `<div class="job-skills">
        <h3>Skill yang Dibutuhkan:</h3>
        <p>${job.skills.map(skill => this.escapeXML(skill)).join(', ')}</p>
      </div>`;
    }

    // Social media content
    if (job.social_media_content) {
      content += `<div class="job-social-media">
        <h3>Untuk Media Sosial:</h3>
        <div class="social-content">
          <p><strong>Twitter:</strong></p>
          <blockquote>${this.escapeXML(job.social_media_content.twitter)}</blockquote>
        </div>
      </div>`;
    }

    // Source attribution
    content += `<hr>
      <div class="job-source">
        <p><em>Sumber: Kementerian Ketenagakerjaan Indonesia - KarirHub</em></p>`;

    if (job.posted_date_formatted) {
      content += `<p><small>Dipublikasikan pada ${this.escapeXML(job.posted_date_formatted)}</small></p>`;
    }

    content += `<p><small>Job ID: ${job.id}</small></p>
      </div>`;

    return content;
  }

  /**
   * Generate item link
   * @param {Object} job - Job object
   * @returns {string} - Item URL
   */
  generateItemLink(job) {
    // Use frontend URL if available, fallback to API URL
    if (job.frontend_url) {
      return job.frontend_url;
    }
    return `${CONFIG.KARIRHUB_BASE_URL}/lowongan-dalam-negeri/lowongan/${job.id}`;
  }

  /**
   * Generate item categories
   * @param {Object} job - Job object
   * @returns {string} - Category XML elements
   */
  generateItemCategories(job) {
    const categories = [];
    const maxCategories = RSS_FIELD_MAPPING.categories.maxCategories;

    // Industry category
    if (job.industry_name) {
      categories.push(`<category domain="industry">${this.escapeXML(job.industry_name)}</category>`);
    }

    // Location categories
    if (job.city_name) {
      categories.push(`<category domain="location">${this.escapeXML(job.city_name)}</category>`);
    }
    if (job.province_name && job.province_name !== job.city_name) {
      categories.push(`<category domain="province">${this.escapeXML(job.province_name)}</category>`);
    }

    // Job function category
    if (job.job_function_name) {
      categories.push(`<category domain="function">${this.escapeXML(job.job_function_name)}</category>`);
    }

    // Job type category
    if (job.detail?.job_type) {
      categories.push(`<category domain="type">${this.escapeXML(job.detail.job_type)}</category>`);
    }

    // Education level category
    if (job.detail?.requirements?.education_min) {
      categories.push(`<category domain="education">${this.escapeXML(job.detail.requirements.education_min)}</category>`);
    }

    // Experience level category
    if (job.detail?.requirements?.experience) {
      const experience = job.detail.requirements.experience.toLowerCase();
      let level = 'general';
      if (experience.includes('fresh') || experience.includes('magang')) {
        level = 'freshgraduate';
      } else if (experience.includes('1') || experience.includes('2')) {
        level = 'junior';
      } else if (experience.includes('3') || experience.includes('4') || experience.includes('5')) {
        level = 'mid';
      } else if (experience.includes('senior') || experience.includes('6') || experience.includes('7') || experience.includes('8') || experience.includes('9') || experience.includes('10')) {
        level = 'senior';
      }
      categories.push(`<category domain="experience">${level}</category>`);
    }

    // Return limited number of categories
    return categories.slice(0, maxCategories).join('\n      ');
  }

  /**
   * Generate media elements for RSS item
   * @param {Object} job - Job object
   * @returns {string} - Media XML elements
   */
  generateMediaElements(job) {
    let mediaElements = '';

    // Company logo
    if (job.detail?.employer?.logo || job.company_logo) {
      const logoUrl = job.detail?.employer?.logo || job.company_logo;
      mediaElements += `<media:thumbnail url="${this.escapeXML(logoUrl)}" />
      <enclosure url="${this.escapeXML(logoUrl)}" type="image/jpeg" />`;
    }

    // Company banner if available
    if (job.detail?.employer?.banner) {
      mediaElements += `<media:content url="${this.escapeXML(job.detail.employer.banner)}" type="image/jpeg" medium="image" />`;
    }

    return mediaElements;
  }

  /**
   * Generate hashtags for RSS item
   * @param {Object} job - Job object
   * @returns {string} - Hashtag string
   */
  generateItemHashtags(job) {
    const hashtags = new Set(['#lowongankerja', '#karir', '#loker']);

    // Location hashtags - remove "kota" prefix and optimize
    if (job.city_name) {
      const cleanLocation = job.city_name
        .toLowerCase()
        .replace(/^kota\s+/i, '') // Remove "kota" prefix
        .replace(/^kabupaten\s+/i, 'kab') // Replace "kabupaten" with "kab"
        .replace(/\s+/g, '');

      if (cleanLocation) {
        hashtags.add(`#loker${cleanLocation}`);
      }
    }

    // Industry hashtags
    if (job.industry_name && job.industry_name !== 'General') {
      const cleanIndustry = this.formatHashtag(job.industry_name);
      if (cleanIndustry) {
        hashtags.add(`#lowongan${cleanIndustry}`);
      }
    }

    // Education level hashtags
    if (job.detail?.requirements?.education_min) {
      const education = job.detail.requirements.education_min.toLowerCase();
      const educationHashtag = this.getEducationHashtag(education);
      if (educationHashtag) {
        hashtags.add(educationHashtag);
      }
    }

    // Job function/skill hashtags
    if (job.job_function_name) {
      const functionHashtag = this.getSkillHashtag(job.job_function_name);
      if (functionHashtag) {
        hashtags.add(functionHashtag);
      }
    }

    // Urgency hashtags based on expiry
    if (job.days_until_expiry !== null && job.days_until_expiry <= 7) {
      hashtags.add('#urgentloker');
    }

    // Experience level hashtags
    const title = (job.title || '').toLowerCase();
    if (title.includes('fresh') || title.includes('magang') || title.includes('intern')) {
      hashtags.add('#lokerfreshgraduate');
    }

    // Convert to array and limit
    const hashtagArray = Array.from(hashtags).slice(0, 12);
    return hashtagArray.join(' ');
  }

  /**
   * Get education level hashtag
   * @param {string} education - Education level text
   * @returns {string|null} - Education hashtag or null
   */
  getEducationHashtag(education) {
    const eduKeywords = {
      'sma': '#lokersma',
      'smk': '#lokersmk',
      's1': '#lokers1',
      's2': '#lokers2',
      's3': '#lokers3',
      'd1': '#lokerd1',
      'd2': '#lokerd2',
      'd3': '#lokerd3',
      'd4': '#lokerd4',
      'sarjana': '#lokers1',
      'diploma': '#lokerd3',
      'bachelor': '#lokers1',
      'master': '#lokers2',
      'doctoral': '#lokers3'
    };

    for (const [key, hashtag] of Object.entries(eduKeywords)) {
      if (education.includes(key)) {
        return hashtag;
      }
    }

    return null;
  }

  /**
   * Get skill-based hashtag
   * @param {string} skill - Skill text
   * @returns {string|null} - Skill hashtag or null
   */
  getSkillHashtag(skill) {
    const skillKeywords = {
      'sales': '#lokersales',
      'marketing': '#lokermarketing',
      'accounting': '#lokeraccounting',
      'engineering': '#lokerengineering',
      'hr': '#lokerhr',
      'human resource': '#lokerhr',
      'customer service': '#lokercustomerservice',
      'admin': '#lokeradmin',
      'administrasi': '#lokeradmin',
      'driver': '#lokerdriver',
      'guru': '#lokerguru',
      'teacher': '#lokerguru',
      'programming': '#lokerprogramming',
      'design': '#lokerdesign',
      'staff': '#lokerstaff'
    };

    const lowerSkill = skill.toLowerCase();
    for (const [key, hashtag] of Object.entries(skillKeywords)) {
      if (lowerSkill.includes(key)) {
        return hashtag;
      }
    }

    return null;
  }

  /**
   * Format text for hashtag
   * @param {string} text - Text to format
   * @returns {string} - Hashtag-friendly text
   */
  formatHashtag(text) {
    if (!text) return '';

    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '')
      .substring(0, 20);
  }

  /**
   * Clean and truncate text
   * @param {string} text - Text to clean
   * @param {number} maxLength - Maximum length
   * @returns {string} - Cleaned text
   */
  cleanText(text, maxLength = 50) {
    if (!text) return '';

    return text
      .trim()
      .replace(/\s+/g, ' ')
      .substring(0, maxLength)
      .trim();
  }

  /**
   * Truncate text with word boundary
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} - Truncated text
   */
  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;

    const truncated = text.substring(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > maxLength * 0.8) {
      return truncated.substring(0, lastSpace) + '...';
    }

    return truncated + '...';
  }

  /**
   * Format job type for display
   * @param {Object|string} jobType - Job type object or string
   * @returns {string} - Formatted job type
   */
  formatJobType(jobType) {
    if (!jobType) return 'Full-time';

    // Handle string job types
    if (typeof jobType === 'string') {
      return jobType;
    }

    // Handle object job types with various field names
    if (typeof jobType === 'object') {
      // Try different possible field names
      const possibleFields = ['name', 'title', 'label', 'job_type_name', 'type'];
      for (const field of possibleFields) {
        if (jobType[field] && typeof jobType[field] === 'string') {
          return jobType[field];
        }
      }

      // If object has string representation
      if (jobType.toString && jobType.toString() !== '[object Object]') {
        return jobType.toString();
      }

      // Last resort: JSON stringify for debugging
      console.warn('Unexpected job_type object structure:', jobType);
      return 'Full-time';
    }

    // Handle other types (numbers, etc.)
    if (typeof jobType !== 'object') {
      return String(jobType);
    }

    return 'Full-time';
  }

  /**
   * Format publication date
   * @param {string|number} dateString - Date string/number in various formats (Unix timestamp, MySQL datetime, ISO, etc.)
   * @returns {string} - RFC 822 formatted date
   */
  formatPubDate(dateString) {
    if (!dateString) {
      return this.currentDate;
    }

    try {
      let date;

      // Handle Unix timestamp (number or numeric string): 1761113794
      if (typeof dateString === 'number' || (typeof dateString === 'string' && /^\d{10}$/.test(dateString))) {
        const timestamp = typeof dateString === 'number' ? dateString : parseInt(dateString, 10);
        date = new Date(timestamp * 1000); // Convert to milliseconds
      }
      // Handle MySQL datetime format: "2025-10-21 20:16:32"
      else if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
        // MySQL datetime format - treat as UTC
        const [datePart, timePart] = dateString.split(' ');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes, seconds] = timePart.split(':').map(Number);
        date = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
      } else {
        // Try standard Date constructor for ISO and other formats
        date = new Date(dateString);
      }

      // Validate date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date after parsing:', dateString, 'type:', typeof dateString);
        return this.currentDate;
      }

      return date.toUTCString();
    } catch (error) {
      console.warn('Error formatting date:', dateString, 'type:', typeof dateString, error);
      return this.currentDate;
    }
  }

  /**
   * Format requirements for HTML
   * @param {string} requirements - Requirements text
   * @returns {string} - Formatted HTML
   */
  formatRequirementsForHTML(requirements) {
    return requirements
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>')
      .replace(/• (.*)/g, '<li>$1</li>')
      .replace(/<li>/g, '<ul><li>')
      .replace(/<\/li>/g, '</li></ul>')
      .replace(/<\/li><ul><li>/g, '</li><li>');
  }

  /**
   * Format benefits for HTML
   * @param {string} benefits - Benefits text
   * @returns {string} - Formatted HTML
   */
  formatBenefitsForHTML(benefits) {
    return benefits
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>')
      .replace(/• (.*)/g, '<li>$1</li>')
      .replace(/<li>/g, '<ul><li>')
      .replace(/<\/li>/g, '</li></ul>')
      .replace(/<\/li><ul><li>/g, '</li><li>');
  }

  /**
   * Escape XML special characters
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  escapeXML(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Generate error item for failed job processing
   * @param {Object} job - Job object
   * @param {string} error - Error message
   * @returns {string} - Error RSS item XML
   */
  generateErrorItem(job, error) {
    const title = `Error processing job: ${job.title || 'Unknown Job'}`;
    const description = `This job could not be processed due to an error: ${error}`;
    const guid = `error-${job.id || 'unknown'}-${Date.now()}`;

    return `    <item>
      <title>${this.escapeXML(title)}</title>
      <description>${this.escapeXML(description)}</description>
      <guid isPermaLink="false">${guid}</guid>
      <pubDate>${this.currentDate}</pubDate>
      <dc:creator>RSS Generator</dc:creator>
    </item>`;
  }

  /**
   * Validate generated RSS
   * @param {string} rssXML - RSS XML string
   * @returns {boolean} - True if valid
   */
  validateRSS(rssXML) {
    try {
      // Basic XML structure validation
      const requiredElements = [
        '<?xml version="1.0"',
        '<rss version="2.0"',
        '<channel>',
        '<title>',
        '<description>',
        '<link>',
        '</channel>',
        '</rss>'
      ];

      for (const element of requiredElements) {
        if (!rssXML.includes(element)) {
          throw new Error(`Missing required element: ${element}`);
        }
      }

      // Check for properly escaped content
      if (rssXML.includes('&') && !rssXML.includes('&amp;') && !rssXML.includes('<?xml')) {
        console.warn('Potential unescaped ampersand found in RSS');
      }

      return true;
    } catch (error) {
      console.error('RSS validation failed:', error);
      return false;
    }
  }

  /**
   * Generate RSS feed statistics
   * @param {Array} jobs - Jobs array
   * @returns {Object} - Statistics object
   */
  getFeedStats(jobs) {
    if (!jobs || !Array.isArray(jobs)) {
      return { error: 'Invalid jobs data' };
    }

    const stats = {
      totalJobs: jobs.length,
      dateRange: {
        oldest: null,
        newest: null
      },
      locations: {},
      industries: {},
      companies: {},
      averageTitleLength: 0
    };

    if (jobs.length === 0) {
      return stats;
    }

    const dates = jobs
      .filter(job => job.created_at)
      .map(job => new Date(job.created_at))
      .sort((a, b) => a - b);

    if (dates.length > 0) {
      stats.dateRange.oldest = dates[0].toISOString();
      stats.dateRange.newest = dates[dates.length - 1].toISOString();
    }

    let totalTitleLength = 0;
    jobs.forEach(job => {
      // Location stats
      const location = job.city_name || 'Unknown';
      stats.locations[location] = (stats.locations[location] || 0) + 1;

      // Industry stats
      const industry = job.industry_name || 'Unknown';
      stats.industries[industry] = (stats.industries[industry] || 0) + 1;

      // Company stats
      const company = job.company_name || 'Unknown';
      stats.companies[company] = (stats.companies[company] || 0) + 1;

      // Title length
      totalTitleLength += (job.title || '').length;
    });

    stats.averageTitleLength = Math.round(totalTitleLength / jobs.length);

    return stats;
  }

  /**
   * Format job benefits for description
   * @param {Object} job - Job object
   * @returns {string} - Formatted benefits
   */
  formatJobBenefits(job) {
    const benefits = [];

    // Salary benefits
    if (job.salary_range && job.salary_range !== 'Gaji Kompetitif') {
      benefits.push(job.salary_range);
    }

    // Work type benefits
    if (job.detail?.job_type?.name === 'Remote') {
      benefits.push('🏠 Work From Home');
    }

    // Inclusive workplace benefits
    if (job.inclusive_workplace) {
      benefits.push('♿ Inclusive Workplace');
    }

    // Fresh graduate benefits
    if (job.experience_level && job.experience_level.includes('Fresh Graduate')) {
      benefits.push('🚫 No Experience Required');
    }

    // Age-specific benefits
    if (job.age_range && job.age_range.includes('21-25')) {
      benefits.push('👥 Fresh Graduate Friendly');
    }

    return benefits.length > 0 ? benefits.join(' • ') : null;
  }

  /**
   * Generate enhanced hashtags for social media optimization
   * @param {Object} job - Job object
   * @returns {string} - Enhanced hashtags
   */
  generateEnhancedHashtags(job) {
    const hashtags = new Set([
      '#LowonganKerja', '#KarirIndonesia', '#InfoLoker'
    ]);

    // Job-specific hashtags
    const title = (job.title || '').toLowerCase();
    if (title.includes('teacher') || title.includes('guru')) {
      hashtags.add('#LowonganGuru');
      hashtags.add('#TeacherJobs');
      hashtags.add('#EducationJobs');
    }
    if (title.includes('biology')) {
      hashtags.add('#BiologyTeacher');
      hashtags.add('#ScienceTeacher');
    }
    if (title.includes('sales') || title.includes('marketing')) {
      hashtags.add('#SalesJobs');
      hashtags.add('#MarketingJobs');
    }

    // Salary-based hashtags
    if (job.salary_range && job.salary_range.includes('Juta')) {
      hashtags.add('#LokerGajiTinggi');
    }

    // Experience-based hashtags
    if (job.experience_level) {
      if (job.experience_level.includes('Fresh Graduate')) {
        hashtags.add('#FreshGraduate');
        hashtags.add('#LokerPengalaman');
      }
      if (job.experience_level.includes('1+ tahun') || job.experience_level.includes('pengalaman')) {
        hashtags.add('#ExperiencedHire');
      }
    }

    // Inclusive workplace hashtags
    if (job.inclusive_workplace) {
      hashtags.add('#InclusiveWorkplace');
      hashtags.add('#DisabilitasFriendly');
    }

    // Location-based hashtags
    if (job.city_name) {
      const cleanCity = job.city_name.replace(/\s+/g, '');
      hashtags.add(`#Karir${cleanCity}`);
      hashtags.add(`#Loker${cleanCity}`);
    }

    // Education-based hashtags
    if (job.education_level) {
      const education = job.education_level.toLowerCase();
      if (education.includes('s1') || education.includes('sarjana')) {
        hashtags.add('#LokerS1');
      }
      if (education.includes('sma') || education.includes('smk')) {
        hashtags.add('#LokerSMA');
      }
    }

    // Industry-based hashtags
    if (job.industry_name) {
      const industry = job.industry_name.toLowerCase();
      if (industry.includes('education')) {
        hashtags.add('#EducationJobs');
      }
      if (industry.includes('technology') || industry.includes('it')) {
        hashtags.add('#TechJobs');
      }
    }

    // Urgency hashtags
    if (job.days_until_expiry !== null && job.days_until_expiry <= 3) {
      hashtags.add('#UrgentLoker');
      hashtags.add('#LastChance');
    }

    // Convert to array and limit to 12 hashtags
    const hashtagArray = Array.from(hashtags).slice(0, 12);
    return hashtagArray.join(' ');
  }
}

export default RSSGenerator;