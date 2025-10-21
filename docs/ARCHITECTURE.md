# Technical Architecture - KarirHub RSS Feed Generator

## 🏗️ System Architecture Overview

The KarirHub RSS Feed Generator is built on Cloudflare Workers with a modular JavaScript architecture designed for high performance, scalability, and maintainability.

## 📋 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge Network                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────  │
│  │   User Request  │────▶│  Cloudflare     │────▶│  KV Storage    │
│  │   (RSS/JSON)    │    │  Worker         │    │  (Cache)       │
│  └─────────────────┘    │                 │    └──────────────  │
│                         │                 │                    │
│  ┌─────────────────┐    │  ┌─────────────┐│    ┌──────────────  │
│  │  Social Media   │────▶│  │   Router    ││────▶│  D1 Database   │
│  │  Platforms      │    │  │             ││    │  (Analytics)   │
│  └─────────────────┘    │  └─────────────┘│    └──────────────  │
│                         │                 │                    │
│  ┌─────────────────┐    │  ┌─────────────┐│                    │
│  │   WordPress     │────▶│  │   Modules   ││                    │
│  │   Websites      │    │  │             ││                    │
│  └─────────────────┘    │  └─────────────┘│                    │
│                         │                 │                    │
│                         └─────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │    KarirHub API         │
                    │  api.kemnaker.go.id     │
                    └─────────────────────────┘
```

## 🔧 Core Components

### 1. Entry Point (`src/index.js`)

The main worker orchestrates all functionality:

```javascript
// Core responsibilities
- Request routing and parsing
- Response format determination
- Error handling and logging
- Module coordination
- Performance monitoring
```

**Key Features:**
- Multi-endpoint support (`/rss`, `/json`, `/health`, `/stats`)
- Content negotiation (RSS vs JSON)
- Comprehensive error handling
- Request/response optimization

### 2. Module System

The application uses a modular architecture with clear separation of concerns:

#### **API Fetcher (`src/modules/api-fetcher.js`)**
```javascript
// Handles all external API interactions
- KarirHub API communication
- Rate limiting and retries
- Response validation
- Error recovery strategies
- Request optimization
```

**Architecture Patterns:**
- Exponential backoff retry logic
- Circuit breaker pattern for API failures
- Request batching for performance
- Response caching integration

#### **Data Aggregator (`src/modules/data-aggregator.js`)**
```javascript
// Data processing and enrichment
- Multi-source data merging
- Content optimization per platform
- Social media formatting
- SEO enhancement
- Content validation
```

**Processing Pipeline:**
1. **Raw Data Ingestion** - API responses
2. **Data Normalization** - Standardize formats
3. **Content Enrichment** - Add metadata and formatting
4. **Platform Optimization** - Tailor content for each platform
5. **Quality Validation** - Ensure content standards

#### **RSS Generator (`src/modules/rss-generator.js`)**
```javascript
// RSS feed creation and validation
- RSS 2.0 specification compliance
- XML generation and escaping
- Media namespace support
- Character limit handling
- Feed optimization
```

**RSS Structure:**
```xml
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <!-- Channel metadata -->
    <item>
      <!-- Job listing data -->
    </item>
  </channel>
</rss>
```

#### **Cache Manager (`src/modules/cache-manager.js`)**
```javascript
// Multi-tier caching strategy
- KV storage integration
- Cache invalidation logic
- Performance optimization
- Cache hit tracking
- Stale-while-revalidate pattern
```

**Caching Strategy:**
- **L1 Cache**: Worker memory (per-request)
- **L2 Cache**: KV storage (distributed)
- **L3 Cache**: CDN edge (Cloudflare)

#### **Analytics (`src/modules/analytics.js`)**
```javascript
// Performance monitoring and logging
- Request tracking
- Performance metrics
- Error logging
- Usage statistics
- Health monitoring
```

### 3. Configuration System (`src/config/environment.js`)

Environment-based configuration management:

```javascript
const config = {
  development: {
    apiBaseUrl: 'https://api.kemnaker.go.id/karirhub/catalogue/v1',
    cacheTTL: 300,        // 5 minutes
    maxJobsPerFeed: 5,
    logLevel: 'debug'
  },
  staging: {
    apiBaseUrl: 'https://api.kemnaker.go.id/karirhub/catalogue/v1',
    cacheTTL: 900,        // 15 minutes
    maxJobsPerFeed: 20,
    logLevel: 'info'
  },
  production: {
    apiBaseUrl: 'https://api.kemnaker.go.id/karirhub/catalogue/v1',
    cacheTTL: 1800,       // 30 minutes
    maxJobsPerFeed: 50,
    logLevel: 'warn'
  }
};
```

## 🗄️ Data Architecture

### Data Flow Pipeline

```
KarirHub API → API Fetcher → Data Aggregator → RSS Generator → Cache Manager → User Response
      ↓              ↓              ↓              ↓              ↓              ↓
  Raw JSON     Validated Data  Enriched Data   RSS XML      Cached Feed    HTTP Response
