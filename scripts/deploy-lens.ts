import hre from "hardhat";
const { ethers } = hre;

async function main() {
  const network = await ethers.provider.getNetwork();
  console.log("Deploying to network:", network.name);
  const Multisender = await ethers.getContractFactory("Multisender");
  const multisender = await Multisender.deploy();
  await multisender.waitForDeployment();
  console.log("Multisender deployed to:", multisender.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
