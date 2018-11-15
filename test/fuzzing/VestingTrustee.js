const { advanceBlock } = require('../helpers/advanceToBlock');
const time = require('../helpers/time');

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
    this.token = await Token.new({ from: owner });
    this.vestingTrustee = await VestingTrustee.new(this.token.address, { from: owner });
    await this.token.transfer(this.vestingTrustee.address, 10000, { from: owner });

    this.value = 1000;
    this.startTime = (await time.latest()) + time.duration.weeks(1);
    this.cliffTime = this.startTime + time.duration.days(50);
    this.endTime = this.cliffTime + time.duration.days(100);
    const revokable = true;

    await this.vestingTrustee.createGrant(
      grantee, this.value, this.startTime, this.cliffTime, this.endTime, revokable
    , { from: owner });
  });

  it('lets the grantee claim a portion of her vested tokens between the cliff and the end time', async function () {
    await time.increaseTo(this.cliffTime + time.duration.seconds(1));

    const pre = await this.token.balanceOf(grantee);
    console.log(await this.vestingTrustee.claimableTokens(grantee, await time.latest()));
    await this.vestingTrustee.claimTokens({ from: grantee });
    const post = await this.token.balanceOf(grantee);

    post.minus(pre).should.be.bignumber.above(0);
    post.minus(pre).should.be.bignumber.below(this.value);
  });
});
