async function assertTokenBalance(token, address, name, expectedBalance) {
  const balance = await token.balanceOf(address);
  if (balance.toString() !== expectedBalance.toString()) {
    console.log(`[ERROR] Incorrect HEY tokens balance for ${name} at address ${address}, aborting deployment`);
    process.exit();
  } else {
    console.log(`[SUCCESS] Correct HEY tokens balance of ${balance.toString()} for ${name} at address ${address}, continuing deployment`);
  }
};

module.exports = assertTokenBalance;
