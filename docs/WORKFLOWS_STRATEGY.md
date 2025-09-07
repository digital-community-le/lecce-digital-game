# GitHub Actions Workflows Strategy

This document explains the GitHub Actions workflow strategy and when each workflow runs.

## Workflows Overview

### 1. `ci.yml` - Continuous Integration
- **Triggers**: 
  - Push to `develop` branch
  - Pull requests to `main` or `develop` branches
- **Purpose**: Development testing and validation
- **Features**:
  - Tests on multiple Node.js versions (20.x, 22.x)
  - Type checking
  - Smart test strategy
  - Coverage reports
  - Build verification (using `npm run build` - no SW version update)
- **Use case**: Validate changes before merging

### 2. `firebase-hosting-merge.yml` - Production Deployment
- **Triggers**: 
  - Push to `main` branch (merge events)
- **Purpose**: Production deployment to Firebase
- **Features**:
  - Complete test suite (`test:smart:all`)
  - Production build with SW versioning (`npm run build:prod`)
  - Firebase deployment
  - Coverage reports
- **Use case**: Deploy validated changes to production

### 3. `firebase-hosting-pull-request.yml` - Preview Deployment
- **Triggers**: 
  - Pull requests to `main` branch
- **Purpose**: Deploy preview versions for PR review
- **Features**:
  - Quick build and deploy to preview channel
  - Uses `npm run build:prod` for realistic preview
- **Use case**: Preview changes before merging

### 4. `full-test.yml` - Comprehensive Testing
- **Triggers**: Manual dispatch or scheduled
- **Purpose**: Run exhaustive tests
- **Use case**: Deep testing when needed

### 5. `scheduled-tests.yml` - Scheduled Validation
- **Triggers**: Scheduled runs
- **Purpose**: Regular health checks
- **Use case**: Catch regressions over time

## Workflow Strategy

```
develop branch:
├── Push → ci.yml (testing)
└── PR to main → ci.yml + firebase-hosting-pull-request.yml (testing + preview)

main branch:
└── Push (merge) → firebase-hosting-merge.yml (testing + production deploy)
```

## Benefits

1. **No Duplication**: Each workflow has a distinct purpose and trigger
2. **Resource Efficiency**: No redundant test runs
3. **Fast Feedback**: Quick CI for development, comprehensive testing for production
4. **Preview Capability**: PR previews for stakeholder review
5. **Production Safety**: Full test suite before production deployment

## Commands Used

- **Development/CI**: `npm run build` (preserves SW placeholder)
- **Production/Preview**: `npm run build:prod` (updates SW version)
- **Local Development**: `npm run build` (preserves SW placeholder)
