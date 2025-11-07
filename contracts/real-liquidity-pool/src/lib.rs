#![no_std]

//! Real Functional Liquidity Pool Contract
//! 
//! This contract implements a Uniswap V2-style constant product AMM (x * y = k)
//! with real token transfers, swaps, and liquidity provision.
//! 
//! Features:
//! - Add/Remove liquidity with LP token minting
//! - Token swaps with 0.3% fee
//! - Real token transfers and balance tracking
//! - Proper price calculation and slippage protection

use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, Symbol, Vec,
    symbol_short, panic_with_error, contracterror,
};

// Storage Keys
const TOKEN_A: Symbol = symbol_short!("TOKEN_A");
const TOKEN_B: Symbol = symbol_short!("TOKEN_B");
const RESERVE_A: Symbol = symbol_short!("RESERVE_A");
const RESERVE_B: Symbol = symbol_short!("RESERVE_B");
const TOTAL_SHARES: Symbol = symbol_short!("SHARES");
const LP_TOKEN: Symbol = symbol_short!("LP_TOKEN");

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PoolInfo {
    pub token_a: Address,
    pub token_b: Address,
    pub reserve_a: i128,
    pub reserve_b: i128,
    pub total_shares: i128,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum PoolError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InsufficientLiquidity = 3,
    InsufficientAmount = 4,
    InsufficientOutputAmount = 5,
    InvalidTokenPair = 6,
    SlippageExceeded = 7,
    Unauthorized = 8,
}

#[contract]
pub struct RealLiquidityPool;

#[contractimpl]
impl RealLiquidityPool {
    /// Initialize the liquidity pool with two tokens
    pub fn initialize(env: Env, token_a: Address, token_b: Address) {
        // Check if already initialized
        if env.storage().instance().has(&TOKEN_A) {
            panic_with_error!(&env, PoolError::AlreadyInitialized);
        }

        // Store token addresses
        env.storage().instance().set(&TOKEN_A, &token_a);
        env.storage().instance().set(&TOKEN_B, &token_b);
        
        // Initialize reserves to 0
        env.storage().instance().set(&RESERVE_A, &0i128);
        env.storage().instance().set(&RESERVE_B, &0i128);
        env.storage().instance().set(&TOTAL_SHARES, &0i128);

        // Emit initialization event
        env.events().publish((symbol_short!("init"),), (token_a, token_b));
    }

