async function assertTokenBalance(token, address, name, expectedBalance) {
  const balance = (await token.balanceOf(address)).toNumber();
  if (balance !== expectedBalance) {
    console.log(`[ERROR] Incorrect HEY tokens balance for ${name} at address ${address}, aborting deployment`);
    process.exit();
  };
};

module.exports = assertTokenBalance;
