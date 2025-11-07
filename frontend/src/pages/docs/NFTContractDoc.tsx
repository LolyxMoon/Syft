import { Image } from 'lucide-react';
import { PageHeader, Section, CodeBlock, Alert } from '../../components/docs/DocsComponents';

export default function NFTContractDoc() {
  return (
    <>
      <PageHeader icon={<Image className="w-8 h-8" />} title="NFT Contract (SIP-009)" />
      
      <Section>
        <p>
          Syft's NFT contract implements the SIP-009 standard for Stellar-compatible NFTs.
          Each NFT represents a vault strategy blueprint and includes AI-generated artwork.
        </p>
      </Section>

      <Alert type="info" title="Contract Address">
        <code className="text-sm">CCTSYGMDPB37KKXGT7CW4KYYDHJKSW4K2DF3S4PXWFZ7JVA5LOS4AIWU</code>
        <p className="text-sm mt-2 text-white/60">Testnet deployment</p>
      </Alert>

      <Section title="NFT Metadata Structure">
        <p className="text-white/70 mb-4">
          Each NFT contains rich metadata about the vault strategy:
        </p>
        <CodeBlock language="json" code={`{
  "name": "Balanced Growth Strategy",
  "description": "60% XLM/USDC, 40% BTC/USDC liquidity provision",
  "image": "ipfs://Qm...",
  "attributes": [
    {
      "trait_type": "Strategy Type",
      "value": "Liquidity Provision"
    },
    {
      "trait_type": "Risk Level",
      "value": "Medium"
    },
    {
      "trait_type": "Pool Count",
      "value": 2
    },
    {
      "trait_type": "Creator",
      "value": "G..."
    },
    {
      "trait_type": "Creation Date",
      "value": "2025-11-07"
    },
    {
      "trait_type": "Total Sales",
      "value": 42
    }
  ],
  "external_url": "https://syft.app/marketplace/nft/123"
}`} />
      </Section>

      <Section title="Key Functions">
        <div className="space-y-6">
          <div>
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <span className="text-[#dce85d]">•</span>
              mint
            </h3>
            <p className="text-white/70 mb-3 text-sm">
              Mints a new NFT for a vault creator with metadata and artwork.
            </p>
            <CodeBlock language="rust" code={`pub fn mint(
    env: Env,
    to: Address,
    token_id: u64,
    metadata_uri: String,
    royalty_percentage: u32
) -> bool`} />
          </div>

          <div>
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <span className="text-[#dce85d]">•</span>
              transfer
            </h3>
            <p className="text-white/70 mb-3 text-sm">
              Transfers NFT ownership and handles royalty payments.
            </p>
            <CodeBlock language="rust" code={`pub fn transfer(
    env: Env,
    from: Address,
    to: Address,
    token_id: u64,
    price: i128
) -> bool`} />
            <p className="text-white/60 text-sm mt-2">
              Automatically calculates and distributes royalties: 80% to creator, 20% to platform.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <span className="text-[#dce85d]">•</span>
              get_metadata
            </h3>
            <p className="text-white/70 mb-3 text-sm">
              Retrieves metadata URI for a specific NFT token.
            </p>
            <CodeBlock language="rust" code={`pub fn get_metadata(
    env: Env,
    token_id: u64
) -> String`} />
          </div>

          <div>
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <span className="text-[#dce85d]">•</span>
              owner_of
            </h3>
            <p className="text-white/70 mb-3 text-sm">
              Returns the current owner of an NFT token.
            </p>
            <CodeBlock language="rust" code={`pub fn owner_of(
    env: Env,
    token_id: u64
) -> Address`} />
          </div>
        </div>
      </Section>

      <Section title="Royalty System">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-gradient-to-br from-[#dce85d]/10 to-transparent border border-[#dce85d]/20 rounded-xl">
            <h3 className="text-[#dce85d] font-bold text-2xl mb-2">80%</h3>
            <p className="text-white/70">Goes to original strategy creator</p>
          </div>
          <div className="p-6 bg-gradient-to-br from-[#dce85d]/10 to-transparent border border-[#dce85d]/20 rounded-xl">
            <h3 className="text-[#dce85d] font-bold text-2xl mb-2">20%</h3>
            <p className="text-white/70">Platform fee for maintenance</p>
          </div>
        </div>
        <p className="text-white/60 text-sm mt-4">
          Royalties are automatically calculated and distributed on every NFT sale in the marketplace.
        </p>
      </Section>

      <Section title="Usage Example">
        <p className="text-white/70 mb-4">
          Minting an NFT when a user creates a vault:
        </p>
        <CodeBlock language="typescript" code={`import * as StellarSDK from '@stellar/stellar-sdk';

// After vault creation, mint NFT
const nftContract = new StellarSDK.Contract(NFT_CONTRACT_ADDRESS);

// Generate metadata with Runware AI
const artwork = await generateArtwork(vaultConfig);
const metadataUri = await uploadToIPFS({
  name: vaultName,
  description: vaultDescription,
  image: artwork.imageUrl,
  attributes: [
    { trait_type: "Strategy Type", value: "LP" },
    { trait_type: "Risk Level", value: "Medium" },
    { trait_type: "Pool Count", value: pools.length }
  ]
});

// Mint NFT
const tx = new StellarSDK.TransactionBuilder(account, {
  fee: StellarSDK.BASE_FEE,
  networkPassphrase: StellarSDK.Networks.TESTNET
})
  .addOperation(
    nftContract.call(
      'mint',
      StellarSDK.Address.fromString(userPublicKey),
      tokenId,
      metadataUri,
      10 // 10% royalty
    )
  )
  .setTimeout(30)
  .build();

await submitTransaction(tx);`} />
      </Section>

      <Section title="AI-Generated Artwork">
        <p className="text-white/70 mb-3">
          Every NFT includes unique artwork generated by Runware AI based on the vault's characteristics:
        </p>
        <ul className="space-y-2 text-white/70">
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Strategy visualization:</strong> Visual representation of pool allocations</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Risk indicators:</strong> Color schemes reflect risk levels</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Unique patterns:</strong> Each NFT has distinct visual elements</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">High resolution:</strong> 1024x1024 PNG images stored on IPFS</span>
          </li>
        </ul>
      </Section>
    </>
  );
}
