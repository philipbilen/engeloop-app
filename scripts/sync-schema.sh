#!/bin/bash
echo "Syncing database schema..."
supabase db dump --linked > backup.sql
supabase gen types typescript --linked > database.types.ts
echo "Schema synced. Review changes with: git diff backup.sql"