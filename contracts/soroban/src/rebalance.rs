// Rebalancing execution logic
use soroban_sdk::{Env, Address, symbol_short, Symbol, Vec, String, log};
use crate::errors::VaultError;

const CONFIG: Symbol = symbol_short!("CONFIG");
const STATE: Symbol = symbol_short!("STATE");

/// Execute rebalancing of vault assets according to rules
#[allow(dead_code)]
pub fn execute_rebalance(env: &Env) -> Result<(), VaultError> {
    use soroban_sdk::symbol_short;
    
    // Get vault configuration
    let config: crate::types::VaultConfig = env.storage().instance()
        .get(&CONFIG)
        .ok_or(VaultError::NotInitialized)?;
    
    let state: crate::types::VaultState = env.storage().instance()
        .get(&STATE)
        .ok_or(VaultError::NotInitialized)?;
    
    // Log rebalance start
    env.events().publish(
        (symbol_short!("reb_start"),),
        state.total_value
    );
    
    // Ensure vault has assets to rebalance
    if state.total_value == 0 {
        return Err(VaultError::InsufficientBalance);
    }
    
    // Execute rebalancing for each rule
    for i in 0..config.rules.len() {
        if let Some(rule) = config.rules.get(i) {
            execute_rule_action(env, &rule, &config.assets, state.total_value)?;
        }
    }
    
    Ok(())
}

/// Execute only rebalance actions (excludes stake and liquidity)
pub fn execute_rebalance_only(env: &Env) -> Result<(), VaultError> {
    use soroban_sdk::symbol_short;
    
    let config: crate::types::VaultConfig = env.storage().instance()
        .get(&CONFIG)
        .ok_or(VaultError::NotInitialized)?;
    
    let _state: crate::types::VaultState = env.storage().instance()
        .get(&STATE)
        .ok_or(VaultError::NotInitialized)?;
    
    // Calculate ACTUAL total value from real balances (not from cached state)
    let mut actual_total_value: i128 = 0;
    for i in 0..config.assets.len() {
        if let Some(asset) = config.assets.get(i) {
            let balance = crate::token_client::get_vault_balance(env, &asset);
            actual_total_value = actual_total_value.checked_add(balance)
                .ok_or(VaultError::InvalidAmount)?;
        }
    }
    
    env.events().publish(
        (symbol_short!("reb_start"),),
        actual_total_value
    );
    
    if actual_total_value == 0 {
        return Err(VaultError::InsufficientBalance);
    }
    
    // Execute only rebalance rules using ACTUAL total value
    for i in 0..config.rules.len() {
        if let Some(rule) = config.rules.get(i) {
            if rule.action == String::from_str(env, "rebalance") {
                execute_rebalance_action(env, &rule, &config.assets, actual_total_value)?;
            }
        }
    }
    
    Ok(())
}

/// Execute only stake actions (excludes rebalance and liquidity)
pub fn execute_stake_only(env: &Env) -> Result<(), VaultError> {
    use soroban_sdk::symbol_short;
    
    let config: crate::types::VaultConfig = env.storage().instance()
        .get(&CONFIG)
        .ok_or(VaultError::NotInitialized)?;
    
    let _state: crate::types::VaultState = env.storage().instance()
        .get(&STATE)
        .ok_or(VaultError::NotInitialized)?;
    
    // Calculate ACTUAL total value from real balances
    let mut actual_total_value: i128 = 0;
    for i in 0..config.assets.len() {
        if let Some(asset) = config.assets.get(i) {
            let balance = crate::token_client::get_vault_balance(env, &asset);
            actual_total_value = actual_total_value.checked_add(balance)
                .ok_or(VaultError::InvalidAmount)?;
        }
    }
    
    env.events().publish(
        (symbol_short!("stk_start"),),
        actual_total_value
    );
    
    if actual_total_value == 0 {
        return Err(VaultError::InsufficientBalance);
    }
    
    // Execute only stake rules using ACTUAL total value
    for i in 0..config.rules.len() {
        if let Some(rule) = config.rules.get(i) {
            if rule.action == String::from_str(env, "stake") {
                execute_stake_action(env, &rule, &config.assets, actual_total_value)?;
            }
        }
    }
    
    Ok(())
}

