// Support for ES6 syntax in Ledger npm module
require('babel-polyfill');

// Working Ledger provider, that relies on 0x's protocol subprovider implementation.
// Note very interestingly that despite the fact that the derivation path is not
// BIP44, it is somehow extended in the underlying implementation to conform with
// this standard. As a result the transactions will emanate from the same address
// as the one seen in the Ledger Live application (and different from the addresses
// seen in the Ledger Ether Chrome Wallet).
const ledgerDerivationPath = "44'/60'/0'/0";

// -------------------------------------------------------------------
// From https://gist.github.com/mxpaul/f2168f5c951306a06ef833efa0eb56ce
// Emulate mocha --grep option to run only matching tests
let mochaConf = {}; // Passed as module.exports.mocha
// -------------------------------------------------------------------

for (let i = 0; i < process.argv.length; i++) {
	const arg = process.argv[i];
	if (arg != '-g' && arg != '--grep' ) continue;
	if (++i >= process.argv.length) {
		console.error(arg + ' option requires argument');
		process.exit(1);
	};
	const re = new RegExp(process.argv[i]);
	mochaConf.grep = new RegExp(process.argv[i]);
	console.error('RegExp: ' + i + ': ' + re);
	break;
}
// -------------------------------------------------------------------

module.exports = {
  networks: {
    development: {
      host: 'localhost',
			port: 8545,
      network_id: '*' // Match any network id
    },
		rinkeby: {
	    provider: function() {
				// Mnemonic wallet config
				// Reading mnemonic from file, for address 0xe6Aaa7987b192194b81bE4EC1d0e77037eA7a6f6
				const { mnemonic, infura } = require('./secrets');
				const endpoint = `https://rinkeby.infura.io/v3/${infura}`;
				const HDWalletProvider = require('truffle-hdwallet-provider');
				return new HDWalletProvider(mnemonic, endpoint);
	    },
	    network_id: 4,
			gasPrice: 5*1e9,
	    gas: 4*1e6
	  },
		live: {
	    provider: function() {
				// Mnemonic wallet config
				// Reading mnemonic from file, for address 0xe6Aaa7987b192194b81bE4EC1d0e77037eA7a6f6
				const { mnemonic, infura } = require('./secrets');
				const endpoint = `https://mainnet.infura.io/v3/${infura}`;
				const HDWalletProvider = require('truffle-hdwallet-provider');
				return new HDWalletProvider(mnemonic, endpoint);
	    },
	    network_id: 1,
			gasPrice: 12*1e9,
	    gas: 4*1e6
	  },
		ropstenLedger: {
			provider: function() {
				const { infura } = require('./secrets');
				const endpoint = `https://ropsten.infura.io/v3/${infura}`;
        return require('truffle-ledger-wallet-provider').default(
          endpoint,
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
