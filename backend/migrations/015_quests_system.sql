-- Migration: 015_quests_system
-- Description: Quest system for onboarding new users with gamified learning
-- Note: Quests are sequential - users must complete each quest in order before unlocking the next

-- Quests table - defines all available quests
CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_key TEXT UNIQUE NOT NULL, -- Unique identifier like 'connect_wallet', 'create_vault'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'basics', 'defi', 'vaults', 'advanced'
  difficulty TEXT NOT NULL, -- 'beginner', 'intermediate', 'advanced'
  order_index INTEGER NOT NULL, -- Display order
  reward_nft_image TEXT, -- URL to NFT image (placeholder for now)
  reward_nft_name TEXT NOT NULL,
  reward_nft_description TEXT,
  validation_type TEXT NOT NULL, -- 'manual', 'automatic'
  validation_config JSONB DEFAULT '{}'::jsonb, -- Config for automatic validation
  hint_steps JSONB DEFAULT '[]'::jsonb, -- Array of hint steps for driver.js
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT quest_key_format CHECK (length(quest_key) > 0)
);

-- User quest progress tracking
CREATE TABLE IF NOT EXISTS user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'claimed'
  progress JSONB DEFAULT '{}'::jsonb, -- Flexible progress tracking
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  nft_token_id TEXT, -- Stored NFT token ID after claiming
  nft_transaction_hash TEXT, -- Transaction hash for NFT mint
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, quest_id)
);

-- User onboarding preferences
CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  has_seen_quest_modal BOOLEAN DEFAULT false,
  wants_quests BOOLEAN DEFAULT false,
  quests_started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quests_category ON quests(category);
CREATE INDEX IF NOT EXISTS idx_quests_order ON quests(order_index);
CREATE INDEX IF NOT EXISTS idx_quests_active ON quests(is_active);

