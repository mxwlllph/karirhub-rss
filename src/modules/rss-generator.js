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

    // Apply template
    let title = template
      .replace('{emoji}', emoji)
      .replace('{title}', cleanTitle)
      .replace('{company}', cleanCompany)
      .replace('{location}', cleanLocation);

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

    // Gather data
    const salary = job.salary_range || 'Gaji nego';
    const jobType = job.job_type_name || job.detail?.job_type_name || 'Full-time';
    const industry = job.industry_name || 'General';
    const education = job.detail?.requirements?.education_min || 'Pendidikan variatif';

    // Apply template
    let description = template
      .replace('{salary}', salary)
      .replace('{job_type}', jobType)
      .replace('{industry}', industry)
      .replace('{education}', education);

    // Add hashtags if enabled
    if (includeHashtags) {
      const hashtags = this.generateItemHashtags(job);
      description += '\n\n' + hashtags;
    }

    // Add call-to-action and engagement elements
    if (job.days_until_expiry !== null && job.days_until_expiry <= 7) {
      description += '\n\n⏰ Deadline: ' + job.days_until_expiry + ' hari lagi! Apply sekarang!';
    } else {
      description += '\n\n📌 Apply now: ' + job.frontend_url;
    }

    // Add engagement prompt
    description += '\n💡 Share dengan teman yang cocok untuk posisi ini!';

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
      // Job type
      if (job.detail.job_type) {
        content += `<div class="job-type">
          <h3>Tipe Pekerjaan:</h3>
          <p>${this.escapeXML(job.detail.job_type)}</p>
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
   * Format publication date
   * @param {string} dateString - ISO date string
   * @returns {string} - RFC 822 formatted date
   */
  formatPubDate(dateString) {
    if (!dateString) {
      return this.currentDate;
    }

    try {
      const date = new Date(dateString);
      return date.toUTCString();
    } catch (error) {
      console.warn('Invalid date format:', dateString);
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
}

export default RSSGenerator;