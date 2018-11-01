function advanceBlock () {
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
    }, (err, res) => {
      return err ? reject(err) : resolve(res);
    });
  });
}

module.exports = {
  advanceBlock,
};
