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
