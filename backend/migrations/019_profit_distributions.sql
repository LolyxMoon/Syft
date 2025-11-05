-- Migration: 015_profit_distributions
-- Description: Track actual profit distributions to NFT holders and vault subscribers

-- Table to track profit distribution events
CREATE TABLE IF NOT EXISTS profit_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source information
  vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  distribution_type TEXT NOT NULL CHECK (distribution_type IN ('nft_holder', 'vault_subscriber')),
  
  -- Transaction details
  transaction_hash TEXT,
  contract_address TEXT NOT NULL,
  
  -- Recipient information
  recipient_wallet_address TEXT NOT NULL,
  recipient_nft_id TEXT, -- If distribution is to NFT holder
  recipient_subscription_id UUID, -- If distribution is to vault subscriber
  
  -- Amount details
  token_address TEXT NOT NULL,
  token_symbol TEXT,
  amount NUMERIC(20, 7) NOT NULL,
  profit_share_percentage NUMERIC(5, 2),
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  
  -- Timestamps
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Indexes
  CONSTRAINT amount_positive CHECK (amount > 0),
  CONSTRAINT profit_percentage_valid CHECK (profit_share_percentage IS NULL OR (profit_share_percentage > 0 AND profit_share_percentage <= 100))
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_profit_distributions_vault ON profit_distributions(vault_id);
CREATE INDEX IF NOT EXISTS idx_profit_distributions_recipient ON profit_distributions(recipient_wallet_address);
CREATE INDEX IF NOT EXISTS idx_profit_distributions_status ON profit_distributions(status);
CREATE INDEX IF NOT EXISTS idx_profit_distributions_type ON profit_distributions(distribution_type);
CREATE INDEX IF NOT EXISTS idx_profit_distributions_nft ON profit_distributions(recipient_nft_id) WHERE recipient_nft_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profit_distributions_subscription ON profit_distributions(recipient_subscription_id) WHERE recipient_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profit_distributions_date ON profit_distributions(initiated_at DESC);

-- Table to aggregate profit stats per NFT
CREATE TABLE IF NOT EXISTS nft_profit_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  nft_id TEXT NOT NULL,
  vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  holder_wallet_address TEXT NOT NULL,
  
  -- Cumulative stats
  total_distributions_count INTEGER DEFAULT 0,
  total_profit_received NUMERIC(20, 7) DEFAULT 0,
  last_distribution_amount NUMERIC(20, 7),
  last_distribution_at TIMESTAMPTZ,
  
  -- Tracking
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_nft_stats UNIQUE (nft_id)
);

-- Indexes for NFT stats
CREATE INDEX IF NOT EXISTS idx_nft_profit_stats_nft ON nft_profit_stats(nft_id);
CREATE INDEX IF NOT EXISTS idx_nft_profit_stats_holder ON nft_profit_stats(holder_wallet_address);
CREATE INDEX IF NOT EXISTS idx_nft_profit_stats_vault ON nft_profit_stats(vault_id);

-- Table to aggregate profit stats per vault subscription
CREATE TABLE IF NOT EXISTS subscription_profit_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  subscription_id UUID NOT NULL REFERENCES vault_subscriptions(id) ON DELETE CASCADE,
  original_vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  subscriber_wallet_address TEXT NOT NULL,
  
  -- Cumulative stats
  total_distributions_count INTEGER DEFAULT 0,
  total_profit_shared NUMERIC(20, 7) DEFAULT 0,
  last_distribution_amount NUMERIC(20, 7),
  last_distribution_at TIMESTAMPTZ,
  
  -- Tracking
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_subscription_stats UNIQUE (subscription_id)
);

