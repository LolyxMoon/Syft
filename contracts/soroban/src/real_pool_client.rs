// Real Liquidity Pool interface for custom tokens
// This interfaces with our custom real-liquidity-pool contract
use soroban_sdk::{contractclient, Address, Env, Symbol, symbol_short};

// Storage key for custom token pool mappings
const CUSTOM_POOL: Symbol = symbol_short!("CUST_POOL");

/// Real Liquidity Pool interface
/// Our custom AMM pool with simplified interface
#[contractclient(name = "RealPoolClient")]
#[allow(dead_code)]
pub trait RealPoolInterface {
    /// Swap tokens through the pool
    /// user: Address executing the swap
    /// token_in: Address of the token being swapped in
    /// amount_in: Amount of tokens to swap in
    /// amount_out_min: Minimum amount of tokens expected out (slippage protection)
    fn swap(
        env: Env,
        user: Address,
        token_in: Address,
        amount_in: i128,
        amount_out_min: i128,
    ) -> i128;
    
    /// Get reserves of the two tokens in the pool
    /// Returns (reserve_a, reserve_b)
    fn get_reserves(env: Env) -> (i128, i128);
    
    /// Get token 0 address
    fn token_0(env: Env) -> Address;
    
    /// Get token 1 address
    fn token_1(env: Env) -> Address;
}

/// Execute a swap through our real liquidity pool
/// This uses our custom pool contract interface
pub fn swap_via_real_pool(
    env: &Env,
    pool_address: &Address,
    from_token: &Address,
    to_token: &Address,
    amount_in: i128,
    min_amount_out: i128,
) -> Result<i128, crate::errors::VaultError> {
    use crate::errors::VaultError;
    use soroban_sdk::{symbol_short, log};
    
    if amount_in <= 0 {
        return Err(VaultError::InvalidAmount);
    }

    // Log swap attempt for debugging
    log!(env, "Custom pool swap: {} -> {}, amount: {}", from_token, to_token, amount_in);

    let pool_client = RealPoolClient::new(env, pool_address);
    let vault_address = env.current_contract_address();
    
    // Get pool token addresses to verify this is the correct pool
    let token_a = pool_client.token_0();
    let token_b = pool_client.token_1();
    
    // Verify tokens match
    if (from_token != &token_a && from_token != &token_b) || 
       (to_token != &token_a && to_token != &token_b) {
        log!(env, "Token mismatch! Pool tokens: {} and {}", token_a, token_b);
        return Err(VaultError::InvalidConfiguration);
    }
    
    // Get reserves before swap for logging
    let (reserve_a, reserve_b) = pool_client.get_reserves();
    log!(env, "Pool reserves: {} / {}", reserve_a, reserve_b);
    
    // Calculate expected output
    let expected_output = calculate_real_pool_output(
        env,
        pool_address,
        from_token,
        to_token,
        amount_in,
    )?;
    
    log!(env, "Expected output: {}", expected_output);
    
    // Verify expected output meets minimum
    if expected_output < min_amount_out {
        log!(env, "Slippage too high! Expected: {}, Min: {}", expected_output, min_amount_out);
        return Err(VaultError::SlippageTooHigh);
    }
    
    // WORKAROUND: Transfer tokens to pool first, then call swap with pool as user
    // This avoids the authorization issue where pool calls token.transfer(vault, pool, amount)
    use soroban_sdk::token;
    
    let token_in_client = token::TokenClient::new(env, from_token);
    
    // Vault transfers tokens to pool first
    token_in_client.transfer(&vault_address, pool_address, &amount_in);
    log!(env, "Transferred {} tokens to pool", amount_in);
    
    // Call swap with VAULT as the user so output tokens go to vault
    // Input tokens are already in the pool from the transfer above
    // Output tokens will be transferred from pool to vault
    let amount_out = pool_client.swap(
        &vault_address,  // Vault receives the output tokens
        from_token,
        &amount_in,
        &min_amount_out,
    );
    
    log!(env, "Swap successful! Output: {}", amount_out);
    
    // Emit event for successful swap
    env.events().publish(
        (symbol_short!("swap"), symbol_short!("custom")),
        (from_token, to_token, amount_in, amount_out)
    );
    
    Ok(amount_out)
}

