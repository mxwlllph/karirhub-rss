# GitHub Repository Initialization Guide

## 📋 Overview

This guide covers the complete process of setting up a GitHub repository for the KarirHub RSS Feed Worker, including initial commit, remote connection, and preparation for collaborative development.

## 🚀 Quick Start (One-Time Setup)

### Option 1: Automated Script (Recommended)
```bash
# Make the script executable
chmod +x scripts/git-init.sh

# Run the initialization script
./scripts/git-init.sh

# Connect to GitHub (using the actual repository URL)
git remote add origin https://github.com/mxwlllph/karirhub-rss.git
git push -u origin main
```

### Option 2: Manual Setup
```bash
# Initialize git repository
git init

# Configure git (optional)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Add files and commit
git add .
git commit -m "Initial commit: KarirHub RSS Feed Worker"

# Connect to GitHub
git remote add origin https://github.com/mxwlllph/karirhub-rss.git
git push -u origin main
```

## 🔧 Detailed Setup Process

### 1. Create GitHub Repository

1. **Go to GitHub**: [github.com](https://github.com)
2. **Sign in** to your account
3. **Click "+" → "New repository"**
4. **Fill repository details**:
   - Repository name: `karirhub-rss`
   - Description: `Cloudflare Worker RSS Feed Generator for KarirHub Job Listings`
   - Visibility: Choose Public or Private
   - **Important**: Do NOT initialize with README, .gitignore, or license

### 2. Initialize Local Repository

#### Prerequisites
- Git installed (`git --version`)
- In project directory: `cd worker-karirhub`

#### Run Initialization Script
```bash
# Navigate to project directory
cd path/to/worker-karirhub

# Make script executable
chmod +x scripts/git-init.sh

# Run initialization
./scripts/git-init.sh
```

#### Manual Initialization (Alternative)
```bash
# Initialize git repository
git init

# Configure git (optional)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Add all files (respecting .gitignore)
git add .

# Create initial commit
git commit -m "Initial commit: KarirHub RSS Feed Worker

🚀 Features:
• Cloudflare Worker RSS feed generation
• KarirHub API integration
• Social media optimization
• WordPress plugin compatibility"

# Set main branch
git branch -M main
```

### 3. Connect Local to Remote

#### Add Remote Repository
```bash
# Add remote (using the actual repository URL)
git remote add origin https://github.com/mxwlllph/karirhub-rss.git

# Verify remote
git remote -v
```

#### Push to GitHub
```bash
# Push main branch to GitHub
git push -u origin main

# You may be prompted for GitHub credentials
```

### 4. Verify Repository Setup

#### Check Repository Status
```bash
# Check git status
git status

# Check branches
git branch -a

# Check remote
git remote -v

# Check log
git log --oneline
```

#### Verify GitHub Repository
1. Visit your GitHub repository
2. Check that all files are present
3. Verify README.md is displayed
4. Confirm .gitignore is working (dev-doc/ should not be visible)

## 🌿 Branch Strategy Setup

### Create Development Branch
```bash
# Create develop branch from main
git checkout main
git checkout -b develop

# Push develop to remote
git push -u origin develop
```

### Configure Branch Protection
In GitHub, go to **Settings → Branches → Branch protection rule**:

#### Main Branch Protection
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Require pull request reviews before merging
- ✅ Limit who can dismiss pull request reviews
- ✅ Require conversation resolution before merging

#### Required Status Checks
- Build (if using CI/CD)
- Test (automated tests)
- Lint (code quality checks)

## 🔐 Security Configuration

### 1. GitHub Secrets Setup
In GitHub repository, go to **Settings → Secrets and variables → Actions**:

Add these secrets if using GitHub Actions:
- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
- `KV_NAMESPACE_ID`: KV namespace ID for production

### 2. Branch Protection Rules
Enable branch protection for:
- **main branch**: Require pull requests, reviews, and status checks
- **develop branch**: Require status checks for automated tests

### 3. Repository Permissions
Go to **Settings → Collaborators & teams**:
- **Owners**: Full administrative access
- **Maintainers**: Can push, merge, manage issues
- **Developers**: Can push to branches, create PRs
- **Viewers**: Read-only access

## 🔄 Development Workflow Setup

### 1. Clone Repository (For Team Members)
```bash
# Clone the repository
git clone https://github.com/yourusername/karirhub-rss-feed.git
cd karirhub-rss-feed

# Install dependencies
npm install

# Verify setup
npm test
```

### 2. Feature Branch Workflow
```bash
# Create feature branch
git checkout develop
git checkout -b feature/social-media-optimization

# Make changes...
git add .
git commit -m "feat(social): Add Twitter character limit optimization"

# Push to remote
git push origin feature/social-media-optimization
```

### 3. Pull Request Process
1. Create Pull Request on GitHub
2. Set base branch: `develop`
3. Set compare branch: `feature/your-feature`
4. Add description and link issues
5. Request reviews from team members
6. Ensure all checks pass
7. Merge to `develop` when approved

## 📋 Repository Configuration Checklist

### ✅ Initial Setup
- [ ] GitHub repository created
- [ ] Local git repository initialized
- [ ] Remote connection established
- [ ] Initial commit pushed to main
- [ ] .gitignore properly configured

### ✅ Branch Configuration
- [ ] Main branch protection enabled
- [ ] Develop branch created
- [ ] Branch protection rules configured
- [ ] Required status checks set up

### ✅ Team Setup
- [ ] Collaborators added with appropriate permissions
- [ ] CODEOWNERS file created (optional)
- [ ] Issue templates created
- [ ] Pull request templates added

### ✅ Automation (Optional)
- [ ] GitHub Actions workflows set up
- [ ] Dependabot enabled for dependency updates
- [ ] Code scanning configured
- [ ] Security scanning enabled

## 🔧 Advanced Configuration

### 1. Create CODEOWNERS File
Create `.github/CODEOWNERS`:
```yaml
# Codeowners file for KarirHub RSS Feed Worker
* @maintainer-username
```

### 2. Create Issue Templates
Create `.github/ISSUE_TEMPLATE/bug_report.md`:
```markdown
---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Safari, Firefox]
- Node.js version: [e.g. 18.0.0]
- Cloudflare account type: [Free/Pro]

**Additional context**
Add any other context about the problem here.
```

### 3. Create Pull Request Template
Create `.github/pull_request_template.md`:
```markdown
## 📋 Description
Brief description of changes made.

## 🎯 Purpose
Why these changes are needed.

## 🔄 Changes
- Change 1
- Change 2
- Change 3

## 🧪 Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] RSS feed validated
- [ ] Performance tested

## 📸 Screenshots
Add screenshots to show visual changes.

## 📚 Documentation
- [ ] Updated README.md
- [ ] Added inline comments
- [ ] Updated API documentation

## 🔗 Related Issues
Closes #123
Related to #456
```

### 4. Setup GitHub Actions (Optional)
Create `.github/workflows/ci.yml`:
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    - name: Install dependencies
      run: npm ci
    - name: Run tests
      run: npm test

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
    - uses: actions/checkout@v3
    - name: Deploy to Staging
      run: wrangler deploy --env staging
      env:
        CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
    - uses: actions/checkout@v3
    - name: Deploy to Production
      run: wrangler deploy --env production
      env:
        CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Authentication Errors
```bash
# Error: Permission denied (publickey)
ssh-keygen -t rsa -b 4096 -C "your.email@example.com"
# Add SSH key to GitHub: Settings → SSH and GPG keys

# Error: Authentication failed for 'https://github.com'
git config --global credential.helper store
git push
# Enter GitHub username and token when prompted
```

#### 2. Remote Repository Issues
```bash
# Check remote configuration
git remote -v

# Update remote URL
git remote set-url origin https://github.com/yourusername/karirhub-rss-feed.git

# Remove and re-add remote
git remote remove origin
git remote add origin https://github.com/yourusername/karirhub-rss-feed.git
```

#### 3. Push Issues
```bash
# Force push (use with caution)
git push --force-with-lease origin main

# Push to specific branch
git push origin feature/your-feature
```

#### 4. Branch Protection Errors
- Temporarily disable branch protection for setup
- Ensure all status checks pass before merging
- Contact repository owner for permission changes

### Recovery Commands
```bash
# Reset to last known good state
git reflog
git reset --hard HEAD@{1}

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1
```

## 📊 Repository Monitoring

### GitHub Insights
Monitor repository health with GitHub Insights:
- **Pulse**: Activity overview
- **Traffic**: Page views and clones
- **Commits**: Contribution patterns
- **Issues**: Issue resolution time

### Git Commands for Monitoring
```bash
# Show repository statistics
git log --stat --summary

# Show commit history
git log --oneline --graph --all

# Show branch information
git branch -a --vv

# Show remote branches
git remote show origin

# Show tag information
git tag -l
```

## 📚 Additional Resources

### GitHub Documentation
- [GitHub Docs](https://docs.github.com/)
- [GitHub Getting Started](https://docs.github.com/en/get-started/quickstart)
- [GitHub CLI](https://cli.github.com/)

### Git Resources
- [Pro Git Book](https://git-scm.com/book)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)

### Repository Best Practices
- [Repository Structure](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repository-structure)
- [Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/about-protected-branches)
- [Pull Request Template](https://docs.github.com/en/commits/using-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-request-templates)

---

## 🎉 Success Criteria

Your GitHub repository is properly initialized when:

✅ **Basic Setup**
- Repository created and accessible
- All source files are committed
- .gitignore is properly configured
- Initial commit is visible

✅ **Branch Structure**
- Main branch is protected
- Develop branch is created
- Branch protection rules are active

✅ **Team Access**
- Collaborators have appropriate permissions
- CODEOWNERS file is configured
- Issue and PR templates are created

✅ **Collaboration Ready**
- Pull request workflow is established
- Automated testing is configured
- Documentation is complete

Once these criteria are met, your repository is ready for collaborative development and deployment!

---

## 🆘 Need Help?

For project-specific issues:
1. Check [LOCAL_DEVELOPMENT.md](../LOCAL_DEVELOPMENT.md)
2. Review [TESTING_GUIDE.md](../dev-doc/testing/TESTING_GUIDE.md)
3. Consult [DEPLOYMENT_WORKFLOW.md](../dev-doc/deployment/DEPLOYMENT_WORKFLOW.md)

For GitHub-specific issues:
1. [GitHub Support](https://support.github.com/)
2. [GitHub Community Forum](https://github.community)
3. [GitHub Documentation](https://docs.github.com/)