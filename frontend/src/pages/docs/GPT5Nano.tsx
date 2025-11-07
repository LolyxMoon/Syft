import { Sparkles } from 'lucide-react';
import { PageHeader, Section, CodeBlock, Alert } from '../../components/docs/DocsComponents';

export default function GPT5Nano() {
  return (
    <>
      <PageHeader icon={<Sparkles className="w-8 h-8" />} title="GPT-5 Nano Integration" />
      
      <Section>
        <p>
          Syft uses GPT-5 Nano (<code>gpt-5-nano-2025-08-07</code>) to power natural language
          vault creation, Terminal AI, and strategy optimization. This cutting-edge model enables
          users to build complex DeFi strategies using plain English.
        </p>
      </Section>

      <Alert type="info" title="Model Details">
        <ul className="space-y-1 text-sm">
          <li>• Model: <code>gpt-5-nano-2025-08-07</code></li>
          <li>• Context window: 128K tokens</li>
          <li>• Fine-tuned for DeFi and blockchain operations</li>
          <li>• Real-time response streaming supported</li>
        </ul>
      </Alert>

      <Section title="Key Capabilities">
        <div className="space-y-4">
          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-lg">
            <h4 className="text-white font-semibold mb-2">Natural Language Vault Creation</h4>
            <p className="text-white/70 text-sm mb-3">
              Users describe their desired strategy in plain English, and GPT-5 Nano translates
              it into vault configurations.
            </p>
            <CodeBlock language="text" code={`User: "Create a balanced vault with 60% in XLM/USDC liquidity 
and 40% in BTC/USDC, rebalance daily"

AI: I'll create a balanced liquidity provision vault for you:
• Pool 1: XLM/USDC (60% allocation)
• Pool 2: BTC/USDC (40% allocation)  
• Rebalance frequency: Every 24 hours
• Risk level: Medium

Would you like to proceed with this configuration?`} />
          </div>

          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-lg">
            <h4 className="text-white font-semibold mb-2">Terminal AI Commands</h4>
            <p className="text-white/70 text-sm mb-3">
              Execute blockchain operations through conversational commands.
            </p>
            <CodeBlock language="text" code={`User: "Show me my vault performance this month"

AI: Here's your vault performance for November 2025:
📊 Total Return: +12.4%
💰 Current Value: 5,240 XLM
📈 Best Performer: XLM/USDC pool (+15.2%)
📉 Underperformer: BTC/USDC pool (+8.1%)

Would you like detailed analytics or rebalancing suggestions?`} />
          </div>

          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-lg">
            <h4 className="text-white font-semibold mb-2">Strategy Optimization</h4>
            <p className="text-white/70 text-sm mb-3">
              AI analyzes vault performance and suggests improvements.
            </p>
            <CodeBlock language="text" code={`AI: I've analyzed your vault and found optimization opportunities:

1. Rebalancing Frequency: Your daily rebalance may be too frequent
   given current volatility. Consider weekly rebalancing to save
   on gas fees (estimated savings: 15 XLM/month).

2. Pool Allocation: XLM/USDC is outperforming. Consider increasing
   allocation from 60% to 70% based on 30-day trends.

3. New Opportunity: AquaUSDC pool showing strong APY (42%) with
   similar risk profile. Worth considering for diversification.

Would you like me to simulate these changes?`} />
          </div>
        </div>
      </Section>

      <Section title="Voice Integration">
        <p className="text-white/70 mb-3">
          GPT-5 Nano works seamlessly with our voice interface powered by VAPI:
        </p>
        <ul className="space-y-2 text-white/70">
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Natural conversations:</strong> Speak to Syft as you would to a financial advisor</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Context awareness:</strong> AI remembers previous interactions in the session</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Multi-turn dialogues:</strong> Ask follow-up questions and refine strategies</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Real-time feedback:</strong> Get instant responses while building vaults</span>
          </li>
        </ul>
      </Section>

      <Section title="API Integration">
        <p className="text-white/70 mb-4">
          Example of how GPT-5 Nano is integrated in the backend:
        </p>
        <CodeBlock language="typescript" code={`import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function processVaultCreationRequest(userMessage: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano-2025-08-07',
    messages: [
      {
        role: 'system',
        content: \`You are a DeFi strategy advisor for Syft. Help users create
vault configurations by understanding their goals and risk tolerance.
Output structured JSON with pool allocations and parameters.\`
      },
      {
        role: 'user',
        content: userMessage
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 2000
  });

  const vaultConfig = JSON.parse(response.choices[0].message.content);
  return vaultConfig;
}`} />
      </Section>

      <Section title="Best Practices">
        <ul className="space-y-2 text-white/70">
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Be specific:</strong> Provide clear goals and risk preferences</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Review suggestions:</strong> Always verify AI-generated configurations</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Use context:</strong> Mention your existing vaults for better recommendations</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Ask questions:</strong> Don't hesitate to ask for explanations or alternatives</span>
          </li>
        </ul>
      </Section>
    </>
  );
}
