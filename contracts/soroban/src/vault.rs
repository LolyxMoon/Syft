// Vault core contract functionality
use soroban_sdk::{contract, contractimpl, Address, Env, Symbol, symbol_short, token, log};

use crate::types::{VaultConfig, VaultState, UserPosition};
use crate::errors::VaultError;
use crate::events::{emit_deposit, emit_withdraw};

const CONFIG: Symbol = symbol_short!("CONFIG");
const STATE: Symbol = symbol_short!("STATE");
const POSITION: Symbol = symbol_short!("POSITION");

#[contract]
pub struct VaultContract;

#[contractimpl]
impl VaultContract {
    /// Initialize a new vault
    pub fn initialize(env: Env, config: VaultConfig) -> Result<(), VaultError> {
        // Check if already initialized
        if env.storage().instance().has(&CONFIG) {
            return Err(VaultError::AlreadyInitialized);
        }

        // Validate configuration
        if config.assets.is_empty() {
            return Err(VaultError::InvalidConfiguration);
        }

        // Initialize vault state
        // Set last_rebalance to 0 so first trigger always works
        let state = VaultState {
            total_shares: 0,
            total_value: 0,
            last_rebalance: 0,
        };

        // Store configuration and state
        env.storage().instance().set(&CONFIG, &config);
        env.storage().instance().set(&STATE, &state);

        Ok(())
    }

    /// Deposit assets into the vault (with optional auto-swap)
    /// If deposit_token is different from base token, it will be swapped automatically
    pub fn deposit(env: Env, user: Address, amount: i128) -> Result<i128, VaultError> {
        // Call deposit_with_token using the base asset (first asset)
        let config: VaultConfig = env.storage().instance().get(&CONFIG)
            .ok_or(VaultError::NotInitialized)?;
        
        if config.assets.is_empty() {
            return Err(VaultError::InvalidConfiguration);
        }
        
        let base_token = config.assets.get(0)
            .ok_or(VaultError::InvalidConfiguration)?;
        
        Self::deposit_with_token(env, user, amount, base_token)
    }

