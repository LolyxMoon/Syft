import { Shield } from 'lucide-react';
import { PageHeader, Section, Alert, SecurityItem } from '../../components/docs/DocsComponents';

export default function BestPractices() {
  return (
    <>
      <PageHeader icon={<Shield className="w-8 h-8" />} title="Security Best Practices" />
      
      <Section>
        <p>
          Follow these best practices to keep your assets safe while using Syft and DeFi in general.
          Security is a shared responsibility between the platform and users.
        </p>
      </Section>

      <Alert type="warning" title="Critical Reminder">
        Never share your seed phrase or private keys with anyone. Syft will NEVER ask for your
        seed phrase. If someone claiming to be from Syft asks for it, it's a scam.
      </Alert>

      <Section title="Wallet Security">
        <div className="space-y-4">
          <div className="p-6 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h3 className="text-white font-semibold mb-3">Secure Your Seed Phrase</h3>
            <div className="space-y-2 text-white/70 text-sm">
              <SecurityItem text="Write it down on paper, never store digitally" />
              <SecurityItem text="Keep multiple copies in secure locations" />
              <SecurityItem text="Never take photos of your seed phrase" />
              <SecurityItem text="Don't store in cloud services (Google Drive, iCloud, etc.)" />
              <SecurityItem text="Consider using a hardware wallet for large amounts" />
            </div>
          </div>

          <div className="p-6 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h3 className="text-white font-semibold mb-3">Freighter Wallet Setup</h3>
            <div className="space-y-2 text-white/70 text-sm">
              <SecurityItem text="Download only from official sources (freighter.app)" />
              <SecurityItem text="Verify the browser extension ID" />
              <SecurityItem text="Enable password protection" />
              <SecurityItem text="Use a strong, unique password" />
              <SecurityItem text="Enable auto-lock for short idle times" />
            </div>
          </div>

          <div className="p-6 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h3 className="text-white font-semibold mb-3">Browser Security</h3>
            <div className="space-y-2 text-white/70 text-sm">
              <SecurityItem text="Keep your browser updated" />
              <SecurityItem text="Only install extensions from official stores" />
              <SecurityItem text="Review extension permissions regularly" />
              <SecurityItem text="Use a dedicated browser for crypto activities" />
              <SecurityItem text="Clear cache and cookies periodically" />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Transaction Safety">
        <div className="space-y-3">
          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-lg">
            <h4 className="text-white font-semibold mb-2">Always Verify Before Signing</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-[#dce85d]">•</span>
                <span><strong className="text-white">Check the website URL:</strong> Ensure you're on syft.app (not syft-app.com or similar)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#dce85d]">•</span>
                <span><strong className="text-white">Review transaction details:</strong> Amounts, recipient addresses, and operations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#dce85d]">•</span>
                <span><strong className="text-white">Verify contract addresses:</strong> Match against official documentation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#dce85d]">•</span>
                <span><strong className="text-white">Check network:</strong> Confirm you're on the intended network (testnet vs mainnet)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#dce85d]">•</span>
                <span><strong className="text-white">Understand the operation:</strong> Don't sign what you don't understand</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-lg">
            <h4 className="text-white font-semibold mb-2">Start Small</h4>
            <p className="text-white/70 text-sm mb-3">
              When trying new features or vaults:
            </p>
            <ul className="space-y-1 text-white/70 text-sm">
              <li>• Test with small amounts first</li>
              <li>• Verify deposits and withdrawals work correctly</li>
              <li>• Monitor performance for a few days</li>
              <li>• Gradually increase allocation if comfortable</li>
            </ul>
          </div>

          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-lg">
            <h4 className="text-white font-semibold mb-2">Slippage Settings</h4>
            <p className="text-white/70 text-sm mb-3">
              Protect yourself from unfavorable trades:
            </p>
            <ul className="space-y-1 text-white/70 text-sm">
              <li>• Use conservative slippage (0.5-1% for stable pairs)</li>
              <li>• Increase slightly for volatile pairs if needed</li>
              <li>• High slippage (5%+) exposes you to MEV attacks</li>
              <li>• If transaction fails, don't immediately increase - check market conditions</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Account Management">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-gradient-to-br from-[#dce85d]/10 to-transparent border border-[#dce85d]/20 rounded-xl">
            <h3 className="text-white font-semibold mb-3">Separate Wallets</h3>
            <ul className="space-y-2 text-white/70 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-[#dce85d]">•</span>
                <span>Hot wallet: Small amounts for daily use</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#dce85d]">•</span>
                <span>Cold wallet: Large holdings in hardware wallet</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#dce85d]">•</span>
                <span>Testing wallet: For trying new dApps (testnet)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#dce85d]">•</span>
                <span>Never keep all funds in one place</span>
              </li>
            </ul>
          </div>

          <div className="p-6 bg-gradient-to-br from-[#dce85d]/10 to-transparent border border-[#dce85d]/20 rounded-xl">
            <h3 className="text-white font-semibold mb-3">Regular Reviews</h3>
            <ul className="space-y-2 text-white/70 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-[#dce85d]">•</span>
                <span>Check active vaults weekly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#dce85d]">•</span>
                <span>Review performance and rebalance if needed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#dce85d]">•</span>
                <span>Revoke unused contract permissions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#dce85d]">•</span>
                <span>Stay informed about platform updates</span>
              </li>
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Phishing Protection">
        <Alert type="warning" title="Common Scams to Avoid">
          <div className="space-y-3 text-sm">
            <div>
              <strong className="text-white">Fake Websites</strong>
              <p className="text-white/70 mt-1">
                Scammers create lookalike sites with similar URLs. Always bookmark the official
                site and verify the URL before connecting your wallet.
              </p>
            </div>
            <div>
              <strong className="text-white">Discord/Telegram Scams</strong>
              <p className="text-white/70 mt-1">
                Admins will NEVER DM you first. Anyone asking for your seed phrase or private
                keys is a scammer, even if they have an "Admin" tag.
              </p>
            </div>
            <div>
              <strong className="text-white">Fake Support</strong>
              <p className="text-white/70 mt-1">
                Use only official support channels. Beware of "support" accounts that DM you
                offering help - they're usually scammers.
              </p>
            </div>
            <div>
              <strong className="text-white">Suspicious Transactions</strong>
              <p className="text-white/70 mt-1">
                If a transaction popup appears unexpectedly, DO NOT sign it. Close it and check
                what triggered it. Malicious sites can trigger transactions.
              </p>
            </div>
          </div>
        </Alert>
      </Section>

      <Section title="Risk Management">
        <p className="text-white/70 mb-4">
          Smart DeFi investing includes proper risk management:
        </p>
        <div className="space-y-3">
          <SecurityItem text="Never invest more than you can afford to lose" />
          <SecurityItem text="Diversify across multiple vaults and strategies" />
          <SecurityItem text="Understand impermanent loss in liquidity pools" />
          <SecurityItem text="Set realistic profit targets and stop-losses" />
          <SecurityItem text="Keep some assets liquid for emergencies" />
          <SecurityItem text="Research protocols before investing significant amounts" />
          <SecurityItem text="Understand the risks of each strategy type" />
          <SecurityItem text="Monitor your positions regularly" />
        </div>
      </Section>

      <Section title="Emergency Procedures">
        <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
          <h3 className="text-white font-semibold mb-3">If You Suspect a Compromise:</h3>
          <ol className="space-y-2 text-white/70 text-sm">
            <li className="flex gap-2">
              <span className="text-[#dce85d] font-bold">1.</span>
              <span>Immediately transfer funds to a new wallet with a new seed phrase</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#dce85d] font-bold">2.</span>
              <span>Revoke all contract permissions on the compromised wallet</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#dce85d] font-bold">3.</span>
              <span>Scan your computer for malware</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#dce85d] font-bold">4.</span>
              <span>Change passwords on all crypto-related accounts</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#dce85d] font-bold">5.</span>
              <span>Report the incident to the Syft team (for platform-related issues)</span>
            </li>
          </ol>
        </div>
      </Section>
    </>
  );
}