    /// Add liquidity to the pool
    /// Returns: (liquidity_minted, amount_a_used, amount_b_used)
    pub fn add_liquidity(
        env: Env,
        user: Address,
        amount_a_desired: i128,
        amount_b_desired: i128,
        amount_a_min: i128,
        amount_b_min: i128,
    ) -> (i128, i128, i128) {
        user.require_auth();

        // Get pool info
        let token_a: Address = env.storage().instance()
            .get(&TOKEN_A)
            .unwrap_or_else(|| panic_with_error!(&env, PoolError::NotInitialized));
        let token_b: Address = env.storage().instance()
            .get(&TOKEN_B)
            .unwrap_or_else(|| panic_with_error!(&env, PoolError::NotInitialized));

        let reserve_a: i128 = env.storage().instance().get(&RESERVE_A).unwrap_or(0);
        let reserve_b: i128 = env.storage().instance().get(&RESERVE_B).unwrap_or(0);
        let total_shares: i128 = env.storage().instance().get(&TOTAL_SHARES).unwrap_or(0);

        // Calculate optimal amounts
        let (amount_a, amount_b) = if reserve_a == 0 && reserve_b == 0 {
            // First liquidity provision - use desired amounts
            (amount_a_desired, amount_b_desired)
        } else {
            // Calculate optimal amount_b based on amount_a
            let amount_b_optimal = Self::quote(amount_a_desired, reserve_a, reserve_b);
            
            if amount_b_optimal <= amount_b_desired {
                if amount_b_optimal < amount_b_min {
                    panic_with_error!(&env, PoolError::InsufficientAmount);
                }
                (amount_a_desired, amount_b_optimal)
            } else {
                // Calculate optimal amount_a based on amount_b
                let amount_a_optimal = Self::quote(amount_b_desired, reserve_b, reserve_a);
                if amount_a_optimal > amount_a_desired || amount_a_optimal < amount_a_min {
                    panic_with_error!(&env, PoolError::InsufficientAmount);
                }
                (amount_a_optimal, amount_b_desired)
            }
        };

        // Calculate liquidity shares to mint
        let liquidity = if total_shares == 0 {
            // Initial liquidity: geometric mean
            let product = amount_a.checked_mul(amount_b)
                .unwrap_or_else(|| panic_with_error!(&env, PoolError::InsufficientAmount));
            Self::sqrt(product)
        } else {
            // Subsequent liquidity: proportional to existing
            let liquidity_a = amount_a.checked_mul(total_shares)
                .and_then(|v| v.checked_div(reserve_a))
                .unwrap_or_else(|| panic_with_error!(&env, PoolError::InsufficientAmount));
            let liquidity_b = amount_b.checked_mul(total_shares)
                .and_then(|v| v.checked_div(reserve_b))
                .unwrap_or_else(|| panic_with_error!(&env, PoolError::InsufficientAmount));
            
            // Use the smaller value to maintain ratio
            if liquidity_a < liquidity_b { liquidity_a } else { liquidity_b }
        };

        if liquidity <= 0 {
            panic_with_error!(&env, PoolError::InsufficientLiquidity);
        }

        // Transfer tokens from user to pool
        let pool_address = env.current_contract_address();
        let token_a_client = token::TokenClient::new(&env, &token_a);
        let token_b_client = token::TokenClient::new(&env, &token_b);

        token_a_client.transfer(&user, &pool_address, &amount_a);
        token_b_client.transfer(&user, &pool_address, &amount_b);

        // Update reserves and total shares
        let new_reserve_a = reserve_a + amount_a;
        let new_reserve_b = reserve_b + amount_b;
        let new_total_shares = total_shares + liquidity;

        env.storage().instance().set(&RESERVE_A, &new_reserve_a);
        env.storage().instance().set(&RESERVE_B, &new_reserve_b);
        env.storage().instance().set(&TOTAL_SHARES, &new_total_shares);

        // Store user's LP shares
        let user_shares_key = (symbol_short!("LP"), user.clone());
        let current_shares: i128 = env.storage().instance().get(&user_shares_key).unwrap_or(0);
        env.storage().instance().set(&user_shares_key, &(current_shares + liquidity));

        // Emit event
        env.events().publish(
            (symbol_short!("add_liq"), user),
            (liquidity, amount_a, amount_b)
        );

        (liquidity, amount_a, amount_b)
    }

    /// Remove liquidity from the pool
    /// Returns: (amount_a_received, amount_b_received)
    pub fn remove_liquidity(
        env: Env,
        user: Address,
        liquidity: i128,
        amount_a_min: i128,
        amount_b_min: i128,
    ) -> (i128, i128) {
        user.require_auth();

        if liquidity <= 0 {
            panic_with_error!(&env, PoolError::InsufficientLiquidity);
        }

        // Get pool info
        let token_a: Address = env.storage().instance()
            .get(&TOKEN_A)
            .unwrap_or_else(|| panic_with_error!(&env, PoolError::NotInitialized));
        let token_b: Address = env.storage().instance()
            .get(&TOKEN_B)
            .unwrap_or_else(|| panic_with_error!(&env, PoolError::NotInitialized));

        let reserve_a: i128 = env.storage().instance().get(&RESERVE_A).unwrap_or(0);
        let reserve_b: i128 = env.storage().instance().get(&RESERVE_B).unwrap_or(0);
        let total_shares: i128 = env.storage().instance().get(&TOTAL_SHARES).unwrap_or(0);

        // Check user has enough shares
        let user_shares_key = (symbol_short!("LP"), user.clone());
        let user_shares: i128 = env.storage().instance().get(&user_shares_key).unwrap_or(0);
        
        if user_shares < liquidity {
            panic_with_error!(&env, PoolError::InsufficientLiquidity);
        }

        // Calculate token amounts to return
        let amount_a = liquidity.checked_mul(reserve_a)
            .and_then(|v| v.checked_div(total_shares))
            .unwrap_or_else(|| panic_with_error!(&env, PoolError::InsufficientAmount));
        let amount_b = liquidity.checked_mul(reserve_b)
            .and_then(|v| v.checked_div(total_shares))
            .unwrap_or_else(|| panic_with_error!(&env, PoolError::InsufficientAmount));

        // Check minimum amounts
        if amount_a < amount_a_min || amount_b < amount_b_min {
            panic_with_error!(&env, PoolError::SlippageExceeded);
        }

        // Transfer tokens back to user
        let pool_address = env.current_contract_address();
        let token_a_client = token::TokenClient::new(&env, &token_a);
        let token_b_client = token::TokenClient::new(&env, &token_b);

        token_a_client.transfer(&pool_address, &user, &amount_a);
        token_b_client.transfer(&pool_address, &user, &amount_b);

        // Update reserves and shares
        let new_reserve_a = reserve_a - amount_a;
        let new_reserve_b = reserve_b - amount_b;
        let new_total_shares = total_shares - liquidity;
        let new_user_shares = user_shares - liquidity;

        env.storage().instance().set(&RESERVE_A, &new_reserve_a);
        env.storage().instance().set(&RESERVE_B, &new_reserve_b);
        env.storage().instance().set(&TOTAL_SHARES, &new_total_shares);
        
        if new_user_shares > 0 {
            env.storage().instance().set(&user_shares_key, &new_user_shares);
        } else {
            env.storage().instance().remove(&user_shares_key);
        }

        // Emit event
        env.events().publish(
            (symbol_short!("rm_liq"), user),
            (amount_a, amount_b)
        );

        (amount_a, amount_b)
    }

