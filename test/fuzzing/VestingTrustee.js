const { advanceBlock } = require('../helpers/advanceToBlock');
const time = require('../helpers/time');
const asciichart = require ('asciichart')

const BigNumber = web3.BigNumber;

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
    this.cliffDays = 50;
    this.totalDays = 100;
    this.cliffTime = this.startTime + time.duration.days(this.cliffDays);
    this.endTime = this.startTime + time.duration.days(this.totalDays);
    const revokable = true;

    await this.vestingTrustee.createGrant(
      grantee, this.value, this.startTime, this.cliffTime, this.endTime, revokable
    , { from: owner });
  });

  it('fuzz', async function () {
    const timeSeries = [];

    for(let i = 0; i <= this.totalDays + 10; i++){
      let claimableTokens = await this.vestingTrustee.claimableTokens(grantee, this.startTime + time.duration.days(i));
      timeSeries.push(claimableTokens.toNumber());
    }
    console.log('\n');
    console.log(`Claimable tokens over time (vested: ${this.value}, cliff days: ${this.cliffDays}, total days: ${this.totalDays})`);
    console.log('\n');
    console.log(asciichart.plot(timeSeries, { height: 20 }));
  });
});
