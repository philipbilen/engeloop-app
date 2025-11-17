# Claude Development Preferences

## Response Style

- Provide complete, working code (no placeholders like `// ... rest of code`)
- Include TypeScript types explicitly
- Show both implementation AND usage examples
- Explain WHY, not just WHAT
- Reference schema/tables by exact names from project-context.md

## Code Quality

- Follow Next.js 14 App Router patterns (no pages/ directory)
- Use Supabase client patterns from their docs
- Implement proper error handling (don't just console.log)
- Add loading states and optimistic UI where appropriate
- Use Tailwind classes, avoid inline styles

## When Building Features

1. Check schema in project-context.md first
2. Verify table/column names match exactly
3. Consider RLS implications (even if disabled now)
4. Think about inheritance flags for credits
5. Validate financial data (shares sum to 100%)

## Avoid

- Don't use Prisma (we're using direct Supabase client)
- Don't create API routes (PostgREST handles this)
- Don't use useState for server data (use server components)
- Don't mutate data without considering audit_log
- Never mix contact_id and artist_profile_id incorrectly

## Priority Order

1. Data integrity (correct FK relationships, constraints respected)
2. Type safety (proper TypeScript)
3. User experience (loading states, error messages)
4. Performance (avoid N+1 queries, use joins)
5. Code reusability
