const toTokens = require('../helpers/toTokens');

const TOTAL_SUPPLY = 1e9;
// This is the sum of all presale contributions (to be fixed at deployment)
const PRESALE_TOKENS_SOLD = 250 * 1e6;

// The remainder of 50% of the tokens is for sale with the Token Sale contract
const TOKEN_SALE_ENDOWMENT = toTokens(0.5 * TOTAL_SUPPLY - PRESALE_TOKENS_SOLD);
const POOL_ENDOWMENT = toTokens(0.3 * TOTAL_SUPPLY);
const TEAM_ENDOWMENT = toTokens(0.1 * TOTAL_SUPPLY);
const CONTRIBUTORS_ENDOWMENT = toTokens(0.05 * TOTAL_SUPPLY);
const INVESTORS_ENDOWMENT = toTokens(0.03 * TOTAL_SUPPLY);
const ADVISORS_ENDOWMENT = toTokens(0.02 * TOTAL_SUPPLY);

module.exports = {
  TOKEN_SALE_ENDOWMENT,
  POOL_ENDOWMENT,
  TEAM_ENDOWMENT,
  CONTRIBUTORS_ENDOWMENT,
  INVESTORS_ENDOWMENT,
  ADVISORS_ENDOWMENT,
}