```

### Data Models

#### **Job Listing Model**
```javascript
{
  id: string,                    // Unique identifier
  title: string,                 // Job title
  companyName: string,           // Employer name
  location: string,              // Job location
  description: string,           // Job description
  requirements: string[],        // Job requirements
  salaryMin: number,             // Minimum salary
  salaryMax: number,             // Maximum salary
  employmentType: string,        // Full-time, Part-time, Contract
  experienceLevel: string,       // Junior, Senior, Manager
  education: string,             // Education requirements
  industry: string,              // Industry category
  postedDate: Date,              // Posting date
  expiryDate: Date,              // Application deadline
  applicationUrl: string,        // Application link
  companyLogo: string,           // Company logo URL
  isRemote: boolean,             // Remote work option
  skills: string[],              // Required skills
  benefits: string[],            // Job benefits
  source: string                 // Data source
}
```

#### **RSS Item Model**
```javascript
{
  title: string,                 // Optimized title with emojis
  description: string,           // Brief description
  content: string,               // Full HTML content
  link: string,                  // Original job URL
  guid: string,                  // Unique identifier
  pubDate: Date,                 // Publication date
  author: string,                // Company name
  categories: string[],          // Industry and location tags
  media: {                       // Media attachments
    thumbnail: string,           // Company logo URL
    content: string              // Additional images
  },
  extensions: {                  // Custom RSS extensions
    salary: string,              // Salary range
    location: string,            // Location
    employmentType: string,      // Employment type
    experienceLevel: string      // Experience level
  }
}
```

## 🚀 Performance Architecture

### Optimization Strategies

#### **1. Edge Computing**
- Global CDN distribution via Cloudflare
- Request routing to nearest edge location
- Automatic geographic optimization

#### **2. Caching Layers**
```
┌─────────────────┐    TTL: 5 minutes
│   Browser Cache │ ──────────────────┐
└─────────────────┘                   │
                                      ▼
┌─────────────────┐    TTL: 30 minutes
│   CDN Cache      │ ──────────────────┤
│  (Cloudflare)   │                   │
└─────────────────┘                   ▼
                                      ┌─────────────────┐    TTL: 15 minutes
                                      │   KV Storage     │ ──────────────────┤
                                      │  (Cloudflare)    │                   │
                                      └─────────────────┘                   ▼
                                                                          ┌─────────────────┐
                                                                          │   API Response  │
                                                                          │   (KarirHub)    │
                                                                          └─────────────────┘
