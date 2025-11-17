# Engeloop Records Management System

Independent electronic music label management platform for release workflows, artist onboarding, contract generation, and metadata coordination.

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- npm or pnpm

### Setup

```bash
npm install
cp .env.example .env.local
# Add your Supabase credentials to .env.local
npm run dev
```

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Project Structure

```
├── app/                 # Next.js app directory
├── components/          # React components
├── lib/                # Utilities, Supabase client
├── docs/               # Technical documentation
├── .claude/            # Claude Code context files
└── supabase/           # Database migrations, functions
```

## Documentation

- [Full Schema](docs/schema.md)
- [Implementation Plan](docs/implementation-plan.md)
- [Claude Context](.claude/project-context.md)

## Development

See `.claude/current-task.md` for active work items.

Current phase: **Phase 1 Week 2** - Database functions & RLS policies
