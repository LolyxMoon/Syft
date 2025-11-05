// Quest routes - endpoints for the quest system
import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { buildMintNFTTransaction, submitSignedTransaction, getQuestNFTImageUrl } from '../services/nftMintingService.js';
import type {
  UserQuest,
  QuestWithProgress,
  UserOnboarding,
  QuestProgressUpdate,
  QuestClaimRequest,
  QuestClaimResponse,
  QuestStatsResponse,
  ApiResponse,
} from '../shared/types/index.js';

const router = Router();

// Get all quests with user progress
router.get('/', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: { message: 'Wallet address is required', code: 'MISSING_WALLET' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    // Get user ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'USER_NOT_FOUND' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    const userId = user.id;

    // Get all active quests
    const { data: quests, error: questsError } = await supabase
      .from('quests')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (questsError) {
      throw questsError;
    }

    // Get user quest progress
    const { data: userQuests, error: userQuestsError } = await supabase
      .from('user_quests')
      .select('*')
      .eq('user_id', userId);

    if (userQuestsError) {
      throw userQuestsError;
    }

    // Combine quests with user progress and determine locked status
    const questsWithProgress: QuestWithProgress[] = (quests || []).map((quest: any, index: number) => {
      const userQuest = (userQuests || []).find((uq: any) => uq.quest_id === quest.id);
      
      // Check if previous quest is completed
      let isLocked = false;
      if (index > 0) {
        const previousQuest = quests[index - 1];
        const previousUserQuest = (userQuests || []).find((uq: any) => uq.quest_id === previousQuest.id);
        // Lock this quest if previous quest is not completed or claimed
        isLocked = !previousUserQuest || (previousUserQuest.status !== 'completed' && previousUserQuest.status !== 'claimed');
      }
      
      return {
        id: quest.id,
        questKey: quest.quest_key,
        title: quest.title,
        description: quest.description,
        category: quest.category,
        difficulty: quest.difficulty,
        orderIndex: quest.order_index,
        rewardNftImage: quest.reward_nft_image,
        rewardNftName: quest.reward_nft_name,
        rewardNftDescription: quest.reward_nft_description,
        validationType: quest.validation_type,
        validationConfig: quest.validation_config,
        hintSteps: quest.hint_steps,
        isActive: quest.is_active,
        createdAt: quest.created_at,
        updatedAt: quest.updated_at,
        isLocked,
        userQuest: userQuest
          ? {
              id: userQuest.id,
              userId,
              questId: quest.id,
              status: userQuest.status,
              progress: userQuest.progress || {},
              startedAt: userQuest.started_at,
              completedAt: userQuest.completed_at,
              claimedAt: userQuest.claimed_at,
              nftTokenId: userQuest.nft_token_id,
              nftTransactionHash: userQuest.nft_transaction_hash,
              createdAt: userQuest.created_at,
              updatedAt: userQuest.updated_at,
            }
          : undefined,
      };
    });

    return res.json({
      success: true,
      data: questsWithProgress,
      timestamp: new Date().toISOString(),
    } as ApiResponse<QuestWithProgress[]>);
  } catch (error) {
    console.error('Error fetching quests:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch quests', code: 'FETCH_ERROR' },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
});

// Get quest statistics for user
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: { message: 'Wallet address is required', code: 'MISSING_WALLET' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'USER_NOT_FOUND' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    const userId = user.id;

    // Get total quests count
    const { count: totalQuests } = await supabase
      .from('quests')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get user quest stats
    const { data: userQuests } = await supabase
      .from('user_quests')
      .select('*')
      .eq('user_id', userId);

    const completedQuests = (userQuests || []).filter(
      (q: any) => q.status === 'completed' || q.status === 'claimed'
    ).length;
    const claimedQuests = (userQuests || []).filter((q: any) => q.status === 'claimed').length;
    const inProgressQuests = (userQuests || []).filter((q: any) => q.status === 'in_progress').length;
    const nftsEarned = (userQuests || []).filter((q: any) => q.nft_token_id).length;

    const stats: QuestStatsResponse = {
      totalQuests: totalQuests || 0,
      completedQuests,
      claimedQuests,
      inProgressQuests,
      completionRate: totalQuests ? (completedQuests / totalQuests) * 100 : 0,
      nftsEarned,
    };

    return res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    } as ApiResponse<QuestStatsResponse>);
  } catch (error) {
    console.error('Error fetching quest stats:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch quest stats', code: 'STATS_ERROR' },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
});

