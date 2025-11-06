import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Sparkles, Award, Gift } from 'lucide-react';

interface QuestOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
}

export const QuestOnboardingModal = ({
  isOpen,
  onClose,
  onAccept,
  onDecline,
}: QuestOnboardingModalProps) => {
  const navigate = useNavigate();
  const [isClosing, setIsClosing] = useState(false);

  const handleAccept = () => {
    onAccept();
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      navigate('/app/quests');
    }, 300);
  };

  const handleDecline = () => {
    onDecline();
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleDecline}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-secondary border border-default rounded-xl shadow-2xl max-w-lg w-full pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative p-6 border-b border-default">
                <button
                  onClick={handleDecline}
                  className="absolute top-4 right-4 p-2 hover:bg-neutral-900 rounded-lg transition-colors text-neutral-400 hover:text-neutral-50"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-50">Welcome to Syft! 🎉</h2>
                    <p className="text-neutral-400 text-sm mt-1">Start your DeFi journey</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <p className="text-neutral-300 leading-relaxed">
                  We've created a special quest system to help you learn about DeFi and our platform! Complete quests by actually using the features (no boring videos!), and earn exclusive NFT rewards along the way.
                </p>

                {/* Features */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-50">Learn by Doing</p>
                      <p className="text-sm text-neutral-400">
                        Complete real transactions and interact with actual features
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg flex-shrink-0">
                      <Gift className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-50">Earn NFT Rewards</p>
                      <p className="text-sm text-neutral-400">
                        Get exclusive NFTs minted to your wallet for each quest
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg flex-shrink-0">
                      <Award className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-50">Guided Hints</p>
                      <p className="text-sm text-neutral-400">
                        Stuck? Use hints to get step-by-step guidance
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4">
                  <p className="text-sm text-primary-300">
                    💡 <strong>Pro tip:</strong> Quests are completely optional, but they're the fastest way to master DeFi on Syft!
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 border-t border-default flex gap-3">
                <button
                  onClick={handleDecline}
                  disabled={isClosing}
                  className="flex-1 px-4 py-3 bg-secondary border border-default rounded-lg text-neutral-300 hover:text-neutral-50 hover:border-neutral-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleAccept}
                  disabled={isClosing}
                  className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 rounded-lg text-black font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Trophy className="w-5 h-5" />
                  <span>Start Quests</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
