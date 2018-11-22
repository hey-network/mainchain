const Token = artifacts.require("./Token.sol");
const VestingTrustee = artifacts.require("./VestingTrustee.sol");

const decimals = 1e18;

// Grants, to be setup with actual data for production deployment
const grants = [
  {
    grantee: '0x7b8f7244FFb5E9aF4e3E0467fDb5EE39333aFC1B',
    value: 1000*decimals,
    start: Date.now(),
    cliff: Date.now() + 5 * 24 * 3600,
    end: Date.now() + 10 * 24 * 3600,
    revokable: false,
  },
  {
    grantee: '0x437f1935285cbd38d9da0810a4e64d8b704191bc',
    value: 2500*decimals,
    start: Date.now(),
    cliff: Date.now() + 5 * 24 * 3600,
    end: Date.now() + 10 * 24 * 3600,
    revokable: false,
  },
];

const totalVesting = grants.reduce((a, b) => ({value: a.value + b.value})).value;

module.exports = function(deployer) {
  deployer.then(async () => {
    const token = await Token.deployed(); // we're able to fetch this from previous migration

    await deployer.deploy(VestingTrustee,
      token.address
    );
    const vestingTrustee = await VestingTrustee.deployed();

    await token.transfer(
      vestingTrustee.address,
      totalVesting,
    );

    await asyncForEach(grants, async (grant) => {
      await vestingTrustee.createGrant(...Object.values(grant));
    });
  });
};

// Helper function
async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};