    /// Deposit with specific token (will auto-swap if not base asset)
    pub fn deposit_with_token(env: Env, user: Address, amount: i128, deposit_token: Address) -> Result<i128, VaultError> {
        // Debug: Entry point
        env.events().publish((symbol_short!("debug"),), symbol_short!("start"));
        
        // Require authorization from the user first
        user.require_auth();
        env.events().publish((symbol_short!("debug"),), symbol_short!("auth_ok"));
        
        // Check vault is initialized
        if !env.storage().instance().has(&CONFIG) {
            return Err(VaultError::NotInitialized);
        }
        env.events().publish((symbol_short!("debug"),), symbol_short!("init_ok"));

        // Validate amount
        if amount <= 0 {
            return Err(VaultError::InvalidAmount);
        }
        env.events().publish((symbol_short!("debug"),), symbol_short!("amt_ok"));

        // Get user position first (before any transfers)
        let mut position = Self::get_position(env.clone(), user.clone());
        env.events().publish((symbol_short!("debug"),), symbol_short!("pos_ok"));

        // Get config to determine base asset (first asset in the vault)
        let config: VaultConfig = env.storage().instance().get(&CONFIG)
            .ok_or(VaultError::NotInitialized)?;
        env.events().publish((symbol_short!("debug"),), symbol_short!("cfg_ok"));
        
        if config.assets.is_empty() {
            return Err(VaultError::InvalidConfiguration);
        }
        
        let base_token = config.assets.get(0)
            .ok_or(VaultError::InvalidConfiguration)?;
        env.events().publish((symbol_short!("debug"),), symbol_short!("tok_ok"));

        // Get vault address
        let vault_address = env.current_contract_address();
        env.events().publish((symbol_short!("debug"),), symbol_short!("addr_ok"));
        
        // Transfer deposit token from user to vault
        env.events().publish((symbol_short!("debug"),), symbol_short!("b4_xfer"));
        let deposit_token_client = token::TokenClient::new(&env, &deposit_token);
        deposit_token_client.transfer(&user, &vault_address, &amount);
        env.events().publish((symbol_short!("debug"),), symbol_short!("xfer_ok"));

        // AUTO-SWAP: Always swap to base token first for deposits
        // The rebalance function will then distribute across assets according to target allocation
        // This ensures consistent behavior regardless of which token is deposited
        let final_amount = if deposit_token != base_token {
            // Deposit token is different from base token - need to swap
            env.events().publish((symbol_short!("debug"),), symbol_short!("swap_req"));
            
            // Check if router is configured
            let router_address = config.router_address
                .ok_or(VaultError::RouterNotSet)?;
            
            env.events().publish((symbol_short!("debug"),), symbol_short!("swap_go"));
            
            // Swap deposit token to base token via router
            let swapped_amount = crate::swap_router::swap_via_router(
                &env,
                &router_address,
                &deposit_token,
                &base_token,
                amount,
                0, // min_amount_out = 0 (accept any slippage for now)
            )?;
            
            env.events().publish((symbol_short!("debug"),), symbol_short!("swap_ok"));
            swapped_amount
        } else {
            // Deposit token matches base token - no swap needed
            amount
        };

        // Get current state
        let mut state: VaultState = env.storage().instance().get(&STATE)
            .ok_or(VaultError::NotInitialized)?;

        // Calculate shares to mint based on final amount (after swap if needed)
        let shares = if state.total_shares == 0 {
            final_amount // First deposit: 1:1 ratio
        } else {
            // shares = (final_amount * total_shares) / total_value
            final_amount.checked_mul(state.total_shares)
                .and_then(|v| v.checked_div(state.total_value))
                .ok_or(VaultError::InvalidAmount)?
        };

        // Update state with final amount
        state.total_shares = state.total_shares.checked_add(shares)
            .ok_or(VaultError::InvalidAmount)?;
        state.total_value = state.total_value.checked_add(final_amount)
            .ok_or(VaultError::InvalidAmount)?;

        // Update user position (position was already fetched at the start)
        position.shares = position.shares.checked_add(shares)
            .ok_or(VaultError::InvalidAmount)?;
        position.last_deposit = env.ledger().timestamp();

        // Store updates
        env.storage().instance().set(&STATE, &state);
        env.storage().instance().set(&(POSITION, user.clone()), &position);

        // Emit event with final amount (after swap)
        emit_deposit(&env, &user, final_amount, shares);

        // NOTE: Auto-swap is ENABLED for all deposits
        // All deposits are first swapped to the base token (first asset in vault config)
        // Example: User deposits XLM into 70% USDC / 30% XLM vault → swaps XLM to USDC first
        //
        // IMPORTANT: For multi-asset vaults, ALWAYS call force_rebalance() after deposit
        // The rebalance function will then distribute the base token across all assets
        // according to the target allocation (e.g., 70% USDC, 30% XLM)

        Ok(shares)
    }

