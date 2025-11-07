#![no_std]

//! Generic Custom Token Contract
//! 
//! A reusable SEP-41 compliant fungible token that can be initialized
//! with any name, symbol, and decimals. Perfect for creating custom
//! testnet tokens for liquidity pools and vaults.

use soroban_sdk::{
    contract, contractimpl, Address, Env, String, symbol_short, Map,
};

const BALANCE: soroban_sdk::Symbol = symbol_short!("BALANCE");
const ALLOWANCE: soroban_sdk::Symbol = symbol_short!("ALLOW");
const DECIMALS: soroban_sdk::Symbol = symbol_short!("decimals");
const NAME: soroban_sdk::Symbol = symbol_short!("name");
const SYMBOL: soroban_sdk::Symbol = symbol_short!("symbol");
const ADMIN: soroban_sdk::Symbol = symbol_short!("admin");

#[contract]
pub struct CustomToken;

#[contractimpl]
impl CustomToken {
    /// Initialize the token with custom parameters
    /// 
    /// # Arguments
    /// * `admin` - The admin address that can mint tokens
    /// * `decimals` - Number of decimals (typically 7 for Stellar)
    /// * `name` - Token name (e.g., "Syft Token A")
    /// * `symbol` - Token symbol (e.g., "TKNA")
    /// * `initial_supply` - Initial supply to mint to admin
    pub fn initialize(
        env: Env,
        admin: Address,
        decimals: u32,
        name: String,
        symbol: String,
        initial_supply: i128,
    ) {
        // Set metadata using instance storage
        env.storage().instance().set(&DECIMALS, &decimals);
        env.storage().instance().set(&NAME, &name);
        env.storage().instance().set(&SYMBOL, &symbol);
        env.storage().instance().set(&ADMIN, &admin);

        // Mint initial supply to admin if specified
        if initial_supply > 0 {
            Self::write_balance(&env, admin.clone(), initial_supply);
        }

        env.events().publish(
            (symbol_short!("init"),),
            (admin.clone(), name.clone(), symbol.clone(), decimals, initial_supply)
        );
    }

    /// Mint new tokens (admin only)
    pub fn mint(env: Env, to: Address, amount: i128) {
        let admin: Address = env.storage().instance()
            .get(&ADMIN)
            .expect("token not initialized");
        admin.require_auth();

        let balance = Self::read_balance(&env, to.clone());
        Self::write_balance(&env, to.clone(), balance + amount);

        env.events().publish((symbol_short!("mint"),), (to, amount));
    }

    /// Get token balance
    pub fn balance(env: Env, account: Address) -> i128 {
        Self::read_balance(&env, account)
    }

    /// Transfer tokens
    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();

        let from_balance = Self::read_balance(&env, from.clone());
        if from_balance < amount {
            panic!("insufficient balance");
        }

        Self::write_balance(&env, from.clone(), from_balance - amount);
        let to_balance = Self::read_balance(&env, to.clone());
        Self::write_balance(&env, to.clone(), to_balance + amount);

        env.events().publish((symbol_short!("transfer"),), (from, to, amount));
    }

    /// Approve spender to spend tokens
    pub fn approve(env: Env, from: Address, spender: Address, amount: i128) {
        from.require_auth();
        Self::write_allowance(&env, from.clone(), spender.clone(), amount);
        env.events().publish((symbol_short!("approve"),), (from, spender, amount));
    }

    /// Transfer from another account (with allowance)
    pub fn transfer_from(env: Env, spender: Address, from: Address, to: Address, amount: i128) {
        spender.require_auth();

        let allowance = Self::read_allowance(&env, from.clone(), spender.clone());
        if allowance < amount {
            panic!("insufficient allowance");
        }

        let from_balance = Self::read_balance(&env, from.clone());
        if from_balance < amount {
            panic!("insufficient balance");
        }

        Self::write_allowance(&env, from.clone(), spender.clone(), allowance - amount);
        Self::write_balance(&env, from.clone(), from_balance - amount);
        
        let to_balance = Self::read_balance(&env, to.clone());
        Self::write_balance(&env, to.clone(), to_balance + amount);

        env.events().publish((symbol_short!("transfer"),), (from, to, amount));
    }

    /// Get allowance
    pub fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        Self::read_allowance(&env, from, spender)
    }

    /// Get token name
    pub fn name(env: Env) -> String {
        env.storage().instance()
            .get(&NAME)
            .unwrap_or(String::from_str(&env, "Unknown"))
    }

    /// Get token symbol
    pub fn symbol(env: Env) -> String {
        env.storage().instance()
            .get(&SYMBOL)
            .unwrap_or(String::from_str(&env, "???"))
    }

    /// Get token decimals
    pub fn decimals(env: Env) -> u32 {
        env.storage().instance()
            .get(&DECIMALS)
            .unwrap_or(7)
    }

    /// Get admin address
    pub fn admin(env: Env) -> Address {
        env.storage().instance()
            .get(&ADMIN)
            .expect("token not initialized")
    }

    // Internal helper functions
    fn read_balance(env: &Env, addr: Address) -> i128 {
        let key = (BALANCE, addr);
        env.storage().persistent().get(&key).unwrap_or(0)
    }

    fn write_balance(env: &Env, addr: Address, amount: i128) {
        let key = (BALANCE, addr);
        env.storage().persistent().set(&key, &amount);
    }

    fn read_allowance(env: &Env, from: Address, spender: Address) -> i128 {
        let key = (ALLOWANCE, from, spender);
        env.storage().persistent().get(&key).unwrap_or(0)
    }

    fn write_allowance(env: &Env, from: Address, spender: Address, amount: i128) {
        let key = (ALLOWANCE, from, spender);
        env.storage().persistent().set(&key, &amount);
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_token_initialization() {
        let env = Env::default();
        env.mock_all_auths();
        
        let contract_id = env.register_contract(None, CustomToken);
        let client = CustomTokenClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        let name = String::from_str(&env, "Test Token");
        let symbol = String::from_str(&env, "TEST");
        
        client.initialize(&admin, &7, &name, &symbol, &1_000_000_0000000);
        
        assert_eq!(client.name(), name);
        assert_eq!(client.symbol(), symbol);
        assert_eq!(client.decimals(), 7);
        assert_eq!(client.balance(&admin), 1_000_000_0000000);
    }

    #[test]
    fn test_transfer() {
        let env = Env::default();
        env.mock_all_auths();
        
        let contract_id = env.register_contract(None, CustomToken);
        let client = CustomTokenClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let name = String::from_str(&env, "Test Token");
        let symbol = String::from_str(&env, "TEST");
        
        client.initialize(&admin, &7, &name, &symbol, &1000_0000000);
        client.transfer(&admin, &user, &100_0000000);
        
        assert_eq!(client.balance(&admin), 900_0000000);
        assert_eq!(client.balance(&user), 100_0000000);
    }
}
