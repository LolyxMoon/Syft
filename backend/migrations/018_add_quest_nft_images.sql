-- Migration: 018_add_quest_nft_images
-- Description: Add NFT image URLs to quests for reward visualization
-- Author: Syft Team
-- Date: 2025-11-05

-- Update each quest with its corresponding NFT image URL
UPDATE quests 
SET reward_nft_image = 'https://syft-stellar.vercel.app/explorer.png'
WHERE quest_key = 'connect_wallet';

UPDATE quests 
SET reward_nft_image = 'https://syft-stellar.vercel.app/creator.png'
WHERE quest_key = 'create_first_vault';

UPDATE quests 
SET reward_nft_image = 'https://syft-stellar.vercel.app/analyst.png'
WHERE quest_key = 'view_vault_details';

UPDATE quests 
SET reward_nft_image = 'https://syft-stellar.vercel.app/investor.png'
WHERE quest_key = 'deposit_to_vault';

UPDATE quests 
SET reward_nft_image = 'https://syft-stellar.vercel.app/explorer.png'
WHERE quest_key = 'explore_vaults';

UPDATE quests 
SET reward_nft_image = 'https://syft-stellar.vercel.app/strategist.png'
WHERE quest_key = 'add_rebalancing_rule';

UPDATE quests 
SET reward_nft_image = 'https://syft-stellar.vercel.app/data-master.png'
WHERE quest_key = 'view_analytics';

UPDATE quests 
SET reward_nft_image = 'https://syft-stellar.vercel.app/analyst-pro.png'
WHERE quest_key = 'run_backtest';

-- Comment
COMMENT ON COLUMN quests.reward_nft_image IS 'URL to the NFT image that users receive upon quest completion';
