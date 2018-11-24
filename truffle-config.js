// Support for ES6 syntax in Ledger npm module
require('babel-polyfill');

// Infura remote node config
const INFURA_API_KEY = require('child_process').execSync('cat .infura', { encoding: 'utf-8' }).trim();
const INFURA_ENDPOINT = `https://ropsten.infura.io/v3/${INFURA_API_KEY}`;

// Mnemonic wallet config
const HDWalletProvider = require("truffle-hdwallet-provider");
// Reading mnemonic from file, for address 0xf4cf72cefa8c3daa761663118459120da3aaa248
const MNEMONIC = require('child_process').execSync('cat .mnemonic', { encoding: 'utf-8' }).trim();

// Working Ledger provider, that relies on 0x's protocol subprovider implementation.
// Note very interestingly that despite the fact that the derivation path is not
// BIP44, it is somehow extended in the underlying implementation to conform with
// this standard. As a result the transactions will emanate from the same address
// as the one seen in the Ledger Live application (and different from the addresses
// seen in the Ledger Ether Chrome Wallet).
const providerFactory = require("truffle-ledger-wallet-provider").default;
const ledgerDerivationPath = "44'/60'/0'/0";

// -------------------------------------------------------------------
// From https://gist.github.com/mxpaul/f2168f5c951306a06ef833efa0eb56ce
// Emulate mocha --grep option to run only matching tests
let mochaConf = {}; // Passed as module.exports.mocha
// -------------------------------------------------------------------

for (let i = 0; i < process.argv.length; i++) {
	const arg = process.argv[i];
	if (arg != '-g' && arg != "--grep" ) continue;
	if (++i >= process.argv.length) {
		console.error(arg + " option requires argument");
		process.exit(1);
	};
	const re = new RegExp(process.argv[i]);
	mochaConf.grep = new RegExp(process.argv[i]);
	console.error("RegExp: " + i + ": " + re);
	break;
}
// -------------------------------------------------------------------

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
			port: 8545,
      network_id: "*" // Match any network id
    },
		ropsten: {
	    provider: function() {
	      return new HDWalletProvider(MNEMONIC, INFURA_ENDPOINT);
	    },
	    network_id: 3,
			gasPrice: 5*1e9,
	    gas: 4*1e6
	  },
		ropstenLedger: {
			provider: function() {
        return providerFactory(
          INFURA_ENDPOINT,
          3, // Ropsten testnet
          ledgerDerivationPath,
        );
	    },
	    network_id: 3,
			gasPrice: 5*1e9,
	    gas: 4*1e6
	  }
  },
  mocha: mochaConf,
};