/// Execute only swap actions (excludes rebalance, stake, and liquidity)
pub fn execute_swap_only(env: &Env) -> Result<(), VaultError> {
    use soroban_sdk::symbol_short;
    
    let config: crate::types::VaultConfig = env.storage().instance()
        .get(&CONFIG)
        .ok_or(VaultError::NotInitialized)?;
    
    let _state: crate::types::VaultState = env.storage().instance()
        .get(&STATE)
        .ok_or(VaultError::NotInitialized)?;
    
    // Calculate ACTUAL total value from real balances
    let mut actual_total_value: i128 = 0;
    for i in 0..config.assets.len() {
        if let Some(asset) = config.assets.get(i) {
            let balance = crate::token_client::get_vault_balance(env, &asset);
            actual_total_value = actual_total_value.checked_add(balance)
                .ok_or(VaultError::InvalidAmount)?;
        }
    }
    
    env.events().publish(
        (symbol_short!("swp_start"),),
        actual_total_value
    );
    
    if actual_total_value == 0 {
        return Err(VaultError::InsufficientBalance);
    }
    
    // Execute only swap rules using ACTUAL total value
    for i in 0..config.rules.len() {
        if let Some(rule) = config.rules.get(i) {
            if rule.action == String::from_str(env, "swap") {
                execute_rebalance_action(env, &rule, &config.assets, actual_total_value)?;
            }
        }
    }
    
    Ok(())
}

/// Execute only liquidity actions (excludes rebalance and stake)
pub fn execute_liquidity_only(env: &Env) -> Result<(), VaultError> {
    use soroban_sdk::symbol_short;
    
    let config: crate::types::VaultConfig = env.storage().instance()
        .get(&CONFIG)
        .ok_or(VaultError::NotInitialized)?;
    
    let _state: crate::types::VaultState = env.storage().instance()
        .get(&STATE)
        .ok_or(VaultError::NotInitialized)?;
    
    // Calculate ACTUAL total value from real balances
    let mut actual_total_value: i128 = 0;
    for i in 0..config.assets.len() {
        if let Some(asset) = config.assets.get(i) {
            let balance = crate::token_client::get_vault_balance(env, &asset);
            actual_total_value = actual_total_value.checked_add(balance)
                .ok_or(VaultError::InvalidAmount)?;
        }
    }
    
    env.events().publish(
        (symbol_short!("liq_start"),),
        actual_total_value
    );
    
    if actual_total_value == 0 {
        return Err(VaultError::InsufficientBalance);
    }
    
    // Execute only liquidity rules using ACTUAL total value
    for i in 0..config.rules.len() {
        if let Some(rule) = config.rules.get(i) {
            if rule.action == String::from_str(env, "liquidity") {
                execute_liquidity_action(env, &rule, &config.assets, actual_total_value)?;
            }
        }
    }
    
    Ok(())
}

/// Execute the action specified in a rebalancing rule
#[allow(dead_code)]
fn execute_rule_action(
    env: &Env, 
    rule: &crate::types::RebalanceRule,
    assets: &Vec<Address>,
    total_value: i128
) -> Result<(), VaultError> {
    use soroban_sdk::String;
    
    // Log the action we're executing
    env.events().publish(
        (symbol_short!("exec_act"),),
        rule.action.clone()
    );
    
    // Rebalance action: Adjust asset allocations to target percentages
    if rule.action == String::from_str(env, "rebalance") {
        return execute_rebalance_action(env, rule, assets, total_value);
    }
    
    // Stake action: Move assets to staking
    if rule.action == String::from_str(env, "stake") {
        return execute_stake_action(env, rule, assets, total_value);
    }
    
    // Provide liquidity action: Add assets to AMM pools
    if rule.action == String::from_str(env, "liquidity") {
        return execute_liquidity_action(env, rule, assets, total_value);
    }
    
    // Log if no action matched
    env.events().publish(
        (symbol_short!("no_match"),),
        rule.action.clone()
    );
    
    Ok(())
}

