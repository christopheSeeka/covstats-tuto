// IMPORT THE CONFIG FILE AND INIT IT
import Config from "../settings";
let config = new Config();

class Getdata {
  constructor() {

    // DECLARE YOUR GLOBAL CONFIG VARIABLES FROM THE SETTINGS FILE
    this.dappAddress = config.get("dappAddress")
    this.userAddress = config.get("userAddress")
    this.nodeUrl = config.get("nodeURL")
    this.providerUrl = config.get("providerUrl");
    this.explorerSegment = config.get("network") == "T" ? "/testnet" : ""

    // CHECK IF THERE IS A PAGE ADDRESS IN FIRST URL SEGMENT, IF YES USE IT,
    // IF NOT, GET IT FROM SETTINGS, ELSE REQUIRE AN ADDRESS
    if (window.location.pathname.split("/")[1]) {
      this.userAddress = window.location.pathname.split("/")[1];
    } else if (this.userAddress != "") {

    } else {
      // IF NO ADDRESS SEND AN ALERT
      alert("defined an account address");
    }
  }

  // THIS METHOD WILL REQUEST DATA BY KEY / REGEX TO THE BLOCKCHAIN NODE
  async getDataByKey(keyname) {
    let data = await fetch(`${this.nodeUrl}/addresses/data/${this.dappAddress}?matches=${keyname}`)
      .then((jsonres) => {
        return jsonres.json();
      })
      .then((res) => {
          return res;
      })
      .catch((err) => {
        console.log(err);
      });
    return data;
  }
}

export default Getdata;
