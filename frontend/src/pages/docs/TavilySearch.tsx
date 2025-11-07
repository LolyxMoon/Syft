import { Search } from 'lucide-react';
import { PageHeader, Section, CodeBlock, Alert } from '../../components/docs/DocsComponents';

export default function TavilySearch() {
  return (
    <>
      <PageHeader icon={<Search className="w-8 h-8" />} title="Tavily Search Integration" />
      
      <Section>
        <p>
          Tavily Search provides Syft's AI with real-time access to web information,
          enabling it to fetch the latest DeFi data, market trends, and protocol updates.
        </p>
      </Section>

      <Section title="What is Tavily?">
        <p className="text-white/70 mb-4">
          Tavily is a search API optimized for AI applications. Unlike traditional search engines,
          it's designed to return structured, relevant information that AI models can easily process
          and use to answer user queries.
        </p>
        <ul className="space-y-2 text-white/70">
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Real-time data:</strong> Fetches current information from the web</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">DeFi-focused:</strong> Optimized for crypto and financial queries</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Structured results:</strong> Returns clean, parseable data for AI</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Fast responses:</strong> Sub-second query times</span>
          </li>
        </ul>
      </Section>

      <Section title="Use Cases in Syft">
        <div className="space-y-4">
          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-lg">
            <h4 className="text-white font-semibold mb-2">Market Data Queries</h4>
            <p className="text-white/70 text-sm mb-3">
              Users can ask Terminal AI about current market conditions and get live data.
            </p>
            <CodeBlock language="text" code={`User: "What's the current TVL on Soroswap?"

AI: *Searching latest data...*

According to recent data, Soroswap currently has a Total 
Value Locked (TVL) of approximately $2.4M across all pools. 
The top pools by TVL are:

1. XLM/USDC: $850K
2. BTC/USDC: $620K  
3. AQUA/USDC: $410K

Note: TVL figures update frequently. Last checked: 2025-11-07.`} />
          </div>

          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-lg">
            <h4 className="text-white font-semibold mb-2">Protocol Research</h4>
            <p className="text-white/70 text-sm mb-3">
              AI can research new protocols and provide summaries for users.
            </p>
            <CodeBlock language="text" code={`User: "Should I add Phoenix protocol pools to my vault?"

AI: *Researching Phoenix protocol...*

Phoenix is a new DEX on Stellar focused on:
• Multi-hop routing for better prices
• Low fees (0.2% standard)
• Currently in beta with $500K TVL

Considerations:
✓ Innovative routing algorithm
✓ Competitive fees
✗ Limited track record (launched Oct 2025)
✗ Lower liquidity than established pools

Recommendation: Consider small allocation (5-10%) for 
diversification, but prioritize proven protocols for core holdings.`} />
          </div>

          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-lg">
            <h4 className="text-white font-semibold mb-2">News & Updates</h4>
            <p className="text-white/70 text-sm mb-3">
              Stay informed about Stellar ecosystem developments.
            </p>
            <CodeBlock language="text" code={`User: "Any recent Stellar news I should know about?"

AI: *Searching latest Stellar news...*

Recent Stellar developments (past 7 days):

1. Soroban upgrade announced for Q1 2026
   - Improved smart contract performance
   - Lower transaction fees

2. New institutional partnership
   - Major payment processor integrating XLM
   - Expected $10M+ monthly volume

3. Aquarius protocol launches liquidity mining
   - New rewards for LP providers
   - 15% APY on select pools

Would you like details on any of these updates?`} />
          </div>
        </div>
      </Section>

      <Section title="API Integration">
        <p className="text-white/70 mb-4">
          Tavily is integrated into GPT-5 Nano's function calling system:
        </p>
        <CodeBlock language="typescript" code={`import Tavily from '@tavily/core';

const tavily = new Tavily({
  apiKey: process.env.TAVILY_API_KEY
});

export async function searchWeb(query: string) {
  const result = await tavily.search({
    query,
    searchDepth: 'advanced',
    includeAnswer: true,
    maxResults: 5,
    includeDomains: [
      'stellar.org',
      'soroban.stellar.org',
      'coinmarketcap.com',
      'defillama.com'
    ]
  });

  return {
    answer: result.answer,
    sources: result.results.map(r => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score
    }))
  };
}

// GPT-5 Nano function definition
const functions = [
  {
    name: 'search_web',
    description: 'Search the web for current DeFi data, market info, and protocol updates',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query (e.g., "Soroswap TVL", "Stellar news")'
        }
      },
      required: ['query']
    }
  }
];`} />
      </Section>

      <Section title="Search Best Practices">
        <Alert type="info" title="Effective Queries">
          <ul className="space-y-1 text-sm">
            <li>• Be specific: "XLM/USDC pool APY" vs "crypto rates"</li>
            <li>• Include timeframes: "Stellar news last week"</li>
            <li>• Specify metrics: "TVL", "APY", "volume"</li>
            <li>• Name protocols: "Soroswap", "Aquarius", etc.</li>
          </ul>
        </Alert>
      </Section>

      <Section title="Privacy & Transparency">
        <p className="text-white/70 mb-3">
          When Tavily Search is used, you'll see indicators in the AI response:
        </p>
        <ul className="space-y-2 text-white/70">
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">"Searching..."</strong> message while query is running</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Source citations</strong> showing where data came from</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Timestamps</strong> on time-sensitive information</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">No personal data</strong> is sent to Tavily - only search queries</span>
          </li>
        </ul>
      </Section>

      <Section title="Limitations">
        <Alert type="warning" title="Keep in Mind">
          <ul className="space-y-1 text-sm">
            <li>• Information accuracy depends on source reliability</li>
            <li>• Real-time data may have slight delays (seconds to minutes)</li>
            <li>• Not a substitute for official protocol documentation</li>
            <li>• Always verify critical information before making decisions</li>
          </ul>
        </Alert>
      </Section>
    </>
  );
}