    /// Withdraw assets from the vault
    /// This will liquidate active positions and swap everything to XLM before withdrawal
    /// Users will always receive XLM (native token) which doesn't require trustlines
    pub fn withdraw(env: Env, user: Address, shares: i128) -> Result<i128, VaultError> {
        // Require authorization from the user first
        user.require_auth();
        
        // Check vault is initialized
        if !env.storage().instance().has(&CONFIG) {
            return Err(VaultError::NotInitialized);
        }

        // Validate shares
        if shares <= 0 {
            return Err(VaultError::InvalidAmount);
        }

        // Get user position
        let mut position = Self::get_position(env.clone(), user.clone());
        if position.shares < shares {
            return Err(VaultError::InsufficientShares);
        }

        // Get current state
        let mut state: VaultState = env.storage().instance().get(&STATE)
            .ok_or(VaultError::NotInitialized)?;

        // Guard against division by zero
        if state.total_shares == 0 {
            return Err(VaultError::InvalidAmount);
        }

        // Calculate amount to return
        // amount = (shares * total_value) / total_shares
        let amount = shares.checked_mul(state.total_value)
            .and_then(|v| v.checked_div(state.total_shares))
            .ok_or(VaultError::InvalidAmount)?;

        // Get config
        let config: VaultConfig = env.storage().instance().get(&CONFIG)
            .ok_or(VaultError::NotInitialized)?;
        
        if config.assets.is_empty() {
            return Err(VaultError::InvalidConfiguration);
        }
        
        // Find XLM token in the vault's assets
        // XLM is always the last asset we'll check, or we need to identify it properly
        // For now, we'll try to find it by checking all assets and use the last one as fallback
        // IMPORTANT: The vault MUST have XLM as one of its configured assets for withdrawals to work!
        let xlm_token = Self::find_xlm_token(&env, &config)?;

        // Get vault address
        let vault_address = env.current_contract_address();
        
        // Check vault's current balance of XLM
        let token_client = token::TokenClient::new(&env, &xlm_token);
        let current_balance = token_client.balance(&vault_address);
        
        log!(&env, "Withdrawal: shares={}, amount_needed={}, current_xlm_balance={}", shares, amount, current_balance);
        
        // WITHDRAWAL STRATEGY: Always return XLM to avoid trustline issues
        // 1. Liquidate all positions (unstake, remove liquidity)
        // 2. Swap ALL non-XLM assets to XLM
        // 3. Send XLM to user (no trustline needed)
        
        // Step 1: Liquidate ALL positions (not just proportional)
        log!(&env, "Step 1: Liquidating all positions");
        Self::liquidate_all_positions(&env, &config)?;
        
        // Step 2: Swap ALL non-XLM assets to XLM
        log!(&env, "Step 2: Swapping all assets to XLM");
        Self::swap_all_assets_to_xlm(&env, &config, &xlm_token)?;
        
        // Step 3: Check final XLM balance
        let final_xlm_balance = token_client.balance(&vault_address);
        log!(&env, "Final XLM balance after liquidation and swaps: {}", final_xlm_balance);
        
        // IMPORTANT: Use the actual XLM balance instead of the calculated amount
        // The calculated amount is based on total_value, but actual value is less due to:
        // - Swap fees (0.3% per swap)
        // - Slippage
        // - K invariant safety margin (-1 per swap)
        // We return whatever XLM is actually available proportional to user's shares
        let actual_amount = if final_xlm_balance < amount {
            log!(&env, "Adjusting withdrawal: calculated={}, actual_available={}", amount, final_xlm_balance);
            // Return proportional amount based on user's share of total shares
            // This ensures fair distribution when multiple users withdraw
            final_xlm_balance.checked_mul(shares)
                .and_then(|v| v.checked_div(state.total_shares))
                .ok_or(VaultError::InvalidAmount)?
        } else {
            amount
        };
        
        // Verify we have enough XLM
        if final_xlm_balance < actual_amount {
            log!(&env, "Insufficient XLM: have={}, need={}", final_xlm_balance, actual_amount);
            return Err(VaultError::InsufficientBalance);
        }
        
        // Transfer XLM from vault to user
        // XLM is the native token and doesn't require trustlines - everyone can receive it!
        token_client.transfer(&vault_address, &user, &actual_amount);
        
        log!(&env, "Successfully transferred {} XLM to user (calculated: {}, actual: {})", actual_amount, amount, actual_amount);

        // Update state using actual amount withdrawn
        state.total_shares = state.total_shares.checked_sub(shares)
            .ok_or(VaultError::InvalidAmount)?;
        state.total_value = state.total_value.checked_sub(actual_amount)
            .ok_or(VaultError::InvalidAmount)?;

        // Update user position
        position.shares = position.shares.checked_sub(shares)
            .ok_or(VaultError::InvalidAmount)?;

        // Store updates
        env.storage().instance().set(&STATE, &state);
        if position.shares == 0 {
            env.storage().instance().remove(&(POSITION, user.clone()));
        } else {
            env.storage().instance().set(&(POSITION, user.clone()), &position);
        }

        // Emit event with actual amount withdrawn
        emit_withdraw(&env, &user, shares, actual_amount);

        Ok(actual_amount)
    }
    
    /// Find XLM token address in the vault's configured assets
    /// XLM should be the last asset, or we check token symbol/name
    /// Falls back to last asset in the list if not found
    fn find_xlm_token(
        env: &Env,
        config: &VaultConfig,
    ) -> Result<Address, VaultError> {
        if config.assets.is_empty() {
            return Err(VaultError::InvalidConfiguration);
        }
        
        // STRATEGY: Try to identify XLM by checking token metadata
        // For now, use a simpler approach: assume XLM is the LAST asset in the vault config
        // This is a reasonable assumption since vaults are typically configured with
        // their base asset (USDC, EURC, etc.) first, and XLM last for withdrawals
        
        let asset_count = config.assets.len();
        let xlm_candidate = config.assets.get(asset_count - 1)
            .ok_or(VaultError::InvalidConfiguration)?;
        
        log!(env, "Using asset at index {} as XLM for withdrawal", asset_count - 1);
        
        Ok(xlm_candidate)
    }
    
