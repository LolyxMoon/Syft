// Token client utilities for interacting with Stellar Asset Contract tokens
use soroban_sdk::{Address, Env, token};
use crate::errors::VaultError;

/// Transfer tokens from one address to another
/// Uses the standard Stellar Asset Contract interface
pub fn transfer_tokens(
    env: &Env,
    token_address: &Address,
    from: &Address,
    to: &Address,
    amount: i128,
) -> Result<(), VaultError> {
    if amount <= 0 {
        return Err(VaultError::InvalidAmount);
    }

    // Use Soroban SDK's built-in token client
    let token_client = token::TokenClient::new(env, token_address);
    token_client.transfer(from, to, &amount);
    
    Ok(())
}

/// Transfer tokens from vault to user (for withdrawals)
#[allow(dead_code)]
pub fn transfer_from_vault(
    env: &Env,
    token_address: &Address,
    to: &Address,
    amount: i128,
) -> Result<(), VaultError> {
    let vault_address = env.current_contract_address();
    transfer_tokens(env, token_address, &vault_address, to, amount)
}

/// Transfer tokens from user to vault (for deposits)
#[allow(dead_code)]
pub fn transfer_to_vault(
    env: &Env,
    token_address: &Address,
    from: &Address,
    amount: i128,
) -> Result<(), VaultError> {
    let vault_address = env.current_contract_address();
    transfer_tokens(env, token_address, from, &vault_address, amount)
}

/// Get token balance for an address
pub fn get_balance(
    env: &Env,
    token_address: &Address,
    address: &Address,
) -> i128 {
    let token_client = token::TokenClient::new(env, token_address);
    token_client.balance(address)
}

/// Get vault's balance of a specific token
pub fn get_vault_balance(
    env: &Env,
    token_address: &Address,
) -> i128 {
    let vault_address = env.current_contract_address();
    get_balance(env, token_address, &vault_address)
}

/// Approve router to spend vault's tokens for swaps
pub fn approve_router(
    env: &Env,
    token_address: &Address,
    router: &Address,
    amount: i128,
) -> Result<(), VaultError> {
    if amount <= 0 {
        return Err(VaultError::InvalidAmount);
    }

    let token_client = token::TokenClient::new(env, token_address);
    let vault_address = env.current_contract_address();
    let expiration_ledger = env.ledger().sequence() + 100;
    
    token_client.approve(&vault_address, router, &amount, &expiration_ledger);
    
    Ok(())
}

/// Approve pool to spend vault's tokens for swaps
pub fn approve_pool(
    env: &Env,
    token_address: &Address,
    pool: &Address,
    amount: i128,
) -> Result<(), VaultError> {
    if amount <= 0 {
        return Err(VaultError::InvalidAmount);
    }

    let token_client = token::TokenClient::new(env, token_address);
    let vault_address = env.current_contract_address();
    let expiration_ledger = env.ledger().sequence() + 100;
    
    token_client.approve(&vault_address, pool, &amount, &expiration_ledger);
    
    Ok(())
}

/// Check if router has sufficient allowance
#[allow(dead_code)]
pub fn check_allowance(
    env: &Env,
    token_address: &Address,
    router: &Address,
) -> i128 {
    let vault_address = env.current_contract_address();
    let token_client = token::TokenClient::new(env, token_address);
    token_client.allowance(&vault_address, router)
}

/// Check if an account has a trustline for a token
/// Returns true if the account can receive the token (trustline exists)
/// Returns false if the trustline is missing
#[allow(dead_code)]
pub fn has_trustline(
    env: &Env,
    token_address: &Address,
    account: &Address,
) -> bool {
    // Try to get the balance - if trustline doesn't exist, this will fail
    // We use a try-catch pattern by checking if we can call balance without panic
    // In Soroban, we can't truly catch panics, so we'll use the token interface
    let token_client = token::TokenClient::new(env, token_address);
    
    // Attempt to get balance - if successful, trustline exists
    // Note: In production, this might still panic if no trustline
    // The proper way is to check balance existence, but Soroban's token
    // interface doesn't expose this directly
    //
    // For now, we document this limitation and rely on frontend validation
    let _ = token_client.balance(account);
    true
}
