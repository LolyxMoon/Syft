-- Migration: 017_update_quest_keys
-- Description: Update quest keys to match validation service expectations

-- Update quest keys to match the validation service
UPDATE quests SET quest_key = 'connect_wallet' WHERE quest_key = 'connect_wallet';
UPDATE quests SET quest_key = 'create_first_vault' WHERE quest_key = 'create_first_vault';
UPDATE quests SET quest_key = 'view_vault_details' WHERE quest_key = 'view_vault_details';
UPDATE quests SET quest_key = 'deposit_to_vault' WHERE quest_key = 'deposit_to_vault';
UPDATE quests SET quest_key = 'explore_vaults' WHERE quest_key = 'explore_vaults';
UPDATE quests SET quest_key = 'add_rebalancing_rule' WHERE quest_key = 'add_rebalancing_rule';
UPDATE quests SET quest_key = 'view_analytics' WHERE quest_key = 'view_analytics';
UPDATE quests SET quest_key = 'run_backtest' WHERE quest_key = 'run_backtest';

-- Update validation configs to use correct check values
UPDATE quests SET validation_config = '{"check": "wallet_connected"}' WHERE quest_key = 'connect_wallet';
UPDATE quests SET validation_config = '{"check": "created_vault"}' WHERE quest_key = 'create_first_vault';
UPDATE quests SET validation_config = '{"check": "viewed_vault_detail", "minTime": 10}' WHERE quest_key = 'view_vault_details';
UPDATE quests SET validation_config = '{"check": "made_deposit", "minAmount": 1}' WHERE quest_key = 'deposit_to_vault';
UPDATE quests SET validation_config = '{"check": "visited_vaults_page", "minTime": 5}' WHERE quest_key = 'explore_vaults';
UPDATE quests SET validation_config = '{"check": "added_rebalancing_rule"}' WHERE quest_key = 'add_rebalancing_rule';
UPDATE quests SET validation_config = '{"check": "visited_analytics", "minTime": 10}' WHERE quest_key = 'view_analytics';
UPDATE quests SET validation_config = '{"check": "ran_backtest"}' WHERE quest_key = 'run_backtest';
