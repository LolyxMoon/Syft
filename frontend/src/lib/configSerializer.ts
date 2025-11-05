import type { Node, Edge } from '@xyflow/react';
import type { VaultConfiguration } from '../types/blocks';

/**
 * Serializes visual block graph into vault configuration for smart contract deployment
 */
export class ConfigSerializer {
  /**
   * Serialize vault configuration from visual blocks
   */
  static serialize(nodes: Node[], edges: Edge[]): VaultConfiguration {
    console.log('[ConfigSerializer] Serializing:', {
      nodes: nodes.length,
      edges: edges.length,
      assets: nodes.filter(n => n.type === 'asset').length,
      conditions: nodes.filter(n => n.type === 'condition').length,
      actions: nodes.filter(n => n.type === 'action').length,
    });
    
    const assets = this.extractAssets(nodes);
    const rules = this.extractRules(nodes, edges);

    console.log('[ConfigSerializer] Serialization complete:', {
      assets: assets.length,
      rules: rules.length,
    });

    return {
      assets,
      rules,
      metadata: {
        createdAt: new Date().toISOString(),
        version: '1.0.0',
      },
    };
  }

  /**
   * Extract asset configuration from asset blocks
   */
  private static extractAssets(nodes: Node[]) {
    const assetBlocks = nodes.filter((n) => n.type === 'asset');
    
    // IMPORTANT: Sort asset blocks by ID to ensure consistent ordering
    // This prevents target_allocation array mismatch issues
    assetBlocks.sort((a, b) => {
      const aId = parseInt(a.id.replace(/\D/g, '')) || 0;
      const bId = parseInt(b.id.replace(/\D/g, '')) || 0;
      return aId - bId;
    });
    
    return assetBlocks.map((block) => {
      const { assetType, assetCode, assetIssuer, allocation } = block.data;

      // For native XLM
      if (assetType === 'XLM') {
        return {
          code: 'XLM',
          allocation: typeof allocation === 'number' ? allocation : 0,
        };
      }

      // For USDC - use the contract address from assetIssuer if provided
      // The frontend should populate this from the token service based on network
      if (assetType === 'USDC') {
        return {
          code: 'USDC',
          issuer: typeof assetIssuer === 'string' && assetIssuer ? assetIssuer : undefined,
          allocation: typeof allocation === 'number' ? allocation : 0,
        };
      }

      // For custom tokens - require both code and issuer
      return {
        code: typeof assetCode === 'string' ? assetCode : 'UNKNOWN',
        issuer: typeof assetIssuer === 'string' ? assetIssuer : '',
        allocation: typeof allocation === 'number' ? allocation : 0,
      };
    });
  }

  /**
   * Extract automation rules from complete chains (Asset -> Condition -> Action)
   */
  private static extractRules(nodes: Node[], edges: Edge[]) {
    const rules: VaultConfiguration['rules'] = [];
    const actionBlocks = nodes.filter((n) => n.type === 'action');

    actionBlocks.forEach((actionNode) => {
      // Find ALL conditions connected to this action (not just the first one!)
      const conditionEdges = edges.filter((e) => e.target === actionNode.id);
      
      if (conditionEdges.length === 0) {
        console.warn('[ConfigSerializer] Action block has no conditions:', actionNode.id);
        return;
      }

      // Create a separate rule for EACH condition
      conditionEdges.forEach((conditionEdge) => {
        const conditionNode = nodes.find((n) => n.id === conditionEdge.source);
        if (!conditionNode || conditionNode.type !== 'condition') {
          console.warn('[ConfigSerializer] Invalid condition node:', conditionEdge.source);
          return;
        }

        // Find asset connected to this condition
        const assetEdge = edges.find((e) => e.target === conditionNode.id);
        if (!assetEdge) {
          console.warn('[ConfigSerializer] Condition has no asset:', conditionNode.id);
          return;
        }

        const assetNode = nodes.find((n) => n.id === assetEdge.source);
        if (!assetNode || assetNode.type !== 'asset') {
          console.warn('[ConfigSerializer] Invalid asset node:', assetEdge.source);
          return;
        }

        // Build the rule
        const condition = this.serializeCondition(conditionNode, assetNode);
        const action = this.serializeAction(actionNode);

        rules.push({ condition, action });
        
        console.log('[ConfigSerializer] Created rule:', {
          asset: assetNode.data.assetCode || assetNode.data.assetType,
          condition: condition.type,
          action: action.type
        });
      });
    });

    console.log(`[ConfigSerializer] Extracted ${rules.length} rules from canvas`);
    return rules;
  }