    /// Liquidate ALL positions before withdrawal (unstake everything, remove all liquidity)
    fn liquidate_all_positions(
        env: &Env,
        config: &VaultConfig,
    ) -> Result<(), VaultError> {
        use crate::staking_client;
        
        log!(env, "Liquidating ALL positions");
        
        // Unstake ALL tokens from staking pool if configured
        if let Some(ref staking_pool) = config.staking_pool_address {
            let staking_symbol = symbol_short!("STAKE");
            
            if let Some(staking_pos) = env.storage().instance().get::<_, crate::types::StakingPosition>(&staking_symbol) {
                log!(env, "Unstaking ALL: {} tokens (st_tokens: {})", 
                    staking_pos.staked_amount, 
                    staking_pos.st_token_amount);
                
                // Unstake ALL st_tokens
                match staking_client::unstake_tokens(
                    env,
                    staking_pool,
                    staking_pos.st_token_amount // Burn ALL st_tokens
                ) {
                    Ok(tokens_received) => {
                        log!(env, "Successfully unstaked all: {}", tokens_received);
                        // Remove staking position
                        env.storage().instance().remove(&staking_symbol);
                    },
                    Err(e) => {
                        log!(env, "Failed to unstake: {:?}", e);
                        // Continue anyway
                    }
                }
            }
        }
        
        // TODO: Add liquidity position liquidation here if needed
        
        Ok(())
    }
    
    /// Liquidate positions to cover withdrawal shortfall (OLD - kept for compatibility)
    fn liquidate_positions_for_withdrawal(
        env: &Env,
        config: &VaultConfig,
        amount_needed: i128
    ) -> Result<(), VaultError> {
        use crate::staking_client;
        
        log!(env, "Liquidating positions to cover withdrawal. Amount needed: {}", amount_needed);
        
        let vault_address = env.current_contract_address();
        let mut amount_liquidated: i128 = 0;
        
        // Try to unstake from staking pool if configured
        if let Some(ref staking_pool) = config.staking_pool_address {
            // Check if vault has any staking position
            let staking_symbol = symbol_short!("STAKE");
            
            if let Some(staking_pos) = env.storage().instance().get::<_, crate::types::StakingPosition>(&staking_symbol) {
                log!(env, "Found staking position: staked={}, st_tokens={}", 
                    staking_pos.staked_amount, 
                    staking_pos.st_token_amount);
                
                // Calculate how much to unstake (proportional or all if needed)
                let amount_to_unstake = if staking_pos.staked_amount <= amount_needed {
                    staking_pos.staked_amount // Unstake all
                } else {
                    amount_needed.checked_sub(amount_liquidated)
                        .ok_or(VaultError::InvalidAmount)?
                };
                
                if amount_to_unstake > 0 {
                    log!(env, "Unstaking {} from pool (st_tokens: {})", 
                        amount_to_unstake, staking_pos.st_token_amount);
                    
                    // Calculate proportional st_token amount to burn
                    // st_tokens_to_burn = (amount_to_unstake * st_token_amount) / staked_amount
                    let st_tokens_to_burn = if amount_to_unstake >= staking_pos.staked_amount {
                        staking_pos.st_token_amount // Burn all
                    } else {
                        amount_to_unstake.checked_mul(staking_pos.st_token_amount)
                            .and_then(|v| v.checked_div(staking_pos.staked_amount))
                            .ok_or(VaultError::InvalidAmount)?
                    };
                    
                    // Unstake tokens by burning st_tokens
                    match staking_client::unstake_tokens(
                        env,
                        staking_pool,
                        st_tokens_to_burn
                    ) {
                        Ok(tokens_received) => {
                            log!(env, "Successfully unstaked: {}", tokens_received);
                            amount_liquidated = amount_liquidated.checked_add(tokens_received)
                                .ok_or(VaultError::InvalidAmount)?;
                            
                            // Update or remove staking position
                            let remaining_st_tokens = staking_pos.st_token_amount.checked_sub(st_tokens_to_burn)
                                .ok_or(VaultError::InvalidAmount)?;
                            
                            if remaining_st_tokens > 0 {
                                // Estimate remaining staked amount based on what we received
                                let remaining_staked = staking_pos.staked_amount.checked_sub(tokens_received)
                                    .ok_or(VaultError::InvalidAmount)?;
                                
                                let updated_pos = crate::types::StakingPosition {
                                    staked_amount: remaining_staked,
                                    st_token_amount: remaining_st_tokens,
                                    ..staking_pos
                                };
                                env.storage().instance().set(&staking_symbol, &updated_pos);
                            } else {
                                env.storage().instance().remove(&staking_symbol);
                            }
                        },
                        Err(e) => {
                            log!(env, "Failed to unstake: {:?}", e);
                            // Continue to try other liquidation methods
                        }
                    }
                }
            } else {
                log!(env, "No active staking position found");
            }
        }
        
        // Check if we've liquidated enough
        if amount_liquidated >= amount_needed {
            log!(env, "Successfully liquidated {} (needed {})", amount_liquidated, amount_needed);
            return Ok(());
        }
        
        log!(env, "Warning: Only liquidated {} out of {} needed", amount_liquidated, amount_needed);
        
        // Could add more liquidation methods here:
        // - Remove liquidity from pools
        // For now, return what we have
        
        Ok(())
    }
    
