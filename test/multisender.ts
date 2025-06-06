import hre from "hardhat";
const { ethers } = hre;
import { expect } from "chai";

describe("Multisender", function () {
  const amounts = [ethers.parseEther("1"), ethers.parseEther("2")];

  it("emits an event after dispersing ether", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const Multisender = await ethers.getContractFactory("Multisender");
    const multisender = await Multisender.deploy();
    const recipients = [addr1.address, addr2.address];
    const total = amounts[0] + amounts[1];

    await expect(
      multisender.disperseEther(recipients, amounts, { value: total })
    )
      .to.emit(multisender, "EtherDispersed")
      .withArgs(owner.address, total, recipients.length);
  });

  it("transfers the specified amounts", async function () {
    const [_, addr1, addr2] = await ethers.getSigners();
    const Multisender = await ethers.getContractFactory("Multisender");
    const multisender = await Multisender.deploy();
    const recipients = [addr1.address, addr2.address];
    const total = amounts[0] + amounts[1];

    await expect(() =>
      multisender.disperseEther(recipients, amounts, { value: total })
    ).to.changeEtherBalances([addr1, addr2], [amounts[0], amounts[1]]);
  });
});
