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

contract('TokenSale', function ([_, owner, participant, wallet, pool, purchaser]) {
  const firstDayRate = new BigNumber(5500);
  const rate = new BigNumber(5000);
  const tokenSupply = new BigNumber('1e27'); // 9 + 18
  const value = ether(42);
  const expectedTokenAmount = firstDayRate.mul(value);

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

    context('once deployed', async function () {
      beforeEach(async function () {
        this.tokenSale = await TokenSale.new(
          this.openingTime, this.closingTime, firstDayRate, rate, wallet, pool, this.token.address, { from: owner }
        );
        await this.token.transfer(this.tokenSale.address, tokenSupply, { from: owner });
      });

      context('when in the period between opening time and closing time', async function () {
        beforeEach(async function () {
          await time.increaseTo(this.openingTime);
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
    });
  });
});
