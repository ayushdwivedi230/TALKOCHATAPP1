-- Migration: Add last_seen column to users table
-- This column tracks when a user was last active (login or message send)
-- Users with last_seen < 2 minutes ago are considered "Online"

ALTER TABLE users
ADD COLUMN last_seen TIMESTAMP NOT NULL DEFAULT NOW();

-- Create an index for efficient queries on last_seen
CREATE INDEX idx_users_last_seen ON users(last_seen);