    /// Swap token A for token B (or vice versa)
    /// Uses constant product formula with 0.3% fee
    pub fn swap(
        env: Env,
        user: Address,
        token_in: Address,
        amount_in: i128,
        amount_out_min: i128,
    ) -> i128 {
        // NOTE: Removed user.require_auth() to allow cross-contract calls
        // The token transfers below will still check authorization
        // user.require_auth();

        if amount_in <= 0 {
            panic_with_error!(&env, PoolError::InsufficientAmount);
        }

        // Get pool tokens
        let token_a: Address = env.storage().instance()
            .get(&TOKEN_A)
            .unwrap_or_else(|| panic_with_error!(&env, PoolError::NotInitialized));
        let token_b: Address = env.storage().instance()
            .get(&TOKEN_B)
            .unwrap_or_else(|| panic_with_error!(&env, PoolError::NotInitialized));

        // Determine swap direction
        let (token_out, reserve_in, reserve_out, is_a_to_b) = if token_in == token_a {
            let reserve_a: i128 = env.storage().instance().get(&RESERVE_A).unwrap_or(0);
            let reserve_b: i128 = env.storage().instance().get(&RESERVE_B).unwrap_or(0);
            (token_b.clone(), reserve_a, reserve_b, true)
        } else if token_in == token_b {
            let reserve_a: i128 = env.storage().instance().get(&RESERVE_A).unwrap_or(0);
            let reserve_b: i128 = env.storage().instance().get(&RESERVE_B).unwrap_or(0);
            (token_a.clone(), reserve_b, reserve_a, false)
        } else {
            panic_with_error!(&env, PoolError::InvalidTokenPair);
        };

        // Calculate output amount with 0.3% fee
        // amount_out = (amount_in * 997 * reserve_out) / (reserve_in * 1000 + amount_in * 997)
        let amount_in_with_fee = amount_in.checked_mul(997)
            .unwrap_or_else(|| panic_with_error!(&env, PoolError::InsufficientAmount));
        
        let numerator = amount_in_with_fee.checked_mul(reserve_out)
            .unwrap_or_else(|| panic_with_error!(&env, PoolError::InsufficientAmount));
        
        let denominator = reserve_in.checked_mul(1000)
            .and_then(|v| v.checked_add(amount_in_with_fee))
            .unwrap_or_else(|| panic_with_error!(&env, PoolError::InsufficientAmount));
        
        let amount_out = numerator.checked_div(denominator)
            .unwrap_or_else(|| panic_with_error!(&env, PoolError::InsufficientAmount));

        // Check slippage
        if amount_out < amount_out_min {
            panic_with_error!(&env, PoolError::SlippageExceeded);
        }

        if amount_out >= reserve_out {
            panic_with_error!(&env, PoolError::InsufficientLiquidity);
        }

        // Execute swap: transfer tokens
        let pool_address = env.current_contract_address();
        let token_in_client = token::TokenClient::new(&env, &token_in);
        let token_out_client = token::TokenClient::new(&env, &token_out);

        // Transfer input token from user to pool
        token_in_client.transfer(&user, &pool_address, &amount_in);
        
        // Transfer output token from pool to user
        token_out_client.transfer(&pool_address, &user, &amount_out);

        // Update reserves
        if is_a_to_b {
            let new_reserve_a: i128 = env.storage().instance().get(&RESERVE_A).unwrap_or(0) + amount_in;
            let new_reserve_b: i128 = env.storage().instance().get(&RESERVE_B).unwrap_or(0) - amount_out;
            env.storage().instance().set(&RESERVE_A, &new_reserve_a);
            env.storage().instance().set(&RESERVE_B, &new_reserve_b);
        } else {
            let new_reserve_a: i128 = env.storage().instance().get(&RESERVE_A).unwrap_or(0) - amount_out;
            let new_reserve_b: i128 = env.storage().instance().get(&RESERVE_B).unwrap_or(0) + amount_in;
            env.storage().instance().set(&RESERVE_A, &new_reserve_a);
            env.storage().instance().set(&RESERVE_B, &new_reserve_b);
        }

        // Emit event
        env.events().publish(
            (symbol_short!("swap"), user),
            (token_in, amount_in, token_out, amount_out)
        );

        amount_out
    }

