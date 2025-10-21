# Integration Guide - KarirHub RSS Feed Generator

## 🔌 Platform Integration Instructions

This guide provides detailed instructions for integrating the KarirHub RSS Feed with various platforms including Zapier, WordPress, and other RSS-consuming services.

## 🤖 Zapier Integration (Social Media Automation)

### Overview

Zapier enables automated posting of job vacancies to social media platforms by monitoring the RSS feed for new items.

### Step-by-Step Setup

#### 1. Create Zap Account

1. Sign up at [zapier.com](https://zapier.com)
2. Choose a plan (Free tier works for basic usage)
3. Verify your email address

#### 2. Create New Zap

1. Click "Create Zap" in dashboard
2. Search for "RSS by Zapier"
3. Select "New Item in Feed" as trigger

#### 3. Configure RSS Trigger

**RSS Feed URL:**
```
https://karirhub-rss.workers.dev/rss
```

**Settings:**
- Polling Interval: 15 minutes (recommended)
- Number of trigger items: 10
- Choose "Will continue running" for ongoing monitoring

#### 4. Social Media Platform Setup

Choose your target platform:

##### **Twitter/X Integration**

1. Select Twitter as action app
2. Choose "Create Tweet" action
3. Connect your Twitter account
4. Map RSS fields:

| RSS Field | Twitter Field | Example |
|-----------|---------------|---------|
| Title | Text | `🔥 Lowongan Software Engineer di PT Tech - Jakarta 💰 10-15jt • S1 • Full-time` |
| Link | Attachment | `https://api.kemnaker.go.id/karirhub/vacancies/123` |
| Categories | Hashtags | `#Software #Jakarta #TechJobs` |

**Character Limit Handling:**
- Tweet content is auto-truncated to 280 characters
- Important information (salary, location) appears first
- Link is automatically shortened

##### **Facebook Page Integration**

1. Select Facebook Pages as action app
2. Choose "Create Page Post" action
3. Connect your Facebook page
4. Map RSS fields:

| RSS Field | Facebook Field | Example |
|-----------|----------------|---------|
| Title | Message | `🔥 Lowongan Software Engineer di PT Tech - Jakarta` |
| Description | Message (extended) | Full job description with requirements |
| Media:thumbnail | Photo URL | Company logo or job image |
| Link | Link | `https://api.kemnaker.go.id/karirhub/vacancies/123` |

**Rich Media Features:**
- Automatic image previews
- Link preview generation
- Multiple photo support via media namespace

##### **LinkedIn Integration**

1. Select LinkedIn as action app
2. Choose "Create Share Update" action
3. Connect your LinkedIn account
4. Map RSS fields:

| RSS Field | LinkedIn Field | Example |
|-----------|----------------|---------|
| Title | Share Comment | `🔥 Lowongan Software Engineer di PT Tech - Jakarta` |
| Description | Share Comment (extended) | Professional job summary |
| Link | Content URL | `https://api.kemnaker.go.id/karirhub/vacancies/123` |

**Professional Formatting:**
- Business-focused language
- Industry hashtag suggestions
- Company mentions via @company

##### **Instagram Integration**

1. Select Instagram for Business as action app
2. Choose "Create Media" action
3. Connect your Instagram business account
4. Map RSS fields:

| RSS Field | Instagram Field | Example |
|-----------|------------------|---------|
| Title | Caption | `🔥 Lowongan Software Engineer di PT Tech - Jakarta 💰 10-15jt` |
| Media:thumbnail | Media URL | Company logo or job graphic |
| Description | Caption (extended) | Full job details in comments |

**Visual Content:**
- Auto-generated quote-style images from job titles
- Carousel posts for multiple job details
- Story templates with "Swipe Up" links

#### 5. Testing and Activation

1. **Test the Zap**
   - Run a test with sample RSS data
   - Verify content appears correctly
   - Check character limits and formatting

2. **Activate the Zap**
   - Turn on the Zap
   - Monitor first few automated posts
   - Adjust formatting as needed

### Advanced Zapier Features

#### **Multi-Platform Posting**

Create Zaps that post to multiple platforms:

1. **Primary Zap** → Twitter (immediate posting)
2. **Secondary Zap** → Facebook (30-minute delay)
3. **Tertiary Zap** → LinkedIn (2-hour delay)

#### **Content Filtering**

Use Zapier filters to post specific job types:

- **Filter by Location**: Only post jobs in specific cities
- **Filter by Industry**: Target specific sectors
- **Filter by Salary**: Only post high-value positions

#### **Custom Formatting**

Use Zapier's formatter to enhance content:

- **Text Operations**: Add prefixes/suffixes
- **Date Formatting**: Format posting dates
- **URL Shortening**: Create custom short links

## 🌐 WordPress Integration (Website Automation)

### Overview

WordPress RSS-to-Post plugins automatically create blog posts from RSS feed items, perfect for job listing websites.

### Method 1: WP RSS Auto Importer (Recommended)

#### Installation

1. In WordPress admin: Plugins → Add New
2. Search "WP RSS Auto Importer"
3. Click "Install Now" → "Activate"

#### Configuration

1. **Go to RSS Aggregator → Import Feeds**
2. **Add New Feed**:
   ```
   Feed URL: https://karirhub-rss.workers.dev/rss
   Feed Title: KarirHub Job Listings
   Update Interval: Every hour
   Max Posts per Import: 10
   ```

3. **Post Settings**:
   - Post Type: Post (or custom "Job Listing" type)
   - Post Status: Published
   - Post Author: Admin or specific user
   - Post Format: Standard

4. **Content Mapping**:
   - Title → Post Title
   - Description → Post Excerpt
   - Content:encoded → Post Content
   - Categories → Post Categories

5. **Featured Images**:
   - Enable "Download and import featured images"
   - Source: media:thumbnail from RSS feed
   - Fallback: Default post thumbnail

#### Custom Post Template

Create a custom template in your theme:

```php
// Template Name: Job Listing
// File: template-job-listing.php

get_header(); ?>

<div class="job-listing">
  <h1><?php the_title(); ?></h1>

  <div class="job-meta">
    <span class="company"><?php echo get_post_meta(get_the_ID(), 'company_name', true); ?></span>
    <span class="location"><?php echo get_post_meta(get_the_ID(), 'location', true); ?></span>
    <span class="salary"><?php echo get_post_meta(get_the_ID(), 'salary', true); ?></span>
    <span class="date"><?php echo get_the_date(); ?></span>
  </div>

  <div class="job-content">
    <?php the_content(); ?>
  </div>

  <div class="job-footer">
    <a href="<?php echo get_post_meta(get_the_ID(), 'original_url', true); ?>" class="apply-btn" target="_blank">
      Apply Now
    </a>
    <p><em>Source: <a href="https://karirhub.kemnaker.go.id">KarirHub Kementerian Ketenagakerjaan</a></em></p>
  </div>
</div>

<?php get_footer();
```

### Method 2: FeedWordPress

#### Installation and Setup

1. **Install Plugin**: Search "FeedWordPress" in WordPress
2. **Add Feed**: Syndication → Posts & Links → Add Feed
3. **Feed URL**: `https://karirhub-rss.workers.dev/rss`
4. **Settings**:
   - Update Schedule: Every hour
   - Post Status: Published
   - Categories: Map RSS categories to WordPress categories

#### Advanced Configuration

```php
// Custom functions for FeedWordPress
// Add to theme's functions.php

function custom_job_post_metadata($post_id, $item) {
    // Extract job details from RSS item
    $title = $item->get_title();
    $description = $item->get_description();

    // Parse job details from title
    if (preg_match('/di (.*?) - (.*?)\s*💰\s*(.*?)\s*•\s*(.*)/', $title, $matches)) {
        update_post_meta($post_id, 'company_name', $matches[1]);
        update_post_meta($post_id, 'location', $matches[2]);
        update_post_meta($post_id, 'salary', $matches[3]);
        update_post_meta($post_id, 'requirements', $matches[4]);
    }

    // Store original URL
    update_post_meta($post_id, 'original_url', $item->get_link());
}
add_action('feedwordpress_update_item', 'custom_job_post_metadata', 10, 2);
```

### Method 3: Custom RSS Import Script

For complete control, create a custom WordPress plugin:

```php
<?php
/**
 * Plugin Name: KarirHub RSS Importer
 * Description: Custom RSS importer for KarirHub job listings
 */

class KarirHubRSSImporter {
    private $rss_url = 'https://karirhub-rss.workers.dev/rss';

    public function __construct() {
        add_action('wp', array($this, 'scheduled_import'));
        add_action('wp_ajax_import_jobs', array($this, 'manual_import'));
    }

    public function scheduled_import() {
        if (!wp_next_scheduled('import_karirhub_jobs')) {
            wp_schedule_event(time(), 'hourly', 'import_karirhub_jobs');
        }
    }

    public function import_jobs() {
        $rss = fetch_feed($this->rss_url);

        if (!is_wp_error($rss)) {
            $maxitems = $rss->get_item_quantity(20);
            $items = $rss->get_items(0, $maxitems);

            foreach ($items as $item) {
                $this->create_job_post($item);
            }
        }
    }

    private function create_job_post($item) {
        $post_data = array(
            'post_title' => $item->get_title(),
            'post_content' => $item->get_content(),
            'post_excerpt' => $item->get_description(),
            'post_status' => 'publish',
            'post_type' => 'job_listing'
        );

        $post_id = wp_insert_post($post_data);

        if ($post_id && !is_wp_error($post_id)) {
            // Add custom meta data
            $this->add_job_metadata($post_id, $item);

            // Add categories
            $this->add_job_categories($post_id, $item);

            // Set featured image
            $this->set_featured_image($post_id, $item);
        }
    }

    private function add_job_metadata($post_id, $item) {
        // Parse and store job details
        $title = $item->get_title();

        if (preg_match('/di (.*?) - (.*?)\s*💰\s*(.*?)\s*•\s*(.*)/', $title, $matches)) {
            update_post_meta($post_id, 'company', $matches[1]);
            update_post_meta($post_id, 'location', $matches[2]);
            update_post_meta($post_id, 'salary', $matches[3]);
            update_post_meta($post_id, 'employment_type', $matches[4]);
        }

        update_post_meta($post_id, 'source_url', $item->get_link());
        update_post_meta($post_id, 'source', 'KarirHub');
    }
}

new KarirHubRSSImporter();
```

## 📧 Email Integration

### Mailchimp Integration

1. **Create RSS Campaign**
   - Campaign Type: RSS-driven campaign
   - RSS URL: `https://karirhub-rss.workers.dev/rss`
   - Schedule: Daily/Weekly digest

2. **Email Template**
   - Subject: Latest Job Opportunities from KarirHub
   - Content: Use RSS merge tags
   - Design: Professional job listing template

### ConvertKit Integration

1. **RSS Feed Rule**
   - Broadcast Type: RSS broadcast
   - Feed URL: `https://karirhub-rss.workers.dev/rss`
   - Send when: New items detected
   - Template: Job digest format

## 🤖 Other Integrations

### IFTTT Integration

1. **Create Applet**
   - Trigger: RSS feed new item
   - Action: Social media post
   - Configuration: Similar to Zapier

### Discord Integration

1. **Webhook Setup**
   - Create Discord webhook URL
   - Use IFTTT or custom script
   - Format for Discord embeds

2. **Custom Bot**
   ```javascript
   // Discord bot example (Node.js)
   const { Client, GatewayIntentBits } = require('discord.js');
   const RSSParser = require('rss-parser');

   const client = new Client({
     intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
   });

   const parser = new RSSParser();
   const RSS_URL = 'https://karirhub-rss.workers.dev/rss';

   async function postLatestJobs() {
     const feed = await parser.parseURL(RSS_URL);
     const channel = await client.channels.fetch('YOUR_CHANNEL_ID');

     feed.items.slice(0, 5).forEach(item => {
       const embed = {
         title: item.title,
         description: item.contentSnippet,
         url: item.link,
         color: 0x0099ff,
         timestamp: new Date(item.pubDate)
       };

       channel.send({ embeds: [embed] });
     });
   }
   ```

### Telegram Integration

1. **Bot Setup**
   - Create Telegram bot via @BotFather
   - Get bot token
   - Create RSS-to-Telegram service

2. **Integration Service**
   - Use services like IFTTT or Zapier
   - Custom Telegram bot with RSS parser
   - Channel posting automation

## 📊 Integration Monitoring

### Performance Monitoring

Monitor integration health:

```bash
# Check RSS feed health
curl -w "%{time_total}\n" -o /dev/null -s https://karirhub-rss.workers.dev/rss

# Check Zapier activity
# Monitor Zapier dashboard for failed runs

# Check WordPress imports
# Monitor WordPress admin for import logs
```

### Error Handling

Common integration issues and solutions:

1. **RSS Validation Errors**
   - Validate feed at [W3C RSS Validator](https://validator.w3.org/feed/)
   - Check XML encoding issues
   - Verify required RSS elements

2. **Authentication Failures**
   - Refresh API tokens
   - Check service permissions
   - Verify webhook URLs

3. **Content Format Issues**
   - Test with sample RSS items
   - Check character encoding
   - Verify HTML escaping

## 🔧 Advanced Configuration

### Custom RSS Feed Variants

Create specialized feeds for different platforms:

#### **Social Media Feed**
- Shortened titles (≤280 characters)
- Optimized for mobile
- High engagement content only

#### **WordPress Feed**
- Full HTML content
- SEO optimized
- Complete job details

#### **Email Digest Feed**
- Summary format
- Weekly highlights
- Curated content

### Content Filtering

Implement server-side filtering:

```javascript
// Add to src/index.js for custom feeds
app.get('/rss/social', async (event) => {
  const data = await fetchJobData();
  const filtered = data.filter(job => {
    // Only high-value jobs for social media
    return job.salaryMin > 5000000 &&
           job.location.includes('Jakarta');
  });

  return generateRSS(filtered, 'social');
});

app.get('/rss/email', async (event) => {
  const data = await fetchJobData();
  const filtered = data.filter(job => {
    // Premium jobs for email digest
    return job.employmentType === 'Full-time' &&
           job.experienceLevel === 'Senior';
  });

  return generateRSS(filtered, 'email');
});
```

## 📞 Support

### Documentation Resources
- [User Guide](./USER_GUIDE.md) - General usage instructions
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions
- [Architecture](./ARCHITECTURE.md) - Technical implementation details

### Community Support
- [GitHub Issues](https://github.com/mxwlllph/karirhub-rss/issues) - Bug reports and feature requests
- [GitHub Discussions](https://github.com/mxwlllph/karirhub-rss/discussions) - Community discussions

### Platform-Specific Support
- [Zapier Documentation](https://zapier.com/help/)
- [WordPress Codex](https://codex.wordpress.org/)
- [Discord Developers](https://discord.com/developers/docs/intro)

---

**🚀 Ready to integrate?** Start with our [User Guide](./USER_GUIDE.md) for basic setup, then return here for detailed platform integration instructions.