    /// Swap ALL non-XLM assets to XLM for withdrawal
    /// This ensures users always receive XLM which doesn't require trustlines
    fn swap_all_assets_to_xlm(
        env: &Env,
        config: &VaultConfig,
        xlm_token: &Address,
    ) -> Result<(), VaultError> {
        use crate::pool_client;
        
        log!(env, "Swapping ALL non-XLM assets to XLM");
        
        // Check if factory is configured for swaps, fallback to hardcoded testnet factory
        use soroban_sdk::String;
        let hardcoded_factory_str = String::from_str(env, "CDJTMBYKNUGINFQALHDMPLZYNGUV42GPN4B7QOYTWHRC4EE5IYJM6AES");
        let hardcoded_factory = Address::from_string(&hardcoded_factory_str);
        
        let factory_address = match config.factory_address.as_ref() {
            Some(addr) => {
                log!(env, "Using configured factory address");
                addr
            },
            None => {
                log!(env, "No factory configured - using hardcoded Soroswap testnet factory");
                // Hardcoded Soroswap Factory address for Testnet
                // CDJTMBYKNUGINFQALHDMPLZYNGUV42GPN4B7QOYTWHRC4EE5IYJM6AES
                &hardcoded_factory
            }
        };
        
        let vault_address = env.current_contract_address();
        let mut total_xlm_received: i128 = 0;
        
        // Iterate through ALL configured assets and swap everything to XLM
        let asset_count = config.assets.len();
        log!(env, "Scanning {} configured assets", asset_count);
        
        for i in 0..asset_count {
            let asset = config.assets.get(i)
                .ok_or(VaultError::InvalidConfiguration)?;
            
            // Skip if this is XLM itself
            if &asset == xlm_token {
                log!(env, "Asset {} is XLM - skipping", i);
                continue;
            }
            
            // Check balance of this asset
            let asset_client = token::TokenClient::new(env, &asset);
            let asset_balance = asset_client.balance(&vault_address);
            
            if asset_balance <= 0 {
                log!(env, "No balance for asset at index {}", i);
                continue;
            }
            
            log!(env, "Found {} balance of asset at index {} - swapping ALL to XLM", asset_balance, i);
            
            // Find the liquidity pool between this asset and XLM
            let pair_address = match pool_client::get_pool_for_pair(
                env,
                &factory_address,
                &asset,
                xlm_token
            ) {
                Ok(addr) => addr,
                Err(e) => {
                    log!(env, "No liquidity pool found for asset {} to XLM: {:?}", i, e);
                    continue; // Skip this asset and try the next one
                }
            };
            
            log!(env, "Found liquidity pair - swapping {} tokens", asset_balance);
            
            // Swap ALL balance to XLM
            match pool_client::swap_via_pool(
                env,
                &pair_address,
                &asset,
                xlm_token,
                asset_balance, // Swap entire balance
                0, // min_amount_out = 0 (accepting any slippage for withdrawal)
            ) {
                Ok(xlm_received) => {
                    log!(env, "Swapped successfully. Received {} XLM", xlm_received);
                    total_xlm_received = total_xlm_received.checked_add(xlm_received)
                        .ok_or(VaultError::InvalidAmount)?;
                },
                Err(e) => {
                    log!(env, "Swap failed: {:?}", e);
                    // Continue to try other assets
                }
            }
        }
        
        log!(env, "Total XLM received from swaps: {}", total_xlm_received);
        Ok(())
    }
    
