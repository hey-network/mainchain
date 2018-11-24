// A simple script to verify connectivity with and addresses of a Ledger Nano S.

require('babel-polyfill');
const Web3 = require('web3');
const LedgerWalletProvider = require('truffle-ledger-provider');

const DERIVATION_PATH =  "44'/60'/0'/0";

const INFURA_API_KEY = require('child_process').execSync('cat .infura', { encoding: 'utf-8' }).trim();
const INFURA_ENDPOINT = `https://ropsten.infura.io/v3/${INFURA_API_KEY}`;

// HOW-TO:
// 0. Go through the readme below to understand derivation path subtleties
// 1. Connect your Ledger Nano S
// 2. Input the PIN
// 3. Open the Ethereum app
// 4. Enable the Contract and Display modes from Settings
// 5. Make sure you've got Ropsten ETH on your account to send a transaction
// 6. Enjoy!

// An important note on derivation paths:
// In implementation A and on the Ledger Ethereum Chrome Wallet, the default
// key derivation path is 44'/60'/0'/0. On Ledger Live however, an additional zero
// is added to the path as per the BIP44 recommendation. See the full description here:
// https://github.com/MyCryptoHQ/MyCrypto/issues/2070
// Since we stick to the ancient derivation path because of the way web3 works here,
// we need to use accounts retrieved from web3. So, no need to send ETH to the Ledger
// Live addresses, since they won't be usable from Web3. Again, all these comments
// apply only to implementation A, and are not relevant for B which uses BIP44.

async function test() {
  // IMPLEMENTATION A (not BIP44, not working with Truffle)
  // const provider = new LedgerWalletProvider(
  //   {
  //     networkId: 3, // Ropsten testnet
  //     path: DERIVATION_PATH,
  //     accountsOffset: 0, // Start from first address to derive accounts
  //     accountsLength: 5, // Load 5 accounts
  //   },
  //   INFURA_ENDPOINT
  // );

  // IMPLEMENTATION B (BIP 44, uses 0x's implementation, works with Truffle)
  const provider = require("truffle-ledger-wallet-provider").default(
    INFURA_ENDPOINT,
    3,
    DERIVATION_PATH,
  );

  const web3 = new Web3(provider);
  const accounts = await web3.eth.getAccounts();

  // List the accounts available, derived from default path.
  console.log(accounts)

  // Trial transaction to test Ledger connectivity
  const signature = await web3.eth.signTransaction({
    from: accounts[0],
    gasPrice: '20000000000',
    gas: '21000',
    to: '0x3535353535353535353535353535353535353535',
    value: '100000000',
    data: ''
  });

  console.log(signature);

  // Trial transaction to test full connectivity to Ropsten.
  try {
    const txHash = await web3.eth.sendTransaction({
      from: accounts[0],
      gasPrice: '20000000000',
      gas: '21000',
      to: '0x3535353535353535353535353535353535353535',
      value: '100000000',
      data: ''
    });
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
