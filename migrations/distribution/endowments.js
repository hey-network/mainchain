const ONE_TOKEN = require("../helpers/oneToken");

const TOTAL_SUPPLY = 1e9 * ONE_TOKEN;

// This is the sum of all presale contributions (to be fixed at deployment)
const PRESALE_TOKENS_SOLD = 250 * 1e6 * ONE_TOKEN;
// The remainder of 50% of the tokens is for sale with the Token Sale contract
const TOKEN_SALE_ENDOWMENT = 0.5 * TOTAL_SUPPLY - PRESALE_TOKENS_SOLD;
const POOL_ENDOWMENT = 0.3 * TOTAL_SUPPLY;
const TEAM_ENDOWMENT = 0.1 * TOTAL_SUPPLY;
const CONTRIBUTORS_ENDOWMENT = 0.05 * TOTAL_SUPPLY;
const INVESTORS_ENDOWMENT = 0.03 * TOTAL_SUPPLY;
const ADVISORS_ENDOWMENT = 0.02 * TOTAL_SUPPLY;

module.exports = {
  TOKEN_SALE_ENDOWMENT,
  POOL_ENDOWMENT,
  TEAM_ENDOWMENT,
  CONTRIBUTORS_ENDOWMENT,
  INVESTORS_ENDOWMENT,
  ADVISORS_ENDOWMENT,
}
