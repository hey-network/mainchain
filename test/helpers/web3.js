const pify = require('pify');

const ethAsync = pify(web3.eth);

module.exports = {
  ethSendTransaction: ethAsync.sendTransaction,
  ethGetBlock: ethAsync.getBlock,
};
