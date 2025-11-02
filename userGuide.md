# Smart Agency OS User Guide

## Purpose
Smart Agency OS helps digital agencies manage clients, track engagements, generate proposals, create reports, and communicate with clients—all powered by AI.

## Access
Login required. Create an agency to get started.

---

## Powered by Manus

**Frontend:** React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui component library for modern, accessible UI  
**Backend:** Express 4 + tRPC 11 for type-safe API with end-to-end TypeScript  
**Database:** MySQL/TiDB with Drizzle ORM for reliable data persistence  
**AI:** OpenAI GPT-4 integration for proposal generation and intelligent co-pilot assistant  
**Email:** Gmail API integration via Model Context Protocol (MCP) for unified inbox  
**Deployment:** Auto-scaling infrastructure with global CDN for fast worldwide access

---

## Using Your Website

### Getting Started
Click "Create Agency" on the welcome screen → Enter your agency name → You'll see the dashboard with navigation sidebar.

### Managing Clients
Click "Clients" in sidebar → Click "+ Add Client" → Fill in name, industry, website, and contact email → Click "Create Client". Your client appears in the list. Click any client card to edit details or change status between Active, Prospect, or Inactive.

### Creating Engagements
Click "Engagements" → Click "+ New Engagement" → Select client → Choose service tier (Basic, Standard, Premium, Enterprise) → Enter monthly fee → Click "Create Engagement". The system auto-generates onboarding tasks. Check off tasks as you complete them to track progress.

### AI Proposal Generator
Click "Proposals" → Click "+ New Proposal" → Select client → Enter title and project brief → Click "Generate with AI". The AI creates a professional proposal with executive summary, methodology, scope, timeline, and pricing. Edit the generated content → Change status to "Sent" when ready to share with client.

### Client Reports
Click "Reports" → Click "+ New Report" → Select client → The AI generates a summary of work completed, identifies risks, and suggests next steps based on your engagement data. Review and edit → Mark as "Sent" to track delivery.

### AI Co-Pilot
Click "AI Co-Pilot" → Ask questions like "What's my total MRR?" or "Show me at-risk clients" → The assistant analyzes your data and provides insights. Use suggested questions to explore your business metrics.

### Inbox
Click "Inbox" → View unread Gmail messages → Click "Refresh" to sync latest emails → Click "Log Communication" to record calls, meetings, or emails with clients for your team's reference.

---

## Managing Your Website

### Dashboard
View key metrics (Active Clients, MRR, Pipeline Value, Overdue Tasks) and recent activity. Use quick action buttons to jump directly to creating clients, engagements, or proposals.

### Settings
Click the settings icon in Management UI (right panel) → **General:** Change website name and logo → **Database:** View and manage all your data with full CRUD interface → **Code:** Download all project files.

### Gmail Connection
First time using Inbox: You'll be prompted to authorize Gmail access via OAuth. This is secure and managed by Manus. Once connected, your unread emails sync automatically.

---

## Next Steps

Talk to Manus AI anytime to request changes or add features. Try asking your AI Co-Pilot about your business metrics to discover insights you might have missed.