CREATE INDEX IF NOT EXISTS idx_user_quests_user ON user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_quest ON user_quests(quest_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_status ON user_quests(status);
CREATE INDEX IF NOT EXISTS idx_user_quests_user_status ON user_quests(user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_onboarding_user ON user_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_modal ON user_onboarding(has_seen_quest_modal);

-- Triggers for updated_at
CREATE TRIGGER update_quests_updated_at
  BEFORE UPDATE ON quests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_quests_updated_at
  BEFORE UPDATE ON user_quests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_onboarding_updated_at
  BEFORE UPDATE ON user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed initial quests (ordered by user flow)
INSERT INTO quests (quest_key, title, description, category, difficulty, order_index, reward_nft_name, reward_nft_description, validation_type, validation_config, hint_steps) VALUES
  ('connect_wallet', 
   'Connect Your Wallet', 
   'Connect your Stellar wallet to get started with Syft. This is your first step into decentralized finance!',
   'basics',
   'beginner',
   1,
   'Wallet Pioneer NFT',
   'You took your first step into DeFi by connecting your wallet!',
   'automatic',
   '{"check": "wallet_connected"}',
   '[{"element": "[data-tour=\"wallet-connect\"]", "popover": {"title": "Connect Wallet", "description": "Click here to connect your Stellar wallet. This will allow you to interact with the platform."}}]'
  ),
  
  ('create_first_vault',
   'Build Your Own Vault',
   'Use the Vault Builder to create your first automated yield strategy.',
   'vaults',
   'beginner',
   2,
   'Creator NFT',
   'You''ve created your first automated yield strategy!',
   'automatic',
   '{"check": "created_vault"}',
   '[{"element": "[data-tour=\"builder-nav\"]", "popover": {"title": "Vault Builder", "description": "Navigate to the Vault Builder to create your strategy."}}, {"element": "[data-tour=\"add-asset\"]", "popover": {"title": "Add Assets", "description": "Select the assets you want in your vault."}}, {"element": "[data-tour=\"set-allocation\"]", "popover": {"title": "Set Allocation", "description": "Define how much of each asset your vault will hold."}}, {"element": "[data-tour=\"create-vault\"]", "popover": {"title": "Create Vault", "description": "Review your strategy and create your vault!"}}]'
  ),
  
  ('view_vault_details',
   'View Vault Details',
   'Click on a vault and explore its performance metrics, asset allocation, and strategy.',
   'basics',
   'beginner',
   3,
   'Analyst NFT',
   'You''ve learned to analyze vault performance!',
   'automatic',
   '{"check": "viewed_vault_detail", "minTime": 10}',
   '[{"element": "[data-tour=\"vault-metrics\"]", "popover": {"title": "Performance Metrics", "description": "Here you can see the vault''s APY, total value, and other key metrics."}}, {"element": "[data-tour=\"vault-composition\"]", "popover": {"title": "Asset Allocation", "description": "This shows how the vault''s assets are distributed across different protocols."}}]'
  ),
  
  ('deposit_to_vault',
   'Make Your First Deposit',
   'Deposit funds into a vault to start earning yield automatically.',
   'defi',
   'beginner',
   4,
   'Investor NFT',
   'You''ve made your first DeFi investment!',
   'automatic',
   '{"check": "made_deposit", "minAmount": 1}',
   '[{"element": "[data-tour=\"deposit-button\"]", "popover": {"title": "Deposit Funds", "description": "Click here to deposit funds into the vault."}}, {"element": "[data-tour=\"deposit-amount\"]", "popover": {"title": "Enter Amount", "description": "Enter the amount you want to deposit. Start small to learn!"}}, {"element": "[data-tour=\"confirm-deposit\"]", "popover": {"title": "Confirm Transaction", "description": "Review the details and confirm your deposit transaction."}}]'
  ),
  
  ('explore_vaults',
   'Explore Existing Vaults',
   'Browse through existing vaults to understand how automated yield strategies work.',
   'basics',
   'intermediate',
   5,
   'Explorer NFT',
   'Curiosity is the first step to knowledge!',
   'automatic',
   '{"check": "visited_vaults_page", "minTime": 5}',
   '[{"element": "[data-tour=\"vaults-nav\"]", "popover": {"title": "Vaults Page", "description": "Navigate to the Vaults page to see all available vaults."}}, {"element": "[data-tour=\"vault-card\"]", "popover": {"title": "Vault Details", "description": "Click on any vault to see its performance, strategy, and composition."}}]'
  ),
  
  ('add_rebalancing_rule',
   'Set Up Rebalancing Rules',
   'Add an automated rebalancing rule to your vault to maintain your target allocation.',
   'vaults',
   'intermediate',
   6,
   'Strategist NFT',
   'You''ve mastered automated rebalancing strategies!',
   'automatic',
   '{"check": "added_rebalancing_rule"}',
   '[{"element": "[data-tour=\"vault-settings\"]", "popover": {"title": "Vault Settings", "description": "Open your vault settings to manage rules."}}, {"element": "[data-tour=\"add-rule\"]", "popover": {"title": "Add Rule", "description": "Click here to add a new rebalancing rule."}}, {"element": "[data-tour=\"rule-config\"]", "popover": {"title": "Configure Rule", "description": "Set up conditions and actions for automatic rebalancing."}}]'
  ),
  
  ('view_analytics',
   'Explore Analytics',
   'Use the analytics dashboard to track your portfolio performance and insights.',
   'advanced',
   'intermediate',
   7,
   'Data Master NFT',
   'You''ve unlocked the power of data-driven decisions!',
   'automatic',
   '{"check": "visited_analytics", "minTime": 10}',
   '[{"element": "[data-tour=\"analytics-nav\"]", "popover": {"title": "Analytics", "description": "Navigate to the Analytics page."}}, {"element": "[data-tour=\"portfolio-overview\"]", "popover": {"title": "Portfolio Overview", "description": "View your total portfolio value and performance."}}, {"element": "[data-tour=\"charts\"]", "popover": {"title": "Performance Charts", "description": "Analyze your performance over time with interactive charts."}}]'
  ),
  
  ('run_backtest',
   'Backtest Your Strategy',
   'Run a backtest to see how your vault strategy would have performed historically.',
   'advanced',
   'advanced',
   8,
   'Analyst Pro NFT',
   'You''ve learned to validate strategies with data!',
   'automatic',
   '{"check": "ran_backtest"}',
   '[{"element": "[data-tour=\"backtests-nav\"]", "popover": {"title": "Backtests", "description": "Navigate to the Backtests page."}}, {"element": "[data-tour=\"new-backtest\"]", "popover": {"title": "New Backtest", "description": "Create a new backtest for your vault strategy."}}, {"element": "[data-tour=\"backtest-config\"]", "popover": {"title": "Configure Backtest", "description": "Set the time period and parameters for your backtest."}}]'
  );

-- Comments
COMMENT ON TABLE quests IS 'Defines all available quests for user onboarding and learning';
COMMENT ON TABLE user_quests IS 'Tracks individual user progress on each quest';
COMMENT ON TABLE user_onboarding IS 'Stores user preferences for the onboarding quest system';
COMMENT ON COLUMN quests.quest_key IS 'Unique identifier for programmatic reference';
COMMENT ON COLUMN quests.validation_type IS 'How quest completion is validated: manual or automatic';
COMMENT ON COLUMN quests.validation_config IS 'Configuration for automatic validation logic';
COMMENT ON COLUMN quests.hint_steps IS 'Array of driver.js hint steps for guided tour';
COMMENT ON COLUMN user_quests.status IS 'Quest status: not_started, in_progress, completed, claimed';
COMMENT ON COLUMN user_quests.progress IS 'Flexible JSON field for tracking quest-specific progress';
