import { useState, useEffect } from 'react';
import { Coins, TrendingUp, Repeat, ChevronDown, ChevronUp } from 'lucide-react';
import type { PaletteItem } from '../../types/blocks';
import { getTokenBySymbol } from '../../services/assetService';
import { useWallet } from '../../providers/WalletProvider';

interface BlockPaletteProps {
  onBlockSelect: (item: PaletteItem) => void;
}

const BlockPalette = ({ onBlockSelect }: BlockPaletteProps) => {
  const { network } = useWallet();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['assets', 'conditions', 'actions'])
  );
  const [xlmAddress, setXlmAddress] = useState<string>('');
  const [usdcAddress, setUsdcAddress] = useState<string>('');

  // Load network-specific asset addresses
  useEffect(() => {
    const loadAssetAddresses = async () => {
      const xlmToken = await getTokenBySymbol('XLM', network as any);
      const usdcToken = await getTokenBySymbol('USDC', network as any);
      
      if (xlmToken) setXlmAddress(xlmToken.address || '');
      if (usdcToken) setUsdcAddress(usdcToken.address || '');
    };
    
    loadAssetAddresses();
  }, [network]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const paletteItems: PaletteItem[] = [
    // Assets
    {
      id: 'asset-xlm',
      type: 'asset',
      label: 'XLM',
      description: 'Stellar Lumens native token',
      category: 'assets',
      defaultData: {
        assetType: 'XLM',
        assetCode: 'XLM',
        assetIssuer: xlmAddress,
        allocation: 50,
      },
    },
    {
      id: 'asset-usdc',
      type: 'asset',
      label: 'USDC',
      description: 'USD Coin stablecoin',
      category: 'assets',
      defaultData: {
        assetType: 'USDC',
        assetCode: 'USDC',
        assetIssuer: usdcAddress,
        allocation: 50,
      },
    },
    // Custom tokens with real liquidity pools
    {
      id: 'asset-aqx',
      type: 'asset',
      label: 'AQX',
      description: 'Aquinox Token',
      category: 'assets',
      defaultData: {
        assetType: 'CUSTOM',
        assetCode: 'AQX',
        assetIssuer: 'CAABHEKIZJ3ZKVLTI63LHEZNQATLIZHSZAIGSKTAOBWGGINONRUUBIF3',
        allocation: 0,
      },
    },
    {
      id: 'asset-vltk',
      type: 'asset',
      label: 'VLTK',
      description: 'Velitok Token',
      category: 'assets',
      defaultData: {
        assetType: 'CUSTOM',
        assetCode: 'VLTK',
        assetIssuer: 'CBBBGORMTQ4B2DULIT3GG2GOQ5VZ724M652JYIDHNDWVUC76242VINME',
        allocation: 0,
      },
    },
    {
      id: 'asset-slx',
      type: 'asset',
      label: 'SLX',
      description: 'Solarix Token',
      category: 'assets',
      defaultData: {
        assetType: 'CUSTOM',
        assetCode: 'SLX',
        assetIssuer: 'CCU7FIONTYIEZK2VWF4IBRHGWQ6ZN2UYIL6A4NKFCG32A2JUEWN2LPY5',
        allocation: 0,
      },
    },
    {
      id: 'asset-wrx',
      type: 'asset',
      label: 'WRX',
      description: 'Wortex Token',
      category: 'assets',
      defaultData: {
        assetType: 'CUSTOM',
        assetCode: 'WRX',
        assetIssuer: 'CCAIKLYMECH7RTVNR3GLWDU77WHOEDUKRVFLYMDXJDA7CX74VX6SRXWE',
        allocation: 0,
      },
    },
    {
      id: 'asset-sixn',
      type: 'asset',
      label: 'SIXN',
      description: 'Sixion Token',
      category: 'assets',
      defaultData: {
        assetType: 'CUSTOM',
        assetCode: 'SIXN',
        assetIssuer: 'CDYGMXR7K4DSN4SE4YAIGBZDP7GHSPP7DADUBHLO3VPQEHHCDJRNWU6O',
        allocation: 0,
      },
    },
    {
      id: 'asset-mbius',
      type: 'asset',
      label: 'MBIUS',
      description: 'Mobius Token',
      category: 'assets',
      defaultData: {
        assetType: 'CUSTOM',
        assetCode: 'MBIUS',
        assetIssuer: 'CBXSQDQUYGJ7TDXPJTVISXYRMJG4IPLGN22NTLXX27Y2TPXA5LZUHQDP',
        allocation: 0,
      },
    },
    {
      id: 'asset-trio',
      type: 'asset',
      label: 'TRIO',
      description: 'Trionic Token',
      category: 'assets',
      defaultData: {
        assetType: 'CUSTOM',
        assetCode: 'TRIO',
        assetIssuer: 'CB4MYY4N7IPH76XX6HFJNKPNORSDFMWBL4ZWDJ4DX73GK4G2KPSRLBGL',
        allocation: 0,
      },
    },
    {
      id: 'asset-relio',
      type: 'asset',
      label: 'RELIO',
      description: 'Relion Token',
      category: 'assets',
      defaultData: {
        assetType: 'CUSTOM',
        assetCode: 'RELIO',
        assetIssuer: 'CDRFQC4J5ZRAYZQUUSTS3KGDMJ35RWAOITXGHQGRXDVRJACMXB32XF7H',
        allocation: 0,
      },
    },
    {
      id: 'asset-tri',
      type: 'asset',
      label: 'TRI',
      description: 'Trion Token',
      category: 'assets',
      defaultData: {
        assetType: 'CUSTOM',
        assetCode: 'TRI',
        assetIssuer: 'CB4JLZSNRR37UQMFZITKTFMQYG7LJR3JHJXKITXEVDFXRQTFYLFKLEDW',
        allocation: 0,
      },
    },
    {
      id: 'asset-numer',
      type: 'asset',
      label: 'NUMER',
      description: 'Numeris Token',
      category: 'assets',
      defaultData: {
        assetType: 'CUSTOM',
        assetCode: 'NUMER',
        assetIssuer: 'CDBBFLGF35YDKD3VXFB7QGZOJFYZ4I2V2BE3NB766D5BUDFCRVUB7MRR',
        allocation: 0,
      },
    },
    // Conditions
    {
      id: 'condition-allocation',
      type: 'condition',
      label: 'Allocation Check',
      description: 'Trigger when allocation exceeds threshold',
      category: 'conditions',
      defaultData: {
        conditionType: 'allocation',
        operator: 'gt',
        threshold: 60,
      },
    },
    {
      id: 'condition-apy',
      type: 'condition',
      label: 'APY Threshold',
      description: 'Trigger based on yield rate',
      category: 'conditions',
      defaultData: {
        conditionType: 'apy_threshold',
        operator: 'lt',
        threshold: 5,
      },
    },
    {
      id: 'condition-time',
      type: 'condition',
      label: 'Time-Based',
      description: 'Trigger at regular intervals',
      category: 'conditions',
      defaultData: {
        conditionType: 'time_based',
        timeValue: 24,
        timeUnit: 'hours',
      },
    },
    {
      id: 'condition-price',
      type: 'condition',
      label: 'Price Change',
      description: 'Trigger on price movement',
      category: 'conditions',
      defaultData: {
        conditionType: 'price_change',
        operator: 'gt',
        value: 10,
      },
    },
    // Actions
    {
      id: 'action-rebalance',
      type: 'action',
      label: 'Rebalance',
      description: 'Rebalance portfolio to target allocations',
      category: 'actions',
      defaultData: {
        actionType: 'rebalance',
      },
    },
    {
      id: 'action-stake',
      type: 'action',
      label: 'Stake',
      description: 'Stake assets in protocol',
      category: 'actions',
      defaultData: {
        actionType: 'stake',
        protocol: '',
      },
    },
    {
      id: 'action-liquidity',
      type: 'action',
      label: 'Provide Liquidity',
      description: 'Add liquidity to DEX pool',
      category: 'actions',
      defaultData: {
        actionType: 'provide_liquidity',
        protocol: '',
      },
    },
    {
      id: 'action-swap',
      type: 'action',
      label: 'Swap',
      description: 'Swap between assets',
      category: 'actions',
      defaultData: {
        actionType: 'swap',
        targetAsset: '',
      },
    },
  ];

  const categories = [
    { id: 'assets', label: 'Assets', icon: Coins, color: 'text-blue-500' },
    { id: 'conditions', label: 'Conditions', icon: TrendingUp, color: 'text-purple-500' },
    { id: 'actions', label: 'Actions', icon: Repeat, color: 'text-orange-500' },
  ];

  const handleDragStart = (event: React.DragEvent, item: PaletteItem) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="h-full flex flex-col bg-transparent">
      <div className="flex-shrink-0 p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold">
          Block Palette
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Drag blocks to canvas
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {categories.map((category) => {
          const Icon = category.icon;
          const isExpanded = expandedCategories.has(category.id);
          const categoryItems = paletteItems.filter(
            (item) => item.category === category.id
          );

          return (
            <div key={category.id} className="mb-2">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${category.color}`} />
                  <span className="font-medium text-sm">
                    {category.label}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {isExpanded && (
                <div className="ml-2 mt-1 space-y-1">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      onClick={() => onBlockSelect(item)}
                      className="p-2 bg-white/5 border border-white/10 rounded cursor-move hover:border-purple-500/50 hover:bg-white/10 transition-all group"
                    >
                      <div className="font-medium text-xs">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">
                        {item.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex-shrink-0 p-3 border-t border-white/10 bg-white/5">
        <div className="text-[10px] text-gray-400 space-y-1">
          <p><strong>Tip:</strong> Drag blocks to canvas</p>
          <p>Connect: Asset → Condition → Action</p>
        </div>
      </div>
    </div>
  );
};

export default BlockPalette;
