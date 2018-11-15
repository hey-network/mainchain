const { advanceBlock } = require('../helpers/advanceToBlock');
const time = require('../helpers/time');
const asciichart = require ('asciichart')

const VestingTrustee = artifacts.require('VestingTrustee');
const Token = artifacts.require('Token');

contract('VestingTrustee', function ([_, owner, grantee, anyone]) {
  [
    {
      value: 100,
      totalDays: 100,
      cliffDays: 25,
    },
    {
      value: 100,
      totalDays: 100,
      cliffDays: 50,
    },
    {
      value: 100,
      totalDays: 100,
      cliffDays: 75,
    }
  ].forEach(async (grant) => {
    it('fuzz', async function () {
      // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
      await advanceBlock();
      const token = await Token.new({ from: owner });
      const vestingTrustee = await VestingTrustee.new(token.address, { from: owner });
      await token.transfer(vestingTrustee.address, 10000, { from: owner });

      const startTime = await time.latest();
      const cliffTime = startTime + time.duration.days(grant.cliffDays);
      const endTime = startTime + time.duration.days(grant.totalDays);
      const revokable = true;

      await vestingTrustee.createGrant(
        grantee, grant.value, startTime, cliffTime, endTime, revokable
        , { from: owner });

      const timeSeries = [];

      for(let i = 0; i <= grant.totalDays + 10; i++){
        let claimableTokens = await vestingTrustee.claimableTokens(grantee, startTime + time.duration.days(i));
        timeSeries.push(claimableTokens.toNumber());
      }
      console.log('\n');
      console.log(`Claimable tokens over time (vested: ${grant.value}, cliff days: ${grant.cliffDays}, total days: ${grant.totalDays})`);
      console.log('\n');
      console.log(asciichart.plot(timeSeries, { height: 20 }));
    });
  });
});
