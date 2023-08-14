require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");
require('dotenv').config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  networks: {
/*
    hardhat: {
      forking: {
        url: process.env.RPC
      }
    },
*/
    mainnet: {
      url: process.env.RPC,
      accounts: [process.env.PRIVATEKEY]
    },
    rinkeby: {
      url: process.env.RINKEBY_RPC,
      accounts: [process.env.PRIVATEKEY]
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN
  },
};
