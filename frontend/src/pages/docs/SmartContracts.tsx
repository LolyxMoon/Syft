import { Code } from 'lucide-react';
import { PageHeader, Section } from '../../components/docs/DocsComponents';
import { Link } from 'react-router-dom';

export default function SmartContracts() {
  return (
    <>
      <PageHeader icon={<Code className="w-8 h-8" />} title="Smart Contracts" />
      
      <Section>
        <p>
          Syft's smart contracts are written in Rust using the Soroban SDK and compiled to WebAssembly
          for deployment on the Stellar network. All contracts follow OpenZeppelin standards and have
          been designed with security and upgradability in mind.
        </p>
      </Section>

      <Section title="Contract Overview">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link 
            to="/docs/smart-contracts/architecture"
            className="p-6 bg-[#0a0b0c] border border-white/10 rounded-xl hover:border-[#dce85d]/30 transition-all group"
          >
            <h3 className="text-white font-semibold mb-2 group-hover:text-[#dce85d] transition-colors">
              Contract Architecture →
            </h3>
            <p className="text-white/60 text-sm">
              Understand the overall structure and design patterns
            </p>
          </Link>

          <Link 
            to="/docs/smart-contracts/vault-factory"
            className="p-6 bg-[#0a0b0c] border border-white/10 rounded-xl hover:border-[#dce85d]/30 transition-all group"
          >
            <h3 className="text-white font-semibold mb-2 group-hover:text-[#dce85d] transition-colors">
              Vault Factory →
            </h3>
            <p className="text-white/60 text-sm">
              Factory pattern for deploying vault instances dynamically
            </p>
          </Link>

          <Link 
            to="/docs/smart-contracts/nft-contract"
            className="p-6 bg-[#0a0b0c] border border-white/10 rounded-xl hover:border-[#dce85d]/30 transition-all group"
          >
            <h3 className="text-white font-semibold mb-2 group-hover:text-[#dce85d] transition-colors">
              NFT Contract →
            </h3>
            <p className="text-white/60 text-sm">
              ERC-721 compatible tokens for vault tokenization
            </p>
          </Link>

          <Link 
            to="/docs/smart-contracts/deployment"
            className="p-6 bg-[#0a0b0c] border border-white/10 rounded-xl hover:border-[#dce85d]/30 transition-all group"
          >
            <h3 className="text-white font-semibold mb-2 group-hover:text-[#dce85d] transition-colors">
              Deployment Guide →
            </h3>
            <p className="text-white/60 text-sm">
              Step-by-step guide to deploying contracts on Stellar
            </p>
          </Link>
        </div>
      </Section>

      <Section title="Technology Stack">
        <ul className="space-y-2 text-white/70">
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Rust (Edition 2021):</strong> Systems programming language for smart contracts</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Soroban SDK 22.0.8:</strong> Stellar's smart contract platform</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">WebAssembly:</strong> Compilation target for optimal performance</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">OpenZeppelin Standards:</strong> Battle-tested contract patterns</span>
          </li>
        </ul>
      </Section>

      <Section title="Deployed Contracts (Testnet)">
        <div className="space-y-4">
          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-2">Vault Factory</h4>
            <p className="text-white/50 text-sm font-mono break-all mb-2">
              CCODOMK6HSVVKX7FP2CCUVL7VKKOYCO3AJPWC5C656RP4FXGFPWU3YM2
            </p>
            <a 
              href="https://stellar.expert/explorer/testnet/contract/CCODOMK6HSVVKX7FP2CCUVL7VKKOYCO3AJPWC5C656RP4FXGFPWU3YM2"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#dce85d] hover:text-[#e8f06d] text-sm"
            >
              View on Stellar Expert →
            </a>
          </div>

          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-2">NFT Contract</h4>
            <p className="text-white/50 text-sm font-mono break-all mb-2">
              CCTSYGMDPB37KKXGT7CW4KYYDHJKSW4K2DF3S4PXWFZ7JVA5LOS4AIWU
            </p>
            <a 
              href="https://stellar.expert/explorer/testnet/contract/CCTSYGMDPB37KKXGT7CW4KYYDHJKSW4K2DF3S4PXWFZ7JVA5LOS4AIWU"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#dce85d] hover:text-[#e8f06d] text-sm"
            >
              View on Stellar Expert →
            </a>
          </div>
        </div>
      </Section>
    </>
  );
}
