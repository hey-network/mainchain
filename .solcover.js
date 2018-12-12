// Note that we can't use a normal network here as solidity-coverage requires
// a specific network where all events fired are recorded to generate the
// coverage report.
module.exports = {
  port: 8555,
  testrpcOptions: '--port 8555 --defaultBalanceEther 100000000',
  copyPackages: ['openzeppelin-solidity'],
  skipFiles: ['mocks/ERC20Mock.sol', 'gateway/ValidatorsManager.sol'],
  testCommand: 'truffle test test/Token.test.js test/TokenSale.test.js test/VestingTrustee.test.js test/Gateway.test.js test/KYCVerifierRole.test.js',
}
