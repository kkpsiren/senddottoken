# Send.Token

Send.Token is a Next.js app.
It sends native GHO and ERC-20 tokens to many recipients in one transaction.
The app uses the Reown AppKit `lens` network from `src/config/index.ts`.

The batch contract is `Multisender` in `contracts/Multisender.sol`.
`disperseEther` sends the native token.
The app calls that method for GHO.
`disperseToken` sends one ERC-20 token.
The app reads the contract address from `NEXT_PUBLIC_MULTISENDER_ADDRESS`.
`.env.example` sets that variable to `0x6207DA5EbFcc45F56Ef2dacD3441516f65aDDe9D` for Lens mainnet.
The app throws when the variable is missing.

`src/constants/tokens.ts` lists GHO, WGHO, BONSAI, WETH, and USDC.
GHO uses an empty token address, so the app treats it as the native token.
USDC uses 6 decimals.
The other listed tokens use 18 decimals.

The form takes one `recipient,amount` pair on each line.
A recipient can be an `0x` address or a Lens username.
`resolveRecipient` in `src/utils/lensAccounts.ts` turns a username into an address.
The Lens namespace constant is `LENS_NAMESPACE`.
An ERC-20 send first approves `Multisender`.
The app then calls `disperseToken`.
A GHO send calls `disperseEther`.
The transaction `value` equals the total amount.
A connected wallet can list `EtherDispersed` and `TokenDispersed` logs.
`NEXT_PUBLIC_TIP_RECIPIENT` shows an optional tip field when it is set.

`contracts/TestToken.sol` is the ERC-20 used by the Hardhat tests.
`scripts/deploy.ts` deploys `Multisender` on the default Hardhat network.
`scripts/deploy-lens.ts` deploys `Multisender` and prints the new address.

## Setup

```bash
git clone https://github.com/kkpsiren/senddottoken
cd senddottoken
npm install
cp .env.example .env
```

Fill in `.env` on your machine.
Do not commit `.env`.
`NEXT_PUBLIC_PROJECT_ID` is the Reown project id.
`src/config/index.ts` uses a public localhost project id when that variable is empty.
`RPC_URL_LENS`, `PRIVATE_KEY_LENS`, and `CHAIN_ID_LENS` are for `npm run deploy:lens`.
`hardhat.config.ts` falls back to `PRIVATE_KEY` when `PRIVATE_KEY_LENS` is empty.
`RPC_URL` and `PRIVATE_KEY` configure the optional `custom` network.

## Scripts

`npm run dev` starts the Next.js dev server.
`npm run lint` runs `next lint`.
`npm test` runs `hardhat test`.
`npm run build` builds the Next.js app.
`npm start` serves that build.
`npm run deploy:lens` runs `hardhat run scripts/deploy-lens.ts --network lens`.
`npx hardhat compile` compiles the Solidity contracts.
