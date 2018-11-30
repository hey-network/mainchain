const ONE_TOKEN = require("../helpers/oneToken");
const NOW = Date.now();

const GRANTS = [
  {
    grantee: '0x7b8f7244FFb5E9aF4e3E0467fDb5EE39333aFC1B',
    value: 2000*ONE_TOKEN,
    start: NOW,
    cliff: NOW + 5 * 24 * 3600,
    end: NOW + 10 * 24 * 3600,
    revokable: false,
  },
  {
    grantee: '0x437f1935285cbd38d9da0810a4e64d8b704191bc',
    value: 100*ONE_TOKEN,
    start: NOW,
    cliff: NOW + 5 * 24 * 3600,
    end: NOW + 10 * 24 * 3600,
    revokable: false,
  },
];

module.exports = GRANTS;
