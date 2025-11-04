#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, symbol_short, token};

const LP_TOKENS: Symbol = symbol_short!("LP_TOKENS");
const TOTAL_LP: Symbol = symbol_short!("TOTAL_LP");

/// Liquidity position for a user
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LiquidityPosition {
    pub lp_tokens: i128,
    pub token_a_provided: i128,
    pub token_b_provided: i128,
}

#[contract]
pub struct MockLiquidityPool;

#[contractimpl]
impl MockLiquidityPool {
    /// Add liquidity to the pool
    /// This is a simplified version that accepts tokens and returns LP tokens
    /// Returns (lp_tokens, amount_a_used, amount_b_used)
    pub fn add_liquidity(
        env: Env,
        user: Address,
        token_a: Address,
        token_b: Address,
        amount_a_desired: i128,
        amount_b_desired: i128,
        amount_a_min: i128,
        amount_b_min: i128,
        deadline: u64,
    ) -> (i128, i128, i128) {
        // Verify user authorization
        user.require_auth();
        
        // Check deadline
        if env.ledger().timestamp() > deadline {
            panic!("Deadline expired");
        }
        
        // For simplicity, we'll use the desired amounts as-is
        let amount_a = amount_a_desired;
        let amount_b = amount_b_desired;
        
        // Verify minimum amounts
        if amount_a < amount_a_min || amount_b < amount_b_min {
            panic!("Insufficient amounts");
        }
        
        // Transfer tokens from user to pool
        let token_a_client = token::TokenClient::new(&env, &token_a);
        let token_b_client = token::TokenClient::new(&env, &token_b);
        
        token_a_client.transfer(&user, &env.current_contract_address(), &amount_a);
        token_b_client.transfer(&user, &env.current_contract_address(), &amount_b);
        
        // Calculate LP tokens (simplified: just sum of both amounts)
        let lp_tokens = amount_a.checked_add(amount_b).unwrap();
        
        // Store user's liquidity position
        let position = LiquidityPosition {
            lp_tokens,
            token_a_provided: amount_a,
            token_b_provided: amount_b,
        };
        
        env.storage().instance().set(&(LP_TOKENS, user.clone()), &position);
        
        // Update total LP tokens
        let total_lp: i128 = env.storage().instance().get(&TOTAL_LP).unwrap_or(0);
        env.storage().instance().set(&TOTAL_LP, &(total_lp + lp_tokens));
        
        // Emit event
        env.events().publish(
            (symbol_short!("add_liq"), user),
            (lp_tokens, amount_a, amount_b)
        );
        
        (lp_tokens, amount_a, amount_b)
    }
    
    /// Remove liquidity from the pool
    /// Returns (amount_a, amount_b)
    pub fn remove_liquidity(
        env: Env,
        user: Address,
        token_a: Address,
        token_b: Address,
        lp_tokens: i128,
        amount_a_min: i128,
        amount_b_min: i128,
        deadline: u64,
    ) -> (i128, i128) {
        // Verify user authorization
        user.require_auth();
        
        // Check deadline
        if env.ledger().timestamp() > deadline {
            panic!("Deadline expired");
        }
        
        // Get user's position
        let position: LiquidityPosition = env.storage()
            .instance()
            .get(&(LP_TOKENS, user.clone()))
            .unwrap_or(LiquidityPosition {
                lp_tokens: 0,
                token_a_provided: 0,
                token_b_provided: 0,
            });
        
        if position.lp_tokens < lp_tokens {
            panic!("Insufficient LP tokens");
        }
        
        // Calculate token amounts to return (proportional to LP tokens)
        let amount_a = position.token_a_provided
            .checked_mul(lp_tokens)
            .and_then(|v| v.checked_div(position.lp_tokens))
            .unwrap();
            
        let amount_b = position.token_b_provided
            .checked_mul(lp_tokens)
            .and_then(|v| v.checked_div(position.lp_tokens))
            .unwrap();
        
        // Verify minimum amounts
        if amount_a < amount_a_min || amount_b < amount_b_min {
            panic!("Insufficient output amounts");
        }
        
        // Transfer tokens back to user
        let token_a_client = token::TokenClient::new(&env, &token_a);
        let token_b_client = token::TokenClient::new(&env, &token_b);
        
        token_a_client.transfer(&env.current_contract_address(), &user, &amount_a);
        token_b_client.transfer(&env.current_contract_address(), &user, &amount_b);
        
        // Update user's position
        let new_lp_tokens = position.lp_tokens - lp_tokens;
        let new_amount_a = position.token_a_provided - amount_a;
        let new_amount_b = position.token_b_provided - amount_b;
        
        if new_lp_tokens > 0 {
            let new_position = LiquidityPosition {
                lp_tokens: new_lp_tokens,
                token_a_provided: new_amount_a,
                token_b_provided: new_amount_b,
            };
            env.storage().instance().set(&(LP_TOKENS, user.clone()), &new_position);
        } else {
            env.storage().instance().remove(&(LP_TOKENS, user.clone()));
        }
        
        // Update total LP tokens
        let total_lp: i128 = env.storage().instance().get(&TOTAL_LP).unwrap_or(0);
        env.storage().instance().set(&TOTAL_LP, &(total_lp - lp_tokens));
        
        // Emit event
        env.events().publish(
            (symbol_short!("rm_liq"), user),
            (amount_a, amount_b)
        );
        
        (amount_a, amount_b)
    }
    
    /// Get user's liquidity position
    pub fn get_position(env: Env, user: Address) -> LiquidityPosition {
        env.storage()
            .instance()
            .get(&(LP_TOKENS, user))
            .unwrap_or(LiquidityPosition {
                lp_tokens: 0,
                token_a_provided: 0,
                token_b_provided: 0,
            })
    }
    
    /// Get total LP tokens in circulation
    pub fn get_total_lp(env: Env) -> i128 {
        env.storage().instance().get(&TOTAL_LP).unwrap_or(0)
    }
    
    /// Get quote for adding liquidity (helper for frontend)
    pub fn quote(
        _env: Env,
        amount_a: i128,
        _reserve_a: i128,
        _reserve_b: i128,
    ) -> i128 {
        // Simplified: return proportional amount
        // In real pool, this would calculate based on reserves
        amount_a / 10 // Mock ratio
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env};

    #[test]
    fn test_add_liquidity() {
        let env = Env::default();
        let contract_id = env.register_contract(None, MockLiquidityPool);
        let client = MockLiquidityPoolClient::new(&env, &contract_id);
        
        let user = Address::generate(&env);
        let token_a = Address::generate(&env);
        let token_b = Address::generate(&env);
        
        // Mock: would need to set up token contracts in real test
        let (lp_tokens, amount_a, amount_b) = client.add_liquidity(
            &user,
            &token_a,
            &token_b,
            &1000,
            &500,
            &900,
            &450,
            &9999999999,
        );
        
        assert_eq!(lp_tokens, 1500); // 1000 + 500
        assert_eq!(amount_a, 1000);
        assert_eq!(amount_b, 500);
    }
}
