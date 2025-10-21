/**
 * XML Validator Utilities
 * Validates RSS XML structure and content
 */

/**
 * Validate RSS XML structure
 * @param {string} xml - XML content to validate
 * @returns {Object} - Validation result with details
 */
export function validateRSSXML(xml) {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    stats: {
      items: 0,
      size: xml.length,
      hasImages: false,
      hasEnclosures: false
    }
  };

  try {
    // Basic XML structure checks
    validateBasicStructure(xml, result);

    // RSS specific checks
    validateRSSStructure(xml, result);

    // Content checks
    validateContent(xml, result);

    // Performance and best practices
    validateBestPractices(xml, result);

  } catch (error) {
    result.valid = false;
    result.errors.push(`Validation error: ${error.message}`);
  }

  // Overall validity
  result.valid = result.errors.length === 0;

  return result;
}

/**
 * Validate basic XML structure
 * @param {string} xml - XML content
 * @param {Object} result - Validation result object
 */
function validateBasicStructure(xml, result) {
  // Check for XML declaration
  if (!xml.includes('<?xml')) {
    result.errors.push('Missing XML declaration (<?xml version="1.0"?>)');
  }

  // Check for RSS root element
  if (!xml.includes('<rss')) {
    result.errors.push('Missing <rss> root element');
  }

  // Check for version attribute
  if (!xml.includes('version=')) {
    result.errors.push('Missing version attribute in <rss> element');
  }

  // Check for channel element
  if (!xml.includes('<channel>')) {
    result.errors.push('Missing <channel> element');
  }

  // Check for proper closing tags
  const openRSS = (xml.match(/<rss[^>]*>/g) || []).length;
  const closeRSS = (xml.match(/<\/rss>/g) || []).length;
  if (openRSS !== closeRSS) {
    result.errors.push('Mismatched <rss> tags');
  }

  const openChannel = (xml.match(/<channel>/g) || []).length;
  const closeChannel = (xml.match(/<\/channel>/g) || []).length;
  if (openChannel !== closeChannel) {
    result.errors.push('Mismatched <channel> tags');
  }
}

/**
 * Validate RSS-specific structure
 * @param {string} xml - XML content
 * @param {Object} result - Validation result object
 */
function validateRSSStructure(xml, result) {
  // Required channel elements
  const requiredChannelElements = [
    { tag: '<title>', description: 'channel title' },
    { tag: '<description>', description: 'channel description' },
    { tag: '<link>', description: 'channel link' }
  ];

  requiredChannelElements.forEach(element => {
    if (!xml.includes(element.tag)) {
      result.errors.push(`Missing required ${element.description}`);
    }
  });

  // Check for items
  const itemMatches = xml.match(/<item>/g);
  if (itemMatches) {
    result.stats.items = itemMatches.length;
  } else {
    result.warnings.push('No <item> elements found in RSS feed');
  }

  // Validate item structure
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let itemMatch;
  let itemIndex = 0;

  while ((itemMatch = itemRegex.exec(xml)) !== null) {
    const itemContent = itemMatch[1];
    validateItemStructure(itemContent, result, itemIndex);
    itemIndex++;
  }
}

/**
 * Validate individual RSS item structure
 * @param {string} itemContent - Item XML content
 * @param {Object} result - Validation result object
 * @param {number} index - Item index
 */