  /**
   * Serialize condition block to configuration
   */
  private static serializeCondition(conditionNode: Node, assetNode: Node) {
    const { conditionType, operator, threshold, value, timeValue, timeUnit } = conditionNode.data;
    const { assetType, assetCode } = assetNode.data;

    const assetIdentifier = assetType === 'CUSTOM' && assetCode ? assetCode : assetType;

    const parameters: Record<string, unknown> = {
      asset: assetIdentifier,
    };

    // Store frontend condition type (will be mapped to contract type during deployment)
    let finalConditionType = typeof conditionType === 'string' ? conditionType : 'custom';

    switch (conditionType) {
      case 'allocation':
        parameters.operator = operator || 'gt';
        parameters.threshold = threshold || 0;
        break;

      case 'apy_threshold':
        parameters.operator = operator || 'gt';
        parameters.threshold = threshold || 0;
        break;

      case 'time_based':
        // Store time interval configuration (will be converted to seconds during deployment)
        parameters.interval = timeValue || 1;
        parameters.unit = timeUnit || 'hours';
        // Also calculate and store threshold in seconds for reference
        const unitToSeconds: Record<string, number> = {
          'minutes': 60,
          'hours': 3600,
          'days': 86400,
          'weeks': 604800,
        };
        const unit = (timeUnit || 'hours') as string;
        parameters.threshold = ((timeValue || 1) as number) * unitToSeconds[unit];
        break;

      case 'price_change':
        parameters.operator = operator || 'gt';
        parameters.percentage = value || 0;
        break;

      default:
        // Custom condition - pass all data
        Object.assign(parameters, conditionNode.data);
    }

    return {
      type: finalConditionType,
      parameters,
    };
  }

  /**
   * Serialize action block to configuration
   */
  private static serializeAction(actionNode: Node) {
    const { actionType, targetAsset, targetAllocation, protocol, parameters } = actionNode.data;

    const actionParams: Record<string, unknown> = {};

    switch (actionType) {
      case 'rebalance':
        if (targetAsset) {
          actionParams.targetAsset = targetAsset;
        }
        if (targetAllocation !== undefined) {
          actionParams.targetAllocation = targetAllocation;
        }
        break;

      case 'stake':
        if (protocol) {
          actionParams.protocol = protocol;
        }
        if (targetAsset) {
          actionParams.targetAsset = targetAsset;
        }
        if (targetAllocation !== undefined) {
          actionParams.targetAllocation = targetAllocation;
        }
        break;

      case 'provide_liquidity':
        if (protocol) {
          actionParams.protocol = protocol;
        }
        if (targetAllocation !== undefined) {
          actionParams.targetAllocation = targetAllocation;
        }
        break;

      case 'swap':
        if (targetAsset) {
          actionParams.targetAsset = targetAsset;
        }
        break;

      default:
        // Custom action - include all parameters
        if (parameters && typeof parameters === 'object') {
          Object.assign(actionParams, parameters);
        }
    }

    return {
      type: typeof actionType === 'string' ? actionType : 'custom',
      parameters: actionParams,
    };
  }

