const { assertRevert } = require('../helpers/assertRevert');
const {
  approver,
  getSignature
} = require('../helpers/signer');

const Gateway = artifacts.require('Gateway');
const Token = artifacts.require('Token');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('Gateway', function([_, owner, redeemer]) {
  beforeEach(async function() {
    this.token = await Token.new({ from: owner });
    this.tokenAddress = await this.token.address;

    this.gateway = await Gateway.new(this.tokenAddress, [approver], 50, 100);
    this.gatewayAddress = await this.gateway.address;

    await this.token.transfer(this.gatewayAddress, 100, { from: owner });

    this.nonce = 0;
  })

  describe('Validators management', function () {
    it('correctly add validators to the validators registry', async function () {
      (await this.gateway.checkValidator(approver)).should.be.true;
    });

    it('lets an existing validator add new validators (TODO)', async function () {
      // TODO: first implement validator modification signature helper
    });
  });

  describe('Mainchain tokens withdrawal', function () {
    it('allows a redeeming user to withdraw HEY tokens when submitting a valid signature', async function () {
      (await this.token.balanceOf(redeemer)).should.be.bignumber.equal(0);

      const amount = 1;
      const sig = getSignature({ redeemer, tokenAddress: this.tokenAddress, nonce: this.nonce, amount });

      await this.gateway.withdrawERC20(amount, sig, { from: redeemer });

      (await this.token.balanceOf(redeemer)).should.be.bignumber.equal(amount);
    });

    it('does not allow redeeming the same redemption multiple times', async function () {
      (await this.token.balanceOf(redeemer)).should.be.bignumber.equal(0);

      const amount = 1;
      const sig = getSignature({ redeemer, tokenAddress: this.tokenAddress, nonce: this.nonce, amount });

      await this.gateway.withdrawERC20(amount, sig, { from: redeemer });

      (await this.token.balanceOf(redeemer)).should.be.bignumber.equal(amount);
      await assertRevert(this.gateway.withdrawERC20(amount, sig, { from: redeemer }));
      (await this.token.balanceOf(redeemer)).should.be.bignumber.equal(amount);
    });

    it('does not allow redeeming with non-sequential nonces', async function () {
      (await this.token.balanceOf(redeemer)).should.be.bignumber.equal(0);

      const amount = 1;
      const anotherNonce = 2;
      const sig = getSignature({ redeemer, tokenAddress: this.tokenAddress, nonce: anotherNonce, amount });

      await assertRevert(this.gateway.withdrawERC20(amount, sig, { from: redeemer }));
      (await this.token.balanceOf(redeemer)).should.be.bignumber.equal(0);
    });
  });
});
