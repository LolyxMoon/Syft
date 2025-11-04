// Quest system types

export type QuestCategory = 'basics' | 'defi' | 'vaults' | 'advanced';
export type QuestDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type QuestStatus = 'not_started' | 'in_progress' | 'completed' | 'claimed';
export type ValidationType = 'manual' | 'automatic';

export interface HintStep {
  element: string;
  popover: {
    title: string;
    description: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end';
  };
}

export interface ValidationConfig {
  check: string; // e.g., 'wallet_connected', 'made_deposit', 'created_vault'
  minAmount?: number;
  minTime?: number; // seconds
  [key: string]: any;
}

export interface Quest {
  id: string;
  questKey: string;
  title: string;
  description: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  orderIndex: number;
  rewardNftImage?: string;
  rewardNftName: string;
  rewardNftDescription?: string;
  validationType: ValidationType;
  validationConfig: ValidationConfig;
  hintSteps: HintStep[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserQuest {
  id: string;
  userId: string;
  questId: string;
  status: QuestStatus;
  progress: {
    [key: string]: any;
  };
  startedAt?: string;
  completedAt?: string;
  claimedAt?: string;
  nftTokenId?: string;
  nftTransactionHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestWithProgress extends Quest {
  userQuest?: UserQuest;
  isLocked: boolean; // True if previous quest is not completed
}

export interface UserOnboarding {
  id: string;
  userId: string;
  hasSeenQuestModal: boolean;
  wantsQuests: boolean;
  questsStartedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestProgressUpdate {
  questKey: string;
  progress?: {
    [key: string]: any;
  };
  completed?: boolean;
}

export interface QuestClaimRequest {
  questId: string;
}

export interface QuestClaimResponse {
  success: boolean;
  nftTokenId?: string;
  transactionHash?: string;
  message?: string;
}

export interface QuestStatsResponse {
  totalQuests: number;
  completedQuests: number;
  claimedQuests: number;
  inProgressQuests: number;
  completionRate: number;
  nftsEarned: number;
}
