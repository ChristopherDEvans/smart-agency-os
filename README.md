# Smart Agency OS

> AI-powered SaaS platform for digital agencies to manage clients, engagements, proposals, and reports

[![Built with Manus](https://img.shields.io/badge/Built%20with-Manus-00D9FF)](https://manus.im)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Smart Agency OS is a comprehensive client relationship management platform designed specifically for digital agencies. It combines traditional CRM functionality with AI-powered features to streamline proposal generation, client reporting, and business intelligence.

## Features

### Core Functionality
- **Multi-tenant Architecture** - Support multiple agencies per user with complete data isolation
- **Client Management** - Track clients, contacts, and relationships with status workflows
- **Engagement Tracking** - Manage active projects with auto-generated onboarding checklists
- **Communication Logging** - Record all client interactions (calls, meetings, emails)
- **Dashboard Analytics** - Real-time KPIs including MRR, active clients, and pipeline value

### AI-Powered Features
- **AI Proposal Generator** - Automatically create professional proposals from project briefs using GPT-4
- **AI Co-Pilot Assistant** - Context-aware chatbot that answers questions about your business metrics and clients
- **Intelligent Insights** - Get recommendations on at-risk clients and priority actions

### Integrations
- **Gmail Integration** - View unread emails directly in the unified inbox via MCP (Model Context Protocol)
- **Activity Tracking** - Automatic logging of all system activities for audit trails

## Tech Stack

**Frontend**
- React 19 with TypeScript
- Tailwind CSS 4 for styling
- shadcn/ui component library
- Wouter for routing
- tRPC React for type-safe API calls

**Backend**
- Express 4
- tRPC 11 for end-to-end type safety
- Drizzle ORM with MySQL/TiDB
- OpenAI GPT-4 integration
- Gmail MCP integration

**Infrastructure**
- Manus deployment platform
- Auto-scaling with global CDN
- S3-compatible object storage
- OAuth authentication

## Getting Started

### Prerequisites
- Node.js 22.x
- pnpm package manager
- MySQL/TiDB database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ChristopherDEvans/smart-agency-os.git
cd smart-agency-os
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
# Copy the example env file
cp .env.example .env

# Required environment variables:
# - DATABASE_URL: MySQL connection string
# - JWT_SECRET: Session signing secret
# - OAUTH_SERVER_URL: OAuth provider URL
# - BUILT_IN_FORGE_API_KEY: Manus API key for LLM
# - BUILT_IN_FORGE_API_URL: Manus API endpoint
```

4. Push database schema:
```bash
pnpm db:push
```

5. Start development server:
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
smart-agency-os/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/           # tRPC client setup
│   │   └── App.tsx        # Main app component
│   └── public/            # Static assets
├── server/                # Backend Express + tRPC
│   ├── _core/            # Framework plumbing
│   ├── routers.ts        # tRPC API routes
│   ├── db.ts             # Database queries
│   ├── ai.ts             # AI service (proposals, reports)
│   ├── copilot.ts        # AI Co-Pilot service
│   └── gmail.ts          # Gmail MCP integration
├── drizzle/              # Database schema
│   └── schema.ts         # Table definitions
└── shared/               # Shared types and constants
```

## Key Workflows

### Creating a Proposal with AI
1. Navigate to Proposals → New Proposal
2. Select client and enter project brief
3. Click "Generate with AI"
4. Review and edit the AI-generated content
5. Change status to "Sent" when ready

### Using the AI Co-Pilot
1. Navigate to AI Co-Pilot
2. Ask questions like:
   - "What's my total MRR?"
   - "Show me at-risk clients"
   - "Summarize my active engagements"
3. The assistant analyzes your data and provides insights

### Gmail Integration
1. Navigate to Inbox
2. Authorize Gmail access (OAuth)
3. View unread emails
4. Click "Refresh" to sync latest messages

## Database Schema

The application uses 14 tables:

- `users` - User accounts and authentication
- `agencies` - Agency profiles
- `agency_members` - Team membership
- `clients` - Client companies
- `contacts` - Individual contacts
- `engagements` - Active projects
- `onboarding_tasks` - Engagement checklists
- `proposals` - Generated proposals
- `reports` - Client reports
- `communications` - Email/call logs
- `chat_messages` - AI Co-Pilot history
- `attachments` - File uploads
- `activities` - Audit log
- `vector_embeddings` - AI context (future)

## API Documentation

The application uses tRPC for type-safe APIs. Key routers:

- `agency` - Agency CRUD operations
- `clients` - Client management
- `engagement` - Engagement tracking
- `proposal` - Proposal generation
- `report` - Report creation
- `communication` - Communication logging
- `copilot` - AI assistant queries
- `gmail` - Email integration
- `activity` - Activity logging

## Development

### Running Tests
```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e
```

### Database Migrations
```bash
# Generate migration
pnpm db:generate

# Apply migration
pnpm db:push
```

### Code Quality
```bash
# Type checking
pnpm type-check

# Linting
pnpm lint
```

## Deployment

The application is designed to deploy on the Manus platform:

1. Save a checkpoint in the Manus interface
2. Click "Publish" in the Management UI
3. Your app will be deployed with auto-scaling and CDN

For custom deployments:
- Build: `pnpm build`
- Start: `pnpm start`
- Ensure all environment variables are set

## Environment Variables

### Required
- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - Session cookie signing secret
- `OAUTH_SERVER_URL` - OAuth backend URL
- `BUILT_IN_FORGE_API_KEY` - Manus LLM API key
- `BUILT_IN_FORGE_API_URL` - Manus API endpoint

### Optional
- `VITE_APP_TITLE` - Application title (default: "Smart Agency OS")
- `VITE_APP_LOGO` - Logo URL
- `OWNER_OPEN_ID` - Owner's OAuth ID (auto-admin)

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Manus](https://manus.im) - AI-powered development platform
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- AI powered by [OpenAI GPT-4](https://openai.com/)

## Support

For questions or issues:
- Open an issue on GitHub
- Contact: [your-email@example.com]

## Roadmap

- [ ] Slack integration for unified inbox
- [ ] Advanced analytics and reporting
- [ ] Team collaboration features
- [ ] Mobile app (React Native)
- [ ] Stripe billing integration
- [ ] Custom branding per agency
- [ ] API webhooks
- [ ] Zapier integration

---

**Built with ❤️ using Manus AI**