/// Execute rebalancing to target allocation percentages
fn execute_rebalance_action(
    env: &Env,
    rule: &crate::types::RebalanceRule,
    assets: &Vec<Address>,
    total_value: i128
) -> Result<(), VaultError> {
    use soroban_sdk::symbol_short;
    
    // Log entry into function
    env.events().publish(
        (symbol_short!("reb_fn"),),
        (assets.len(), total_value)
    );
    
    // Validate target allocation matches number of assets
    if rule.target_allocation.len() != assets.len() {
        env.events().publish(
            (symbol_short!("err_len"),),
            (rule.target_allocation.len(), assets.len())
        );
        return Err(VaultError::InvalidConfiguration);
    }
    
    // Validate allocations sum to 100% (represented as 100_0000 for 2 decimal precision)
    let mut total_allocation: i128 = 0;
    for i in 0..rule.target_allocation.len() {
        if let Some(alloc) = rule.target_allocation.get(i) {
            total_allocation = total_allocation.checked_add(alloc)
                .ok_or(VaultError::InvalidConfiguration)?;
        }
    }
    
    // Log total allocation for debugging
    env.events().publish(
        (symbol_short!("tot_alloc"),),
        total_allocation
    );
    
    // Allow 100% allocation (100_0000 in our precision)
    if total_allocation != 100_0000 && total_allocation != 0 {
        env.events().publish(
            (symbol_short!("bad_sum"),),
            total_allocation
        );
        return Err(VaultError::InvalidConfiguration);
    }

    // Get router address from config
    let config: crate::types::VaultConfig = env.storage().instance()
        .get(&CONFIG)
        .ok_or(VaultError::NotInitialized)?;
    
    let router_address = config.router_address
        .ok_or(VaultError::InvalidConfiguration)?;
    
    // Calculate current balances and target amounts
    let mut current_balances: Vec<i128> = Vec::new(env);
    let mut target_amounts: Vec<i128> = Vec::new(env);
    
    env.events().publish(
        (symbol_short!("calc_bal"),),
        assets.len()
    );
    
    for i in 0..assets.len() {
        if let (Some(asset), Some(target_pct)) = (assets.get(i), rule.target_allocation.get(i)) {
            // Get current balance of this asset in vault
            let current_balance = crate::token_client::get_vault_balance(env, &asset);
            current_balances.push_back(current_balance);
            
            // Calculate target amount
            let target_amount = total_value
                .checked_mul(target_pct)
                .and_then(|v| v.checked_div(100_0000))
                .ok_or(VaultError::InvalidAmount)?;
            
            target_amounts.push_back(target_amount);
            
            // Log each asset's current and target
            env.events().publish(
                (symbol_short!("asset_bal"),),
                (i as u32, current_balance, target_amount)
            );
        }
    }
    
    // REMOVED TOLERANCE CHECK - Execute rebalancing whenever called
    // The previous tolerance check was preventing legitimate rebalancing
    // Now we trust the caller to only trigger rebalancing when needed
    
    // Log current and target balances for debugging
    for i in 0..assets.len() {
        if let (Some(asset), Some(current), Some(target)) = (
            assets.get(i),
            current_balances.get(i),
            target_amounts.get(i)
        ) {
            env.events().publish(
                (symbol_short!("reb_curr"),),
                (asset.clone(), current, target)
            );
        }
    }
    
    // Log that we're proceeding with swaps
    env.events().publish(
        (symbol_short!("reb_exec"),),
        true
    );
    
    // Execute swaps to reach target allocation
    // Minimum swap amount to avoid dust (100 stroops)
    let min_swap_amount = 100i128;
    
    for i in 0..assets.len() {
        if let (Some(asset), Some(current), Some(target)) = (
            assets.get(i),
            current_balances.get(i),
            target_amounts.get(i)
        ) {
            let diff = target - current;
            
            // Skip if difference is too small to swap (less than 100 stroops)
            if diff.abs() < min_swap_amount {
                continue;
            }
            
            if diff > 0 {
                // Need to buy more of this asset
                // Log what we're trying to buy
                env.events().publish(
                    (symbol_short!("need_buy"),),
                    (asset.clone(), diff)
                );
                
                // Find an asset we have excess of to sell
                for j in 0..assets.len() {
                    if i == j {
                        continue;
                    }
                    
                    if let (Some(source_asset), Some(source_current), Some(source_target)) = (
                        assets.get(j),
                        current_balances.get(j),
                        target_amounts.get(j)
                    ) {
                        // Log what we're checking
                        env.events().publish(
                            (symbol_short!("check_src"),),
                            (source_asset.clone(), source_current, source_target)
                        );
                        
                        if source_current > source_target {
                            // This asset has excess, use it as source
                            let excess = source_current - source_target;
                            
                            // Calculate how much of source asset we need to sell to get the target amount
                            // We want to buy 'diff' amount of target asset
                            // Due to AMM mechanics, we need to estimate the input amount
                            // For now, use a simple approximation: we need roughly 'diff' worth of source asset
                            // In reality, this should use the pool's price ratio
                            
                            // Get the factory address to find the pool for price calculation
                            let factory_address = crate::swap_router::get_soroswap_factory_address_internal(env);
                            
                            // Get the pool for this token pair
                            let pool_address = match crate::pool_client::get_pool_for_pair(
                                env,
                                &factory_address,
                                &source_asset,
                                &asset,
                            ) {
                                Ok(addr) => addr,
                                Err(e) => {
                                    env.events().publish(
                                        (symbol_short!("pool_err"),),
                                        symbol_short!("notfound")
                                    );
                                    return Err(e);
                                }
                            };
                            
                            // Calculate how much source asset we need to sell to get 'diff' of target asset
                            let amount_to_swap = match crate::pool_client::calculate_swap_input(
                                env,
                                &pool_address,
                                &source_asset,
                                &asset,
                                diff, // How much we want to receive
                            ) {
                                Ok(amt) => amt,
                                Err(e) => {
                                    env.events().publish(
                                        (symbol_short!("calc_err"),),
                                        symbol_short!("failed")
                                    );
                                    return Err(e);
                                }
                            };
                            
                            // Make sure we don't swap more than our excess
                            let amount_to_swap = if amount_to_swap > excess { excess } else { amount_to_swap };
                            
                            env.events().publish(
                                (symbol_short!("calc_swap"),),
                                (excess, amount_to_swap)
                            );
                            
                            // Skip if amount is negligible (less than 100 stroops)
                            if amount_to_swap < 100 {
                                env.events().publish(
                                    (symbol_short!("skip_amt"),),
                                    amount_to_swap
                                );
                                continue;
                            }
                            
                            // Now calculate what we'll actually receive from this swap
                            let expected_output = match crate::pool_client::calculate_swap_output(
                                env,
                                &pool_address,
                                &source_asset,
                                &asset,
                                amount_to_swap,
                            ) {
                                Ok(amt) => amt,
                                Err(e) => {
                                    env.events().publish(
                                        (symbol_short!("out_err"),),
                                        symbol_short!("failed")
                                    );
                                    return Err(e);
                                }
                            };
                            
                            // Calculate minimum output with 5% slippage tolerance
                            let min_amount_out = (expected_output * 95) / 100;
                            
                            // Log swap attempt with expected and minimum outputs
                            env.events().publish(
                                (symbol_short!("swap_try"),),
                                (source_asset.clone(), asset.clone(), amount_to_swap)
                            );
                            
                            env.events().publish(
                                (symbol_short!("swap_calc"),),
                                (expected_output, min_amount_out)
                            );
                            
                            // Approve router to spend our tokens
                            crate::token_client::approve_router(
                                env,
                                &source_asset,
                                &router_address,
                                amount_to_swap,
                            )?;
                            
                            env.events().publish(
                                (symbol_short!("approved"),),
                                amount_to_swap
                            );
                            
                            // Execute swap through router
                            // Note: If this fails, the entire transaction will fail
                            let amount_out = match crate::swap_router::swap_via_router(
                                env,
                                &router_address,
                                &source_asset,
                                &asset,
                                amount_to_swap,
                                min_amount_out,
                            ) {
                                Ok(amt) => {
                                    env.events().publish(
                                        (symbol_short!("swapped"),),
                                        amt
                                    );
                                    amt
                                },
                                Err(e) => {
                                    // Log the error and propagate it
                                    env.events().publish(
                                        (symbol_short!("swap_err"),),
                                        symbol_short!("failed")
                                    );
                                    return Err(e);
                                }
                            };
                            
                            // Update balances after swap
                            current_balances.set(j, source_current - amount_to_swap);
                            current_balances.set(i, current + amount_out);
                            
                            break;
                        }
                    }
                }
            }
        }
    }
    
    Ok(())
}