-- Indexes for subscription stats
CREATE INDEX IF NOT EXISTS idx_subscription_profit_stats_sub ON subscription_profit_stats(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_profit_stats_subscriber ON subscription_profit_stats(subscriber_wallet_address);
CREATE INDEX IF NOT EXISTS idx_subscription_profit_stats_vault ON subscription_profit_stats(original_vault_id);

-- Function to update NFT profit stats after distribution
CREATE OR REPLACE FUNCTION update_nft_profit_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.distribution_type = 'nft_holder' AND NEW.status = 'completed' AND NEW.recipient_nft_id IS NOT NULL THEN
    INSERT INTO nft_profit_stats (
      nft_id,
      vault_id,
      holder_wallet_address,
      total_distributions_count,
      total_profit_received,
      last_distribution_amount,
      last_distribution_at,
      updated_at
    )
    VALUES (
      NEW.recipient_nft_id,
      NEW.vault_id,
      NEW.recipient_wallet_address,
      1,
      NEW.amount,
      NEW.amount,
      NEW.completed_at,
      NOW()
    )
    ON CONFLICT (nft_id)
    DO UPDATE SET
      total_distributions_count = nft_profit_stats.total_distributions_count + 1,
      total_profit_received = nft_profit_stats.total_profit_received + NEW.amount,
      last_distribution_amount = NEW.amount,
      last_distribution_at = NEW.completed_at,
      holder_wallet_address = NEW.recipient_wallet_address,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update subscription profit stats after distribution
CREATE OR REPLACE FUNCTION update_subscription_profit_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.distribution_type = 'vault_subscriber' AND NEW.status = 'completed' AND NEW.recipient_subscription_id IS NOT NULL THEN
    INSERT INTO subscription_profit_stats (
      subscription_id,
      original_vault_id,
      subscriber_wallet_address,
      total_distributions_count,
      total_profit_shared,
      last_distribution_amount,
      last_distribution_at,
      updated_at
    )
    VALUES (
      NEW.recipient_subscription_id,
      NEW.vault_id,
      NEW.recipient_wallet_address,
      1,
      NEW.amount,
      NEW.amount,
      NEW.completed_at,
      NOW()
    )
    ON CONFLICT (subscription_id)
    DO UPDATE SET
      total_distributions_count = subscription_profit_stats.total_distributions_count + 1,
      total_profit_shared = subscription_profit_stats.total_profit_shared + NEW.amount,
      last_distribution_amount = NEW.amount,
      last_distribution_at = NEW.completed_at,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update stats
DROP TRIGGER IF EXISTS trigger_update_nft_profit_stats ON profit_distributions;
CREATE TRIGGER trigger_update_nft_profit_stats
  AFTER INSERT OR UPDATE ON profit_distributions
  FOR EACH ROW
  EXECUTE FUNCTION update_nft_profit_stats();

DROP TRIGGER IF EXISTS trigger_update_subscription_profit_stats ON profit_distributions;
CREATE TRIGGER trigger_update_subscription_profit_stats
  AFTER INSERT OR UPDATE ON profit_distributions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_profit_stats();

-- Update legacy tables to link with new distribution tracking
ALTER TABLE vault_nfts
  ADD COLUMN IF NOT EXISTS last_profit_distribution_id UUID REFERENCES profit_distributions(id);

ALTER TABLE vault_subscriptions
  ADD COLUMN IF NOT EXISTS last_profit_distribution_id UUID REFERENCES profit_distributions(id);

-- Comments
COMMENT ON TABLE profit_distributions IS 'Tracks all profit distribution transactions to NFT holders and vault subscribers';
COMMENT ON TABLE nft_profit_stats IS 'Aggregated profit statistics per NFT for quick lookups';
COMMENT ON TABLE subscription_profit_stats IS 'Aggregated profit statistics per vault subscription for quick lookups';
COMMENT ON COLUMN profit_distributions.distribution_type IS 'Type of distribution: nft_holder or vault_subscriber';
COMMENT ON COLUMN profit_distributions.status IS 'Status: pending, processing, completed, or failed';
COMMENT ON COLUMN nft_profit_stats.total_profit_received IS 'Cumulative profit received by this NFT holder';
COMMENT ON COLUMN subscription_profit_stats.total_profit_shared IS 'Cumulative profit shared to original vault creator';
