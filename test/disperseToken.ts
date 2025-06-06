import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("disperseToken", function () {
  it("sends tokens to multiple recipients", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const Multisender = await ethers.getContractFactory("Multisender");
    const multisender = await Multisender.deploy();
    await multisender.waitForDeployment();

    const Token = await ethers.getContractFactory("TestToken");
    const token = await Token.deploy();
    await token.mint(owner.address, 300);
    await token.approve(multisender.target, 300);

    const recipients = [addr1.address, addr2.address];
    const amounts = [100n, 200n];

    const tx = await multisender.disperseToken(token.target, recipients, amounts);

    await expect(tx)
      .to.emit(multisender, "TokenDispersed")
      .withArgs(token.target, owner.address, 300n, recipients.length);

    expect(await token.balanceOf(addr1.address)).to.equal(amounts[0]);
    expect(await token.balanceOf(addr2.address)).to.equal(amounts[1]);
  });

  it("reverts when transferFrom fails", async function () {
    const [owner, addr1] = await ethers.getSigners();
    const Multisender = await ethers.getContractFactory("Multisender");
    const multisender = await Multisender.deploy();
    await multisender.waitForDeployment();

    const Token = await ethers.getContractFactory("TestToken");
    const token = await Token.deploy();
    await token.mint(owner.address, 100);
    await token.setFailTransferFrom(true);
    await token.approve(multisender.target, 100);

    await expect(
      multisender.disperseToken(token.target, [addr1.address], [100])
    ).to.be.revertedWith("transferFrom failed");
  });

  it("reverts when transfer fails", async function () {
    const [owner, addr1] = await ethers.getSigners();
    const Multisender = await ethers.getContractFactory("Multisender");
    const multisender = await Multisender.deploy();
    await multisender.waitForDeployment();

    const Token = await ethers.getContractFactory("TestToken");
    const token = await Token.deploy();
    await token.mint(owner.address, 100);
    await token.approve(multisender.target, 100);
    await token.setFailTransfer(true);

    await expect(
      multisender.disperseToken(token.target, [addr1.address], [100])
    ).to.be.revertedWith("transfer failed");
  });
});
