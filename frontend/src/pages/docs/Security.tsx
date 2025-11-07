import { Shield } from 'lucide-react';
import { PageHeader, Section, SecurityItem } from '../../components/docs/DocsComponents';
import { Link } from 'react-router-dom';

export default function Security() {
  return (
    <>
      <PageHeader icon={<Shield className="w-8 h-8" />} title="Security" />
      
      <Section>
        <p>
          Security is our top priority. Syft implements multiple layers of protection to ensure
          your assets and data remain safe at all times.
        </p>
      </Section>

      <Section title="Security Sections">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link 
            to="/docs/security/overview"
            className="p-6 bg-[#0a0b0c] border border-white/10 rounded-xl hover:border-[#dce85d]/30 transition-all group"
          >
            <h3 className="text-white font-semibold mb-2 group-hover:text-[#dce85d] transition-colors">
              Security Overview →
            </h3>
            <p className="text-white/60 text-sm">
              Comprehensive security measures and architecture
            </p>
          </Link>

          <Link 
            to="/docs/security/best-practices"
            className="p-6 bg-[#0a0b0c] border border-white/10 rounded-xl hover:border-[#dce85d]/30 transition-all group"
          >
            <h3 className="text-white font-semibold mb-2 group-hover:text-[#dce85d] transition-colors">
              Best Practices →
            </h3>
            <p className="text-white/60 text-sm">
              Guidelines for keeping your assets secure
            </p>
          </Link>
        </div>
      </Section>

      <Section title="Key Security Features">
        <div className="space-y-3">
          <SecurityItem text="Audited by OpenZeppelin standards" />
          <SecurityItem text="Non-custodial architecture - you control your keys" />
          <SecurityItem text="Role-based access control for contracts" />
          <SecurityItem text="Emergency pause mechanism" />
          <SecurityItem text="No private key storage on servers" />
          <SecurityItem text="HTTPS encryption for all API calls" />
          <SecurityItem text="Transaction simulation before execution" />
          <SecurityItem text="Regular security audits and updates" />
        </div>
      </Section>
    </>
  );
}
