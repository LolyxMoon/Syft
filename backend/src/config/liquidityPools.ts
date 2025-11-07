/**
 * Liquidity Pool Mappings for Custom Tokens
 * Maps token pairs to their liquidity pool contract addresses
 */

export const XLM_ADDRESS = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

/**
 * Custom tokens with real liquidity pools (XLM pairs)
 */
export const CUSTOM_TOKENS = {
  AQX: 'CAABHEKIZJ3ZKVLTI63LHEZNQATLIZHSZAIGSKTAOBWGGINONRUUBIF3',
  VLTK: 'CBBBGORMTQ4B2DULIT3GG2GOQ5VZ724M652JYIDHNDWVUC76242VINME',
  SLX: 'CCU7FIONTYIEZK2VWF4IBRHGWQ6ZN2UYIL6A4NKFCG32A2JUEWN2LPY5',
  WRX: 'CCAIKLYMECH7RTVNR3GLWDU77WHOEDUKRVFLYMDXJDA7CX74VX6SRXWE',
  SIXN: 'CDYGMXR7K4DSN4SE4YAIGBZDP7GHSPP7DADUBHLO3VPQEHHCDJRNWU6O',
  MBIUS: 'CBXSQDQUYGJ7TDXPJTVISXYRMJG4IPLGN22NTLXX27Y2TPXA5LZUHQDP',
  TRIO: 'CB4MYY4N7IPH76XX6HFJNKPNORSDFMWBL4ZWDJ4DX73GK4G2KPSRLBGL',
  RELIO: 'CDRFQC4J5ZRAYZQUUSTS3KGDMJ35RWAOITXGHQGRXDVRJACMXB32XF7H',
  TRI: 'CB4JLZSNRR37UQMFZITKTFMQYG7LJR3JHJXKITXEVDFXRQTFYLFKLEDW',
  NUMER: 'CDBBFLGF35YDKD3VXFB7QGZOJFYZ4I2V2BE3NB766D5BUDFCRVUB7MRR',
};

/**
 * XLM/Custom Token liquidity pool addresses
 * All pools use real-liquidity-pool contract with x*y=k AMM
 * FIXED: Authorization and double-transfer issues resolved
 */
export const XLM_LIQUIDITY_POOLS = {
  // XLM/AQX Pool (FIXED)
  [CUSTOM_TOKENS.AQX]: 'CD7U5F4EKUC7UM72F3D5G4UPS6DJ54RNNPSHKJBK7KCRX4N3MNNBDGES',
  
  // XLM/VLTK Pool (FIXED)
  [CUSTOM_TOKENS.VLTK]: 'CCPV4CJUVHJ7DHN7UTHXORHOBVBP7ALNYU5QBXA6MJBFVS2Z5JWQHJRC',
  
  // XLM/SLX Pool (FIXED)
  [CUSTOM_TOKENS.SLX]: 'CBIM5CPY2T3KM6BDH6KVQNTPZ244VF6SJYB6DHB25UU6XGUWDNGICQMA',
  
  // XLM/WRX Pool (FIXED)
  [CUSTOM_TOKENS.WRX]: 'CCYBUIBFOWROWGLZWJWWVOWJSDVYF4XX3PW6U7Z4SWZVG64LPTWUT3S4',
  
  // XLM/SIXN Pool (FIXED)
  [CUSTOM_TOKENS.SIXN]: 'CCOQIJJM6VWFH6YA4QU2D3GX5YUEJOWDLZP4EPTIIL5AFLMRZKTBNRJW',
  
  // XLM/MBIUS Pool (FIXED)
  [CUSTOM_TOKENS.MBIUS]: 'CBERM7NGHSHHKDNOFE7DAMYLHYKK2M5JJBP4QSYL65OMSYGKBN3M2GUE',
  
  // XLM/TRIO Pool (FIXED)
  [CUSTOM_TOKENS.TRIO]: 'CBP6CNZQIJHP66L6NY7YJVZ4GBC773XKNRLG4TMD7D773HQ5LZ46OEZ4',
  
  // XLM/RELIO Pool (FIXED)
  [CUSTOM_TOKENS.RELIO]: 'CDPGBKILVQXIDSVOUHQ4YOK5P7PNZVPSVM7GNSJX3JI5NQRNTSGOKEGN',
  
  // XLM/TRI Pool (FIXED)
  [CUSTOM_TOKENS.TRI]: 'CAQ2366OMMX74H7QB4MQTEMH3RVSLNU4O5Y2HMJ5AWT2M4ONZR7IE47Y',
  
  // XLM/NUMER Pool (FIXED)
  [CUSTOM_TOKENS.NUMER]: 'CA6KURSAHVBAOZXPD3M5CQLWNDCJ6IWEH2A3XCCVPAXI2DDVVBESAVB5',
};

/**
 * Get liquidity pool address for a given token pair
 * Currently only supports XLM/Custom Token pairs
 * 
 * @param tokenA - First token address
 * @param tokenB - Second token address
 * @returns Pool address or null if no pool exists
 */
export function getPoolAddress(tokenA: string, tokenB: string): string | null {
  // Normalize order (XLM should always be tokenA)
  if (tokenB === XLM_ADDRESS) {
    [tokenA, tokenB] = [tokenB, tokenA];
  }
  
  // Check if this is an XLM/Custom Token pair
  if (tokenA === XLM_ADDRESS && XLM_LIQUIDITY_POOLS[tokenB]) {
    return XLM_LIQUIDITY_POOLS[tokenB];
  }
  
  return null;
}

/**
 * Check if a token is a custom token with a liquidity pool
 */
export function isCustomToken(tokenAddress: string): boolean {
  return Object.values(CUSTOM_TOKENS).includes(tokenAddress);
}

/**
 * Get token symbol from address
 */
export function getTokenSymbol(tokenAddress: string): string | null {
  const entry = Object.entries(CUSTOM_TOKENS).find(([, addr]) => addr === tokenAddress);
  return entry ? entry[0] : null;
}

/**
 * Pool contract interface (real-liquidity-pool)
 * - swap(user, token_in, amount_in, amount_out_min) - Execute token swap with 0.3% fee
 * - add_liquidity(user, amount_a_desired, amount_b_desired, amount_a_min, amount_b_min) - Add liquidity
 * - get_reserves() - Get current reserves (reserve_a, reserve_b)
 * 
 * Note: These pools use constant product AMM (x * y = k)
 * Swap fee: 0.3% (997/1000 multiplier)
 */