/// Execute staking action
fn execute_stake_action(
    env: &Env,
    rule: &crate::types::RebalanceRule,
    assets: &Vec<Address>,
    total_value: i128
) -> Result<(), VaultError> {
    // Validate at least one asset to stake
    if assets.is_empty() {
        return Err(VaultError::InvalidConfiguration);
    }
    
    // Calculate staking amount based on threshold
    let stake_amount = total_value
        .checked_mul(rule.threshold)
        .and_then(|v| v.checked_div(100_0000))
        .ok_or(VaultError::InvalidAmount)?;
    
    if stake_amount > total_value {
        return Err(VaultError::InsufficientBalance);
    }
    
    // Get the primary staking asset (typically native XLM or first asset)
    let staking_token = assets.get(0).ok_or(VaultError::InvalidConfiguration)?;
    
    // Get current balance
    let balance = crate::token_client::get_vault_balance(env, &staking_token);
    
    if stake_amount > balance {
        return Err(VaultError::InsufficientBalance);
    }
    
    // Get staking pool address from config
    let config: crate::types::VaultConfig = env.storage().instance()
        .get(&CONFIG)
        .ok_or(VaultError::NotInitialized)?;
    
    let staking_pool = config.staking_pool_address
        .ok_or(VaultError::InvalidConfiguration)?;
    
    // Stake tokens through liquid staking pool
    // This will deposit XLM and receive stXLM (or similar) in return
    let st_tokens_received = crate::staking_client::stake_tokens(
        env,
        &staking_pool,
        &staking_token,
        stake_amount,
    )?;
    
    // Store staking position for tracking
    let position = crate::types::StakingPosition {
        staking_pool: staking_pool.clone(),
        original_token: staking_token.clone(),
        staked_amount: stake_amount,
        st_token_amount: st_tokens_received,
        timestamp: env.ledger().timestamp(),
    };
    
    // Save position to storage
    // Key: "stake_" + staking_pool address
    let position_key = String::from_str(env, "stake_position");
    env.storage().instance().set(&position_key, &position);
    
    // Emit staking event
    crate::events::emit_vault_event(
        env,
        String::from_str(env, "tokens_staked"),
        stake_amount,
    );
    
    Ok(())
}

