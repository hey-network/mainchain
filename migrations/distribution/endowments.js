const toTokens = require('../helpers/toTokens');

const TOTAL_SUPPLY = 1e9;

const OWNER_ENDOWMENT = toTokens(0.6 * TOTAL_SUPPLY);
const POOL_ENDOWMENT = toTokens(0.3 * TOTAL_SUPPLY);
const TEAM_ENDOWMENT = toTokens(0.1 * TOTAL_SUPPLY);

module.exports = {
  OWNER_ENDOWMENT,
  POOL_ENDOWMENT,
  TEAM_ENDOWMENT,
}
