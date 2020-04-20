class Config {
  constructor(opts) {
    this.network = "T";
    this.nodeURL = "https://nodes-testnet.wavesnodes.com";
    this.providerUrl = "https://testnet.waves.exchange/signer/";
    this.userAddress = "3MsG6jPNCrVJUtYB7XJBxS7utWsXAf4n9Vp";
    this.dappAddress = "3N5NLAqd9w7sNuUnjfWq7mzW3bherD6uZmn";
  }

  get(key) {
    return this[key];
  }
}
module.exports = Config;