```

#### **3. Request Optimization**
- HTTP/2 multiplexing
- Response compression (gzip, brotli)
- Conditional requests (ETag, Last-Modified)
- Keep-alive connections

#### **4. Data Processing**
- Stream processing for large datasets
- Lazy loading of job details
- Background refresh of cache
- Graceful degradation on failures

## 🔒 Security Architecture

### Security Measures

#### **1. Input Validation**
```javascript
// Sanitize all user inputs
- URL parameter validation
- Content length limits
- Character encoding validation
- XML entity escaping
```

#### **2. Rate Limiting**
- Per-client request limits
- API rate limiting compliance
- DDoS protection via Cloudflare
- Intelligent throttling

#### **3. Secure Headers**
```javascript
// Security headers implementation
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000",
  "Content-Security-Policy": "default-src 'self'"
}
```

#### **4. Data Protection**
- No sensitive data in responses
- Encrypted communications (HTTPS only)
- API key protection
- Error message sanitization

## 🔍 Monitoring Architecture

### Observability Stack

#### **1. Health Monitoring**
```javascript
// Health check endpoints
GET /health - Service status
GET /stats - Performance metrics
GET /version - Build information
```

#### **2. Performance Metrics**
- Response time tracking (p50, p95, p99)
- Cache hit rate monitoring
- Error rate tracking
- Request volume analytics

#### **3. Error Tracking**
- Structured error logging
- Stack trace collection
- Error categorization
- Alert threshold configuration

#### **4. Analytics Dashboard**
Key metrics displayed:
```
┌─────────────────────────────────┐
│    Performance Dashboard        │
├─────────────────────────────────┤
│ Response Time: 145ms (p95)      │
│ Cache Hit Rate: 87.3%           │
│ Error Rate: 0.12%               │
│ Requests/min: 245               │
│ Uptime: 99.97%                  │
└─────────────────────────────────┘
```

## 🌐 Integration Architecture

### API Integration Patterns

#### **1. KarirHub API Integration**
```javascript
// API endpoint structure
GET /industrial-vacancies?page={page}&limit={limit}
GET /vacancies/{id}
GET /employers/{id}

// Response caching strategy
- Job listings: 15 minutes
- Job details: 1 hour
- Employer info: 24 hours
```

#### **2. RSS Consumer Integration**
Support for various RSS consumers:
- **Zapier**: Webhook-based automation
- **WordPress**: Plugin-based content import
- **Email Clients**: RSS-to-email services
- **Custom Applications**: REST API consumption

#### **3. Webhook Architecture**
```javascript
// Webhook event types
JOB_POSTED - New job listing created
JOB_UPDATED - Existing job modified
JOB_EXPIRED - Job listing expired
SYSTEM_ALERT - Performance or error alerts
```

## 🔧 Deployment Architecture

### Multi-Environment Setup

#### **Development Environment**
```
Location: Local development
URL: http://localhost:8787
Features: Debug logging, mock data, hot reload
```

#### **Staging Environment**
```
Location: Cloudflare Workers (staging)
URL: https://karirhub-rss-staging.workers.dev
Features: Real API, testing data, performance monitoring
```

#### **Production Environment**
```
Location: Cloudflare Workers (production)
URL: https://karirhub.com
Features: Full performance, analytics, monitoring
```

### Deployment Pipeline

```
Git Push → CI/CD Pipeline → Tests → Build → Deploy Staging → Validate → Deploy Production
```

#### **CI/CD Integration**
```yaml
# GitHub Actions workflow
- Automated testing on push
- Staging deployment on develop branch
- Production deployment on main branch
- Health checks post-deployment
- Rollback on failure
```

## 📊 Scalability Architecture

### Horizontal Scaling

#### **Cloudflare Workers Benefits**
- Automatic scaling from 0 to millions of requests
- Global edge network distribution
- No server management required
- Pay-per-request pricing model

#### **Load Handling**
```
┌─────────────────────────────────┐
│         Load Balancer           │
│    (Cloudflare Edge Network)    │
└─────────────────────────────────┘
                  │
         ┌────────┼────────┐
         ▼        ▼        ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Worker 1 │ │ Worker 2 │ │ Worker 3 │
│  (Asia)  │ │ (Europe) │ │ (Americas)│
└─────────┘ └─────────┘ └─────────┘
```

#### **Performance Optimization**
- Geographic request routing
- Edge-side includes for static content
- Intelligent caching strategies
- Resource pooling and reuse

## 🔮 Future Architecture Considerations

### Planned Enhancements

#### **1. Advanced Analytics**
- Click-through rate tracking
- User engagement metrics
- Conversion funnel analysis
- A/B testing framework

#### **2. Machine Learning Integration**
- Job recommendation algorithms
- Content quality scoring
- Personalized feed generation
- Predictive analytics

#### **3. Advanced Integration**
- GraphQL API support
- WebSocket real-time updates
- Mobile app push notifications
- Enterprise SSO integration

#### **4. Enhanced Features**
- Multi-language support
- Advanced filtering options
- Custom branding capabilities
- White-label solutions

---

**This architecture document provides the technical foundation for understanding how the KarirHub RSS Feed Generator operates, scales, and integrates with external systems.**