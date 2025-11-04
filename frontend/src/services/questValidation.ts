// Quest validation service - tracks user actions and validates quest completion

const API_URL = `${import.meta.env.VITE_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api`;

class QuestValidationService {
  private walletAddress: string | null = null;
  private pageVisits: Map<string, number> = new Map();
  private actionTimestamps: Map<string, number> = new Map();

  setWalletAddress(address: string) {
    this.walletAddress = address;
  }

  // Track page visit duration
  trackPageVisit(pageName: string) {
    const now = Date.now();
    if (!this.pageVisits.has(pageName)) {
      this.pageVisits.set(pageName, now);
    }
  }

  // Get time spent on a page (in seconds)
  getPageVisitDuration(pageName: string): number {
    const startTime = this.pageVisits.get(pageName);
    if (!startTime) return 0;
    return Math.floor((Date.now() - startTime) / 1000);
  }

  // Track an action
  trackAction(actionName: string) {
    this.actionTimestamps.set(actionName, Date.now());
  }

  // Update quest progress on the backend
  async updateQuestProgress(questKey: string, progress?: any, completed?: boolean) {
    if (!this.walletAddress) {
      console.warn('Cannot update quest progress: wallet not connected');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/quests/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: this.walletAddress,
          questKey,
          progress,
          completed,
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        console.error('Failed to update quest progress:', data.error);
      }
      
      return data;
    } catch (error) {
      console.error('Error updating quest progress:', error);
    }
  }

  // Quest validation methods

  async validateConnectWallet() {
    if (this.walletAddress) {
      await this.updateQuestProgress('connect_wallet', { connected: true }, true);
    }
  }

  async validateExploreVaults() {
    const duration = this.getPageVisitDuration('vaults');
    if (duration >= 5) {
      await this.updateQuestProgress('explore_vaults', { visitDuration: duration }, true);
    } else {
      await this.updateQuestProgress('explore_vaults', { visitDuration: duration }, false);
    }
  }

  async validateViewVaultDetails() {
    const duration = this.getPageVisitDuration('vault_detail');
    if (duration >= 10) {
      await this.updateQuestProgress('view_vault_details', { visitDuration: duration }, true);
    } else {
      await this.updateQuestProgress('view_vault_details', { visitDuration: duration }, false);
    }
  }

  async validateDepositToVault(amount: number) {
    await this.updateQuestProgress('deposit_to_vault', { depositAmount: amount }, true);
  }

  async validateCreateVault(vaultId: string) {
    await this.updateQuestProgress('create_first_vault', { vaultId }, true);
  }

  async validateAddRebalancingRule(vaultId: string, ruleIndex: number) {
    await this.updateQuestProgress('add_rebalancing_rule', { vaultId, ruleIndex }, true);
  }

  async validateRunBacktest(backtestId: string) {
    await this.updateQuestProgress('run_backtest', { backtestId }, true);
  }

  async validateViewAnalytics() {
    const duration = this.getPageVisitDuration('analytics');
    if (duration >= 10) {
      await this.updateQuestProgress('view_analytics', { visitDuration: duration }, true);
    } else {
      await this.updateQuestProgress('view_analytics', { visitDuration: duration }, false);
    }
  }

  // Clear page visit tracking when leaving a page
  clearPageVisit(pageName: string) {
    this.pageVisits.delete(pageName);
  }

  // Reset all tracking
  reset() {
    this.walletAddress = null;
    this.pageVisits.clear();
    this.actionTimestamps.clear();
  }
}

// Export singleton instance
export const questValidation = new QuestValidationService();
