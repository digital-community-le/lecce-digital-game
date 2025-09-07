# Build Commands

This document explains the different build commands available in the project.

## Commands

### `npm run build`
- **Purpose**: Local development build
- **Behavior**: 
  - Builds the application without updating the Service Worker cache version
  - Keeps the `%%CACHE_VERSION%%` placeholder in the Service Worker
  - Used for local testing and development

### `npm run build:prod`
- **Purpose**: Production build
- **Behavior**:
  - Updates the Service Worker cache version with a timestamp
  - Builds the application for production deployment
  - Used by GitHub Actions for deployment to Firebase

### `npm run build:sw`
- **Purpose**: Update Service Worker version only
- **Behavior**: Updates the cache version in the Service Worker without building

### `npm run restore:sw`
- **Purpose**: Restore Service Worker placeholder
- **Behavior**: Restores the `%%CACHE_VERSION%%` placeholder in the Service Worker

## Usage Guidelines

1. **For local development**: Use `npm run build`
2. **For production deployment**: Use `npm run build:prod` (automatically used by GitHub Actions)
3. **To restore SW after accidental update**: Use `npm run restore:sw`

## Important Notes

- The Service Worker in the repository should always have the `%%CACHE_VERSION%%` placeholder
- Never commit changes with actual timestamp versions in the Service Worker
- GitHub Actions automatically use `build:prod` for deployments
