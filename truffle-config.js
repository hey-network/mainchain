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
    }
  },
  mocha: mochaConf,
};