// Update quest progress
router.post('/progress', async (req: Request, res: Response) => {
  try {
    const { walletAddress, questKey, progress, completed } = req.body as {
      walletAddress: string;
    } & QuestProgressUpdate;

    if (!walletAddress || !questKey) {
      return res.status(400).json({
        success: false,
        error: { message: 'Wallet address and quest key are required', code: 'MISSING_FIELDS' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'USER_NOT_FOUND' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    const userId = user.id;

    // Get quest with order_index
    const { data: quest, error: questError } = await supabase
      .from('quests')
      .select('id, order_index')
      .eq('quest_key', questKey)
      .single();

    if (questError || !quest) {
      return res.status(404).json({
        success: false,
        error: { message: 'Quest not found', code: 'QUEST_NOT_FOUND' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    const questId = quest.id;

    // Check if quest is locked (previous quest not completed)
    if (quest.order_index > 1) {
      // Get the previous quest
      const { data: previousQuest, error: prevQuestError } = await supabase
        .from('quests')
        .select('id')
        .eq('order_index', quest.order_index - 1)
        .single();

      if (!prevQuestError && previousQuest) {
        // Check if previous quest is completed
        const { data: previousUserQuest } = await supabase
          .from('user_quests')
          .select('status')
          .eq('user_id', userId)
          .eq('quest_id', previousQuest.id)
          .single();

        if (!previousUserQuest || (previousUserQuest.status !== 'completed' && previousUserQuest.status !== 'claimed')) {
          return res.status(403).json({
            success: false,
            error: { message: 'Previous quest must be completed first', code: 'QUEST_LOCKED' },
            timestamp: new Date().toISOString(),
          } as ApiResponse);
        }
      }
    }
    const now = new Date().toISOString();
    const status = completed ? 'completed' : 'in_progress';

    // Check if user quest exists and if it's already claimed
    const { data: existingUserQuest } = await supabase
      .from('user_quests')
      .select('*')
      .eq('user_id', userId)
      .eq('quest_id', questId)
      .single();

    // Don't update if already claimed
    if (existingUserQuest && existingUserQuest.status === 'claimed') {
      const userQuest: UserQuest = {
        id: existingUserQuest.id,
        userId: existingUserQuest.user_id,
        questId: existingUserQuest.quest_id,
        status: existingUserQuest.status,
        progress: existingUserQuest.progress,
        startedAt: existingUserQuest.started_at,
        completedAt: existingUserQuest.completed_at,
        claimedAt: existingUserQuest.claimed_at,
        nftTokenId: existingUserQuest.nft_token_id,
        nftTransactionHash: existingUserQuest.nft_transaction_hash,
        createdAt: existingUserQuest.created_at,
        updatedAt: existingUserQuest.updated_at,
      };
      return res.json({
        success: true,
        data: userQuest,
        timestamp: new Date().toISOString(),
      } as ApiResponse<UserQuest>);
    }

    // Use upsert to handle both insert and update
    const { data: result, error: upsertError } = await supabase
      .from('user_quests')
      .upsert(
        {
          user_id: userId,
          quest_id: questId,
          status,
          progress: progress || existingUserQuest?.progress || {},
          started_at: existingUserQuest?.started_at || now,
          completed_at: completed ? now : existingUserQuest?.completed_at || null,
          updated_at: now,
        },
        { 
          onConflict: 'user_id,quest_id',
          ignoreDuplicates: false 
        }
      )
      .select()
      .single();

    if (upsertError) throw upsertError;

    const userQuest: UserQuest = {
      id: result.id,
      userId: result.user_id,
      questId: result.quest_id,
      status: result.status,
      progress: result.progress,
      startedAt: result.started_at,
      completedAt: result.completed_at,
      claimedAt: result.claimed_at,
      nftTokenId: result.nft_token_id,
      nftTransactionHash: result.nft_transaction_hash,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };

    return res.json({
      success: true,
      data: userQuest,
      timestamp: new Date().toISOString(),
    } as ApiResponse<UserQuest>);
  } catch (error) {
    console.error('Error updating quest progress:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to update quest progress', code: 'UPDATE_ERROR' },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
});

// Build NFT minting transaction for completed quest
router.post('/claim', async (req: Request, res: Response) => {
  try {
    const { walletAddress, questId } = req.body as { walletAddress: string } & QuestClaimRequest;

    if (!walletAddress || !questId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Wallet address and quest ID are required', code: 'MISSING_FIELDS' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'USER_NOT_FOUND' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    const userId = user.id;

    // Get quest details to check order
    const { data: questDetails, error: questDetailsError } = await supabase
      .from('quests')
      .select('order_index')
      .eq('id', questId)
      .single();

    if (questDetailsError || !questDetails) {
      return res.status(404).json({
        success: false,
        error: { message: 'Quest not found', code: 'QUEST_NOT_FOUND' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    // Check if quest is locked (previous quest not completed)
    if (questDetails.order_index > 1) {
      const { data: previousQuest } = await supabase
        .from('quests')
        .select('id')
        .eq('order_index', questDetails.order_index - 1)
        .single();

      if (previousQuest) {
        const { data: previousUserQuest } = await supabase
          .from('user_quests')
          .select('status')
          .eq('user_id', userId)
          .eq('quest_id', previousQuest.id)
          .single();

        if (!previousUserQuest || (previousUserQuest.status !== 'completed' && previousUserQuest.status !== 'claimed')) {
          return res.status(403).json({
            success: false,
            error: { message: 'Previous quest must be completed first', code: 'QUEST_LOCKED' },
            timestamp: new Date().toISOString(),
          } as ApiResponse);
        }
      }
    }

    // Check quest completion
    const { data: userQuest, error: questError } = await supabase
      .from('user_quests')
      .select('*')
      .eq('user_id', userId)
      .eq('quest_id', questId)
      .single();

    if (questError || !userQuest) {
      return res.status(404).json({
        success: false,
        error: { message: 'Quest not found for user', code: 'QUEST_NOT_FOUND' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    if (userQuest.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: { message: 'Quest is not completed yet', code: 'QUEST_NOT_COMPLETED' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    if (userQuest.status === 'claimed') {
      return res.status(400).json({
        success: false,
        error: { message: 'Quest reward already claimed', code: 'ALREADY_CLAIMED' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    // Get quest details for NFT metadata
    const { data: questData, error: questDataError } = await supabase
      .from('quests')
      .select('*')
      .eq('id', questId)
      .single();

    if (questDataError || !questData) {
      return res.status(404).json({
        success: false,
        error: { message: 'Quest not found', code: 'QUEST_NOT_FOUND' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    // Get user's network preference (default to testnet)
    const network = 'testnet'; // TODO: Get from user preferences or request

    // Build NFT minting transaction
    const imageUrl = getQuestNFTImageUrl(questId, questData.category);
    const mintResult = await buildMintNFTTransaction({
      toAddress: walletAddress,
      metadata: {
        name: questData.reward_nft_name || questData.title,
        description: questData.reward_nft_description || questData.description,
        image_url: imageUrl,
        vault_performance: 0, // Quest NFTs don't have performance metrics
      },
      network,
    });

    if (!mintResult.success || !mintResult.xdr) {
      return res.status(500).json({
        success: false,
        error: { message: mintResult.error || 'Failed to build NFT minting transaction', code: 'MINT_ERROR' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    // Return the unsigned transaction for the client to sign
    const response: QuestClaimResponse = {
      success: true,
      xdr: mintResult.xdr,
      message: 'Please sign the transaction in your wallet to mint your NFT!',
    };

    return res.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
    } as ApiResponse<QuestClaimResponse>);
  } catch (error) {
    console.error('Error claiming quest reward:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to claim quest reward', code: 'CLAIM_ERROR' },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
});

// Confirm NFT minting after user signs the transaction
router.post('/claim/confirm', async (req: Request, res: Response) => {
  try {
    const { walletAddress, questId, transactionHash, nftTokenId } = req.body;

    if (!walletAddress || !questId || !transactionHash) {
      return res.status(400).json({
        success: false,
        error: { message: 'Wallet address, quest ID, and transaction hash are required', code: 'MISSING_FIELDS' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'USER_NOT_FOUND' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    const userId = user.id;

    // Update quest status to claimed
    const { error: updateError } = await supabase
      .from('user_quests')
      .update({
        status: 'claimed',
        claimed_at: new Date().toISOString(),
        nft_token_id: nftTokenId || transactionHash,
        nft_transaction_hash: transactionHash,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('quest_id', questId);

    if (updateError) throw updateError;

    const response: QuestClaimResponse = {
      success: true,
      nftTokenId: nftTokenId || transactionHash,
      transactionHash,
      message: 'NFT reward claimed successfully!',
    };

    return res.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
    } as ApiResponse<QuestClaimResponse>);
  } catch (error) {
    console.error('Error confirming quest NFT claim:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to confirm NFT claim', code: 'CONFIRM_ERROR' },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
});

// Submit signed transaction to blockchain
router.post('/claim/submit', async (req: Request, res: Response) => {
  try {
    let { signedXdr, network = 'testnet' } = req.body;

    // Handle both string XDR and object with signedTxXdr property
    if (typeof signedXdr === 'object' && signedXdr.signedTxXdr) {
      signedXdr = signedXdr.signedTxXdr;
    }

    if (!signedXdr || typeof signedXdr !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: 'Signed XDR is required', code: 'MISSING_XDR' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    console.log('[NFT Submit] Submitting signed transaction to network:', network);

    const result = await submitSignedTransaction(signedXdr, network);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: { message: result.error || 'Failed to submit transaction', code: 'SUBMIT_ERROR' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    console.log('[NFT Submit] Transaction submitted successfully:', result.transactionHash);

    return res.json({
      success: true,
      data: {
        transactionHash: result.transactionHash,
        nftTokenId: result.nftTokenId,
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } catch (error) {
    console.error('Error submitting signed transaction:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to submit signed transaction', code: 'SUBMIT_ERROR' },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
});

// Get or create user onboarding preferences
router.get('/onboarding', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: { message: 'Wallet address is required', code: 'MISSING_WALLET' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'USER_NOT_FOUND' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    const userId = user.id;

    // Get or create onboarding record
    let { data: onboarding, error: onboardingError } = await supabase
      .from('user_onboarding')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (onboardingError && onboardingError.code === 'PGRST116') {
      // Record doesn't exist, create it
      const { data: newOnboarding, error: insertError } = await supabase
        .from('user_onboarding')
        .insert({ user_id: userId })
        .select()
        .single();

      if (insertError) throw insertError;
      onboarding = newOnboarding;
    } else if (onboardingError) {
      throw onboardingError;
    }

    const result: UserOnboarding = {
      id: onboarding.id,
      userId: onboarding.user_id,
      hasSeenQuestModal: onboarding.has_seen_quest_modal,
      wantsQuests: onboarding.wants_quests,
      questsStartedAt: onboarding.quests_started_at,
      createdAt: onboarding.created_at,
      updatedAt: onboarding.updated_at,
    };

    return res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    } as ApiResponse<UserOnboarding>);
  } catch (error) {
    console.error('Error fetching onboarding:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch onboarding preferences', code: 'FETCH_ERROR' },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
});

// Update user onboarding preferences
router.post('/onboarding', async (req: Request, res: Response) => {
  try {
    const { walletAddress, hasSeenQuestModal, wantsQuests } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: { message: 'Wallet address is required', code: 'MISSING_WALLET' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'USER_NOT_FOUND' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    const userId = user.id;
    const now = new Date().toISOString();

    // Prepare update data
    const updateData: any = { updated_at: now };
    if (hasSeenQuestModal !== undefined) updateData.has_seen_quest_modal = hasSeenQuestModal;
    if (wantsQuests !== undefined) {
      updateData.wants_quests = wantsQuests;
      if (wantsQuests) updateData.quests_started_at = now;
    }

    // Upsert onboarding record
    const { data: onboarding, error: upsertError } = await supabase
      .from('user_onboarding')
      .upsert({ user_id: userId, ...updateData }, { onConflict: 'user_id' })
      .select()
      .single();

    if (upsertError) throw upsertError;

    const result: UserOnboarding = {
      id: onboarding.id,
      userId: onboarding.user_id,
      hasSeenQuestModal: onboarding.has_seen_quest_modal,
      wantsQuests: onboarding.wants_quests,
      questsStartedAt: onboarding.quests_started_at,
      createdAt: onboarding.created_at,
      updatedAt: onboarding.updated_at,
    };

    return res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    } as ApiResponse<UserOnboarding>);
  } catch (error) {
    console.error('Error updating onboarding:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to update onboarding preferences', code: 'UPDATE_ERROR' },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
});

export default router;
