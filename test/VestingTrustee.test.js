const expectEvent = require('./helpers/expectEvent');
const shouldFail = require('./helpers/shouldFail');
const { ether } = require('./helpers/ether');
const { ethGetBalance } = require('./helpers/web3');
const { advanceBlock } = require('./helpers/advanceToBlock');
const time = require('./helpers/time');
const { ZERO_ADDRESS } = require('./helpers/constants');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const VestingTrustee = artifacts.require('VestingTrustee');
const Token = artifacts.require('Token');

contract('VestingTrustee', function ([_, owner, grantee, anyone]) {
  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock();
  });

  it('requires a non-null token', async function () {
    await shouldFail.reverting(VestingTrustee.new(ZERO_ADDRESS, { from: owner }));
  });

  context('with token', async function () {
    beforeEach(async function () {
      this.token = await Token.new({ from: owner });
      this.vestingTrustee = await VestingTrustee.new(this.token.address, { from: owner });
    });

    context('with provisioned token balance', async function () {
      beforeEach(async function () {
        await this.token.transfer(this.vestingTrustee.address, 10000, { from: owner });
      });

      describe('create grant', async function () {
        it('should create a new grant', async function () {
          const value = 1000;
          const startTime = (await time.latest()) + time.duration.weeks(1);
          const cliffTime = startTime + time.duration.days(50);
          const endTime = cliffTime + time.duration.days(100);
          const revokable = false;

          await this.vestingTrustee.createGrant(
            grantee, value, startTime, cliffTime, endTime, revokable
          , { from: owner });
          (await this.vestingTrustee.grants(grantee))[0].should.be.bignumber.equal(value);
          (await this.vestingTrustee.claimableTokens(grantee, (await time.latest()))).should.be.bignumber.equal(0);
        });
      });

      // Note: this test should be placed somewhere else, for now we keep it
      // as it contributes to 100% test coverage on the contract.
      describe('claimableTokens', async function () {
        it('should return 0 for an address that is not a grantee', async function () {
          (await this.vestingTrustee.claimableTokens(anyone, (await time.latest()))).should.be.bignumber.equal(0);
        });
      });

      context('with an existing revokable single grant', async function () {
        beforeEach(async function () {
          this.value = 1000;
          this.startTime = (await time.latest()) + time.duration.weeks(1);
          this.cliffTime = this.startTime + time.duration.days(50);
          this.endTime = this.cliffTime + time.duration.days(100);
          const revokable = true;

          await this.vestingTrustee.createGrant(
            grantee, this.value, this.startTime, this.cliffTime, this.endTime, revokable
          , { from: owner });
        });

        it('allows the owner to revoke the grant', async function () {
          const pre = await this.token.balanceOf(owner);
          await this.vestingTrustee.revokeGrant(grantee, { from: owner });
          const post = await this.token.balanceOf(owner);
          (await this.vestingTrustee.grants(grantee))[0].should.be.bignumber.equal(0);
          post.minus(pre).should.be.bignumber.equal(this.value);
        });

        it('does not let the grantee claim tokens before the cliff', async function () {
          await shouldFail.reverting(this.vestingTrustee.unlockVestedTokens({ from: grantee }));
        });

        it('lets the grantee claim a portion of her vested tokens between the cliff and the end time', async function () {
          await time.increaseTo(this.cliffTime + time.duration.seconds(1));

          const pre = await this.token.balanceOf(grantee);
          await this.vestingTrustee.unlockVestedTokens({ from: grantee });
          const post = await this.token.balanceOf(grantee);

          post.minus(pre).should.be.bignumber.above(0);
          post.minus(pre).should.be.bignumber.below(this.value);
        });

        it('lets the grantee claim all her vested tokens after the end time', async function () {
          await time.increaseTo(this.endTime + time.duration.seconds(1));
          await this.vestingTrustee.unlockVestedTokens({ from: grantee });
          (await this.token.balanceOf(grantee)).should.be.bignumber.equal(this.value);
        });
      });
    });
  });
});
