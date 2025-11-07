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
 */
export const XLM_LIQUIDITY_POOLS = {
  // XLM/AQX Pool
  [CUSTOM_TOKENS.AQX]: 'CDNN77W7A4X3IKVENIKRQMUVBODUF3WRLUZYJ4WQYVNML6SVAORUVXFN',
  
  // XLM/VLTK Pool
  [CUSTOM_TOKENS.VLTK]: 'CDV2HI43TPWV36KJS6X6GLXDTZQFWFQI2H3DFD4O47LRTHA3A3KKTAEI',
  
  // XLM/SLX Pool
  [CUSTOM_TOKENS.SLX]: 'CC47IJVCOHTNGKBQZFABNMPSAKFRGSXXXVOH3256L6K4WLAQJDJG2DDS',
  
  // XLM/WRX Pool
  [CUSTOM_TOKENS.WRX]: 'CD6Z46SJGJH6QADZAG5TXQJKCGAW5VP2JSOFRZ3UGOZFHXTZ4AS62E24',
  
  // XLM/SIXN Pool
  [CUSTOM_TOKENS.SIXN]: 'CDC2NAQ6RNVZHQ4Q2BBPO4FRZMJDCUCKX5P67W772I5HLTBKRJQLJKOO',
  
  // XLM/MBIUS Pool
  [CUSTOM_TOKENS.MBIUS]: 'CAM2UB4364HCDFIVQGW2YIONWMMCNZ43MXXVUD43X5ZP3PWAXBW5ABBK',
  
  // XLM/TRIO Pool
  [CUSTOM_TOKENS.TRIO]: 'CDL44UJMRKE5LZG2SVMNM3T2TSTBDGZUD4MJF3X5DBTYO2A4XU2UGKU2',
  
  // XLM/RELIO Pool
  [CUSTOM_TOKENS.RELIO]: 'CAKKECWO4LPCX5B4O4KENUKPBKFOJJL5HJXOC237TLU2LPKP3DDTGWLL',
  
  // XLM/TRI Pool
  [CUSTOM_TOKENS.TRI]: 'CAT3BC6DPFZHQBLDIZKRGIIYIWQTN6S6TGJUNXXLIYHBUDI3T7VPEOUA',
  
  // XLM/NUMER Pool
  [CUSTOM_TOKENS.NUMER]: 'CAKFDKYUVLM2ZJURHAIA4W626IZR3Y76KPEDTEK7NZIS5TMSFCYCKOM6',
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