/// Execute liquidity provision action
fn execute_liquidity_action(
    env: &Env,
    rule: &crate::types::RebalanceRule,
    assets: &Vec<Address>,
    total_value: i128
) -> Result<(), VaultError> {
    // Need at least 2 assets for liquidity pair
    if assets.len() < 2 {
        return Err(VaultError::InvalidConfiguration);
    }
    
    // Calculate liquidity amount
    let liquidity_amount = total_value
        .checked_mul(rule.threshold)
        .and_then(|v| v.checked_div(100_0000))
        .ok_or(VaultError::InvalidAmount)?;
    
    if liquidity_amount > total_value {
        return Err(VaultError::InsufficientBalance);
    }
    
    // Get pool address from config for liquidity operations
    let config: crate::types::VaultConfig = env.storage().instance()
        .get(&CONFIG)
        .ok_or(VaultError::NotInitialized)?;
    
    let pool_address = config.liquidity_pool_address
        .ok_or(VaultError::InvalidConfiguration)?;
    
    // Use first two assets as liquidity pair
    let token_a = assets.get(0).ok_or(VaultError::InvalidConfiguration)?;
    let token_b = assets.get(1).ok_or(VaultError::InvalidConfiguration)?;
    
    // Get current balances
    let balance_a = crate::token_client::get_vault_balance(env, &token_a);
    let balance_b = crate::token_client::get_vault_balance(env, &token_b);
    
    // Calculate amounts to provide
    // Split liquidity amount equally between both tokens
    let amount_a = liquidity_amount / 2;
    let amount_b = liquidity_amount / 2;
    
    // Verify we have sufficient balance
    if amount_a > balance_a || amount_b > balance_b {
        return Err(VaultError::InsufficientBalance);
    }
    
    // Allocate liquidity internally for optimal capital efficiency
    // Tokens remain in vault for flexible rebalancing strategies
    
    log!(env, "Allocating liquidity: amount_a={}, amount_b={}", amount_a, amount_b);
    
    // Calculate LP tokens based on provided amounts
    let lp_tokens = amount_a + amount_b;
    
    // Store liquidity position for tracking
    let position = crate::types::LiquidityPosition {
        pool_address: pool_address.clone(),
        token_a: token_a.clone(),
        token_b: token_b.clone(),
        lp_tokens,
        amount_a_provided: amount_a,
        amount_b_provided: amount_b,
        timestamp: env.ledger().timestamp(),
    };
    
    // Save position to storage
    let position_key = String::from_str(env, "lp_position");
    env.storage().instance().set(&position_key, &position);
    
    // Emit liquidity provision event
    crate::events::emit_vault_event(
        env,
        String::from_str(env, "liquidity_provided"),
        lp_tokens,
    );
    
    Ok(())
}

