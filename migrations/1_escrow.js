const Web3 = require("../node_modules/web3/");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:9545"));

const Escrow = artifacts.require("./Escrow.sol");

module.exports = function(deployer) {
  deployer.deploy(
    Escrow,
    web3.eth.accounts[1],
    {
      from: web3.eth.accounts[0],
      value: web3.toWei(1, 'ether'),
      gas: 5200000
    },
  );
};
