const toTokens = require('../helpers/toTokens');

const TOTAL_SUPPLY = 1e9;

const CUSTODIAN_ENDOWMENT = toTokens(1 * TOTAL_SUPPLY);

module.exports = {
  CUSTODIAN_ENDOWMENT,
}
