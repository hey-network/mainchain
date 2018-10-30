const Web3 = require('web3');
const web3 = new Web3();
const SIGNATURE_MODE = '01'; //GETH

// Since this module is a pure tests helper, no worries to have this private
// key hardcoded. In the actual MontBlanc application we load this key from
// a secured local file.
const privateKey = '0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8709';
const approverAddress = web3.eth.accounts.privateKeyToAccount(privateKey).address;

// Export this address so it can be used when deploying the Gateway initially,
// to populate the list of validators
module.exports.approver = approverAddress;
module.exports.getSignature = function({ redeemer, tokenAddress, nonce, amount }) {
  // This is web3's equivalent of EVM's encodePacked method.
  const hash = web3.utils.soliditySha3(redeemer, tokenAddress, nonce, amount);
  const { signature } = web3.eth.accounts.sign(hash, privateKey);
  // Signature is originally 65 bytes long, prefixed by 0x to indicate its hexa-
  // decimal nature. We need to prepend the signature mode byte, then add back
  // the 0x. See this interesting StackOverflow question:
  // https://ethereum.stackexchange.com/questions/25601/what-is-the-difference-between-web3-eth-sign-web3-eth-accounts-sign-web3-eth-p
  const prefixedSignature = '0x' + SIGNATURE_MODE + signature.substring(2, signature.length);
  return prefixedSignature;
}
