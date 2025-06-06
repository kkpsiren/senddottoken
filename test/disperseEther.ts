import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("disperseEther", function () {
  it("sends ETH to multiple recipients", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const Multisender = await ethers.getContractFactory("Multisender");
    const multisender = await Multisender.deploy();
    await multisender.waitForDeployment();

    const recipients = [addr1.address, addr2.address];
    const amounts = [ethers.parseEther("1"), ethers.parseEther("2")];
    const total = amounts[0] + amounts[1];

    const bal1Before = await ethers.provider.getBalance(addr1.address);
    const bal2Before = await ethers.provider.getBalance(addr2.address);

    const tx = await multisender.disperseEther(recipients, amounts, { value: total });

    await expect(tx)
      .to.emit(multisender, "EtherDispersed")
      .withArgs(owner.address, total, recipients.length);

    expect(await ethers.provider.getBalance(addr1.address)).to.equal(bal1Before + amounts[0]);
    expect(await ethers.provider.getBalance(addr2.address)).to.equal(bal2Before + amounts[1]);
  });

  it("reverts on value mismatch", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const Multisender = await ethers.getContractFactory("Multisender");
    const multisender = await Multisender.deploy();
    await multisender.waitForDeployment();

    const recipients = [addr1.address, addr2.address];
    const amounts = [ethers.parseEther("1"), ethers.parseEther("2")];

    await expect(
      multisender.disperseEther(recipients, amounts, { value: amounts[0] })
    ).to.be.revertedWith("value mismatch");
  });
});
