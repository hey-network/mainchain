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

contract('VestingTrustee', function ([_, owner, grantee, grantee2, grantee3, grantee4, anyone]) {
  // before(async function () {
  //   // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
  //   await advanceBlock();
  // });
  const SECOND = 1;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * 60;
  const WEEK = 7 * DAY;
  const MONTH = 30 * DAY;
  const YEAR = 12 * MONTH;

  describe('deployment', async function () {
    it('requires a non-null token', async function () {
      await shouldFail.reverting(VestingTrustee.new(ZERO_ADDRESS, { from: owner }));
    });
  });

  context('with token', async function () {
    let now;
    let token;
    let vestingTrustee;

    beforeEach(async function () {
      now = await time.latest();
      token = await Token.new({ from: owner });
      vestingTrustee = await VestingTrustee.new(token.address, { from: owner });
    });

    let getGrant = async (address) => {
      let grant = await vestingTrustee.grants(address);

      return {
        value: grant[0].toNumber(),
        start: grant[1].toNumber(),
        cliff: grant[2].toNumber(),
        end: grant[3].toNumber(),
        transferred: grant[4].toNumber(),
        revokable: grant[5]
      };
    }

    describe('deployment and provisioning', async function () {
      it('should be ownable', async () => {
        (await vestingTrustee.owner()).should.be.equal(owner);
      });

      it('should sets the token address to the ERC20 contract address', async function () {
        (await vestingTrustee.token()).should.be.equal(token.address);
      });

      it('should start with a zero total vesting initially', async function () {
        (await vestingTrustee.totalVesting()).should.be.bignumber.equal(0);
      });

      it('should start with a zero token balance initially', async function () {
        (await token.balanceOf(await vestingTrustee.address)).should.be.bignumber.equal(0);
      });

      let balance = 1000;
      context(`with ${balance} tokens provisioned to the contract`, async () => {
          beforeEach(async () => {
            await token.transfer(vestingTrustee.address, balance, { from: owner });
          });

          it(`should have a token balance equal to ${balance}`, async () => {
            (await token.balanceOf(await vestingTrustee.address)).should.be.bignumber.equal(balance);
          });

          it('should be provisionable with additional tokens', async () => {
            let value = 10;
            await token.transfer(vestingTrustee.address, value, { from: owner });
            (await token.balanceOf(await vestingTrustee.address)).should.be.bignumber.equal(balance + value);
          });
      });
    });

    let balance = 10000;
    let value = 1000;
    context(`with a provisioned token balance of ${balance}`, async function () {
      beforeEach(async function () {
        await token.transfer(vestingTrustee.address, balance, { from: owner });
      });

      describe('create grant', async function () {
        it('should not allow granting to the zero address', async function () {
          await shouldFail.reverting(vestingTrustee.createGrant(ZERO_ADDRESS, value, now, now, now + 10 * YEAR, false, { from: owner }));
        });

        it('should not allow granting 0 tokens', async function () {
          await shouldFail.reverting(vestingTrustee.createGrant(grantee, 0, now, now, now + 10 * YEAR, false, { from: owner }));
        });

        it('should not allow granting with a cliff before the start', async function () {
          await shouldFail.reverting(vestingTrustee.createGrant(grantee, value, now, now - 1, now + 10 * YEAR, false, { from: owner }));
        });

        it('should allow granting with a cliff equal to the start', async function () {
          await vestingTrustee.createGrant(grantee, value, now, now, now + MONTH, false, { from: owner });
        });

        it('should allow granting with a cliff equal to the end', async function () {
          await vestingTrustee.createGrant(grantee, value, now, now + MONTH, now + MONTH, false, { from: owner });
        });

        it('should not allow granting with a cliff after the end', async function () {
          await shouldFail.reverting(vestingTrustee.createGrant(grantee, value, now, now + YEAR, now + MONTH, false, { from: owner }));
        });

        it('should not allow granting with a start after the end', async function () {
          await shouldFail.reverting(vestingTrustee.createGrant(grantee, value, now + MONTH, now + YEAR, now, false, { from: owner }));
        });

        it('should not allow granting tokens more than once to the same address', async function () {
          await vestingTrustee.createGrant(grantee, value, now, now, now + 10 * YEAR, false, { from: owner });
          await shouldFail.reverting(vestingTrustee.createGrant(grantee, value, now, now, now + 10 * YEAR, false, { from: owner }));
        });

        it('should not allow granting from a non-owner', async function () {
          await shouldFail.reverting(vestingTrustee.createGrant(grantee, value, now, now, now + 10 * YEAR, false, { from: anyone }));
        });

        it('should not allow granting more than the contract token balance in a single grant', async function () {
          await shouldFail.reverting(vestingTrustee.createGrant(grantee, balance + 1, now, now + MONTH, now + YEAR, false, { from: owner }));
        });

        it('should not allow granting more than the contract token balance in multiple grants', async function () {
          await vestingTrustee.createGrant(grantee, balance - 10, now, now + MONTH, now + YEAR, false, { from: owner });
          await vestingTrustee.createGrant(grantee2, 7, now, now + MONTH, now + YEAR, false, { from: owner });
          await vestingTrustee.createGrant(grantee3, 3, now, now + 5 * MONTH, now + YEAR, false, { from: owner });

          await shouldFail.reverting(vestingTrustee.createGrant(grantee4, 1, now, now, now + YEAR, false, { from: owner }));
        });

        it('should record a grant and increase grants count and total vesting', async function () {
          let totalVesting = (await vestingTrustee.totalVesting()).toNumber();
          totalVesting.should.be.bignumber.equal(0);

          let value = 1000;
          let start = now;
          let cliff = now + MONTH;
          let end = now + YEAR;
          await vestingTrustee.createGrant(grantee, value, start, cliff, end, false, { from: owner });

          (await vestingTrustee.totalVesting()).should.be.bignumber.equal(totalVesting + value);
          (await vestingTrustee.claimableTokens(grantee, now)).should.be.bignumber.equal(0);
          let grant = await getGrant(grantee);
          grant.value.should.be.equal(value);
          grant.start.should.be.equal(start);
          grant.cliff.should.be.equal(cliff);
          grant.end.should.be.equal(end);
          grant.transferred.should.be.equal(0);
          grant.revokable.should.be.equal(false);

          let value2 = 2300;
          let start2 = now + 2 * MONTH;
          let cliff2 = now + 6 * MONTH;
          let end2 = now + YEAR;
          await vestingTrustee.createGrant(grantee2, value2, start2, cliff2, end2, false, { from: owner });

          (await vestingTrustee.totalVesting()).should.be.bignumber.equal(totalVesting + value + value2);
          (await vestingTrustee.claimableTokens(grantee2, now)).should.be.bignumber.equal(0);
          let grant2 = await getGrant(grantee2);
          grant2.value.should.be.equal(value2);
          grant2.start.should.be.equal(start2);
          grant2.cliff.should.be.equal(cliff2);
          grant2.end.should.be.equal(end2);
          grant2.transferred.should.be.equal(0);
          grant2.revokable.should.be.equal(false);
        });
      });

      // Note: this test should be placed somewhere else, for now we keep it
      // as it contributes to 100% test coverage on the contract.
      describe('claimableTokens', async function () {
        it('should return 0 for an address that is not a grantee', async function () {
          (await vestingTrustee.claimableTokens(anyone, now)).should.be.bignumber.equal(0);
        });
      });

      context('with an existing revokable single grant', async function () {
        beforeEach(async function () {
          this.value = 1000;
          this.startTime = now + WEEK;
          this.cliffTime = this.startTime + 50 * DAY;
          this.endTime = this.cliffTime + 100 * DAY;
          const revokable = true;

          await vestingTrustee.createGrant(
            grantee, this.value, this.startTime, this.cliffTime, this.endTime, revokable
          , { from: owner });
        });

        it('allows the owner to revoke the grant', async function () {
          const pre = await token.balanceOf(owner);
          await vestingTrustee.revokeGrant(grantee, { from: owner });
          const post = await token.balanceOf(owner);
          (await getGrant(grantee)).value.should.be.bignumber.equal(0);
          post.minus(pre).should.be.bignumber.equal(this.value);
        });

        it('does not let the grantee claim tokens before the cliff', async function () {
          await shouldFail.reverting(vestingTrustee.claimTokens({ from: grantee }));
        });

        it('lets the grantee claim a portion of her vested tokens between the cliff and the end time', async function () {
          await time.increaseTo(this.cliffTime + SECOND);

          const pre = await token.balanceOf(grantee);
          await vestingTrustee.claimTokens({ from: grantee });
          const post = await token.balanceOf(grantee);

          post.minus(pre).should.be.bignumber.above(0);
          post.minus(pre).should.be.bignumber.below(this.value);
        });

        it('lets the grantee claim all her vested tokens after the end time', async function () {
          await time.increaseTo(this.endTime + SECOND);
          await vestingTrustee.claimTokens({ from: grantee });
          (await token.balanceOf(grantee)).should.be.bignumber.equal(this.value);
        });
      });
    });
  });
});