    /// Swap other assets back to base token for withdrawal (OLD - kept for compatibility)
    /// SMART APPROACH: Scan ALL configured assets for balances and swap to base token
    /// This works even if vault config is incomplete - we swap whatever tokens the vault actually holds
    fn swap_assets_to_base_token(
        env: &Env,
        config: &VaultConfig,
        base_token: &Address,
        amount_needed: i128
    ) -> Result<(), VaultError> {
        use crate::pool_client;
        
        log!(env, "Swapping non-base assets to base token. Amount needed: {}", amount_needed);
        
        // Check if factory is configured for swaps, fallback to hardcoded testnet factory
        use soroban_sdk::String;
        let hardcoded_factory_str = String::from_str(env, "CDJTMBYKNUGINFQALHDMPLZYNGUV42GPN4B7QOYTWHRC4EE5IYJM6AES");
        let hardcoded_factory = Address::from_string(&hardcoded_factory_str);
        
        let factory_address = match config.factory_address.as_ref() {
            Some(addr) => {
                log!(env, "Using configured factory address");
                addr
            },
            None => {
                log!(env, "No factory configured - using hardcoded Soroswap testnet factory");
                // Hardcoded Soroswap Factory address for Testnet
                // CDJTMBYKNUGINFQALHDMPLZYNGUV42GPN4B7QOYTWHRC4EE5IYJM6AES
                &hardcoded_factory
            }
        };
        
        let vault_address = env.current_contract_address();
        let mut amount_swapped: i128 = 0;
        
        // Simple approach: Iterate through ALL configured assets
        // For each asset, check if vault has a balance, and if so, swap it to base token
        // This works even if the config doesn't match what the vault actually holds
        let asset_count = config.assets.len();
        log!(env, "Scanning {} configured assets for balances to swap", asset_count);
        
        // Iterate through all assets and swap any balance we find
        for i in 0..asset_count {
            if amount_swapped >= amount_needed {
                log!(env, "Swapped enough ({}) - stopping", amount_swapped);
                break;
            }
            
            let asset = config.assets.get(i)
                .ok_or(VaultError::InvalidConfiguration)?;
            
            // Skip if this is the base token
            if &asset == base_token {
                log!(env, "Asset {} is base token - skipping", i);
                continue;
            }
            
            // Check balance of this asset
            let asset_client = token::TokenClient::new(env, &asset);
            let asset_balance = asset_client.balance(&vault_address);
            
            if asset_balance <= 0 {
                log!(env, "No balance for asset at index {}", i);
                continue;
            }
            
            log!(env, "Found {} balance of asset at index {}", asset_balance, i);
            
            // Find the liquidity pool between this asset and base token
            let pair_address = match pool_client::get_pool_for_pair(
                env,
                factory_address,
                &asset,
                base_token
            ) {
                Ok(addr) => addr,
                Err(e) => {
                    log!(env, "No liquidity pool found for asset {} to base token: {:?}", i, e);
                    continue; // Skip this asset and try the next one
                }
            };
            
            log!(env, "Found pair for swap");
            
            // Calculate how much we need to swap
            // Try to get at least the remaining amount needed, but swap up to our full balance
            let remaining_needed = amount_needed.checked_sub(amount_swapped)
                .ok_or(VaultError::InvalidAmount)?;
            
            // Estimate how much of the asset we need to swap
            // For safety, try to swap a bit more to account for slippage
            let amount_to_swap = if asset_balance <= remaining_needed {
                asset_balance // Swap all if we don't have enough
            } else {
                remaining_needed // Otherwise swap what we need
            };
            
            log!(env, "Attempting to swap {} of asset to base token", amount_to_swap);
            
            // Execute the swap via the pool
            match pool_client::swap_via_pool(
                env,
                &pair_address,
                &asset,
                base_token,
                amount_to_swap,
                0, // min_amount_out = 0 (accepting any slippage for withdrawal)
            ) {
                Ok(amount_out) => {
                    log!(env, "Swapped successfully. Received {} base tokens", amount_out);
                    amount_swapped = amount_swapped.checked_add(amount_out)
                        .ok_or(VaultError::InvalidAmount)?;
                },
                Err(e) => {
                    log!(env, "Swap failed: {:?}", e);
                    // Continue to try other assets
                }
            }
        }
        
        log!(env, "Total swapped to base token: {} (needed: {})", amount_swapped, amount_needed);
        
        // Return Ok even if we didn't swap enough - the calling function will check final balance
        // This allows partial swaps to still be useful
        if amount_swapped > 0 {
            Ok(())
        } else {
            log!(env, "No assets could be swapped");
            Err(VaultError::InsufficientBalance)
        }
    }

