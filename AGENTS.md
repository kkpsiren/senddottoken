# Send.Token

Send.Token is a Next.js app.
It batch-sends native GHO and ERC-20 tokens on the Lens network.
`contracts/Multisender.sol` holds `disperseEther` and `disperseToken`.
The web app calls the address in `NEXT_PUBLIC_MULTISENDER_ADDRESS`.

## Directories

- `src/app` holds the Next.js pages.
- `src/components` holds the send form, wallet button, and transaction history.
- `src/config` holds the Reown AppKit and wagmi setup.
- `src/constants/tokens.ts` holds the token list.
- `src/utils/lensAccounts.ts` resolves a Lens username.
- `contracts` holds `Multisender.sol` and the test token `TestToken.sol`.
- `scripts/deploy-lens.ts` deploys `Multisender` to the `lens` network.
- `scripts/deploy.ts` deploys `Multisender` on the default Hardhat network.
- `test` holds the Hardhat tests.

## Commands

- `npm run dev` starts the Next.js dev server.
- `npm run lint` lints the project.
- `npm test` runs the Hardhat tests.
- `npm run deploy:lens` deploys `Multisender` to Lens.
- `npx hardhat compile` compiles the Solidity contracts.

Use two spaces for indentation in TypeScript, Solidity, and configuration files.
Run `npm run lint` after code changes.
Run `npx hardhat compile` after Solidity changes.
Record the lint and compile results in the pull request summary.
Do not commit secrets.
Keep private keys in `.env`.
`.env.example` lists the variable names.
