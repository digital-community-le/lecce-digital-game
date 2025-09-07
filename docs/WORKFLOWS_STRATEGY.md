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
  - **Only when application code changes** (client/, server/, shared/, public/, configs)
- **Purpose**: Production deployment to Firebase
- **Features**:
  - Complete test suite (`test:smart:all`)
  - Production build with SW versioning (`npm run build:prod`)
  - Firebase deployment
  - Coverage reports
- **Use case**: Deploy validated changes to production
- **Path filters**: `client/`, `server/`, `shared/`, `public/`, `package.json`, `vite.config.ts`, etc.

### 3. `firebase-hosting-pull-request.yml` - Preview Deployment
- **Triggers**: 
  - Pull requests to `main` branch
  - **Only when application code changes** (client/, server/, shared/, public/, configs)
- **Purpose**: Deploy preview versions for PR review
- **Features**:
  - Quick build and deploy to preview channel
  - Uses `npm run build:prod` for realistic preview
- **Use case**: Preview changes before merging
- **Path filters**: Same as production deployment

### 4. `docs-config-only.yml` - Documentation & Configuration
- **Triggers**:
  - Push to `main` branch or PR
  - **Only when documentation/config changes** (docs/, scripts/, README.md, etc.)
- **Purpose**: Validate documentation and configuration changes
- **Features**:
  - Type checking
  - Script validation
  - Documentation validation
  - **No deployment** - just validation
- **Use case**: Fast validation for non-application changes
- **Path filters**: `docs/`, `README.md`, `scripts/`, `.github/workflows/`, etc.

### 5. `full-test.yml` - Comprehensive Testing
- **Triggers**: Manual dispatch or scheduled
- **Purpose**: Run exhaustive tests
- **Use case**: Deep testing when needed

### 6. `scheduled-tests.yml` - Scheduled Validation
- **Triggers**: Scheduled runs
- **Purpose**: Regular health checks
- **Use case**: Catch regressions over time

## Workflow Strategy

```
develop branch:
├── Push → ci.yml (testing)
└── PR to main → ci.yml + firebase-hosting-pull-request.yml (testing + preview) OR docs-config-only.yml

main branch:
├── App code changes → firebase-hosting-merge.yml (testing + production deploy)
└── Docs/config only → docs-config-only.yml (validation only, no deploy)
```

## Path-Based Triggering

### Application Code Changes (Triggers Deployment)
- `client/` - Frontend React application
- `server/` - Backend Node.js server
- `shared/` - Shared TypeScript schemas
- `public/` - Static assets
- `package.json`, `package-lock.json` - Dependencies
- `vite.config.ts`, `tsconfig.json` - Build configuration
- `tailwind.config.ts`, `postcss.config.js` - Styling configuration
- `firebase.json` - Firebase configuration

### Documentation/Config Only (No Deployment)
- `docs/` - Documentation files
- `README.md`, `replit.md` - Project documentation
- `scripts/` - Build and utility scripts
- `.husky/` - Git hooks
- `.gitignore` - Git configuration
- `components.json` - UI components configuration
- `tsconfig.check.json` - TypeScript check configuration
- `.github/workflows/` - Workflow definitions (except Firebase workflows)

## Benefits

1. **No Unnecessary Deployments**: Documentation changes don't trigger expensive deploys
2. **Resource Efficiency**: Saves GitHub Actions minutes and Firebase hosting quotas
3. **Faster Feedback**: Quick validation for docs/config changes
4. **Clear Separation**: Different workflows for different types of changes
5. **Cost Optimization**: Reduced Firebase function executions and hosting operations

## Commands Used

- **Development/CI**: `npm run build` (preserves SW placeholder)
- **Production/Preview**: `npm run build:prod` (updates SW version)
- **Local Development**: `npm run build` (preserves SW placeholder)
- **Docs/Config**: Only validation, no build needed
