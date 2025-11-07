import { Palette } from 'lucide-react';
import { PageHeader, Section, CodeBlock, Alert } from '../../components/docs/DocsComponents';

export default function RunwareAI() {
  return (
    <>
      <PageHeader icon={<Palette className="w-8 h-8" />} title="Runware AI - NFT Artwork" />
      
      <Section>
        <p>
          Runware AI automatically generates unique, high-quality artwork for every vault NFT.
          Each piece visually represents the vault's strategy, risk profile, and characteristics.
        </p>
      </Section>

      <Section title="How It Works">
        <div className="space-y-4">
          <div className="p-6 bg-gradient-to-br from-[#dce85d]/10 to-transparent border border-[#dce85d]/20 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#dce85d] text-black flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="text-white font-semibold">Strategy Analysis</h3>
            </div>
            <p className="text-white/70 text-sm">
              When a user creates a vault, Syft analyzes the strategy parameters: pool types,
              allocations, risk level, and rebalancing frequency.
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-[#dce85d]/10 to-transparent border border-[#dce85d]/20 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#dce85d] text-black flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="text-white font-semibold">Prompt Generation</h3>
            </div>
            <p className="text-white/70 text-sm">
              GPT-5 Nano converts the strategy into a detailed visual prompt, describing colors,
              patterns, and symbols that represent the vault's characteristics.
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-[#dce85d]/10 to-transparent border border-[#dce85d]/20 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#dce85d] text-black flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="text-white font-semibold">Image Generation</h3>
            </div>
            <p className="text-white/70 text-sm">
              Runware AI generates a 1024x1024 PNG image based on the prompt, creating unique
              artwork that matches the vault's identity.
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-[#dce85d]/10 to-transparent border border-[#dce85d]/20 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#dce85d] text-black flex items-center justify-center font-bold">
                4
              </div>
              <h3 className="text-white font-semibold">IPFS Upload</h3>
            </div>
            <p className="text-white/70 text-sm">
              The generated artwork is uploaded to IPFS for permanent, decentralized storage,
              and the IPFS hash is included in the NFT metadata.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Visual Style Guide">
        <p className="text-white/70 mb-4">
          Runware generates artwork that reflects vault characteristics:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-lg">
            <h4 className="text-white font-semibold mb-2">Risk Level</h4>
            <ul className="space-y-1 text-sm text-white/70">
              <li className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500/30 border border-green-500"></div>
                <span>Low: Cool blues and greens</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500/30 border border-yellow-500"></div>
                <span>Medium: Warm yellows</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500/30 border border-red-500"></div>
                <span>High: Vibrant reds and oranges</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-lg">
            <h4 className="text-white font-semibold mb-2">Strategy Type</h4>
            <ul className="space-y-1 text-sm text-white/70">
              <li>• LP: Flowing liquidity patterns</li>
              <li>• Yield Farming: Growing organic shapes</li>
              <li>• Balanced: Symmetrical geometric forms</li>
              <li>• Aggressive: Sharp, dynamic angles</li>
            </ul>
          </div>

          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-lg">
            <h4 className="text-white font-semibold mb-2">Pool Count</h4>
            <ul className="space-y-1 text-sm text-white/70">
              <li>• Single pool: Focused central element</li>
              <li>• 2-3 pools: Dual/triple symmetry</li>
              <li>• 4+ pools: Complex tessellations</li>
            </ul>
          </div>

          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-lg">
            <h4 className="text-white font-semibold mb-2">Performance</h4>
            <ul className="space-y-1 text-sm text-white/70">
              <li>• Positive returns: Upward gradients</li>
              <li>• Stable: Horizontal patterns</li>
              <li>• Volatile: Dynamic swirls</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section title="API Integration">
        <p className="text-white/70 mb-4">
          Example code for generating NFT artwork:
        </p>
        <CodeBlock language="typescript" code={`import { RunwareClient } from '@runware/sdk';

const runware = new RunwareClient({
  apiKey: process.env.RUNWARE_API_KEY
});

export async function generateVaultArtwork(vaultConfig: VaultConfig) {
  // Generate visual prompt from strategy
  const prompt = await generateArtPrompt(vaultConfig);
  
  // Create image with Runware
  const result = await runware.imageInference({
    positivePrompt: prompt,
    model: 'runware:100@1',
    width: 1024,
    height: 1024,
    numberResults: 1,
    outputFormat: 'PNG',
    outputType: 'base64'
  });

  // Upload to IPFS
  const ipfsHash = await uploadToIPFS(result.imageBase64);
  
  return {
    imageUrl: \`ipfs://\${ipfsHash}\`,
    imageData: result.imageBase64
  };
}

async function generateArtPrompt(vault: VaultConfig): Promise<string> {
  const riskColors = {
    low: 'cool blues and calming greens',
    medium: 'balanced yellows and warm tones',
    high: 'vibrant reds and dynamic oranges'
  };

  return \`Abstract digital art representing a DeFi vault strategy.
Features: \${vault.pools.length} interconnected pools shown as 
flowing liquid forms. Color palette: \${riskColors[vault.riskLevel]}.
Style: Modern, geometric, financial visualization with glowing 
elements. Mood: Professional and technological. High quality, 
4K, centered composition, clean background.\`;
}`} />
      </Section>

      <Section title="Image Specifications">
        <Alert type="info" title="Technical Details">
          <ul className="space-y-1 text-sm">
            <li>• Resolution: 1024x1024 pixels</li>
            <li>• Format: PNG with transparency support</li>
            <li>• Storage: IPFS (InterPlanetary File System)</li>
            <li>• Generation time: ~3-5 seconds</li>
            <li>• Cost: ~$0.02 per image</li>
          </ul>
        </Alert>
      </Section>

      <Section title="Benefits">
        <ul className="space-y-2 text-white/70">
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Unique identity:</strong> Every vault NFT has distinctive artwork</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Visual communication:</strong> Strategy characteristics visible at a glance</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Marketplace appeal:</strong> Attractive NFTs drive marketplace engagement</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Automated process:</strong> No manual design work required</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Consistent quality:</strong> Professional-grade output every time</span>
          </li>
        </ul>
      </Section>
    </>
  );
}