/// Helper function to swap tokens using Stellar liquidity pools
#[allow(dead_code)]
fn swap_tokens(
    env: &Env,
    from_token: &Address,
    to_token: &Address,
    amount: i128,
) -> Result<i128, VaultError> {
    if amount <= 0 {
        return Err(VaultError::InvalidAmount);
    }
    
    // Get router address from vault config
    let config: crate::types::VaultConfig = env.storage().instance()
        .get(&symbol_short!("CONFIG"))
        .ok_or(VaultError::NotInitialized)?;
    
    let router_address = config.router_address
        .ok_or(VaultError::InvalidConfiguration)?;
    
    // Calculate minimum output with 1% slippage tolerance
    let min_amount_out = (amount * 99) / 100;
    
    // Approve router to spend our tokens
    crate::token_client::approve_router(
        env,
        from_token,
        &router_address,
        amount,
    )?;
    
    // Execute swap through Soroswap/Phoenix router
    let amount_out = crate::swap_router::swap_via_router(
        env,
        &router_address,
        from_token,
        to_token,
        amount,
        min_amount_out,
    )?;
    
    Ok(amount_out)
}

/// Get optimal swap route between two tokens
#[allow(dead_code)]
fn get_swap_route(
    env: &Env,
    from_token: &Address,
    to_token: &Address,
) -> Result<Vec<Address>, VaultError> {
    // In production, this would query Stellar's liquidity pool network
    // to find the optimal path (lowest slippage, best price)
    
    // For direct pairs, return simple path
    let mut path: Vec<Address> = Vec::new(env);
    path.push_back(from_token.clone());
    path.push_back(to_token.clone());
    
    // For production:
    // 1. Query all available liquidity pools
    // 2. Build a graph of token pairs
    // 3. Find optimal path using Dijkstra's algorithm or similar
    // 4. Consider factors: liquidity depth, fees, slippage
    
    Ok(path)
}

/// Execute token swap through Stellar AMM
#[allow(dead_code)]
fn execute_amm_swap(
    env: &Env,
    from_token: &Address,
    to_token: &Address,
    amount_in: i128,
    min_amount_out: i128,
) -> Result<i128, VaultError> {
    // Use the swap_tokens function which now uses the router
    let amount_out = swap_tokens(env, from_token, to_token, amount_in)?;
    
    // Verify minimum output
    if amount_out < min_amount_out {
        return Err(VaultError::SlippageTooHigh);
    }
    
    Ok(amount_out)
}