    /// Get vault state
    pub fn get_state(env: Env) -> VaultState {
        env.storage().instance().get(&STATE)
            .unwrap_or(VaultState {
                total_shares: 0,
                total_value: 0,
                last_rebalance: 0,
            })
    }

    /// Get user position
    pub fn get_position(env: Env, user: Address) -> UserPosition {
        env.storage().instance().get(&(POSITION, user))
            .unwrap_or(UserPosition {
                shares: 0,
                last_deposit: 0,
            })
    }

    /// Get vault configuration
    pub fn get_config(env: Env) -> Result<VaultConfig, VaultError> {
        env.storage().instance().get(&CONFIG)
            .ok_or(VaultError::NotInitialized)
    }

    /// Set router address for swaps (owner only)
    pub fn set_router(env: Env, router: Address) -> Result<(), VaultError> {
        // Check vault is initialized
        if !env.storage().instance().has(&CONFIG) {
            return Err(VaultError::NotInitialized);
        }

        // Get config and verify owner
        let mut config: VaultConfig = env.storage().instance().get(&CONFIG)
            .ok_or(VaultError::NotInitialized)?;
        
        config.owner.require_auth();
        
        // Update router address
        config.router_address = Some(router);
        
        // Store updated config
        env.storage().instance().set(&CONFIG, &config);
        
        Ok(())
    }

    /// Set the staking pool address for liquid staking (e.g., stXLM)
    pub fn set_staking_pool(env: Env, caller: Address, staking_pool: Address) -> Result<(), VaultError> {
        caller.require_auth();
        
        let mut config: VaultConfig = env.storage().instance().get(&CONFIG)
            .ok_or(VaultError::NotInitialized)?;
        
        // Only owner can update staking pool
        if caller != config.owner {
            return Err(VaultError::Unauthorized);
        }
        
        config.staking_pool_address = Some(staking_pool);
        
        // Store updated config
        env.storage().instance().set(&CONFIG, &config);
        
        Ok(())
    }

    /// Set the factory address for finding liquidity pools
    pub fn set_factory(env: Env, caller: Address, factory: Address) -> Result<(), VaultError> {
        caller.require_auth();
        
        let mut config: VaultConfig = env.storage().instance().get(&CONFIG)
            .ok_or(VaultError::NotInitialized)?;
        
        // Only owner can update factory
        if caller != config.owner {
            return Err(VaultError::Unauthorized);
        }
        
        config.factory_address = Some(factory);
        
        // Store updated config
        env.storage().instance().set(&CONFIG, &config);
        
        Ok(())
    }

    /// Trigger a rebalance based on configured rules (only rebalance actions)
    /// Can be called by anyone, but only executes if rebalance rules are met
    pub fn trigger_rebalance(env: Env) -> Result<(), VaultError> {
        // Check vault is initialized
        if !env.storage().instance().has(&CONFIG) {
            return Err(VaultError::NotInitialized);
        }

        // Check if rebalancing should occur based on rules
        // NOTE: Anyone can call this, but it only rebalances if rules are satisfied
        // This prevents griefing while allowing automated rebalancing
        if !crate::engine::should_rebalance(&env) {
            return Ok(()); // No rebalancing needed
        }

        let _config: VaultConfig = env.storage().instance().get(&CONFIG)
            .ok_or(VaultError::NotInitialized)?;
        
        let mut state: VaultState = env.storage().instance().get(&STATE)
            .ok_or(VaultError::NotInitialized)?;

        // Execute only rebalance actions
        crate::rebalance::execute_rebalance_only(&env)?;

        // Update last rebalance timestamp
        state.last_rebalance = env.ledger().timestamp();
        env.storage().instance().set(&STATE, &state);

        // Emit rebalance event
        crate::events::emit_rebalance(&env, state.last_rebalance);

        Ok(())
    }

