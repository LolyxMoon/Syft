import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { AppHeader } from '../components/layout/AppHeader';
import { QuestOnboardingModal } from '../components/quests/QuestOnboardingModal';
import { useWallet } from '../providers/WalletProvider';
import { useActivityTracker } from '../hooks/useActivityTracker';

const API_URL = `${import.meta.env.VITE_PUBLIC_BACKEND_URL || 'https://syft-f6ad696f49ee.herokuapp.com'}/api`;

const AppLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const { address: publicKey } = useWallet();
  
  // Track user activity for quest validation
  useActivityTracker();

  useEffect(() => {
    if (publicKey) {
      checkOnboardingStatus();
    }
  }, [publicKey]);

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/quests/onboarding?walletAddress=${publicKey}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        // Show modal only if user hasn't seen it yet
        if (!data.data.hasSeenQuestModal) {
          setShowQuestModal(true);
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const handleAcceptQuests = async () => {
    try {
      await fetch(`${API_URL}/quests/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey,
          hasSeenQuestModal: true,
          wantsQuests: true,
        }),
      });
      setShowQuestModal(false);
    } catch (error) {
      console.error('Error accepting quests:', error);
    }
  };

  const handleDeclineQuests = async () => {
    try {
      await fetch(`${API_URL}/quests/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey,
          hasSeenQuestModal: true,
          wantsQuests: false,
        }),
      });
      setShowQuestModal(false);
    } catch (error) {
      console.error('Error declining quests:', error);
    }
  };

  return (
    <div className="flex h-screen bg-app overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <AppHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Quest Onboarding Modal */}
      <QuestOnboardingModal
        isOpen={showQuestModal}
        onClose={() => setShowQuestModal(false)}
        onAccept={handleAcceptQuests}
        onDecline={handleDeclineQuests}
      />
    </div>
  );
};

export default AppLayout;