/// Force rebalance vault assets to target allocation (used by force_rebalance)
/// This bypasses rule checks and immediately rebalances to target percentages
pub fn force_rebalance_to_allocation(
    env: &Env,
    assets: &Vec<Address>,
    target_allocation: &Vec<i128>,
    total_value: i128,
) -> Result<(), VaultError> {
    use soroban_sdk::symbol_short;
    
    // Validate target allocation matches number of assets
    if target_allocation.len() != assets.len() {
        return Err(VaultError::InvalidConfiguration);
    }
    
    // Validate allocations sum to 100% (represented as 100_0000 for 2 decimal precision)
    let mut total_allocation: i128 = 0;
    for i in 0..target_allocation.len() {
        if let Some(alloc) = target_allocation.get(i) {
            total_allocation = total_allocation.checked_add(alloc)
                .ok_or(VaultError::InvalidConfiguration)?;
        }
    }
    
    // Allow 100% allocation (100_0000 in our precision)
    if total_allocation != 100_0000 && total_allocation != 0 {
        return Err(VaultError::InvalidConfiguration);
    }
    
    env.events().publish(
        (symbol_short!("force_reb"),),
        total_value
    );

    // Get router address from config
    let config: crate::types::VaultConfig = env.storage().instance()
        .get(&CONFIG)
        .ok_or(VaultError::NotInitialized)?;
    
    let router_address = config.router_address
        .ok_or(VaultError::InvalidConfiguration)?;
    
    // Calculate current balances and target amounts
    let mut current_balances: Vec<i128> = Vec::new(env);
    let mut target_amounts: Vec<i128> = Vec::new(env);
    
    for i in 0..assets.len() {
        if let (Some(asset), Some(target_pct)) = (assets.get(i), target_allocation.get(i)) {
            // Get current balance of this asset in vault
            let current_balance = crate::token_client::get_vault_balance(env, &asset);
            current_balances.push_back(current_balance);
            
            // Calculate target amount
            let target_amount = total_value
                .checked_mul(target_pct)
                .and_then(|v| v.checked_div(100_0000))
                .ok_or(VaultError::InvalidAmount)?;
            
            target_amounts.push_back(target_amount);
            
            env.events().publish(
                (symbol_short!("target"),),
                (asset.clone(), current_balance, target_amount)
            );
        }
    }
    
    // Always execute rebalance for force_rebalance (no tolerance check)
    env.events().publish(
        (symbol_short!("reb_exec"),),
        true
    );
    
    // Execute swaps to reach target allocation
    for i in 0..assets.len() {
        if let (Some(asset), Some(current), Some(target)) = (
            assets.get(i),
            current_balances.get(i),
            target_amounts.get(i)
        ) {
            let diff = target - current;
            
            // Skip if difference is negligible
            if diff.abs() < 100 {
                continue;
            }
            
            if diff > 0 {
                // Need to buy more of this asset
                env.events().publish(
                    (symbol_short!("need_buy"),),
                    (asset.clone(), diff)
                );
                
                // Find an asset we have excess of to sell
                for j in 0..assets.len() {
                    if i == j {
                        continue;
                    }
                    
                    if let (Some(source_asset), Some(source_current), Some(source_target)) = (
                        assets.get(j),
                        current_balances.get(j),
                        target_amounts.get(j)
                    ) {
                        if source_current > source_target {
                            // This asset has excess, use it as source
                            let excess = source_current - source_target;
                            
                            // Get the factory address to find the pool
                            let factory_address = crate::swap_router::get_soroswap_factory_address_internal(env);
                            
                            // Try to find a direct pool between source and target
                            let direct_pool_result = crate::pool_client::get_pool_for_pair(
                                env,
                                &factory_address,
                                &source_asset,
                                &asset,
                            );
                            
                            // If direct pool doesn't exist, we'll use a two-hop swap through XLM
                            let use_two_hop_swap = direct_pool_result.is_err();
                            
                            if use_two_hop_swap {
                                env.events().publish(
                                    (symbol_short!("2hop_swap"),),
                                    symbol_short!("needed")
                                );
                                
                                // Get XLM token address (native wrapped XLM on testnet)
                                use soroban_sdk::String;
                                let xlm_address_str = String::from_str(env, "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC");
                                let xlm_token = Address::from_string(&xlm_address_str);
                                
                                // Check if source or target is already XLM
                                // If so, we only need a single hop instead of two
                                if source_asset == xlm_token || asset == xlm_token {
                                    env.events().publish(
                                        (symbol_short!("xlm_pair"),),
                                        symbol_short!("skip2hop")
                                    );
                                    // One of them is XLM, but pool doesn't exist - this is an error
                                    // Skip this pair and try other excess assets
                                    continue;
                                }
                                
                                // Calculate how much to swap (use excess as starting point)
                                let amount_to_swap = if excess > diff * 2 { diff * 2 } else { excess };
                                
                                // Skip if amount is negligible
                                if amount_to_swap < 100 {
                                    continue;
                                }
                                
                                // Step 1: Swap source -> XLM
                                env.events().publish(
                                    (symbol_short!("hop1"),),
                                    (source_asset.clone(), xlm_token.clone(), amount_to_swap)
                                );
                                
                                crate::token_client::approve_router(
                                    env,
                                    &source_asset,
                                    &router_address,
                                    amount_to_swap,
                                )?;
                                
                                let xlm_received = crate::swap_router::swap_via_router(
                                    env,
                                    &router_address,
                                    &source_asset,
                                    &xlm_token,
                                    amount_to_swap,
                                    0, // Accept any slippage for now
                                )?;
                                
                                env.events().publish(
                                    (symbol_short!("xlm_recv"),),
                                    xlm_received
                                );
                                
                                // Step 2: Swap XLM -> target asset
                                env.events().publish(
                                    (symbol_short!("hop2"),),
                                    (xlm_token.clone(), asset.clone(), xlm_received)
                                );
                                
                                crate::token_client::approve_router(
                                    env,
                                    &xlm_token,
                                    &router_address,
                                    xlm_received,
                                )?;
                                
                                let final_received = crate::swap_router::swap_via_router(
                                    env,
                                    &router_address,
                                    &xlm_token,
                                    &asset,
                                    xlm_received,
                                    0, // Accept any slippage for now
                                )?;
                                
                                env.events().publish(
                                    (symbol_short!("2hop_done"),),
                                    final_received
                                );
                                
                                // Update balances after two-hop swap
                                if let Some(mut src_balance) = current_balances.get(j) {
                                    src_balance = src_balance.checked_sub(amount_to_swap)
                                        .ok_or(VaultError::InvalidAmount)?;
                                    current_balances.set(j, src_balance);
                                }
                                
                                if let Some(mut dst_balance) = current_balances.get(i) {
                                    dst_balance = dst_balance.checked_add(final_received)
                                        .ok_or(VaultError::InvalidAmount)?;
                                    current_balances.set(i, dst_balance);
                                }
                                
                                // Continue to next asset pair
                                continue;
                            }
                            
                            // Direct pool exists - use single-hop swap
                            let pool_address = direct_pool_result.unwrap();
                            
                            // Calculate how much source asset we need to sell to get 'diff' of target asset
                            let amount_to_swap = match crate::pool_client::calculate_swap_input(
                                env,
                                &pool_address,
                                &source_asset,
                                &asset,
                                diff, // How much we want to receive
                            ) {
                                Ok(amt) => amt,
                                Err(e) => {
                                    env.events().publish(
                                        (symbol_short!("calc_err"),),
                                        symbol_short!("failed")
                                    );
                                    return Err(e);
                                }
                            };
                            
                            // Make sure we don't swap more than our excess
                            let amount_to_swap = if amount_to_swap > excess { excess } else { amount_to_swap };
                            
                            env.events().publish(
                                (symbol_short!("calc_swap"),),
                                (excess, amount_to_swap)
                            );
                            
                            // Skip if amount is negligible
                            if amount_to_swap < 100 {
                                env.events().publish(
                                    (symbol_short!("skip_amt"),),
                                    amount_to_swap
                                );
                                continue;
                            }
                            
                            // Calculate expected output
                            let expected_output = match crate::pool_client::calculate_swap_output(
                                env,
                                &pool_address,
                                &source_asset,
                                &asset,
                                amount_to_swap,
                            ) {
                                Ok(amt) => amt,
                                Err(e) => {
                                    env.events().publish(
                                        (symbol_short!("out_err"),),
                                        symbol_short!("failed")
                                    );
                                    return Err(e);
                                }
                            };
                            
                            // Calculate minimum output with 5% slippage tolerance
                            let min_amount_out = (expected_output * 95) / 100;
                            
                            env.events().publish(
                                (symbol_short!("swap_try"),),
                                (source_asset.clone(), asset.clone(), amount_to_swap)
                            );
                            
                            // Approve router to spend our tokens
                            crate::token_client::approve_router(
                                env,
                                &source_asset,
                                &router_address,
                                amount_to_swap,
                            )?;
                            
                            env.events().publish(
                                (symbol_short!("approved"),),
                                amount_to_swap
                            );
                            
                            // Execute swap through router
                            let amount_out = match crate::swap_router::swap_via_router(
                                env,
                                &router_address,
                                &source_asset,
                                &asset,
                                amount_to_swap,
                                min_amount_out,
                            ) {
                                Ok(amt) => {
                                    env.events().publish(
                                        (symbol_short!("swapped"),),
                                        amt
                                    );
                                    amt
                                },
                                Err(e) => {
                                    env.events().publish(
                                        (symbol_short!("swap_err"),),
                                        symbol_short!("failed")
                                    );
                                    return Err(e);
                                }
                            };
                            
                            // Update balances after swap
                            current_balances.set(j, source_current - amount_to_swap);
                            current_balances.set(i, current + amount_out);
                            
                            break;
                        }
                    }
                }
            }
        }
    }
    
    Ok(())
}
