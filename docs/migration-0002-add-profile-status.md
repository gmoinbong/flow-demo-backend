# Migration: Add status column to profile table

## SQL Migration

```sql
-- Add status column to profile table
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "status" varchar(20);
```

## How to apply

Execute this SQL directly in your database:

```bash
psql -d your_database -c "ALTER TABLE profile ADD COLUMN IF NOT EXISTS status varchar(20);"
```

Or use your database client to run the SQL.

## What it does

Adds a `status` column to the `profile` table to track profile status (active, pending, suspended).

