-- Migration: 016_user_activity_tracking
-- Description: Track user page visits and actions for automatic quest validation

-- User page visits for tracking quest completion
CREATE TABLE IF NOT EXISTS user_page_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  page_path TEXT NOT NULL, -- e.g., '/vaults', '/analytics', '/vault/:id'
  visit_count INTEGER DEFAULT 1,
  first_visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, page_path)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_page_visits_user ON user_page_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_page_visits_page ON user_page_visits(page_path);
CREATE INDEX IF NOT EXISTS idx_user_page_visits_user_page ON user_page_visits(user_id, page_path);

-- Comments
COMMENT ON TABLE user_page_visits IS 'Tracks user page visits for automatic quest validation';
COMMENT ON COLUMN user_page_visits.page_path IS 'Normalized page path, e.g., /vaults, /analytics, /vault-detail';
COMMENT ON COLUMN user_page_visits.visit_count IS 'Number of times user visited this page';
