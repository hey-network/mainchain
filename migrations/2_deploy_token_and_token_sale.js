/** @title Hey Token and Token Sale deployment
 *  @author Thomas Vanderstraeten - <thomas@get-hey.com>
 *  @dev Token and Token Sale deployment script. Note that all variables will
 *  be settled with their actual production values at the time of deployment.
 */

const asyncForEach = require("./helpers/asyncForEach");
const assertTokenBalance = require("./helpers/assertTokenBalance");
const ONE_TOKEN = require("./helpers/oneToken");

const Token = artifacts.require("./Token.sol");
const TokenSale = artifacts.require("./TokenSale.sol");

// Timing parameters
const OPENING_TIME = Date.now();
const DURATION = 7 * 24 * 3600;
const CLOSING_TIME = OPENING_TIME + DURATION;
// Rate parameters
const FIRST_DAY_RATE = 4400;
const RATE = 4000;
// Distribution and addresses parameters
const {
  POOL,
  CONTRIBUTORS,
  INVESTORS,
  ADVISORS,
  WALLET,
} = require("./distribution/addresses");
const {
  TOKEN_SALE_ENDOWMENT,
  POOL_ENDOWMENT,
  CONTRIBUTORS_ENDOWMENT,
  INVESTORS_ENDOWMENT,
  ADVISORS_ENDOWMENT,
} = require("./distribution/endowments");
const PRESALE_CONTRIBUTIONS = require("./distribution/presaleContributions");

// Deployment script
module.exports = function(deployer) {
  deployer.then(async () => {
    // Deploy the Token contract; the whole total supply gets minted to the
    // deployer address (who becomes the owner of the Token contract).
    await deployer.deploy(Token);
    const token = await Token.deployed();

    // Deploy the Token Sale contract.
    await deployer.deploy(TokenSale,
      OPENING_TIME,
      CLOSING_TIME,
      FIRST_DAY_RATE,
      RATE,
      WALLET,
      POOL,
      token.address,
    );
    const tokenSale = await TokenSale.deployed();

    // Endow the Token Sale contract with the tokens that it will distribute.
    await token.transfer(
      tokenSale.address,
      TOKEN_SALE_ENDOWMENT,
    );
    await assertTokenBalance(token, tokenSale.address, 'Token Sale', TOKEN_SALE_ENDOWMENT);

    // Endow the Pool address with its required share of tokens.
    await token.transfer(
      POOL,
      POOL_ENDOWMENT,
    );
    await assertTokenBalance(token, POOL, 'Pool', POOL_ENDOWMENT);

    // Endow the Contributors address with its required share of tokens.
    await token.transfer(
      CONTRIBUTORS,
      CONTRIBUTORS_ENDOWMENT,
    );
    await assertTokenBalance(token, CONTRIBUTORS, 'Contributors', CONTRIBUTORS_ENDOWMENT);

    // Endow the Investors address with its required share of tokens.
    await token.transfer(
      INVESTORS,
      INVESTORS_ENDOWMENT,
    );
    await assertTokenBalance(token, INVESTORS, 'Investors', INVESTORS_ENDOWMENT);

    // Endow the Advisors address with its required share of tokens.
    await token.transfer(
      ADVISORS,
      ADVISORS_ENDOWMENT,
    );
    await assertTokenBalance(token, ADVISORS, 'Advisors', ADVISORS_ENDOWMENT);

    // Distribute tokens to presale contributors and other addresses that have
    // a claim on tokens that they can receive directly.
    await asyncForEach(PRESALE_CONTRIBUTIONS, async (contribution) => {
      await token.transfer(
        contribution.address,
        contribution.amount,
      );
      await assertTokenBalance(token, contribution.address, 'Presale', contribution.amount);
    });
  });
};
