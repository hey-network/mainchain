const expectEvent = require('./helpers/expectEvent');
const shouldFail = require('./helpers/shouldFail');
const { shouldBeAround } = require('./helpers/shouldBeAround');
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
    let trustee;

    beforeEach(async function () {
      now = await time.latest();
      token = await Token.new({ from: owner });
      trustee = await VestingTrustee.new(token.address, { from: owner });
    });

    let getGrant = async function (address) {
      let grant = await trustee.grants(address);

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
      it('should be ownable', async function () {
        (await trustee.owner()).should.be.equal(owner);
      });

      it('should sets the token address to the ERC20 contract address', async function () {
        (await trustee.token()).should.be.equal(token.address);
      });

      it('should start with a zero total vesting initially', async function () {
        (await trustee.totalVesting()).should.be.bignumber.equal(0);
      });

      it('should start with a zero token balance initially', async function () {
        (await token.balanceOf(await trustee.address)).should.be.bignumber.equal(0);
      });

      let balance = 1000;
      context(`with ${balance} tokens provisioned to the contract`, async function () {
          beforeEach(async function () {
            await token.transfer(trustee.address, balance, { from: owner });
          });

          it(`should have a token balance equal to ${balance}`, async function () {
            (await token.balanceOf(await trustee.address)).should.be.bignumber.equal(balance);
          });

          it('should be provisionable with additional tokens', async function () {
            let value = 10;
            await token.transfer(trustee.address, value, { from: owner });
            (await token.balanceOf(await trustee.address)).should.be.bignumber.equal(balance + value);
          });
      });
    });

    let balance = 10 ** 12;
    let value = 1000;
    context(`with a provisioned token balance of ${balance}`, async function () {
      beforeEach(async function () {
        await token.transfer(trustee.address, balance, { from: owner });
      });

      describe('createGrant()', async function () {
        it('should not allow granting to the zero address', async function () {
          await shouldFail.reverting(trustee.createGrant(ZERO_ADDRESS, value, now, now, now + 10 * YEAR, false, { from: owner }));
        });

        it('should not allow granting 0 tokens', async function () {
          await shouldFail.reverting(trustee.createGrant(grantee, 0, now, now, now + 10 * YEAR, false, { from: owner }));
        });

        it('should not allow granting with a cliff before the start', async function () {
          await shouldFail.reverting(trustee.createGrant(grantee, value, now, now - 1, now + 10 * YEAR, false, { from: owner }));
        });

        it('should allow granting with a cliff equal to the start', async function () {
          await trustee.createGrant(grantee, value, now, now, now + MONTH, false, { from: owner });
        });

        it('should allow granting with a cliff equal to the end', async function () {
          await trustee.createGrant(grantee, value, now, now + MONTH, now + MONTH, false, { from: owner });
        });

        it('should not allow granting with a cliff after the end', async function () {
          await shouldFail.reverting(trustee.createGrant(grantee, value, now, now + YEAR, now + MONTH, false, { from: owner }));
        });

        it('should not allow granting with a start after the end', async function () {
          await shouldFail.reverting(trustee.createGrant(grantee, value, now + MONTH, now + YEAR, now, false, { from: owner }));
        });

        it('should not allow granting tokens more than once to the same address', async function () {
          await trustee.createGrant(grantee, value, now, now, now + 10 * YEAR, false, { from: owner });
          await shouldFail.reverting(trustee.createGrant(grantee, value, now, now, now + 10 * YEAR, false, { from: owner }));
        });

        it('should not allow granting from a non-owner', async function () {
          await shouldFail.reverting(trustee.createGrant(grantee, value, now, now, now + 10 * YEAR, false, { from: anyone }));
        });

        it('should not allow granting more than the contract token balance in a single grant', async function () {
          await shouldFail.reverting(trustee.createGrant(grantee, balance + 1, now, now + MONTH, now + YEAR, false, { from: owner }));
        });

        it('should not allow granting more than the contract token balance in multiple grants', async function () {
          await trustee.createGrant(grantee, balance - 10, now, now + MONTH, now + YEAR, false, { from: owner });
          await trustee.createGrant(grantee2, 7, now, now + MONTH, now + YEAR, false, { from: owner });
          await trustee.createGrant(grantee3, 3, now, now + 5 * MONTH, now + YEAR, false, { from: owner });

          await shouldFail.reverting(trustee.createGrant(grantee4, 1, now, now, now + YEAR, false, { from: owner }));
        });

        it('should record a grant and increase grants count and total vesting', async function () {
          let totalVesting = (await trustee.totalVesting());
          totalVesting.should.be.bignumber.equal(0);

          let value = 1000;
          let start = now;
          let cliff = now + MONTH;
          let end = now + YEAR;
          await trustee.createGrant(grantee, value, start, cliff, end, false, { from: owner });

          (await trustee.totalVesting()).should.be.bignumber.equal(totalVesting + value);
          (await trustee.claimableTokens(grantee, now)).should.be.bignumber.equal(0);
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
          await trustee.createGrant(grantee2, value2, start2, cliff2, end2, false, { from: owner });

          (await trustee.totalVesting()).should.be.bignumber.equal(totalVesting.toNumber() + value + value2);
          (await trustee.claimableTokens(grantee2, now)).should.be.bignumber.equal(0);
          let grant2 = await getGrant(grantee2);
          grant2.value.should.be.equal(value2);
          grant2.start.should.be.equal(start2);
          grant2.cliff.should.be.equal(cliff2);
          grant2.end.should.be.equal(end2);
          grant2.transferred.should.be.equal(0);
          grant2.revokable.should.be.equal(false);
        });
      });

      describe('claimableTokens()', async function () {
        it('should return 0 for non existing grant', async function () {
          let grant = await getGrant(anyone);

          grant.value.should.be.equal(0);
          grant.start.should.be.equal(0);
          grant.cliff.should.be.equal(0);
          grant.end.should.be.equal(0);

          (await trustee.claimableTokens(anyone, now + 100 * YEAR)).should.be.bignumber.equal(0);
        });

        [
          {
            tokens: 1000, startOffset: 0, cliffOffset: MONTH, endOffset: YEAR, results: [
            { offset: 0, claimable: 0 },
            { offset: MONTH - 1, claimable: 0 },
            { offset: MONTH, claimable: Math.floor(1000 / 12) },
            { offset: 2 * MONTH, claimable: 2 * Math.floor(1000 / 12) },
            { offset: 0.5 * YEAR, claimable: 1000 / 2 },
            { offset: YEAR, claimable: 1000 },
            { offset: YEAR + DAY, claimable: 1000 }
            ]
          },
          {
            tokens: 10000, startOffset: 0, cliffOffset: 0, endOffset: 4 * YEAR, results: [
            { offset: 0, claimable: 0 },
            { offset: MONTH, claimable: Math.floor(10000 / 12 / 4) },
            { offset: 0.5 * YEAR, claimable: 10000 / 8 },
            { offset: YEAR, claimable: 10000 / 4 },
            { offset: 2 * YEAR, claimable: 10000 / 2 },
            { offset: 3 * YEAR, claimable: 10000 * 0.75 },
            { offset: 4 * YEAR, claimable: 10000 },
            { offset: 4 * YEAR + MONTH, claimable: 10000 }
            ]
          },
          {
            tokens: 10000, startOffset: 0, cliffOffset: YEAR, endOffset: 4 * YEAR, results: [
            { offset: 0, claimable: 0 },
            { offset: MONTH, claimable: 0 },
            { offset: 0.5 * YEAR, claimable: 0 },
            { offset: YEAR, claimable: 10000 / 4 },
            { offset: 2 * YEAR, claimable: 10000 / 2 },
            { offset: 3 * YEAR, claimable: 10000 * 0.75 },
            { offset: 4 * YEAR, claimable: 10000 },
            { offset: 4 * YEAR + MONTH, claimable: 10000 }
            ]
          },
          {
            tokens: 100000000, startOffset: 0, cliffOffset: 0, endOffset: 2 * YEAR, results: [
            { offset: 0, claimable: 0 },
            { offset: MONTH, claimable: Math.floor(100000000 / 12 / 2) },
            { offset: 0.5 * YEAR, claimable: 100000000 / 4 },
            { offset: YEAR, claimable: 100000000 / 2 },
            { offset: 2 * YEAR, claimable: 100000000 },
            { offset: 3 * YEAR, claimable: 100000000 }
            ]
          },
        ].forEach(function (grant) {
            context(`grant: ${grant.tokens}, startOffset: ${grant.startOffset}, cliffOffset: ${grant.cliffOffset}, ` +
              `endOffset: ${grant.endOffset}`, async function () {

              beforeEach(async function () {
                await trustee.createGrant(grantee, grant.tokens, now + grant.startOffset, now + grant.cliffOffset,
                  now + grant.endOffset, false, { from: owner });
              });

              grant.results.forEach(async function (res) {
                it(`should allow to claim ${res.claimable} out of ${grant.tokens} at time offset ${res.offset}`, async function () {
                  (await trustee.claimableTokens(grantee, now + res.offset)).should.be.bignumber.equal(res.claimable);
                });
              });
            });
          });
      });

      describe('claimTokens()', async function () {
        // We'd allow (up to) 10 tokens vesting error, due to possible timing differences during the tests.
        const MAX_ERROR = 10;

        it('should not allow claiming a non-existing grant', async function () {
          let grant = await getGrant(anyone);

          grant.value.should.be.equal(0);
          grant.start.should.be.equal(0);
          grant.cliff.should.be.equal(0);
          grant.end.should.be.equal(0);

          await shouldFail.reverting(trustee.claimTokens({ from: anyone }));
        });

        it('should not allow claiming a revoked grant', async function () {
          await trustee.createGrant(grantee, balance, now, now + MONTH, now + YEAR, true, { from: owner });
          await trustee.revokeGrant(grantee, { from: owner });

          await shouldFail.reverting(trustee.claimTokens({ from: grantee }));
        });

        [
          {
            tokens: 1000, startOffset: 0, cliffOffset: MONTH, endOffset: YEAR, results: [
            { diff: 0, unlocked: 0 },
            // 1 day before the cliff.
            { diff: MONTH - DAY, unlocked: 0 },
            // At the cliff.
            { diff: DAY, unlocked: 83 },
            // 1 second after the cliff and previous unlock/withdraw.
            { diff: 1, unlocked: 0 },
            // 1 month after the cliff.
            { diff: MONTH - 1, unlocked: 83 },
            // At half of the vesting period.
            { diff: 4 * MONTH, unlocked: 1000 / 2 - 2 * 83 },
            // At the end of the vesting period.
            { diff: 6 * MONTH, unlocked: 1000 / 2 },
            // After the vesting period, with everything already unlocked and withdrawn.
            { diff: DAY, unlocked: 0 }
            ]
          },
          {
            tokens: 1000, startOffset: 0, cliffOffset: MONTH, endOffset: YEAR, results: [
            { diff: 0, unlocked: 0 },
            // 1 day after the vesting period.
            { diff: YEAR + DAY, unlocked: 1000 },
            // 1 year after the vesting period.
            { diff: YEAR - DAY, unlocked: 0 }
            ]
          },
          {
            tokens: 1000000, startOffset: 0, cliffOffset: 0, endOffset: 4 * YEAR, results: [
            { diff: 0, unlocked: 0 },
            { diff: YEAR, unlocked: 1000000 / 4 },
            { diff: YEAR, unlocked: 1000000 / 4 },
            { diff: YEAR, unlocked: 1000000 / 4 },
            { diff: YEAR, unlocked: 1000000 / 4 },
            { diff: YEAR, unlocked: 0 }
            ]
          }
        ].forEach(async function (grant) {
            context(`grant: ${grant.tokens}, startOffset: ${grant.startOffset}, cliffOffset: ${grant.cliffOffset}, ` +
              `endOffset: ${grant.endOffset}`, async function () {

              beforeEach(async function () {
                await trustee.createGrant(grantee, grant.tokens, now + grant.startOffset, now + grant.cliffOffset, now +
                  grant.endOffset, false, { from: owner });
              });

            it('should unlock tokens according to the schedule', async function () {
              for (let res of grant.results) {
                console.log(`\texpecting ${res.unlocked} tokens unlocked and transferred after another ` +
                  `${res.diff} seconds`);

                // Get previous state.
                let totalVesting = (await trustee.totalVesting());
                let trusteeBalance = (await token.balanceOf(trustee.address));
                let userBalance = (await token.balanceOf(grantee));
                let transferred = (await getGrant(grantee)).transferred;

                // Jump forward in time by the requested diff.
                await time.increase(res.diff);

                // Should revert if nothing can be unlocked yet, to avoid having
                // grantee wasting transaction fees.
                if (res.unlocked === 0) {
                  await shouldFail.reverting(trustee.claimTokens({from: grantee}));
                } else {
                  await trustee.claimTokens({from: grantee});
                }

                // Verify new state.
                let totalVesting2 = (await trustee.totalVesting());
                let trusteeBalance2 = (await token.balanceOf(trustee.address));
                let userBalance2 = (await token.balanceOf(grantee));
                let transferred2 = (await getGrant(grantee)).transferred;

                shouldBeAround(totalVesting2, totalVesting.toNumber() - res.unlocked, MAX_ERROR);
                shouldBeAround(trusteeBalance2, trusteeBalance.toNumber() - res.unlocked, MAX_ERROR);
                shouldBeAround(userBalance2, userBalance.toNumber() + res.unlocked, MAX_ERROR);
                shouldBeAround(transferred2, transferred + res.unlocked, MAX_ERROR);
              }
            });
          });
        });
      });

      describe('revokeGrant()', async function () {
        it('should throw an error when revoking a non-existing grant', async function () {
          await shouldFail.reverting(trustee.revokeGrant(anyone, { from: owner }));
        });

        it('should not be able to revoke a non-revokable grant', async function () {
          await trustee.createGrant(grantee, balance, now, now + MONTH, now + YEAR, false, { from: owner });

          await shouldFail.reverting(trustee.revokeGrant(grantee, { from: owner }));
        });

        it('should only allow revoking a grant by an owner', async function () {
          await trustee.createGrant(grantee, balance, now, now + MONTH, now + YEAR, true, { from: owner });
          await shouldFail.reverting(trustee.revokeGrant(grantee, { from: anyone }));
          await trustee.revokeGrant(grantee, {from: owner });
        });

        [
          {
            tokens: 1000, startOffset: 0, cliffOffset: MONTH, endOffset: YEAR, results: [
            { diff: 0, claimed: 0 },
            // 1 day before the cliff.
            { diff: MONTH - DAY, claimed: 0 },
            // At the cliff.
            { diff: DAY, claimed: 83 },
            // 1 second after che cliff and previous unlock/withdraw.
            { diff: 1, claimed: 0 },
            // 1 month after the cliff.
            { diff: MONTH - 1, claimed: 83 },
            // At half of the vesting period.
            { diff: 4 * MONTH, claimed: 1000 / 2 - 2 * 83 },
            // At the end of the vesting period.
            { diff: 6 * MONTH, claimed: 1000 / 2 },
            // After the vesting period, with everything already claimed and withdrawn.
            { diff: DAY, claimed: 0 }
            ]
          },
          {
            tokens: 1000, startOffset: 0, cliffOffset: MONTH, endOffset: YEAR, results: [
            { diff: 0, claimed: 0 },
            // 1 day after the vesting period.
            { diff: YEAR + DAY, claimed: 1000 },
            // 1 year after the vesting period.
            { diff: YEAR - DAY, claimed: 0 }
            ]
          },
          {
            tokens: 1000000, startOffset: 0, cliffOffset: 0, endOffset: 4 * YEAR, results: [
            { diff: 0, claimed: 0 },
            { diff: YEAR, claimed: 1000000 / 4 },
            { diff: YEAR, claimed: 1000000 / 4 },
            { diff: YEAR, claimed: 1000000 / 4 },
            { diff: YEAR, claimed: 1000000 / 4 },
            { diff: YEAR, claimed: 0 }
            ]
          }
        ].forEach(async function (grant) {
          context(`grant: ${grant.tokens}, startOffset: ${grant.startOffset}, cliffOffset: ${grant.cliffOffset}, ` +
            `endOffset: ${grant.endOffset}`, async function () {
            // We'd allow (up to) 10 tokens vesting error, due to possible timing differences during the tests.
            const MAX_ERROR = 10;

            for (let i = 0; i < grant.results.length; ++i) {
              it(`should revoke the grant and refund tokens after ${i + 1} withdrawals`, async function () {
                trustee = await VestingTrustee.new(token.address, {from: owner});
                await token.transfer(trustee.address, grant.tokens, {from: owner});
                await trustee.createGrant(grantee, grant.tokens, now + grant.startOffset, now + grant.cliffOffset,
                  now + grant.endOffset, true, { from: owner });

                // Get previous state.
                let totalVesting = (await trustee.totalVesting());
                let trusteeBalance = (await token.balanceOf(trustee.address));
                let userBalance = (await token.balanceOf(grantee));
                let transferred = (await getGrant(grantee)).transferred;
                let ownerBalance = (await token.balanceOf(owner));

                let totalClaimed = 0;

                for (let j = 0; j <= i; ++j) {
                  let res = grant.results[j];

                  // Jump forward in time by the requested diff.
                  await time.increase(res.diff);

                  if (res.claimed !== 0) { await trustee.claimTokens({from: grantee}); }

                  totalClaimed += res.claimed;
                }

                // Verify the state after the multiple unlocks.
                let totalVesting2 = (await trustee.totalVesting());
                let trusteeBalance2 = (await token.balanceOf(trustee.address));
                let userBalance2 = (await token.balanceOf(grantee));
                let transferred2 = (await getGrant(grantee)).transferred;

                shouldBeAround(totalVesting2, totalVesting - totalClaimed, MAX_ERROR);
                shouldBeAround(trusteeBalance2, trusteeBalance - totalClaimed, MAX_ERROR);
                shouldBeAround(userBalance2, userBalance + totalClaimed, MAX_ERROR);
                shouldBeAround(transferred2, transferred + totalClaimed, MAX_ERROR);

                let remainingTokens = grant.tokens - totalClaimed;

                console.log(`\texpecting ${remainingTokens} tokens refunded to owner when revoking a grant after ${i + 1} previous withdrawals`);

                let vestingGrant = await getGrant(grantee);
                vestingGrant.value.should.be.equal(grant.tokens);

                await trustee.revokeGrant(grantee, { from: owner });

                let totalVesting3 = (await trustee.totalVesting());
                let trusteeBalance3 = (await token.balanceOf(trustee.address));
                let userBalance3 = (await token.balanceOf(grantee));
                let ownerBalance2 = (await token.balanceOf(owner));

                shouldBeAround(totalVesting3, totalVesting2 - remainingTokens, MAX_ERROR);
                shouldBeAround(trusteeBalance3, trusteeBalance2 - remainingTokens, MAX_ERROR);
                userBalance3.should.be.bignumber.equal(userBalance2);
                shouldBeAround(ownerBalance2.toNumber(), ownerBalance.toNumber() + remainingTokens, MAX_ERROR);
              });
              }
            });
        });
      });
    });
  });
});
