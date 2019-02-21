const { balance, BN, constants, expectEvent, shouldFail, ether, time } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;

const TokenSale = artifacts.require('TokenSale');
const Token = artifacts.require('Token');

contract('TokenSale', function ([_, owner, participant, wallet, pool, purchaser, anyone]) {
  // Total supply
  const tokenSupply = new BN('1000000000000000000000000000'); // 1 billion with 18 decimals (9 + 18)
  // Default value sent by participants
  const value = ether(new BN(11));
  // Rates
  const zero = new BN(0);
  const firstDayRate = new BN(4400);
  const rate = new BN(4000);
  const expectedFirstDayTokenAmount = firstDayRate.mul(value);
  const expectedTokenAmount = rate.mul(value);
  // Minimum contributions
  const firstDayEthMinimumContribution = 10;
  const ethMinimumContribution = 0.1;
  const firstDayMinimumContribution = ether(new BN(firstDayEthMinimumContribution));
  const minimumContribution = ether(new BN(ethMinimumContribution));

  it('requires a non-null token', async function () {
    this.openingTime = (await time.latest()).add(time.duration.weeks(1));
    this.closingTime = this.openingTime.add(time.duration.days(28));
    await shouldFail.reverting(TokenSale.new(
      this.openingTime, this.closingTime, zero, rate, wallet, pool, ZERO_ADDRESS, { from: owner }
    ));
  });

  context('with token', async function () {
    beforeEach(async function () {
      this.openingTime = (await time.latest()).add(time.duration.weeks(1));
      this.closingTime = this.openingTime.add(time.duration.days(28));
      this.afterClosingTime = this.closingTime + time.duration.seconds(1);
      this.token = await Token.new({ from: owner });
    });

    it('requires a non-zero first day rate', async function () {
      await shouldFail.reverting(TokenSale.new(
        this.openingTime, this.closingTime, zero, rate, wallet, pool, this.token.address, { from: owner }
      ));
    });

    it('requires a non-zero rate', async function () {
      await shouldFail.reverting(TokenSale.new(
        this.openingTime, this.closingTime, firstDayRate, zero, wallet, pool, this.token.address, { from: owner }
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

      describe('KYC', function () {
        beforeEach(async function () {
          await time.increaseTo(this.openingTime);
        });

        it('should allow the owner to grant KYC authorization to an account', async function () {
          await this.tokenSale.grantKYCAuthorizations([participant], { from: owner });
          (await this.tokenSale.kycAuthorized(participant)).should.equal(true);
        });

        it('should allow the owner to revert KYC authorization to an account', async function () {
          await this.tokenSale.grantKYCAuthorizations([participant], { from: owner });
          (await this.tokenSale.kycAuthorized(participant)).should.equal(true);
          await this.tokenSale.revertKYCAuthorizations([participant], { from: owner });
          (await this.tokenSale.kycAuthorized(participant)).should.equal(false);
        });

        it('should reject payments from non KYC authorized accounts', async function () {
          await shouldFail.reverting(this.tokenSale.send(value));
          await shouldFail.reverting(this.tokenSale.buyTokens(participant, { from: purchaser, value: value }));
        });

        it('should accept payments from KYC authorized accounts', async function () {
          await this.tokenSale.grantKYCAuthorizations([_, participant], { from: owner });
          await this.tokenSale.send(value);
          await this.tokenSale.buyTokens(participant, { value: value, from: purchaser });
        });
      });

      context('once participants have been authorized', async function () {
        beforeEach(async function () {
          await this.tokenSale.grantKYCAuthorizations([_, participant, purchaser, anyone], { from: owner });
        });
        describe('pausable', function () {
          it('can be paused by the owner', async function () {
            await this.tokenSale.pause({ from: owner });
            (await this.tokenSale.paused()).should.equal(true);
          });

          it('cannot be paused if sender is not the owner', async function () {
            await shouldFail.reverting(this.tokenSale.pause({ from: anyone }));
          });

          it('should reject payments when paused', async function () {
            await time.increaseTo(this.openingTime);
            await this.tokenSale.pause({ from: owner });
            await shouldFail.reverting(this.tokenSale.send(value));
            await shouldFail.reverting(this.tokenSale.buyTokens(participant, { value: value, from: purchaser }));
          });
        });

        describe('evolving rate', function () {
          context('within 24 hours after opening time', async function () {
            beforeEach(async function () {
              await time.increaseTo(this.openingTime);
            });

            describe('rate', function () {
              it(`is set at ${firstDayRate} tokens per ETH`, async function () {
                (await this.tokenSale.getCurrentRate()).should.be.bignumber.equal(firstDayRate);
              });
            });
          });

          context('after 24 hours after opening time', async function () {
            beforeEach(async function () {
              await time.increaseTo(this.openingTime.add(time.duration.hours(24)));
            });

            describe('rate', function () {
              it(`is set at ${rate} tokens per ETH`, async function () {
                (await this.tokenSale.getCurrentRate()).should.be.bignumber.equal(rate);
              });
            });
          });
        });

        describe('timed crowdsale', function () {
          it('should be ended only after end', async function () {
            (await this.tokenSale.hasClosed()).should.equal(false);
            await time.increaseTo(this.afterClosingTime);
            (await this.tokenSale.isOpen()).should.equal(false);
            (await this.tokenSale.hasClosed()).should.equal(true);
          });

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

        describe('minimum contribution', function () {
          context('when within 24 hours after the opening time before and closing time', async function () {
            it(`rejects payments with a value below ${firstDayEthMinimumContribution} ETH`, async function () {
              await time.increaseTo(this.openingTime);
              await shouldFail.reverting(this.tokenSale.send(ether(new BN(firstDayEthMinimumContribution - 0.001))));
              await shouldFail.reverting(this.tokenSale.buyTokens(participant, { from: purchaser, value: (ether(new BN(firstDayEthMinimumContribution - 0.001))) }));
            });

            it(`accepts payments with a value equal to ${firstDayEthMinimumContribution} ETH`, async function () {
              await time.increaseTo(this.openingTime);
              await this.tokenSale.send(firstDayMinimumContribution);
              await this.tokenSale.buyTokens(participant, { from: purchaser, value: firstDayMinimumContribution });
            });

            it(`accepts payments with a value above ${firstDayEthMinimumContribution} ETH`, async function () {
              await time.increaseTo(this.openingTime);
              await this.tokenSale.send(ether(new BN(firstDayEthMinimumContribution + 0.001)));
              await this.tokenSale.buyTokens(participant, { from: purchaser, value: (ether(new BN(firstDayEthMinimumContribution + 0.001))) });
            });
          });

          context('when more than 24 hours after the opening time before and closing time', async function () {
            it(`rejects payments with a value below ${ethMinimumContribution} ETH`, async function () {
              await time.increaseTo(this.openingTime.add(time.duration.hours(24)));
              await shouldFail.reverting(this.tokenSale.send(ether(new BN(ethMinimumContribution - 0.001))));
              await shouldFail.reverting(this.tokenSale.buyTokens(participant, { from: purchaser, value: (ether(new BN(ethMinimumContribution - 0.001))) }));
            });

            it(`accepts payments with a value equal to ${ethMinimumContribution} ETH`, async function () {
              await time.increaseTo(this.openingTime.add(time.duration.hours(24)));
              await this.tokenSale.send(minimumContribution);
              await this.tokenSale.buyTokens(participant, { from: purchaser, value: minimumContribution });
            });

            await time.increaseTo(this.openingTime.add(time.duration.hours(24)));
            it(`accepts payments with a value above ${ethMinimumContribution} ETH`, async function () {
              await this.tokenSale.send(ether(new BN(ethMinimumContribution + 0.001)));
              await this.tokenSale.buyTokens(participant, { from: purchaser, value: (ether(new BN(ethMinimumContribution + 0.001))) });
            });
          });
        });

        describe('standard crowdsale behaviour', function () {
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
                    this.tokenSale.send(zero, { from: purchaser })
                  );
                });
              });

              describe('buyTokens', function () {
                it('should accept payments', async function () {
                  await this.tokenSale.buyTokens(participant, { value: value, from: purchaser });
                });

                it('reverts on zero-valued payments', async function () {
                  await shouldFail.reverting(
                    this.tokenSale.buyTokens(participant, { value: zero, from: purchaser })
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
                (await balance.difference(wallet, () =>
                  this.tokenSale.sendTransaction({ value, from: participant }))
                ).should.be.bignumber.equal(value);
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
                (await balance.difference(wallet, () =>
                  this.tokenSale.buyTokens(participant, { value, from: purchaser }))
                ).should.be.bignumber.equal(value);
              });
            });
          });

          context('when more than 24 hours after the opening time before and closing time', async function () {
            beforeEach(async function () {
              await time.increaseTo(this.openingTime.add(time.duration.hours(24)));
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
                    this.tokenSale.send(zero, { from: purchaser })
                  );
                });
              });

              describe('buyTokens', function () {
                it('should accept payments', async function () {
                  await this.tokenSale.buyTokens(participant, { value: value, from: purchaser });
                });

                it('reverts on zero-valued payments', async function () {
                  await shouldFail.reverting(
                    this.tokenSale.buyTokens(participant, { value: zero, from: purchaser })
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
                (await balance.difference(wallet, () =>
                  this.tokenSale.sendTransaction({ value, from: participant }))
                ).should.be.bignumber.equal(value);
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
                (await balance.difference(wallet, () =>
                  this.tokenSale.buyTokens(participant, { value, from: purchaser }))
                ).should.be.bignumber.equal(value);
              });
            });
          });
        });

        describe('finalize', function () {
          context('when the sale has ended after closing time', async function () {
            beforeEach(async function () {
              await time.increaseTo(this.openingTime);
              await this.tokenSale.buyTokens(participant, { value, from: purchaser });
              await time.increaseTo(this.afterClosingTime);
            });

            it('should forward remaining tokens to pool', async function () {
              const remaining = await this.token.balanceOf(this.tokenSale.address);
              await this.tokenSale.finalize({ from: anyone });
              (await this.token.balanceOf(this.tokenSale.address)).should.be.bignumber.equal(zero);
              (await balance.difference(pool, () =>
                this.tokenSale.buyTokens(participant, { value, from: purchaser }))
              ).should.be.bignumber.equal(remaining);
            });
          });
        });
      });
    });
  });
});
