# Reown AppKit Example using ethers (next.js with App Router)

This is a Next.js project.

## Usage

1. Go to [Reown Cloud](https://cloud.reown.com) and create a new project.
2. Copy your `Project ID`
3. Rename `.env.example` to `.env` and paste your `Project ID` as the value for `NEXT_PUBLIC_PROJECT_ID`
4. Run `npm install` to install dependencies
5. Run `npm run dev` to start the development server

## Resources

- [Reown — Docs](https://docs.reown.com)
- [Next.js — Docs](https://nextjs.org/docs)

## Contracts

This repository includes `contracts/Multisender.sol`, a minimal Solidity contract that enables batch distribution of ETH or ERC-20 tokens. It exposes `disperseEther` and `disperseToken` functions so you can send funds to multiple recipients in a single transaction.

## Deployment

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and fill in `RPC_URL` and `PRIVATE_KEY` for the target network or `RPC_URL_LENS` and `PRIVATE_KEY_LENS` for Lens Chain.
3. Run `npx hardhat run scripts/deploy.ts --network custom` to deploy to a custom network or `npx hardhat run scripts/deploy-lens.ts --network lens` to deploy on Lens Chain.
4. Copy the printed contract address into `NEXT_PUBLIC_MULTISENDER_ADDRESS` in your `.env` file for the frontend.

## Testing

Run `npm run test` to execute Hardhat tests. Note that Hardhat downloads the Solidity compiler at runtime, which may fail in restricted networks.
