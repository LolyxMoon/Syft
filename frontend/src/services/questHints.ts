// Quest hint service using driver.js for guided tours
import { driver, DriveStep, Config } from 'driver.js';
import 'driver.js/dist/driver.css';
import type { HintStep } from '../../../shared/types';

// Custom styles for the driver.js popover
const driverConfig: Config = {
  showProgress: true,
  showButtons: ['next', 'previous', 'close'],
  popoverClass: 'quest-hint-popover',
  progressText: 'Step {{current}} of {{total}}',
  nextBtnText: 'Next',
  prevBtnText: 'Previous',
  doneBtnText: 'Got it!',
  smoothScroll: true,
  animate: true,
  overlayOpacity: 0.15,
  stagePadding: 5,
  onDestroyed: () => {
    console.log('Hint tour completed or closed');
  },
};

class QuestHintService {
  private driverInstance: ReturnType<typeof driver> | null = null;

  // Convert our HintStep format to driver.js format
  private convertHintSteps(hintSteps: HintStep[]): DriveStep[] {
    return hintSteps.map((step) => ({
      element: step.element,
      popover: {
        title: step.popover.title,
        description: step.popover.description,
        side: step.popover.side || 'bottom',
        align: step.popover.align || 'center',
      },
    }));
  }

  // Start a hint tour for a quest
  startHintTour(hintSteps: HintStep[], questTitle: string) {
    if (!hintSteps || hintSteps.length === 0) {
      console.warn('No hint steps provided for quest');
      return;
    }

    // Clean up any existing tour
    if (this.driverInstance) {
      this.driverInstance.destroy();
    }

    const steps = this.convertHintSteps(hintSteps);

    // Add an intro step
    const introStep: DriveStep = {
      popover: {
        title: `🎯 Quest: ${questTitle}`,
        description: `Let's walk through how to complete this quest. Follow the highlighted areas and read the instructions carefully.`,
      },
    };

    // Create new driver instance
    this.driverInstance = driver({
      ...driverConfig,
      steps: [introStep, ...steps],
      onDestroyed: () => {
        this.driverInstance = null;
      },
    });

    // Start the tour
    this.driverInstance.drive();
  }

  // Highlight a specific element
  highlightElement(element: string, title: string, description: string) {
    if (this.driverInstance) {
      this.driverInstance.destroy();
    }

    this.driverInstance = driver({
      ...driverConfig,
      steps: [
        {
          element,
          popover: {
            title,
            description,
          },
        },
      ],
      onDestroyed: () => {
        this.driverInstance = null;
      },
    });

    this.driverInstance.drive();
  }

  // Stop any active tour
  stopTour() {
    if (this.driverInstance) {
      this.driverInstance.destroy();
      this.driverInstance = null;
    }
  }

  // Move to next step
  moveNext() {
    if (this.driverInstance) {
      this.driverInstance.moveNext();
    }
  }

  // Move to previous step
  movePrevious() {
    if (this.driverInstance) {
      this.driverInstance.movePrevious();
    }
  }
}

// Export singleton instance
export const questHints = new QuestHintService();
