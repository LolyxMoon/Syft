// Quest Progress Tracker - Tracks user actions and progresses quest hints automatically
import { questHints } from './questHints';

interface QuestStepTracker {
  questKey: string;
  currentStep: number;
  totalSteps: number;
  stepsCompleted: Set<string>;
  onComplete?: () => void;
}

class QuestProgressTracker {
  private activeQuest: QuestStepTracker | null = null;
  private eventListeners: Map<string, EventListener> = new Map();

  // Start tracking a quest
  startTracking(
    questKey: string,
    steps: string[],
    onComplete?: () => void
  ) {
    // Stop any existing tracking
    this.stopTracking();

    this.activeQuest = {
      questKey,
      currentStep: 0,
      totalSteps: steps.length,
      stepsCompleted: new Set(),
      onComplete,
    };

    console.log(`[QuestProgressTracker] Started tracking quest: ${questKey}`);
    console.log(`[QuestProgressTracker] Steps to track:`, steps);
  }

  // Stop tracking the current quest
  stopTracking() {
    if (!this.activeQuest) return;

    console.log(`[QuestProgressTracker] Stopped tracking quest: ${this.activeQuest.questKey}`);
    
    // Clean up event listeners
    this.eventListeners.forEach((listener, event) => {
      document.removeEventListener(event, listener);
    });
    this.eventListeners.clear();

    this.activeQuest = null;
  }

  // Mark a step as completed and progress to next
  completeStep(stepKey: string) {
    if (!this.activeQuest) {
      console.warn('[QuestProgressTracker] No active quest to complete step for');
      return;
    }

    if (this.activeQuest.stepsCompleted.has(stepKey)) {
      console.log(`[QuestProgressTracker] Step "${stepKey}" already completed, skipping`);
      return;
    }

    console.log(`[QuestProgressTracker] Step completed: ${stepKey}`);
    this.activeQuest.stepsCompleted.add(stepKey);
    this.activeQuest.currentStep++;

    // Progress the hint tour to the next step
    questHints.moveNext();

    // Check if quest is fully completed
    if (this.activeQuest.currentStep >= this.activeQuest.totalSteps) {
      console.log(`[QuestProgressTracker] Quest "${this.activeQuest.questKey}" completed!`);
      if (this.activeQuest.onComplete) {
        this.activeQuest.onComplete();
      }
      this.stopTracking();
    }
  }

  // Check if currently tracking a specific quest
  isTracking(questKey: string): boolean {
    return this.activeQuest?.questKey === questKey;
  }

  // Get the current quest being tracked
  getActiveQuest(): QuestStepTracker | null {
    return this.activeQuest;
  }

  // Track specific actions for "Build And Deploy Your Own Vault" quest
  trackVaultBuilderAction(action: 'drag_to_canvas' | 'add_allocation' | 'deploy_vault') {
    if (!this.activeQuest || this.activeQuest.questKey !== 'create_first_vault') {
      return;
    }

    console.log(`[QuestProgressTracker] Vault builder action: ${action}`);
    this.completeStep(action);
  }

  // Generic action tracker
  trackAction(actionKey: string) {
    if (!this.activeQuest) {
      return;
    }

    console.log(`[QuestProgressTracker] Generic action: ${actionKey}`);
    this.completeStep(actionKey);
  }
}

// Export singleton instance
export const questProgressTracker = new QuestProgressTracker();
