const DECIMALS = 18;
const ethers = require('ethers');
const toTokens = (n) => ethers.utils.parseUnits(n.toString(), DECIMALS);

module.exports = toTokens;
