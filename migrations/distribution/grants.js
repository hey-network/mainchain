const ONE_TOKEN = require("../helpers/oneToken");
const NOW = Date.now();

const GRANTS = [
  {
    grantee: '0x3155227a551d5dbe53a8c4c9a10eac39c10016d1',
    value: 20000 * ONE_TOKEN,
    start: NOW,
    cliff: NOW + 5 * 24 * 3600,
    end: NOW + 10 * 24 * 3600,
    revokable: false,
  },
  {
    grantee: '0x437f1935285cbd38d9da0810a4e64d8b704191bc',
    value: 50000 * ONE_TOKEN,
    start: NOW,
    cliff: NOW + 5 * 24 * 3600,
    end: NOW + 10 * 24 * 3600,
    revokable: false,
  },
];

// Note that for rounding reasons we cannot perform a mapreduce on each grant
// here, so we hardcode the sum of all grants (which serves as an additional
// check, so it's not too bad).
const TOTAL_VESTING = 70000 * ONE_TOKEN;

module.exports = {
  GRANTS,
  TOTAL_VESTING,
};
