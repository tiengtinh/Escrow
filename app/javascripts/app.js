// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import escrow_artifacts from '../../build/contracts/Escrow.json'
import escrow_factory_artifacts from '../../build/contracts/EscrowFactory.json'

var Escrow = contract(escrow_artifacts);
var EscrowFactory = contract(escrow_factory_artifacts);

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts;
var account;

window.App = {
  start: async function() {
    var self = this;

    // Bootstrap the MetaCoin abstraction for Use.
    EscrowFactory.setProvider(web3.currentProvider);
    Escrow.setProvider(web3.currentProvider);

    EscrowFactory.web3.eth.defaultAccount = web3.eth.accounts[0]
    Escrow.web3.eth.defaultAccount = web3.eth.accounts[0]

    const instance = await EscrowFactory.deployed()

    function stringifyOk(ok) {
      switch (ok.toString()) {
        case '0': return 'undecided'
        case '1': return 'accepted'
        case '2': return 'rejected'
        default: throw 'wat?: ' + ok.toString()
      }
    }

    instance.EscrowCreated(async (err, result) => {
      console.log('EscrowCreated', err, result)

      const escrow = Escrow.at(result.args.newAddress)
      const createdAt = await escrow.createdAt()
      const buyerOk = await escrow.buyerOk()
      const sellerOk = await escrow.sellerOk()
      console.log({
        address: result.args.newAddress,
        createdAt, buyerOk, sellerOk,
      })

      $('#contracts').append(`<div>
        ${ result.args.newAddress }
        <br>
        Created at ${ new Date(createdAt.toNumber()).toJSON() }
        <br>
        BuyerOk: ${ stringifyOk(buyerOk) }
        <br>
        SellerOk: ${ stringifyOk(sellerOk) }
        <br>
        <button onclick="App.accept('${ result.args.newAddress }')">Accept</button>
        <button onclick="App.reject('${ result.args.newAddress }')">Reject</button>
      </div>`)
    })

    // Get the initial account balance so it can be displayed.
    // web3.eth.getAccounts(function(err, accs) {
    //   if (err != null) {
    //     alert("There was an error fetching your accounts.");
    //     return;
    //   }

    //   if (accs.length == 0) {
    //     alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
    //     return;
    //   }

    //   accounts = accs;
    //   account = accounts[0];

    //   self.refreshBalance();
    // });
  },

  async createEscrow() {
    const amount = parseInt($('#amount').val());
    const seller = $('#seller').val();
    console.log({
      amount,
      seller,
    })

    const instance = await EscrowFactory.deployed()
    // web3.eth.defaultAccount = web3.eth.accounts[0]
    

    console.log('from: ', web3.eth.accounts[0])
    const result = await instance.createEscrow.sendTransaction(seller, {
      // from: web3.eth.accounts[0],
      value: web3.toWei(amount, 'ether'),
      // gas: 4712388,
      // gasPrice: 100000000000,
    })

    console.log('result: ', result)
  },

  accept: async function(escrowAddress) {
    const escrow = Escrow.at(escrowAddress)
    const result = await escrow.accept()
    console.log('accept result: ', result)
  },

  refreshBalance: function() {
    var self = this;

    var meta;
    MetaCoin.deployed().then(function(instance) {
      meta = instance;
      return meta.getBalance.call(account, {from: account});
    }).then(function(value) {
      var balance_element = document.getElementById("balance");
      balance_element.innerHTML = value.valueOf();
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error getting balance; see log.");
    });
  },

  sendCoin: function() {
    var self = this;

    var amount = parseInt(document.getElementById("amount").value);
    var receiver = document.getElementById("receiver").value;

    this.setStatus("Initiating transaction... (please wait)");

    var meta;
    MetaCoin.deployed().then(function(instance) {
      meta = instance;
      return meta.sendCoin(receiver, amount, {from: account});
    }).then(function() {
      self.setStatus("Transaction complete!");
      self.refreshBalance();
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error sending coin; see log.");
    });
  }
};

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));
  }

  App.start();
});
