/** @title Vesting Trustee deployment
 *  @author Thomas Vanderstraeten - <thomas@get-hey.com>
 *  @dev Vesting Trustee deployment script. Note that all variables will
 *  be settled with their actual production values at the time of deployment.
 */

const asyncForEach = require("./helpers/asyncForEach");
const assertTokenBalance = require("./helpers/assertTokenBalance");

const Token = artifacts.require("./Token.sol");
const VestingTrustee = artifacts.require("./VestingTrustee.sol");

const { GRANTS, TOTAL_VESTING } = require("./distribution/grants");

// Deployment script
module.exports = function(deployer) {
  deployer.then(async () => {
    // Fetch this from previous migration.
    const token = await Token.deployed();

    // Deploy the Vesting Trustee contract.
    await deployer.deploy(VestingTrustee,
      token.address,
    );
    const vestingTrustee = await VestingTrustee.deployed();

    // Endow the contract with enough tokens to match the vested amounts.
    await token.transfer(
      vestingTrustee.address,
      TOTAL_VESTING,
    );
    await assertTokenBalance(token, vestingTrustee.address, 'Vesting Trustee', TOTAL_VESTING);

    // Create each grant individually
    await asyncForEach(GRANTS, async (grant) => {
      await vestingTrustee.createGrant(...Object.values(grant));
    });
  });
};