/// Calculate expected output for a swap without executing it
/// This uses the constant product formula (x * y = k) with 0.3% fee
pub fn calculate_real_pool_output(
    env: &Env,
    pool_address: &Address,
    from_token: &Address,
    _to_token: &Address,
    amount_in: i128,
) -> Result<i128, crate::errors::VaultError> {
    use crate::errors::VaultError;
    
    if amount_in <= 0 {
        return Err(VaultError::InvalidAmount);
    }

    let pool_client = RealPoolClient::new(env, pool_address);
    
    // Get pool token addresses to determine which is token_a and token_b
    let token_a = pool_client.token_0();
    let token_b = pool_client.token_1();
    
    // Determine which token we're swapping from
    let is_token_a_in = if from_token == &token_a {
        true
    } else if from_token == &token_b {
        false
    } else {
        return Err(VaultError::InvalidConfiguration);
    };
    
    // Get current reserves
    let (reserve_a, reserve_b) = pool_client.get_reserves();
    
    // Calculate output amount using constant product formula
    // Formula: amount_out = (amount_in * 997 * reserve_out) / (reserve_in * 1000 + amount_in * 997)
    let (reserve_in, reserve_out) = if is_token_a_in {
        (reserve_a, reserve_b)
    } else {
        (reserve_b, reserve_a)
    };
    
    let amount_in_with_fee = amount_in
        .checked_mul(997)
        .ok_or(VaultError::InvalidAmount)?;
    
    let numerator = amount_in_with_fee
        .checked_mul(reserve_out)
        .ok_or(VaultError::InvalidAmount)?;
    
    let denominator = reserve_in
        .checked_mul(1000)
        .and_then(|v| v.checked_add(amount_in_with_fee))
        .ok_or(VaultError::InvalidAmount)?;
    
    let amount_out = numerator / denominator;
    
    Ok(amount_out)
}

/// Register a custom token pool mapping
/// This should be called during vault initialization or by owner
pub fn register_custom_pool(env: &Env, token_address: &Address, pool_address: &Address) {
    env.storage().instance().set(&(CUSTOM_POOL, token_address), pool_address);
}

/// Get the custom pool address for a token (if registered)
/// Returns None if no custom pool is registered for this token
pub fn get_custom_token_pool(env: &Env, token_address: &Address) -> Option<Address> {
    env.storage().instance().get(&(CUSTOM_POOL, token_address))
}

/// Check if a token is a custom token with a real liquidity pool
#[allow(dead_code)]
pub fn is_custom_token(env: &Env, token_address: &Address) -> bool {
    get_custom_token_pool(env, token_address).is_some()
}

/// Find the appropriate pool for a token pair
/// This checks both tokens and returns the custom pool if either is a custom token
/// Assumes the other token in the pair is XLM (the base pair for custom tokens)
pub fn find_pool_for_pair(
    env: &Env,
    token_a: &Address,
    token_b: &Address,
) -> Option<Address> {
    // Check if token_a has a custom pool
    if let Some(pool) = get_custom_token_pool(env, token_a) {
        // Verify this pool actually contains both tokens
        let pool_client = RealPoolClient::new(env, &pool);
        let pool_token_a = pool_client.token_0();
        let pool_token_b = pool_client.token_1();
        
        if (token_a == &pool_token_a || token_a == &pool_token_b) &&
           (token_b == &pool_token_a || token_b == &pool_token_b) {
            return Some(pool);
        }
    }
    
    // Check if token_b has a custom pool
    if let Some(pool) = get_custom_token_pool(env, token_b) {
        // Verify this pool actually contains both tokens
        let pool_client = RealPoolClient::new(env, &pool);
        let pool_token_a = pool_client.token_0();
        let pool_token_b = pool_client.token_1();
        
        if (token_a == &pool_token_a || token_a == &pool_token_b) &&
           (token_b == &pool_token_a || token_b == &pool_token_b) {
            return Some(pool);
        }
    }
    
    None
}