function validateItemStructure(itemContent, result, index) {
  const itemPrefix = `Item ${index + 1}`;

  // Required item elements
  const requiredElements = [
    { tag: '<title>', required: true },
    { tag: '<description>', required: true },
    { tag: '<link>', required: false },
    { tag: '<guid>', required: false }
  ];

  requiredElements.forEach(element => {
    if (element.required && !itemContent.includes(element.tag)) {
      result.errors.push(`${itemPrefix}: Missing required ${element.tag}`);
    }
  });

  // Check for publication date
  if (!itemContent.includes('<pubDate>') && !itemContent.includes('<dc:date>')) {
    result.warnings.push(`${itemPrefix}: Missing publication date (<pubDate>)`);
  }

  // Check for title length
  const titleMatch = itemContent.match(/<title>(.*?)<\/title>/);
  if (titleMatch && titleMatch[1]) {
    const titleLength = titleMatch[1].length;
    if (titleLength > 100) {
      result.warnings.push(`${itemPrefix}: Title is very long (${titleLength} characters)`);
    }
    if (titleLength === 0) {
      result.errors.push(`${itemPrefix}: Title is empty`);
    }
  }

  // Check for description length
  const descMatch = itemContent.match(/<description>(.*?)<\/description>/);
  if (descMatch && descMatch[1]) {
    const descLength = descMatch[1].length;
    if (descLength > 500) {
      result.warnings.push(`${itemPrefix}: Description is very long (${descLength} characters)`);
    }
  }

  // Check for GUID
  const guidMatch = itemContent.match(/<guid[^>]*>(.*?)<\/guid>/);
  if (guidMatch) {
    const guid = guidMatch[1];
    if (!guid || guid.trim().length === 0) {
      result.errors.push(`${itemPrefix}: Empty GUID`);
    }
  }
}

/**
 * Validate XML content for common issues
 * @param {string} xml - XML content
 * @param {Object} result - Validation result object
 */
function validateContent(xml, result) {
  // Check for unescaped characters
  const unescapedAmpersands = xml.match(/&(?!amp;|lt;|gt;|quot;|apos;|nbsp;)/g);
  if (unescapedAmpersands) {
    result.errors.push(`Found ${unescapedAmpersands.length} unescaped ampersand(s) - use &amp; instead`);
  }

  // Check for invalid characters
  const invalidChars = xml.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g);
  if (invalidChars) {
    result.errors.push(`Found ${invalidChars.length} invalid control characters`);
  }

  // Check for CDATA sections (good for HTML content)
  const cdataSections = xml.match(/<!\[CDATA\[(.*?)\]\]>/g);
  if (cdataSections) {
    result.stats.hasCDATA = true;
  }

  // Check for media elements
  if (xml.includes('<media:') || xml.includes('<enclosure')) {
    result.stats.hasEnclosures = true;
  }

  // Check for images
  if (xml.includes('<img') || xml.includes('media:thumbnail') || xml.includes('enclosure url=')) {
    result.stats.hasImages = true;
  }

  // Check for namespaces
  const namespaces = xml.match(/xmlns:[^=]+=/g);
  if (namespaces) {
    result.stats.namespaces = namespaces.length;
  }
}

/**
 * Validate best practices and performance
 * @param {string} xml - XML content
 * @param {Object} result - Validation result object
 */
function validateBestPractices(xml, result) {
  // Check feed size
  if (result.stats.size > 1024 * 1024) { // 1MB
    result.warnings.push('RSS feed is very large (>1MB) - consider pagination');
  }

  // Check number of items
  if (result.stats.items > 100) {
    result.warnings.push(`Feed has ${result.stats.items} items - consider reducing to improve performance`);
  }

  // Check for TTL element
  if (!xml.includes('<ttl>')) {
    result.warnings.push('Missing <ttl> element - recommend adding for cache control');
  }

  // Check for lastBuildDate
  if (!xml.includes('<lastBuildDate>')) {
    result.warnings.push('Missing <lastBuildDate> - recommended for feed freshness');
  }

  // Check for generator
  if (!xml.includes('<generator>')) {
    result.warnings.push('Missing <generator> element - good for debugging');
  }

  // Check for language
  if (!xml.includes('<language>')) {
    result.warnings.push('Missing <language> element - recommended for international feeds');
  }

  // Check for atom:link (self-reference)
  if (!xml.includes('atom:link')) {
    result.warnings.push('Missing atom:link for self-reference - recommended for feed discovery');
  }
}

/**
 * Fix common XML issues
 * @param {string} xml - XML content to fix
 * @returns {string} - Fixed XML content
 */
