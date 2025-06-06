import { ethers } from "hardhat";

async function main() {
  const Multisender = await ethers.getContractFactory("Multisender");
  const multisender = await Multisender.deploy();
  await multisender.waitForDeployment();
  console.log("Multisender deployed to:", multisender.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
