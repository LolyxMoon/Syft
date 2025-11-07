import { Sparkles } from 'lucide-react';
import { PageHeader, Section, FeatureGrid, FeatureCard } from '../../components/docs/DocsComponents';
import { Layout, Bot, Terminal, Image, TrendingUp, Shield } from 'lucide-react';

export default function WhatIsSyft() {
  return (
    <>
      <PageHeader icon={<Sparkles className="w-8 h-8" />} title="What is Syft?" />
      
      <Section>
        <p>
          <strong>Syft</strong> is a next-generation DeFi platform built on Stellar that revolutionizes yield vault 
          creation and management. With three intuitive ways to build strategies—visual drag-and-drop, AI chat, and 
          voice commands—plus a powerful Terminal AI for blockchain operations, Syft empowers users to create 
          sophisticated DeFi strategies without writing a single line of code.
        </p>
      </Section>

      <Section title="Three Ways to Build">
        <FeatureGrid>
          <FeatureCard 
            icon={<Layout className="w-6 h-6" />}
            title="Visual Builder"
            description="Drag-and-drop interface for creating complex strategies with real-time validation"
          />
          <FeatureCard 
            icon={<Bot className="w-6 h-6" />}
            title="AI-Powered"
            description="Chat and voice commands with GPT-5 Nano for natural language vault creation"
          />
          <FeatureCard 
            icon={<Terminal className="w-6 h-6" />}
            title="Terminal AI"
            description="Execute blockchain operations with natural language commands"
          />
        </FeatureGrid>
      </Section>

      <Section title="Why Syft?">
        <div className="space-y-4">
          <div className="flex gap-3 items-start">
            <div className="w-6 h-6 bg-[#dce85d]/20 border border-[#dce85d] rounded flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[#dce85d] text-sm">✓</span>
            </div>
            <div>
              <h4 className="text-white font-medium">No Coding Required</h4>
              <p className="text-white/60 text-sm">Create sophisticated DeFi strategies without writing code</p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="w-6 h-6 bg-[#dce85d]/20 border border-[#dce85d] rounded flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[#dce85d] text-sm">✓</span>
            </div>
            <div>
              <h4 className="text-white font-medium">Monetize Your Strategies</h4>
              <p className="text-white/60 text-sm">Convert vaults into NFTs and earn from subscribers</p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="w-6 h-6 bg-[#dce85d]/20 border border-[#dce85d] rounded flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[#dce85d] text-sm">✓</span>
            </div>
            <div>
              <h4 className="text-white font-medium">Built on Stellar</h4>
              <p className="text-white/60 text-sm">Fast, secure, and low-cost transactions on Stellar blockchain</p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="w-6 h-6 bg-[#dce85d]/20 border border-[#dce85d] rounded flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[#dce85d] text-sm">✓</span>
            </div>
            <div>
              <h4 className="text-white font-medium">Non-Custodial</h4>
              <p className="text-white/60 text-sm">You maintain full control of your assets at all times</p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Use Cases">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <TrendingUp className="w-8 h-8 text-[#dce85d] mb-3" />
            <h4 className="text-white font-semibold mb-2">For Strategy Creators</h4>
            <ul className="text-white/60 text-sm space-y-1">
              <li>• Build and deploy automated yield strategies</li>
              <li>• Mint strategy NFTs with AI-generated art</li>
              <li>• Earn passive income from subscribers</li>
              <li>• Track performance with real-time analytics</li>
            </ul>
          </div>

          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <Image className="w-8 h-8 text-[#dce85d] mb-3" />
            <h4 className="text-white font-semibold mb-2">For Vault Subscribers</h4>
            <ul className="text-white/60 text-sm space-y-1">
              <li>• Discover high-performing strategies</li>
              <li>• Subscribe and earn automated yields</li>
              <li>• View transparent performance metrics</li>
              <li>• Manage positions from unified dashboard</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section>
        <div className="bg-gradient-to-br from-[#dce85d]/10 to-transparent border border-[#dce85d]/30 rounded-xl p-6">
          <Shield className="w-10 h-10 text-[#dce85d] mb-3" />
          <h3 className="text-white font-semibold mb-2">Security First</h3>
          <p className="text-white/70">
            Syft is built with security as the top priority. All smart contracts are audited, non-custodial, 
            and follow OpenZeppelin standards. Your private keys stay with you, always.
          </p>
        </div>
      </Section>
    </>
  );
}
