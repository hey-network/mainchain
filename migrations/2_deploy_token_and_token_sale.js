const Token = artifacts.require("./Token.sol");
const TokenSale = artifacts.require("./TokenSale.sol");

// All variables to be setup for production at time of deploy
const openingTime = Date.now();
const duration = 7 * 24 * 3600;
const closingTime = openingTime + duration;
const firstDayRate = 5500;
const rate = 5000;
const wallet = '0x7b8f7244FFb5E9aF4e3E0467fDb5EE39333aFC1B';
const pool = '0x7b8f7244FFb5E9aF4e3E0467fDb5EE39333aFC1B';

// Should be decreased with pre-sale amounts as well as grants amounts
// once these are finalized
const decimals = 1e18;
const tokenSaleEndowment = 0.5*1e9*decimals;
const poolEndowment = 0.3*1e9*decimals;

// Contributions from the pre-sale (incl. fiat contributions), all hard-coded
const presaleContributions = [
  {
    address: '0x7b8f7244FFb5E9aF4e3E0467fDb5EE39333aFC1B',
    amount: 100000*decimals,
  },
  {
    address: '0x7b8f7244FFb5E9aF4e3E0467fDb5EE39333aFC1B',
    amount: 250000*decimals,
  }
];

module.exports = function(deployer) {
  deployer.then(async () => {
    await deployer.deploy(Token);
    const token = await Token.deployed();

    await deployer.deploy(TokenSale,
      openingTime,
      closingTime,
      firstDayRate,
      rate,
      wallet,
      pool,
      token.address,
    );
    const tokenSale = await TokenSale.deployed();

    await token.transfer(
      tokenSale.address,
      tokenSaleEndowment,
    );

    await token.transfer(
      pool,
      poolEndowment,
    );

    await asyncForEach(presaleContributions, async (contribution) => {
      await token.transfer(
        contribution.address,
        contribution.amount,
      );
    });
  });
};

// Helper function
async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};
