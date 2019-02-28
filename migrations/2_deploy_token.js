/** @title Hey Token and Token Sale deployment
 *  @author Thomas Vanderstraeten - <thomas@get-hey.com>
 *  @dev Token deployment script. Note that all variables will be settled with
 *  their actual production values at the time of deployment.
 */

const BigNumber = require('bignumber.js');
const toBN = (n) => new BigNumber(n.toString());

const asyncForEach = require("./helpers/asyncForEach");
const assertTokenBalance = require("./helpers/assertTokenBalance");

const Token = artifacts.require("./Token.sol");

// Distribution and addresses parameters
const {
  POOL,
  CUSTODIAN,
} = require("./distribution/addresses");
const {
  POOL_ENDOWMENT,
  CUSTODIAN_ENDOWMENT,
} = require("./distribution/endowments");

// Deployment script
module.exports = function(deployer, network, accounts) {
  const owner = accounts[0];

  deployer.then(async () => {
    // Deploy the Token contract; the whole total supply gets minted to the
    // deployer address (who becomes the owner of the Token contract).
    await deployer.deploy(Token);
    const token = await Token.deployed();

    // Endow the Team address with its required share of tokens.
    await token.transfer(
      POOL,
      POOL_ENDOWMENT,
    );
    await assertTokenBalance(token, POOL, 'Pool', POOL_ENDOWMENT);

    // Ensure the Custodian address owns the right remaining amount of tokens
    await token.transfer(
      CUSTODIAN,
      CUSTODIAN_ENDOWMENT,
    );
    await assertTokenBalance(token, CUSTODIAN, 'Custodian', CUSTODIAN_ENDOWMENT);

    // Ensure owner has no balance anymore
    await assertTokenBalance(token, owner, 'Owner', 0);
  });
};
