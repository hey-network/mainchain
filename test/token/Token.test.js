const { assertRevert } = require('../helpers/assertRevert');
const expectEvent = require('../helpers/expectEvent');

const Token = artifacts.require('Token');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('Token', function ([_, owner, recipient, anotherAccount]) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
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
});