    /// Get pool information
    pub fn get_pool_info(env: Env) -> PoolInfo {
        let token_a: Address = env.storage().instance()
            .get(&TOKEN_A)
            .unwrap_or_else(|| panic_with_error!(&env, PoolError::NotInitialized));
        let token_b: Address = env.storage().instance()
            .get(&TOKEN_B)
            .unwrap_or_else(|| panic_with_error!(&env, PoolError::NotInitialized));
        let reserve_a: i128 = env.storage().instance().get(&RESERVE_A).unwrap_or(0);
        let reserve_b: i128 = env.storage().instance().get(&RESERVE_B).unwrap_or(0);
        let total_shares: i128 = env.storage().instance().get(&TOTAL_SHARES).unwrap_or(0);

        PoolInfo {
            token_a,
            token_b,
            reserve_a,
            reserve_b,
            total_shares,
        }
    }

    /// Get user's LP token balance
    pub fn get_user_liquidity(env: Env, user: Address) -> i128 {
        let user_shares_key = (symbol_short!("LP"), user);
        env.storage().instance().get(&user_shares_key).unwrap_or(0)
    }

    /// Get reserves (for compatibility)
    pub fn get_reserves(env: Env) -> (i128, i128) {
        let reserve_a: i128 = env.storage().instance().get(&RESERVE_A).unwrap_or(0);
        let reserve_b: i128 = env.storage().instance().get(&RESERVE_B).unwrap_or(0);
        (reserve_a, reserve_b)
    }

    /// Get token addresses
    pub fn token_0(env: Env) -> Address {
        env.storage().instance()
            .get(&TOKEN_A)
            .unwrap_or_else(|| panic_with_error!(&env, PoolError::NotInitialized))
    }

    pub fn token_1(env: Env) -> Address {
        env.storage().instance()
            .get(&TOKEN_B)
            .unwrap_or_else(|| panic_with_error!(&env, PoolError::NotInitialized))
    }

    /// Aliases for compatibility with vault contract
    pub fn token_a(env: Env) -> Address {
        Self::token_0(env)
    }

    pub fn token_b(env: Env) -> Address {
        Self::token_1(env)
    }

    // ========== Helper Functions ==========

    /// Calculate quote for adding liquidity
    fn quote(amount_a: i128, reserve_a: i128, reserve_b: i128) -> i128 {
        if reserve_a == 0 || reserve_b == 0 {
            return amount_a;
        }
        amount_a.checked_mul(reserve_b)
            .and_then(|v| v.checked_div(reserve_a))
            .unwrap_or(0)
    }

    /// Integer square root (Babylonian method)
    fn sqrt(x: i128) -> i128 {
        if x == 0 {
            return 0;
        }
        let mut z = x;
        let mut y = (x + 1) / 2;
        while y < z {
            z = y;
            y = (x / y + y) / 2;
        }
        z
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env};

    #[test]
    fn test_pool_initialization() {
        let env = Env::default();
        let contract_id = env.register_contract(None, RealLiquidityPool);
        let client = RealLiquidityPoolClient::new(&env, &contract_id);
        
        let token_a = Address::generate(&env);
        let token_b = Address::generate(&env);
        
        client.initialize(&token_a, &token_b);
        
        let pool_info = client.get_pool_info();
        assert_eq!(pool_info.token_a, token_a);
        assert_eq!(pool_info.token_b, token_b);
        assert_eq!(pool_info.reserve_a, 0);
        assert_eq!(pool_info.reserve_b, 0);
    }
}
