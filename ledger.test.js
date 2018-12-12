/**
  *  @dev Simple scripts to verify connectivity and addresses of a Ledger Nano S.
  *  @author Thomas Vanderstraeten - <thomas@get-hey.com>
  *
  *  HOW-TO:
  *  0. Go through the readme below to understand derivation path subtleties
  *  1. Connect the Ledger Nano S to your machine
  *  2. Input the device PIN to unlock it
  *  3. Open the Ethereum app on the device
  *  4. Enable the Contract and Display modes in the device Settings
  *  5. Make sure you've got Ropsten ETH on your account to send a transaction
  *  6. Make sure you've got a valid Infura API key saved in a .infura file
  *  7. Enjoy!
  *
  *  NOTE ON DERIVATION PATHS:
  *  In implementation A and on the Ledger Ethereum Chrome Wallet, the default BIP39
  *  key derivation path is 44'/60'/0'/0. On Ledger Live and implementation B however,
  *  an additional zero is added to the path as per the BIP44 recommendation.
  *  See the full description here:
  *  https://github.com/MyCryptoHQ/MyCrypto/issues/2070
  *
  *  NOTE ON NANO LEDGER S TESTNETS SUPPORT:
  *  The device works identically whether you're on a Testnet or Mainnet. No warning
  *  messages of any kind will ever be displayed, since all the device really does
  *  is signing messages irrespective of where they'll be sent. Ensure to always
  *  review your full settings to double-check the environment to which you'll
  *  be sending the signed transaction.
  */

require('babel-polyfill');
const Web3 = require('web3');

// Watchout for the very similar names of these packages when looking them up
// on GitHub etc ;)
const bip39ProviderFactory = require('truffle-ledger-provider');
const bip44ProviderFactory = require('truffle-ledger-wallet-provider');

const DERIVATION_PATH =  "44'/60'/0'/0";

const INFURA_API_KEY = require('child_process').execSync('cat .infura', { encoding: 'utf-8' }).trim();
const INFURA_ENDPOINT = `https://ropsten.infura.io/v3/${INFURA_API_KEY}`;

const NETWORK_ID = 3; // Ropsten Testnet

// IMPLEMENTATION A (not working with Truffle)
function bip39Provider() {
  return new bip39ProviderFactory(
    {
      networkId: NETWORK_ID,
      path: DERIVATION_PATH,
      accountsOffset: 0, // Start from first address to derive accounts
      accountsLength: 5, // Load 5 accounts
    },
    INFURA_ENDPOINT
  );
};

// IMPLEMENTATION B (uses 0x's implementation, works with Truffle)
function bip44Provider() {
  return bip44ProviderFactory.default(
    INFURA_ENDPOINT,
    NETWORK_ID,
    // Strangely we have to use BIP39 derivation path in argument here, although
    // the addresses ultimately derived are identical to those of Ledger Live,
    // which we know uses BIP44. To be investigated if time allows.
    DERIVATION_PATH,
  );
};

const testTransaction = {
  from: accounts[0],
  gasPrice: '20000000000',
  gas: '21000',
  to: '0x3535353535353535353535353535353535353535',
  value: '100000000',
  data: ''
};

async function test() {
  const provider = bip44Provider();
  const web3 = new Web3(provider);

  // List the accounts available, derived from default path.
  const accounts = await web3.eth.getAccounts();
  console.log(accounts)

  // Trial transaction to test Ledger connectivity
  const signature = await web3.eth.signTransaction(testTransaction);
  console.log(signature);

  // Trial transaction to test full connectivity to Ropsten.
  try {
    const txHash = await web3.eth.sendTransaction(testTransaction);
  } catch (error) {
    // This is a known limitation when using Infura, and does not prevent the tx.
    // See issue here: https://github.com/ethereum/web3.js/issues/951
    if (error.message.includes('Failed to subscribe to new newBlockHeaders')) {
      console.log('transaction successful');
    } else {
      throw error;
    }
  }

  // Exit gracefully by stopping the provider engine, as it would otherwise hang
  // forever waiting for new input (for implementation A, call .engine.stop())
  provider.stop()
}

test();
