export const tokenList = [
  { symbol: "GHO", address: "", decimals: 18 },
  {
    symbol: "WGHO",
    address: "0x6bDc36E20D267Ff0dd6097799f82e78907105e2F",
    decimals: 18,
  },
  {
    symbol: "BONSAI",
    address: "0xB0588f9A9cADe7CD5f194a5fe77AcD6A58250f82",
    decimals: 18,
  },
  {
    symbol: "WETH",
    address: "0xE5ecd226b3032910CEaa43ba92EE8232f8237553",
    decimals: 18,
  },
  {
    symbol: "USDC",
    address: "0x88F08E304EC4f90D644Cec3Fb69b8aD414acf884",
    decimals: 6,
  },
] as const;

export type TokenSymbol = (typeof tokenList)[number]["symbol"];
