module.exports = {
  copyPackages: ['openzeppelin-solidity'],
  skipFiles: ['mocks/ERC20Mock.sol', 'gateway/ValidatorsManager.sol'],
  // Do not use the test network here as solidity-coverage has gas issues with it
  testCommand: 'truffle test test/Token.test.js test/TokenSale.test.js test/VestingTrustee.test.js test/Gateway.test.js',
}
