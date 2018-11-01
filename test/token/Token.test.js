const shouldFail = require('../helpers/shouldFail');
const expectEvent = require('../helpers/expectEvent');
const { ZERO_ADDRESS } = require('../helpers/constants');

const Token = artifacts.require('Token');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('Token', function ([_, owner, recipient, anotherAccount]) {
  const TOTAL_SUPPLY = 1e9*1e18;
  const DECIMALS = 18;
  const NAME = "HeyToken";
  const SYMBOL = "HEY";

  beforeEach(async function () {
    this.token = await Token.new({ from: owner });
  });

  describe('when the contract is deployed', function () {
    it(`sets the token name to "${NAME}"`, async function () {
      (await this.token.name()).should.be.equal(NAME);
    });

    it(`sets the token symbol to "${SYMBOL}"`, async function () {
      (await this.token.symbol()).should.be.equal(SYMBOL);
    });

    it(`sets the token number of decimals to ${DECIMALS}`, async function () {
      (await this.token.decimals()).should.be.bignumber.equal(DECIMALS);
    });

    it(`mints a total supply of ${TOTAL_SUPPLY / (10 ** DECIMALS)} tokens`, async function () {
      (await this.token.totalSupply()).should.be.bignumber.equal(TOTAL_SUPPLY);
    });

    it('transfers all tokens to the address deploying the contract', async function () {
      (await this.token.balanceOf(owner)).should.be.bignumber.equal(TOTAL_SUPPLY);
    });
  });

  // Since we extend the 'transfer' method, we ensure that all standard specs
  // are still valid (these tests are a copy-paste from OpenZeppelin's ERC20 tests).
  describe('transfer', function () {
    describe('when the recipient is not the zero address', function () {
      const to = recipient;

      describe('when the sender does not have enough balance', function () {
        const amount = TOTAL_SUPPLY * 1.1;

        it('reverts', async function () {
          await shouldFail.reverting(this.token.transfer(to, amount, { from: owner }));
        });
      });

      describe('when the sender has enough balance', function () {
        const amount = TOTAL_SUPPLY;

        it('transfers the requested amount', async function () {
          await this.token.transfer(to, amount, { from: owner });

          (await this.token.balanceOf(owner)).should.be.bignumber.equal(0);

          (await this.token.balanceOf(to)).should.be.bignumber.equal(amount);
        });

        it('emits a transfer event', async function () {
          const { logs } = await this.token.transfer(to, amount, { from: owner });

          expectEvent.inLogs(logs, 'Transfer', {
            from: owner,
            to: to,
            value: amount,
          });
        });
      });
    });

    describe('when the recipient is the zero address', function () {
      const to = ZERO_ADDRESS;

      it('reverts', async function () {
        await shouldFail.reverting(this.token.transfer(to, TOTAL_SUPPLY, { from: owner }));
      });
    });

    describe('when the recipient is the token contract itself', function () {
      it('reverts', async function () {
        // 'token' does not exist outside 'it' because of the way our before
        // each test hook is defined.
        const to = this.token.address
        await shouldFail.reverting(this.token.transfer(to, TOTAL_SUPPLY, { from: owner }));
      });
    });
  });

  // Since we extend the 'transfer' method, we ensure that all standard specs
  // are still valid (these tests are a copy-paste from OpenZeppelin's ERC20 tests).
  describe('transfer from', function () {
    const spender = recipient;

    describe('when the recipient is not the zero address', function () {
      const to = anotherAccount;

      describe('when the spender has enough approved balance', function () {
        beforeEach(async function () {
          await this.token.approve(spender, TOTAL_SUPPLY, { from: owner });
        });

        describe('when the owner has enough balance', function () {
          const amount = TOTAL_SUPPLY;

          it('transfers the requested amount', async function () {
            await this.token.transferFrom(owner, to, amount, { from: spender });

            (await this.token.balanceOf(owner)).should.be.bignumber.equal(0);

            (await this.token.balanceOf(to)).should.be.bignumber.equal(amount);
          });

          it('decreases the spender allowance', async function () {
            await this.token.transferFrom(owner, to, amount, { from: spender });

            (await this.token.allowance(owner, spender)).should.be.bignumber.equal(0);
          });

          it('emits a transfer event', async function () {
            const { logs } = await this.token.transferFrom(owner, to, amount, { from: spender });

            expectEvent.inLogs(logs, 'Transfer', {
              from: owner,
              to: to,
              value: amount,
            });
          });
        });

        describe('when the owner does not have enough balance', function () {
          const amount = TOTAL_SUPPLY * 1.1;

          it('reverts', async function () {
            await shouldFail.reverting(this.token.transferFrom(owner, to, amount, { from: spender }));
          });
        });
      });

      describe('when the spender does not have enough approved balance', function () {
        beforeEach(async function () {
          await this.token.approve(spender, TOTAL_SUPPLY * 0.9, { from: owner });
        });

        describe('when the owner has enough balance', function () {
          const amount = TOTAL_SUPPLY;

          it('reverts', async function () {
            await shouldFail.reverting(this.token.transferFrom(owner, to, amount, { from: spender }));
          });
        });

        describe('when the owner does not have enough balance', function () {
          const amount = TOTAL_SUPPLY * 1.1;

          it('reverts', async function () {
            await shouldFail.reverting(this.token.transferFrom(owner, to, amount, { from: spender }));
          });
        });
      });
    });

    describe('when the recipient is the zero address', function () {
      const amount = TOTAL_SUPPLY;
      const to = ZERO_ADDRESS;

      beforeEach(async function () {
        await this.token.approve(spender, amount, { from: owner });
      });

      it('reverts', async function () {
        await shouldFail.reverting(this.token.transferFrom(owner, to, amount, { from: spender }));
      });
    });

    describe('when the recipient is the token contract itself', function () {
      const amount = TOTAL_SUPPLY;

      beforeEach(async function () {
        await this.token.approve(spender, amount, { from: owner });
      });

      it('reverts', async function () {
        // 'token' does not exist outside 'it' because of the way our before
        // each test hook is defined.
        const to = this.token.address
        await shouldFail.reverting(this.token.transferFrom(owner, to, amount, { from: spender }));
      });
    });
  });
});
