const toTokens = require('../helpers/toTokens');

const TOTAL_SUPPLY = 1e9;

const POOL_ENDOWMENT = toTokens(0.1 * TOTAL_SUPPLY);
const CUSTODIAN_ENDOWMENT = toTokens(0.9 * TOTAL_SUPPLY);

module.exports = {
  POOL_ENDOWMENT,
  CUSTODIAN_ENDOWMENT,
}
