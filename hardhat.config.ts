import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    ...(process.env.RPC_URL && {
      custom: {
        url: process.env.RPC_URL,
        accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
      }
    }),
    ...(process.env.RPC_URL_LENS && {
      lens: {
        url: process.env.RPC_URL_LENS,
        accounts: process.env.PRIVATE_KEY_LENS
          ? [process.env.PRIVATE_KEY_LENS]
          : process.env.PRIVATE_KEY
            ? [process.env.PRIVATE_KEY]
            : [],
        chainId: process.env.CHAIN_ID_LENS
          ? parseInt(process.env.CHAIN_ID_LENS)
          : undefined
      }
    })
  }
};

export default config;
