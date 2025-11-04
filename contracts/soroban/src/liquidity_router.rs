// Mock Liquidity Pool interface for liquidity provision
// This handles adding and removing liquidity from a mock DEX pool
use soroban_sdk::{contractclient, Address, Env, Vec};

/// Mock Liquidity Pool interface
/// Simplified interface for testing liquidity operations
#[contractclient(name = "MockLiquidityPoolClient")]
pub trait MockLiquidityPoolInterface {
    /// Add liquidity to a token pair pool
    /// Returns (liquidity_tokens, amount_a_used, amount_b_used)
    fn add_liquidity(
        env: Env,
        user: Address,
        token_a: Address,
        token_b: Address,
        amount_a_desired: i128,
        amount_b_desired: i128,
        amount_a_min: i128,
        amount_b_min: i128,
        deadline: u64,
    ) -> (i128, i128, i128);
    
    /// Remove liquidity from a token pair pool
    /// Returns (amount_a, amount_b)
    fn remove_liquidity(
        env: Env,
        user: Address,
        token_a: Address,
        token_b: Address,
        lp_tokens: i128,
        amount_a_min: i128,
        amount_b_min: i128,
        deadline: u64,
    ) -> (i128, i128);
    
    /// Get optimal amounts for adding liquidity
    /// Returns optimal amount_b for given amount_a
    fn quote(
        env: Env,
        amount_a: i128,
        reserve_a: i128,
        reserve_b: i128,
    ) -> i128;
}

/// Add liquidity to a mock liquidity pool
/// This adds both tokens to the pool and receives LP tokens
pub fn add_liquidity_to_pool(
    env: &Env,
    pool_address: &Address,
    token_a: &Address,
    token_b: &Address,
    amount_a: i128,
    amount_b: i128,
    slippage_percent: i128, // e.g., 5 for 5% slippage
) -> Result<(i128, i128, i128), crate::errors::VaultError> {
    use crate::errors::VaultError;
    
    if amount_a <= 0 || amount_b <= 0 {
        return Err(VaultError::InvalidAmount);
    }
    
    if slippage_percent < 0 || slippage_percent > 100 {
        return Err(VaultError::InvalidConfiguration);
    }

    let pool_client = MockLiquidityPoolClient::new(env, pool_address);
    let vault_address = env.current_contract_address();
    
    // Calculate minimum amounts based on slippage tolerance
    let amount_a_min = amount_a
        .checked_mul(100 - slippage_percent)
        .and_then(|v| v.checked_div(100))
        .ok_or(VaultError::InvalidAmount)?;
    
    let amount_b_min = amount_b
        .checked_mul(100 - slippage_percent)
        .and_then(|v| v.checked_div(100))
        .ok_or(VaultError::InvalidAmount)?;
    
    // Set deadline to 1 hour from now
    let deadline = env.ledger().timestamp() + 3600;
    
    // Add liquidity through mock pool
    // The mock pool will call token.transfer internally with proper authorization
    let (lp_tokens, actual_a, actual_b) = pool_client.add_liquidity(
        &vault_address,
        &token_a,
        &token_b,
        &amount_a,
        &amount_b,
        &amount_a_min,
        &amount_b_min,
        &deadline,
    );
    
    if lp_tokens <= 0 {
        return Err(VaultError::InvalidAmount);
    }
    
    Ok((lp_tokens, actual_a, actual_b))
}

/// Remove liquidity from a mock liquidity pool
/// This burns LP tokens and receives both tokens back
pub fn remove_liquidity_from_pool(
    env: &Env,
    pool_address: &Address,
    token_a: &Address,
    token_b: &Address,
    lp_tokens: i128,
    slippage_percent: i128,
) -> Result<(i128, i128), crate::errors::VaultError> {
    use crate::errors::VaultError;
    
    if lp_tokens <= 0 {
        return Err(VaultError::InvalidAmount);
    }
    
    if slippage_percent < 0 || slippage_percent > 100 {
        return Err(VaultError::InvalidConfiguration);
    }

    let pool_client = MockLiquidityPoolClient::new(env, pool_address);
    let vault_address = env.current_contract_address();
    
    // Calculate minimum amounts based on slippage tolerance
    // For mock pool, we'll use 0 for simplicity
    let amount_a_min = 0;
    let amount_b_min = 0;
    
    // Set deadline to 1 hour from now
    let deadline = env.ledger().timestamp() + 3600;
    
    // Remove liquidity through mock pool
    let (amount_a, amount_b) = pool_client.remove_liquidity(
        &vault_address,
        &token_a,
        &token_b,
        &lp_tokens,
        &amount_a_min,
        &amount_b_min,
        &deadline,
    );
    
    if amount_a <= 0 || amount_b <= 0 {
        return Err(VaultError::InvalidAmount);
    }
    
    Ok((amount_a, amount_b))
}

/// Get optimal amount_b for adding liquidity with amount_a
/// This helps maintain the correct ratio when adding liquidity
pub fn get_optimal_liquidity_amounts(
    env: &Env,
    pool_address: &Address,
    amount_a: i128,
    reserve_a: i128,
    reserve_b: i128,
) -> Result<i128, crate::errors::VaultError> {
    use crate::errors::VaultError;
    
    if amount_a <= 0 || reserve_a <= 0 || reserve_b <= 0 {
        return Err(VaultError::InvalidAmount);
    }

    let pool_client = MockLiquidityPoolClient::new(env, pool_address);
    
    let amount_b = pool_client.quote(
        &amount_a,
        &reserve_a,
        &reserve_b,
    );
    
    Ok(amount_b)
}
