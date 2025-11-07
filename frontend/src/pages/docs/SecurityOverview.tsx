import { ShieldCheck } from 'lucide-react';
import { PageHeader, Section, SecurityItem, Alert } from '../../components/docs/DocsComponents';

export default function SecurityOverview() {
  return (
    <>
      <PageHeader icon={<ShieldCheck className="w-8 h-8" />} title="Security Overview" />
      
      <Section>
        <p>
          Syft implements comprehensive security measures across all layers of the platform.
          From smart contracts to API endpoints, security is built into every component.
        </p>
      </Section>

      <Section title="Smart Contract Security">
        <div className="space-y-3 mb-6">
          <SecurityItem text="Audited by OpenZeppelin standards" />
          <SecurityItem text="Reentrancy guards on all state-changing functions" />
          <SecurityItem text="Integer overflow protection with SafeMath" />
          <SecurityItem text="Emergency pause mechanism for critical issues" />
          <SecurityItem text="Time-locked admin functions for transparency" />
          <SecurityItem text="Access control with role-based permissions" />
        </div>
        <Alert type="info" title="Audit Status">
          Syft smart contracts are currently undergoing security audit. Testnet deployment
          only. Mainnet launch pending audit completion and community review.
        </Alert>
      </Section>

      <Section title="Non-Custodial Architecture">
        <p className="text-white/70 mb-4">
          Syft never holds your private keys or assets. You maintain full control at all times:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-gradient-to-br from-[#dce85d]/10 to-transparent border border-[#dce85d]/20 rounded-xl">
            <h3 className="text-white font-semibold mb-3">Your Keys, Your Assets</h3>
            <ul className="space-y-2 text-white/70 text-sm">
              <li>• Private keys stored in your Freighter wallet</li>
              <li>• Sign transactions locally on your device</li>
              <li>• Revoke permissions anytime</li>
              <li>• No server-side key storage</li>
            </ul>
          </div>
          <div className="p-6 bg-gradient-to-br from-[#dce85d]/10 to-transparent border border-[#dce85d]/20 rounded-xl">
            <h3 className="text-white font-semibold mb-3">Transparent Operations</h3>
            <ul className="space-y-2 text-white/70 text-sm">
              <li>• All transactions visible on Stellar</li>
              <li>• Open-source smart contracts</li>
              <li>• Verify contract code before interacting</li>
              <li>• Community governance for upgrades</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Infrastructure Security">
        <div className="space-y-4">
          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-lg">
            <h4 className="text-white font-semibold mb-2">API Security</h4>
            <ul className="space-y-1 text-white/70 text-sm">
              <li>• HTTPS encryption for all requests</li>
              <li>• Rate limiting to prevent abuse</li>
              <li>• CORS policies for browser security</li>
              <li>• JWT authentication with short expiry</li>
              <li>• No sensitive data in logs</li>
            </ul>
          </div>

          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-lg">
            <h4 className="text-white font-semibold mb-2">Database Security</h4>
            <ul className="space-y-1 text-white/70 text-sm">
              <li>• Encrypted at rest and in transit</li>
              <li>• Regular backups with encryption</li>
              <li>• Principle of least privilege access</li>
              <li>• No private keys or sensitive data stored</li>
              <li>• SQL injection prevention</li>
            </ul>
          </div>

          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-lg">
            <h4 className="text-white font-semibold mb-2">Frontend Security</h4>
            <ul className="space-y-1 text-white/70 text-sm">
              <li>• Content Security Policy (CSP) headers</li>
              <li>• XSS protection via React's built-in sanitization</li>
              <li>• Secure dependencies (automated Dependabot)</li>
              <li>• HTTPS-only cookies</li>
              <li>• Regular security updates</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Transaction Security">
        <p className="text-white/70 mb-4">
          Every transaction goes through multiple security checks:
        </p>
        <div className="space-y-3">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#dce85d]/20 border border-[#dce85d] flex items-center justify-center text-[#dce85d] font-bold">
              1
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">Simulation</h4>
              <p className="text-white/70 text-sm">
                Transaction is simulated before submission to check for errors and estimate costs.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#dce85d]/20 border border-[#dce85d] flex items-center justify-center text-[#dce85d] font-bold">
              2
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">User Approval</h4>
              <p className="text-white/70 text-sm">
                You review and approve every transaction in your Freighter wallet before signing.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#dce85d]/20 border border-[#dce85d] flex items-center justify-center text-[#dce85d] font-bold">
              3
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">Slippage Protection</h4>
              <p className="text-white/70 text-sm">
                Minimum output amounts prevent sandwich attacks and unexpected losses.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#dce85d]/20 border border-[#dce85d] flex items-center justify-center text-[#dce85d] font-bold">
              4
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">On-Chain Validation</h4>
              <p className="text-white/70 text-sm">
                Smart contracts verify all parameters and enforce security rules.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Monitoring & Incident Response">
        <p className="text-white/70 mb-4">
          Syft maintains 24/7 monitoring and has established incident response procedures:
        </p>
        <div className="space-y-3">
          <SecurityItem text="Real-time alerts for unusual contract activity" />
          <SecurityItem text="Automated circuit breakers for anomalies" />
          <SecurityItem text="Multi-signature emergency pause mechanism" />
          <SecurityItem text="Bug bounty program for responsible disclosure" />
          <SecurityItem text="Transparent incident communication via Discord" />
          <SecurityItem text="Post-mortem reports for all security events" />
        </div>
      </Section>

      <Section title="Responsible Disclosure">
        <Alert type="warning" title="Found a Security Issue?">
          <p className="mb-2">
            We take security seriously. If you discover a vulnerability:
          </p>
          <ul className="space-y-1 text-sm">
            <li>• Email: <code>security@syft.app</code> (not yet active - placeholder)</li>
            <li>• Do NOT disclose publicly until we've had time to fix it</li>
            <li>• Include detailed steps to reproduce</li>
            <li>• We aim to respond within 24 hours</li>
            <li>• Eligible for bug bounty rewards</li>
          </ul>
        </Alert>
      </Section>
    </>
  );
}
