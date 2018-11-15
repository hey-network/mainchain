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
        value: grant[0],
        start: grant[1],
        cliff: grant[2],
        end: grant[3],
        transferred: grant[4],
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

    context('with provisioned token balance', async function () {
      beforeEach(async function () {
        await token.transfer(vestingTrustee.address, 10000, { from: owner });
      });

      describe('create grant', async function () {
        // it('should not allow granting to 0', async () => {
        //   await shouldFail.reverting(trustee.grant(ZERO_ADDRESS, 1000, now(), now(), now() + 10 * YEAR, false));
        // });
        //
        // it('should not allow granting 0 tokens', async () => {
        //     await expectThrow(trustee.grant(accounts[0], 0, now, now, now + 3 * YEAR, false));
        // });
        //
        // it('should not allow granting with a cliff before the start', async () => {
        //     await expectThrow(trustee.grant(accounts[0], 0, now, now - 1, now + 10 * YEAR, false));
        // });
        //
        // it('should not allow granting with a cliff after the vesting', async () => {
        //     await expectThrow(trustee.grant(accounts[0], 0, now, now + YEAR, now + MONTH, false));
        // });
        //
        // it('should not allow granting tokens more than once', async () => {
        //     await trustee.grant(accounts[1], 1000, now, now, now + 10 * YEAR, false);
        //
        //     await expectThrow(trustee.grant(accounts[1], 1000, now, now, now + 10 * YEAR, false));
        // });
        //
        // it('should not allow granting from not an owner', async () => {
        //     await expectThrow(trustee.grant(accounts[0], 1000, now, now + MONTH, now + YEAR, false,
        //         {from: accounts[1]}));
        // });
        //
        // it('should not allow granting more than the balance in a single grant', async () => {
        //     await expectThrow(trustee.grant(accounts[0], balance + 1, now, now + MONTH, now + YEAR, false));
        // });
        //
        // it('should not allow granting more than the balance in multiple grants', async () => {
        //     await trustee.grant(accounts[0], balance - 10, now, now + MONTH, now + YEAR, false);
        //     await trustee.grant(accounts[1], 7, now, now + MONTH, now + YEAR, false);
        //     await trustee.grant(accounts[2], 3, now, now + 5 * MONTH, now + YEAR, false);
        //
        //     await expectThrow(trustee.grant(accounts[3], 1, now, now, now + YEAR, false));
        // });
        //
        // it('should record a grant and increase grants count and total vesting', async () => {
        //     let totalVesting = (await trustee.totalVesting()).toNumber();
        //     assert.equal(totalVesting, 0);
        //
        //     let value = 1000;
        //     let start = now;
        //     let cliff = now + MONTH;
        //     let end = now + YEAR;
        //     await trustee.grant(accounts[0], value, start, cliff, end, false);
        //
        //     assert.equal((await trustee.totalVesting()).toNumber(), totalVesting + value);
        //     let grant = await getGrant(accounts[0]);
        //     assert.equal(grant.value, value);
        //     assert.equal(grant.start, start);
        //     assert.equal(grant.cliff, cliff);
        //     assert.equal(grant.end, end);
        //     assert.equal(grant.transferred, 0);
        //     assert.equal(grant.revokable, false);
        //
        //     let value2 = 2300;
        //     let start2 = now + 2 * MONTH;
        //     let cliff2 = now + 6 * MONTH;
        //     let end2 = now + YEAR;
        //     await trustee.grant(accounts[1], value2, start2, cliff2, end2, false);
        //
        //     assert.equal((await trustee.totalVesting()).toNumber(), totalVesting + value + value2);
        //     let grant2 = await getGrant(accounts[1]);
        //     assert.equal(grant2.value, value2);
        //     assert.equal(grant2.start, start2);
        //     assert.equal(grant2.cliff, cliff2);
        //     assert.equal(grant2.end, end2);
        //     assert.equal(grant2.transferred, 0);
        //     assert.equal(grant2.revokable, false);
        // });
      });

      describe('create grant', async function () {
        it('should create a new grant', async function () {
          const value = 1000;
          const startTime = now + WEEK;
          const cliffTime = startTime + 50 * DAY;
          const endTime = cliffTime + 100 * DAY;
          const revokable = false;

          await vestingTrustee.createGrant(
            grantee, value, startTime, cliffTime, endTime, revokable
          , { from: owner });
          (await getGrant(grantee)).value.should.be.bignumber.equal(value);
          (await vestingTrustee.claimableTokens(grantee, now)).should.be.bignumber.equal(0);
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
