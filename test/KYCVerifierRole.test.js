const { shouldBehaveLikePublicRole } = require('../node_modules/openzeppelin-solidity/test/behaviors/access/roles/PublicRole.behavior');
const KYCVerifierRoleMock = artifacts.require('KYCVerifierRoleMock');

contract('KYCVerifierRole', function ([_, pauser, otherKYCVerifier, ...otherAccounts]) {
  beforeEach(async function () {
    this.contract = await KYCVerifierRoleMock.new({ from: pauser });
    await this.contract.addKYCVerifier(otherKYCVerifier, { from: pauser });
  });

  shouldBehaveLikePublicRole(pauser, otherKYCVerifier, otherAccounts, 'KYCVerifier');
});