export function fixCommonXMLErrors(xml) {
  let fixed = xml;

  // Fix unescaped ampersands
  fixed = fixed.replace(/&(?!amp;|lt;|gt;|quot;|apos;|nbsp;)/g, '&amp;');

  // Remove invalid control characters
  fixed = fixed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

  // Ensure proper XML declaration
  if (!fixed.includes('<?xml')) {
    fixed = '<?xml version="1.0" encoding="UTF-8"?>\n' + fixed;
  }

  // Ensure proper RSS version
  if (fixed.includes('<rss>') && !fixed.includes('<rss version=')) {
    fixed = fixed.replace('<rss>', '<rss version="2.0">');
  }

  return fixed;
}

/**
 * Extract RSS feed metadata
 * @param {string} xml - RSS XML content
 * @returns {Object} - Feed metadata
 */
export function extractRSSMetadata(xml) {
  const metadata = {
    title: extractTagContent(xml, 'title'),
    description: extractTagContent(xml, 'description'),
    link: extractTagContent(xml, 'link'),
    language: extractTagContent(xml, 'language'),
    generator: extractTagContent(xml, 'generator'),
    lastBuildDate: extractTagContent(xml, 'lastBuildDate'),
    pubDate: extractTagContent(xml, 'pubDate'),
    ttl: extractTagContent(xml, 'ttl'),
    itemCount: (xml.match(/<item>/g) || []).length,
    size: xml.length,
    hasNamespaces: xml.includes('xmlns:'),
    hasMedia: xml.includes('media:') || xml.includes('enclosure'),
    hasCDATA: xml.includes('<![CDATA[')
  };

  // Extract namespaces
  const namespaceMatches = xml.match(/xmlns:([^=]+)="([^"]*)"/g);
  if (namespaceMatches) {
    metadata.namespaces = {};
    namespaceMatches.forEach(ns => {
      const match = ns.match(/xmlns:([^=]+)="([^"]*)"/);
      if (match) {
        metadata.namespaces[match[1]] = match[2];
      }
    });
  }

  return metadata;
}

/**
 * Extract content from XML tag
 * @param {string} xml - XML content
 * @param {string} tagName - Tag name to extract
 * @returns {string|null} - Tag content or null
 */
