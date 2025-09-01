# Overview

This is a Progressive Web App (PWA) for the DevFest Lecce 2025 event. It's a retro 8-bit styled interactive game called "Il Sigillo di Lecce" (The Lecce Seal) featuring four distinct challenges in a gamified experience. The application uses a fantasy RPG-style narrative where users collect gems by completing networking, puzzle-solving, debugging, and social media challenges. The app operates in a local-first architecture with optional remote synchronization, designed to work offline and provide an engaging community-building experience for event attendees.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: NES.css for retro 8-bit aesthetics combined with Tailwind CSS for utility-first styling
- **State Management**: Custom React hook (`useGameStore`) implementing a reactive store pattern with localStorage persistence
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui component library for accessible, customizable components
- **PWA Features**: Service worker implementation for offline functionality, web app manifest for installability

## Backend Architecture
- **Server Framework**: Express.js with TypeScript
- **Development Setup**: Integrated development server with Vite middleware for seamless full-stack development
- **API Structure**: RESTful API endpoints prefixed with `/api` (currently minimal implementation)
- **Build Process**: ESBuild for server bundling, separate client and server build processes

## Data Storage Solutions
- **Primary Storage**: Browser localStorage with structured key-value pairs using `ldc:*` prefix
- **Schema**: Zod validation schemas for type safety across user profiles, game progress, challenge states, and social proofs
- **Persistence Strategy**: Local-first architecture with append-only operations for scans and game events
- **Optional Remote Sync**: Configurable backend synchronization via `remoteBackend` flag in game configuration

## Authentication and Authorization
- **User Identification**: URL query parameter based user ID system (from DevFest redirect)
- **No Traditional Auth**: Stateless approach using localStorage for user persistence
- **QR Code System**: Client-side QR generation and parsing for user-to-user interactions
- **Privacy First**: All user data stored locally by default, optional remote sync requires explicit configuration

## External Dependencies

- **Database**: Drizzle ORM configured for PostgreSQL (via Neon serverless)
- **Styling Libraries**: 
  - NES.css for retro gaming aesthetics
  - Google Fonts (Press Start 2P, Nunito)
- **QR Code Functionality**: qrcode library for client-side QR generation and parsing
- **UI Framework**: Comprehensive Radix UI ecosystem for accessible components
- **Development Tools**: 
  - Replit-specific plugins for runtime error handling and code mapping
  - PostCSS with Tailwind for CSS processing
- **Media Processing**: Planned Tesseract.js integration for OCR functionality in Social Arena challenge
- **Query Management**: TanStack React Query for data fetching and caching (minimal usage currently)