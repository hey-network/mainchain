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

const TokenSale = artifacts.require('TokenSale');
const Token = artifacts.require('Token');

contract('TokenSale', function ([_, owner, participant, wallet, pool, purchaser, anyone]) {
  const firstDayRate = new BigNumber(5500);
  const rate = new BigNumber(5000);
  const tokenSupply = new BigNumber('1e27'); // 9 + 18
  const value = ether(5);
  const expectedFirstDayTokenAmount = firstDayRate.mul(value);
  const expectedTokenAmount = rate.mul(value);

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock();
  });

  it('requires a non-null token', async function () {
    await shouldFail.reverting(TokenSale.new(
      this.openingTime, this.closingTime, 0, rate, wallet, pool, ZERO_ADDRESS, { from: owner }
    ));
  });

  context('with token', async function () {
    beforeEach(async function () {
      this.openingTime = (await time.latest()) + time.duration.weeks(1);
      this.closingTime = this.openingTime + time.duration.days(28);
      this.afterClosingTime = this.closingTime + time.duration.seconds(1);
      this.token = await Token.new({ from: owner });
    });

    it('requires a non-zero first day rate', async function () {
      await shouldFail.reverting(TokenSale.new(
        this.openingTime, this.closingTime, 0, rate, wallet, pool, this.token.address, { from: owner }
      ));
    });

    it('requires a non-zero rate', async function () {
      await shouldFail.reverting(TokenSale.new(
        this.openingTime, this.closingTime, firstDayRate, 0, wallet, pool, this.token.address, { from: owner }
      ));
    });

    it('requires a non-null wallet', async function () {
      await shouldFail.reverting(TokenSale.new(
        this.openingTime, this.closingTime, firstDayRate, rate, ZERO_ADDRESS, pool, this.token.address, { from: owner }
      ));
    });

    it('requires a non-null pool', async function () {
      await shouldFail.reverting(TokenSale.new(
        this.openingTime, this.closingTime, firstDayRate, rate, wallet, ZERO_ADDRESS, this.token.address, { from: owner }
      ));
    });

    it('reverts if the opening time is in the past', async function () {
      await shouldFail.reverting(TokenSale.new(
        (await time.latest()) - time.duration.days(1), this.closingTime, firstDayRate, rate, wallet, pool, this.token.address, { from: owner }
      ));
    });

    it('reverts if the closing time is before the opening time', async function () {
      await shouldFail.reverting(TokenSale.new(
        this.openingTime, this.openingTime - time.duration.seconds(1), firstDayRate, rate, wallet, pool, this.token.address, { from: owner }
      ));
    });

    it('reverts if the closing time equals the opening time', async function () {
      await shouldFail.reverting(TokenSale.new(
        this.openingTime, this.openingTime, firstDayRate, rate, wallet, pool, this.token.address, { from: owner }
      ));
    });

    context('once deployed', async function () {
      beforeEach(async function () {
        this.tokenSale = await TokenSale.new(
          this.openingTime, this.closingTime, firstDayRate, rate, wallet, pool, this.token.address, { from: owner }
        );
        await this.token.transfer(this.tokenSale.address, tokenSupply, { from: owner });
      });

      it('should be ended only after end', async function () {
        (await this.tokenSale.hasClosed()).should.equal(false);
        await time.increaseTo(this.afterClosingTime);
        (await this.tokenSale.isOpen()).should.equal(false);
        (await this.tokenSale.hasClosed()).should.equal(true);
      });

      describe('pausable', function () {
        it('can be paused by the owner', async function () {
          await this.tokenSale.pause({ from: owner });
          (await this.tokenSale.paused()).should.equal(true);
        });

        it('cannot be paused if sender is not the owner', async function () {
          await shouldFail.reverting(this.tokenSale.pause({ from: anyone }));
        });

        it.only('should reject payments when paused', async function () {
          await time.increaseTo(this.openingTime);
          await this.tokenSale.pause({ from: owner });
          await shouldFail.reverting(this.tokenSale.send(value));
          await shouldFail.reverting(this.tokenSale.buyTokens(participant, { value: value, from: purchaser }));
        });
      });

      describe('evolving rate', function () {
        context('within 24 hours after the opening time before and closing time', async function () {
          beforeEach(async function () {
            await time.increaseTo(this.openingTime);
          });

          describe('rate', function () {
            it(`is set at ${firstDayRate} tokens per ETH`, async function () {
              (await this.tokenSale.getCurrentRate()).should.be.bignumber.equal(firstDayRate);
            });
          });
        });

        context('after 24 hours after the opening time before and closing time', async function () {
          beforeEach(async function () {
            await time.increaseTo(this.openingTime + time.duration.hours(24));
          });

          describe('rate', function () {
            it(`is set at ${rate} tokens per ETH`, async function () {
              (await this.tokenSale.getCurrentRate()).should.be.bignumber.equal(firstDayRate);
            });
          });
        });
      });

      describe('accepting payments', function () {
        it('should reject payments before start', async function () {
          (await this.tokenSale.isOpen()).should.equal(false);
          await shouldFail.reverting(this.tokenSale.send(value));
          await shouldFail.reverting(this.tokenSale.buyTokens(participant, { from: purchaser, value: value }));
        });

        it('should accept payments after start', async function () {
          await time.increaseTo(this.openingTime);
          (await this.tokenSale.isOpen()).should.equal(true);
          await this.tokenSale.send(value);
          await this.tokenSale.buyTokens(participant, { value: value, from: purchaser });
        });

        it('should reject payments after end', async function () {
          await time.increaseTo(this.afterClosingTime);
          await shouldFail.reverting(this.tokenSale.send(value));
          await shouldFail.reverting(this.tokenSale.buyTokens(participant, { value: value, from: purchaser }));
        });
      });

      context('when within 24 hours after the opening time before and closing time', async function () {
        beforeEach(async function () {
          await time.increaseTo(this.openingTime);
        });

        describe('rate', function () {
          it(`is set at ${firstDayRate} tokens per ETH`, async function () {
            (await this.tokenSale.getCurrentRate()).should.be.bignumber.equal(firstDayRate);
          });
        });

        describe('accepting payments', function () {
          describe('bare payments', function () {
            it('should accept payments', async function () {
              await this.tokenSale.send(value, { from: purchaser });
            });

            it('reverts on zero-valued payments', async function () {
              await shouldFail.reverting(
                this.tokenSale.send(0, { from: purchaser })
              );
            });
          });

          describe('buyTokens', function () {
            it('should accept payments', async function () {
              await this.tokenSale.buyTokens(participant, { value: value, from: purchaser });
            });

            it('reverts on zero-valued payments', async function () {
              await shouldFail.reverting(
                this.tokenSale.buyTokens(participant, { value: 0, from: purchaser })
              );
            });

            it('requires a non-null beneficiary', async function () {
              await shouldFail.reverting(
                this.tokenSale.buyTokens(ZERO_ADDRESS, { value: value, from: purchaser })
              );
            });
          });
        });

        describe('high-level purchase', function () {
          it('should log purchase', async function () {
            const { logs } = await this.tokenSale.sendTransaction({ value: value, from: participant });
            expectEvent.inLogs(logs, 'TokensPurchased', {
              purchaser: participant,
              beneficiary: participant,
              value: value,
              amount: expectedFirstDayTokenAmount,
            });
          });

          it('should assign tokens to sender', async function () {
            await this.tokenSale.sendTransaction({ value: value, from: participant });
            (await this.token.balanceOf(participant)).should.be.bignumber.equal(expectedFirstDayTokenAmount);
          });

          it('should forward funds to wallet', async function () {
            const pre = await ethGetBalance(wallet);
            await this.tokenSale.sendTransaction({ value, from: participant });
            const post = await ethGetBalance(wallet);
            post.minus(pre).should.be.bignumber.equal(value);
          });
        });

        describe('low-level purchase', function () {
          it('should log purchase', async function () {
            const { logs } = await this.tokenSale.buyTokens(participant, { value: value, from: purchaser });
            expectEvent.inLogs(logs, 'TokensPurchased', {
              purchaser: purchaser,
              beneficiary: participant,
              value: value,
              amount: expectedFirstDayTokenAmount,
            });
          });

          it('should assign tokens to beneficiary', async function () {
            await this.tokenSale.buyTokens(participant, { value, from: purchaser });
            (await this.token.balanceOf(participant)).should.be.bignumber.equal(expectedFirstDayTokenAmount);
          });

          it('should forward funds to wallet', async function () {
            const pre = await ethGetBalance(wallet);
            await this.tokenSale.buyTokens(participant, { value, from: purchaser });
            const post = await ethGetBalance(wallet);
            post.minus(pre).should.be.bignumber.equal(value);
          });
        });
      });

      context('when more than 24 hours after the opening time before and closing time', async function () {
        beforeEach(async function () {
          await time.increaseTo(this.openingTime + time.duration.hours(24));
        });

        describe('rate', function () {
          it(`is set at ${rate} tokens per ETH`, async function () {
            (await this.tokenSale.getCurrentRate()).should.be.bignumber.equal(rate);
          });
        });

        describe('accepting payments', function () {
          describe('bare payments', function () {
            it('should accept payments', async function () {
              await this.tokenSale.send(value, { from: purchaser });
            });

            it('reverts on zero-valued payments', async function () {
              await shouldFail.reverting(
                this.tokenSale.send(0, { from: purchaser })
              );
            });
          });

          describe('buyTokens', function () {
            it('should accept payments', async function () {
              await this.tokenSale.buyTokens(participant, { value: value, from: purchaser });
            });

            it('reverts on zero-valued payments', async function () {
              await shouldFail.reverting(
                this.tokenSale.buyTokens(participant, { value: 0, from: purchaser })
              );
            });

            it('requires a non-null beneficiary', async function () {
              await shouldFail.reverting(
                this.tokenSale.buyTokens(ZERO_ADDRESS, { value: value, from: purchaser })
              );
            });
          });
        });

        describe('high-level purchase', function () {
          it('should log purchase', async function () {
            const { logs } = await this.tokenSale.sendTransaction({ value: value, from: participant });
            expectEvent.inLogs(logs, 'TokensPurchased', {
              purchaser: participant,
              beneficiary: participant,
              value: value,
              amount: expectedTokenAmount,
            });
          });

          it('should assign tokens to sender', async function () {
            await this.tokenSale.sendTransaction({ value: value, from: participant });
            (await this.token.balanceOf(participant)).should.be.bignumber.equal(expectedTokenAmount);
          });

          it('should forward funds to wallet', async function () {
            const pre = await ethGetBalance(wallet);
            await this.tokenSale.sendTransaction({ value, from: participant });
            const post = await ethGetBalance(wallet);
            post.minus(pre).should.be.bignumber.equal(value);
          });
        });

        describe('low-level purchase', function () {
          it('should log purchase', async function () {
            const { logs } = await this.tokenSale.buyTokens(participant, { value: value, from: purchaser });
            expectEvent.inLogs(logs, 'TokensPurchased', {
              purchaser: purchaser,
              beneficiary: participant,
              value: value,
              amount: expectedTokenAmount,
            });
          });

          it('should assign tokens to beneficiary', async function () {
            await this.tokenSale.buyTokens(participant, { value, from: purchaser });
            (await this.token.balanceOf(participant)).should.be.bignumber.equal(expectedTokenAmount);
          });

          it('should forward funds to wallet', async function () {
            const pre = await ethGetBalance(wallet);
            await this.tokenSale.buyTokens(participant, { value, from: purchaser });
            const post = await ethGetBalance(wallet);
            post.minus(pre).should.be.bignumber.equal(value);
          });
        });
      });

      context('when the sale has ended after closing time', async function () {
        beforeEach(async function () {
          await time.increaseTo(this.openingTime);
          await this.tokenSale.buyTokens(participant, { value, from: purchaser });
          await time.increaseTo(this.afterClosingTime);
        });

        describe('finalize', function () {
          it('should forward remaining tokens to pool', async function () {
            const remaining = await this.token.balanceOf(this.tokenSale.address);
            const pre = await this.token.balanceOf(pool);
            await this.tokenSale.finalize({ from: anyone });
            const post = await this.token.balanceOf(pool);
            (await this.token.balanceOf(this.tokenSale.address)).should.be.bignumber.equal(0);
            post.minus(pre).should.be.bignumber.equal(remaining);
          });
        });
      });
    });
  });
});