  /**
   * Deserialize vault configuration back into visual blocks
   * Useful for loading saved vaults
   */
  static deserialize(config: VaultConfiguration): { nodes: Node[]; edges: Edge[] } {
    console.log('[ConfigSerializer] Deserializing config:', config);
    
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let nodeIdCounter = 0;

    // Validate config structure
    if (!config) {
      throw new Error('Configuration is null or undefined');
    }
    if (!config.assets || !Array.isArray(config.assets)) {
      throw new Error('Invalid configuration: missing or invalid assets array');
    }
    if (!config.rules || !Array.isArray(config.rules)) {
      throw new Error('Invalid configuration: missing or invalid rules array');
    }

    // CLEANUP: Remove assets with 0% allocation (these are auto-added target assets for swaps)
    const cleanedAssets = config.assets.filter(asset => {
      if (asset.allocation === 0) {
        console.log('[ConfigSerializer] Filtering out 0% allocation asset:', asset.code);
        return false;
      }
      return true;
    });
    
    // CLEANUP: Default swap action targetAllocation to 100% if not set
    const cleanedRules = config.rules.map((rule: any) => {
      if (rule.action === 'swap' || rule.action?.type === 'swap') {
        const actionParams = rule.action?.parameters || rule;
        if (actionParams.targetAllocation === undefined) {
          console.log('[ConfigSerializer] Defaulting swap action targetAllocation to 100%');
          if (rule.action?.parameters) {
            rule.action.parameters.targetAllocation = 100;
          } else {
            rule.targetAllocation = 100;
          }
        }
      }
      return rule;
    });

    // Create asset blocks (use cleaned assets)
    cleanedAssets.forEach((asset, index) => {
      const assetId = `asset-${nodeIdCounter++}`;
      
      let assetType: 'XLM' | 'USDC' | 'CUSTOM' = 'CUSTOM';
      if (asset.code === 'XLM') {
        assetType = 'XLM';
      } else if (asset.code === 'USDC') {
        assetType = 'USDC';
      }

      nodes.push({
        id: assetId,
        type: 'asset',
        position: { x: 100, y: 100 + index * 150 },
        data: {
          assetType,
          assetCode: asset.code,
          assetIssuer: asset.issuer,
          allocation: asset.allocation,
          label: asset.code,
        },
      });
    });

    // Group rules by action signature to detect shared actions
    const actionMap = new Map<string, string>(); // action signature -> action node ID
    
    // Create condition and action blocks for each rule (use cleaned rules)
    cleanedRules.forEach((rule: any, index) => {
      // Handle both old flat format and new nested format
      let condition, action;
      
      // Check if it's the old flat format (from database)
      if ('condition_type' in rule && !rule.condition) {
        // Convert old format to new format
        console.log('[ConfigSerializer] Converting old flat format rule:', rule);
        
        // Use monitored_asset if available, otherwise infer from threshold
        let assetForCondition = rule.monitored_asset;
        
        if (!assetForCondition) {
          // Legacy fallback: Try to infer which asset based on threshold
          // If we have multiple rules with different thresholds, map them to different assets
          const ruleIndex = config.rules.indexOf(rule);
          if (ruleIndex < config.assets.length) {
            assetForCondition = config.assets[ruleIndex]?.code;
          } else {
            assetForCondition = config.assets[0]?.code || 'USDC';
          }
          console.warn('[ConfigSerializer] No monitored_asset found, inferring:', assetForCondition);
        }
        
        // Map contract condition types back to frontend types
        const contractToFrontendConditionType: Record<string, string> = {
          'time': 'time_based',
          'price': 'price_change',
          'apy': 'apy_threshold',
          'allocation': 'allocation',
        };
        
        const frontendConditionType = contractToFrontendConditionType[rule.condition_type] || rule.condition_type;
        
        // Build condition parameters - restore all saved fields
        const conditionParameters: Record<string, unknown> = {
          asset: assetForCondition,
          threshold: rule.threshold || 0,
        };
        
        // Restore operator if saved
        if (rule.operator) {
          conditionParameters.operator = rule.operator;
        } else {
          conditionParameters.operator = 'gt'; // default fallback
        }
        
        // Restore percentage/value if saved (for price_change conditions)
        if (rule.percentage !== undefined) {
          conditionParameters.percentage = rule.percentage;
        }
        
        // Restore time interval fields if saved (for time_based conditions)
        if (rule.interval !== undefined) {
          conditionParameters.interval = rule.interval;
        }
        if (rule.unit !== undefined) {
          conditionParameters.unit = rule.unit;
        }
        
        // Restore description if saved
        if (rule.description) {
          conditionParameters.description = rule.description;
        }
        
        // Build action parameters - restore all saved fields
        const actionParameters: Record<string, unknown> = {};
        
        // Restore target_allocation if present
        if (rule.target_allocation !== undefined) {
          actionParameters.targetAllocation = rule.target_allocation;
        }
        
        // Restore targetAsset if saved (for swap/rebalance actions)
        if (rule.targetAsset) {
          actionParameters.targetAsset = rule.targetAsset;
        }
        
        // Restore protocol if saved (for stake/liquidity actions)
        if (rule.protocol) {
          actionParameters.protocol = rule.protocol;
        }
        
        // Restore targetAllocation if saved separately
        if (rule.targetAllocation !== undefined) {
          actionParameters.targetAllocation = rule.targetAllocation;
        }
        
        // Restore custom parameters if saved
        if (rule.parameters) {
          actionParameters.parameters = rule.parameters;
        }
        
        condition = {
          type: frontendConditionType,
          parameters: conditionParameters,
        };
        
        action = {
          type: rule.action,
          parameters: actionParameters,
        };
      } else {
        // New nested format
        condition = rule.condition;
        action = rule.action;
      }
      
      // Skip malformed rules
      if (!condition || !action) {
        console.warn('[ConfigSerializer] Skipping malformed rule at index', index, rule);
        return;
      }

      const conditionId = `condition-${nodeIdCounter++}`;
      
      // Create a signature for the action to detect duplicates
      const actionSignature = JSON.stringify({
        type: action.type,
        params: action.parameters
      });
      
      // Reuse existing action node if same action already exists
      let actionId = actionMap.get(actionSignature);
      
      if (!actionId) {
        // Create new action block
        actionId = `action-${nodeIdCounter++}`;
        actionMap.set(actionSignature, actionId);
        
        const actionData: Record<string, unknown> = {
          actionType: action?.type || 'custom',
          label: action?.type || 'custom',
        };
        
        // Spread all parameters
        if (action?.parameters) {
          Object.assign(actionData, action.parameters);
        }
        
        nodes.push({
          id: actionId,
          type: 'action',
          position: { x: 700, y: 100 + actionMap.size * 200 },
          data: actionData,
        });
        
        console.log('[ConfigSerializer] Created new action node:', actionId, action.type);
      } else {
        console.log('[ConfigSerializer] Reusing existing action node:', actionId);
      }

      // Find matching asset block
      const assetNode = nodes.find((n) => {
        if (n.type !== 'asset') return false;
        const assetIdentifier = n.data.assetType === 'CUSTOM' ? n.data.assetCode : n.data.assetType;
        return assetIdentifier === condition?.parameters?.asset;
      });

      // Create condition block with all restored parameters
      const conditionData: Record<string, unknown> = {
        conditionType: condition?.type || 'custom',
        label: condition?.type || 'custom',
      };
      
      // Spread all parameters
      if (condition?.parameters) {
        Object.assign(conditionData, condition.parameters);
      }
      
      // For time_based conditions, ensure we have both interval/unit AND threshold
      if (condition?.type === 'time_based') {
        // If we have interval and unit, use them; otherwise derive from threshold
        if (!conditionData.interval || !conditionData.unit) {
          const threshold = (conditionData.threshold || 0) as number;
          // Try to convert seconds back to a reasonable unit
          if (threshold >= 604800) {
            conditionData.interval = Math.round(threshold / 604800);
            conditionData.unit = 'weeks';
          } else if (threshold >= 86400) {
            conditionData.interval = Math.round(threshold / 86400);
            conditionData.unit = 'days';
          } else if (threshold >= 3600) {
            conditionData.interval = Math.round(threshold / 3600);
            conditionData.unit = 'hours';
          } else if (threshold >= 60) {
            conditionData.interval = Math.round(threshold / 60);
            conditionData.unit = 'minutes';
          } else {
            conditionData.interval = threshold;
            conditionData.unit = 'minutes';
          }
        }
        
        // Store as timeValue and timeUnit for the condition block
        conditionData.timeValue = conditionData.interval;
        conditionData.timeUnit = conditionData.unit;
      }
      
      // For apy_threshold conditions, ensure operator has a default
      if (condition?.type === 'apy_threshold' && !conditionData.operator) {
        conditionData.operator = 'gt';
      }
      
      // For allocation conditions, ensure operator has a default
      if (condition?.type === 'allocation' && !conditionData.operator) {
        conditionData.operator = 'gt';
      }
      
      // For price_change conditions, map percentage to value
      if (condition?.type === 'price_change' && conditionData.percentage !== undefined) {
        conditionData.value = conditionData.percentage;
      }
      
      nodes.push({
        id: conditionId,
        type: 'condition',
        position: { x: 400, y: 100 + index * 150 },
        data: conditionData,
      });

      // Create edges
      if (assetNode) {
        edges.push({
          id: `e-${assetNode.id}-${conditionId}`,
          source: assetNode.id,
          target: conditionId,
          animated: true,
        });
      }

      edges.push({
        id: `e-${conditionId}-${actionId}`,
        source: conditionId,
        target: actionId,
        animated: true,
      });
    });

    return { nodes, edges };
  }

  /**
   * Export configuration as JSON string
   */
  static exportJSON(config: VaultConfiguration): string {
    return JSON.stringify(config, null, 2);
  }

  /**
   * Import configuration from JSON string
   */
  static importJSON(json: string): VaultConfiguration {
    try {
      const config = JSON.parse(json);
      // Basic validation
      if (!config.assets || !Array.isArray(config.assets)) {
        throw new Error('Invalid configuration: missing assets array');
      }
      if (!config.rules || !Array.isArray(config.rules)) {
        throw new Error('Invalid configuration: missing rules array');
      }
      return config as VaultConfiguration;
    } catch (error) {
      throw new Error(`Failed to parse configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