function extractTagContent(xml, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Validate RSS feed against feed readers
 * @param {string} xml - RSS XML content
 * @returns {Object} - Compatibility check result
 */
export function validateFeedCompatibility(xml) {
  const compatibility = {
    feedly: checkFeedlyCompatibility(xml),
    feedburner: checkFeedBurnerCompatibility(xml),
    applePodcasts: checkApplePodcastsCompatibility(xml),
    googleNews: checkGoogleNewsCompatibility(xml),
    overall: 'good'
  };

  // Determine overall compatibility
  const issues = Object.values(compatibility).filter(result => result !== 'excellent');
  if (issues.length === 0) {
    compatibility.overall = 'excellent';
  } else if (issues.length <= 1) {
    compatibility.overall = 'good';
  } else if (issues.length <= 2) {
    compatibility.overall = 'fair';
  } else {
    compatibility.overall = 'poor';
  }

  return compatibility;
}

/**
 * Check Feedly compatibility
 * @param {string} xml - XML content
 * @returns {string} - Compatibility level
 */
function checkFeedlyCompatibility(xml) {
  let score = 5;

  // Feedly prefers complete metadata
  if (!xml.includes('<author>') && !xml.includes('<dc:creator>')) score--;
  if (!xml.includes('<media:thumbnail>') && !xml.includes('<enclosure>')) score--;
  if (!xml.includes('<pubDate>')) score--;
  if (xml.length > 500000) score--; // Very large feeds

  if (score >= 4) return 'excellent';
  if (score >= 3) return 'good';
  if (score >= 2) return 'fair';
  return 'poor';
}

/**
 * Check FeedBurner compatibility
 * @param {string} xml - XML content
 * @returns {string} - Compatibility level
 */
function checkFeedBurnerCompatibility(xml) {
  let score = 5;

  // FeedBurner is more lenient but prefers standards compliance
  if (!xml.includes('<ttl>')) score--;
  if (!xml.includes('<language>')) score--;
  if (!xml.includes('<generator>')) score--;
  if (xml.includes('<content:encoded>')) score++; // Bonus for full content

  if (score >= 4) return 'excellent';
  if (score >= 3) return 'good';
  if (score >= 2) return 'fair';
  return 'poor';
}

/**
 * Check Apple Podcasts compatibility
 * @param {string} xml - XML content
 * @returns {string} - Compatibility level
 */
function checkApplePodcastsCompatibility(xml) {
  let score = 5;

  // Apple Podcasts requires specific iTunes namespace
  if (!xml.includes('xmlns:itunes=')) score -= 3;
  if (!xml.includes('<itunes:author>')) score--;
  if (!xml.includes('<itunes:image>')) score--;
  if (!xml.includes('<itunes:category>')) score--;

  if (score >= 4) return 'excellent';
  if (score >= 3) return 'good';
  if (score >= 2) return 'fair';
  return 'poor';
}

/**
 * Check Google News compatibility
 * @param {string} xml - XML content
 * @returns {string} - Compatibility level
 */
function checkGoogleNewsCompatibility(xml) {
  let score = 5;

  // Google News has specific requirements
  if (!xml.includes('<pubDate>')) score -= 2;
  if (!xml.includes('<guid>')) score--;
  if (!xml.includes('<dc:creator>')) score--;
  if (xml.includes('<language>') && !xml.includes('<language>en')) score--; // Prefers English

  if (score >= 4) return 'excellent';
  if (score >= 3) return 'good';
  if (score >= 2) return 'fair';
  return 'poor';
}

/**
 * Generate validation report
 * @param {Object} validationResult - Validation result
 * @returns {string} - Formatted report
 */
export function generateValidationReport(validationResult) {
  let report = '# RSS Feed Validation Report\n\n';

  // Overall status
  report += `**Status:** ${validationResult.valid ? '✅ Valid' : '❌ Invalid'}\n\n`;

  // Statistics
  report += '## Feed Statistics\n\n';
  report += `- **Items:** ${validationResult.stats.items}\n`;
  report += `- **Size:** ${formatFileSize(validationResult.stats.size)}\n`;
  report += `- **Has Images:** ${validationResult.stats.hasImages ? 'Yes' : 'No'}\n`;
  report += `- **Has Enclosures:** ${validationResult.stats.hasEnclosures ? 'Yes' : 'No'}\n`;
  report += `- **Namespaces:** ${validationResult.stats.namespaces || 0}\n\n`;

  // Errors
  if (validationResult.errors.length > 0) {
    report += '## Errors ❌\n\n';
    validationResult.errors.forEach((error, index) => {
      report += `${index + 1}. ${error}\n`;
    });
    report += '\n';
  }

  // Warnings
  if (validationResult.warnings.length > 0) {
    report += '## Warnings ⚠️\n\n';
    validationResult.warnings.forEach((warning, index) => {
      report += `${index + 1}. ${warning}\n`;
    });
    report += '\n';
  }

  // Recommendations
  report += '## Recommendations 💡\n\n';
  if (validationResult.errors.length > 0) {
    report += '- Fix all errors before publishing the feed\n';
  }
  if (validationResult.warnings.length > 0) {
    report += '- Address warnings to improve feed compatibility\n';
  }
  if (validationResult.stats.items > 50) {
    report += '- Consider reducing the number of items for better performance\n';
  }
  if (validationResult.stats.size > 500000) {
    report += '- Consider optimizing feed size for faster loading\n';
  }
  if (!validationResult.stats.hasImages && validationResult.stats.items > 0) {
    report += '- Add images to items to improve visual appeal\n';
  }

  return report;
}

/**
 * Format file size in human readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default {
  validateRSSXML,
  fixCommonXMLErrors,
  extractRSSMetadata,
  validateFeedCompatibility,
  generateValidationReport
};