    /// Trigger staking based on configured rules (only stake actions)
    /// Can be called by anyone - assumes conditions already checked by caller
    pub fn trigger_stake(env: Env) -> Result<(), VaultError> {
        // Check vault is initialized
        if !env.storage().instance().has(&CONFIG) {
            return Err(VaultError::NotInitialized);
        }

        let _config: VaultConfig = env.storage().instance().get(&CONFIG)
            .ok_or(VaultError::NotInitialized)?;
        
        let mut state: VaultState = env.storage().instance().get(&STATE)
            .ok_or(VaultError::NotInitialized)?;

        // Execute only stake actions (no condition checking - backend already verified)
        crate::rebalance::execute_stake_only(&env)?;

        // Update last rebalance timestamp
        state.last_rebalance = env.ledger().timestamp();
        env.storage().instance().set(&STATE, &state);

        // Emit stake event
        env.events().publish((symbol_short!("staked"),), state.last_rebalance);

        Ok(())
    }

    /// Trigger liquidity provision based on configured rules (only liquidity actions)
    /// Can be called by anyone, but only executes if liquidity rules are met
    pub fn trigger_liquidity(env: Env) -> Result<(), VaultError> {
        // Check vault is initialized
        if !env.storage().instance().has(&CONFIG) {
            return Err(VaultError::NotInitialized);
        }

        // Check if liquidity provision should occur based on rules
        if !crate::engine::should_provide_liquidity(&env) {
            return Ok(()); // No liquidity provision needed
        }

        let _config: VaultConfig = env.storage().instance().get(&CONFIG)
            .ok_or(VaultError::NotInitialized)?;
        
        let mut state: VaultState = env.storage().instance().get(&STATE)
            .ok_or(VaultError::NotInitialized)?;

        // Execute only liquidity actions
        crate::rebalance::execute_liquidity_only(&env)?;

        // Update last rebalance timestamp
        state.last_rebalance = env.ledger().timestamp();
        env.storage().instance().set(&STATE, &state);

        // Emit liquidity event
        env.events().publish((symbol_short!("liquidity"),), state.last_rebalance);

        Ok(())
    }

    /// Force rebalance to target allocation (for post-deposit swaps)
    /// Always executes rebalance regardless of rules
    pub fn force_rebalance(env: Env) -> Result<(), VaultError> {
        // Check vault is initialized
        if !env.storage().instance().has(&CONFIG) {
            return Err(VaultError::NotInitialized);
        }

        let _config: VaultConfig = env.storage().instance().get(&CONFIG)
            .ok_or(VaultError::NotInitialized)?;

        let mut state: VaultState = env.storage().instance().get(&STATE)
            .ok_or(VaultError::NotInitialized)?;

        // Execute rebalance logic without checking rules
        crate::rebalance::execute_rebalance(&env)?;

        // Update last rebalance timestamp
        state.last_rebalance = env.ledger().timestamp();
        env.storage().instance().set(&STATE, &state);

        // Emit rebalance event
        crate::events::emit_rebalance(&env, state.last_rebalance);

        Ok(())
    }

    /// Get the current staking position for the vault
    pub fn get_staking_position(env: Env) -> Result<crate::types::StakingPosition, VaultError> {
        use soroban_sdk::String;
        
        let position_key = String::from_str(&env, "stake_position");
        
        env.storage().instance()
            .get(&position_key)
            .ok_or(VaultError::NotInitialized)
    }

    /// Get the current liquidity position for the vault
    pub fn get_liquidity_position(env: Env) -> Result<crate::types::LiquidityPosition, VaultError> {
        use soroban_sdk::String;
        
        let position_key = String::from_str(&env, "lp_position");
        
        env.storage().instance()
            .get(&position_key)
            .ok_or(VaultError::NotInitialized)
    }

    /// Check if vault has an active staking position
    pub fn has_staking_position(env: Env) -> bool {
        use soroban_sdk::String;
        let position_key = String::from_str(&env, "stake_position");
        env.storage().instance().has(&position_key)
    }

    /// Check if vault has an active liquidity position
    pub fn has_liquidity_position(env: Env) -> bool {
        use soroban_sdk::String;
        let position_key = String::from_str(&env, "lp_position");
        env.storage().instance().has(&position_key)
    }
}
