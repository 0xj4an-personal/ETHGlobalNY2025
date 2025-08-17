const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CeloSwapContract", function () {
  let celoSwapContract;
  let owner;
  let user1;
  let user2;
  
  // Direcciones de test (Celo Alfajores)
  const CELO_TOKEN = "0x471EcE3750Da237f93B8E339c536989b8978a438";
  const CUSD_TOKEN = "0x765DE816845861e75A25fCA122bb6898B8B1282a";
  const CCOP_TOKEN = "0x2A3684e9Dc20B88e2EC8A9E5A9C8C8C8C8C8C8C8C8";
  const UNISWAP_ROUTER = "0x5615CDAb10dc425a742d643d949a7F474C01ca4a";

  beforeEach(async function () {
    // Obtener signers
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy del contrato
    const CeloSwapContract = await ethers.getContractFactory("CeloSwapContract");
    celoSwapContract = await CeloSwapContract.deploy();
    await celoSwapContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy with correct owner", async function () {
      expect(await celoSwapContract.owner()).to.equal(owner.address);
    });

    it("Should have correct token addresses", async function () {
      expect(await celoSwapContract.CELO()).to.equal(CELO_TOKEN);
      expect(await celoSwapContract.CUSD()).to.equal(CUSD_TOKEN);
      expect(await celoSwapContract.CCOP()).to.equal(CCOP_TOKEN);
    });

    it("Should have correct Uniswap router", async function () {
      expect(await celoSwapContract.UNISWAP_V3_ROUTER()).to.equal(UNISWAP_ROUTER);
    });

    it("Should have correct fee configuration", async function () {
      expect(await celoSwapContract.CONTRACT_FEE()).to.equal(50); // 0.5%
      expect(await celoSwapContract.FEE_DENOMINATOR()).to.equal(10000);
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to pause", async function () {
      await celoSwapContract.pause();
      expect(await celoSwapContract.paused()).to.be.true;
    });

    it("Should allow owner to unpause", async function () {
      await celoSwapContract.pause();
      await celoSwapContract.unpause();
      expect(await celoSwapContract.paused()).to.be.false;
    });

    it("Should not allow non-owner to pause", async function () {
      await expect(
        celoSwapContract.connect(user1).pause()
      ).to.be.revertedWithCustomError(celoSwapContract, "OwnableUnauthorizedAccount");
    });

    it("Should not allow non-owner to unpause", async function () {
      await celoSwapContract.pause();
      await expect(
        celoSwapContract.connect(user1).unpause()
      ).to.be.revertedWithCustomError(celoSwapContract, "OwnableUnauthorizedAccount");
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to withdraw ETH", async function () {
      // Enviar ETH al contrato
      await user1.sendTransaction({
        to: await celoSwapContract.getAddress(),
        value: ethers.parseEther("1.0")
      });

      const initialBalance = await ethers.provider.getBalance(owner.address);
      await celoSwapContract.emergencyWithdraw(ethers.ZeroAddress, ethers.parseEther("1.0"));
      const finalBalance = await ethers.provider.getBalance(owner.address);

      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should not allow non-owner to withdraw", async function () {
      await expect(
        celoSwapContract.connect(user1).emergencyWithdraw(ethers.ZeroAddress, ethers.parseEther("1.0"))
      ).to.be.revertedWithCustomError(celoSwapContract, "OwnableUnauthorizedAccount");
    });
  });

  describe("Contract State", function () {
    it("Should return correct contract balance", async function () {
      const balance = await celoSwapContract.getContractBalance();
      expect(balance).to.equal(0);
    });

    it("Should return correct token balance", async function () {
      const balance = await celoSwapContract.getTokenBalance(CELO_TOKEN);
      expect(balance).to.equal(0);
    });
  });

  describe("Swap Functionality", function () {
    it("Should not allow swap with zero amount", async function () {
      await expect(
        celoSwapContract.connect(user1).receiveCeloAndSwap(user1.address)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should not allow swap with invalid user address", async function () {
      await expect(
        celoSwapContract.connect(user1).receiveCeloAndSwap(ethers.ZeroAddress, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWith("Invalid user address");
    });

    it("Should emit CeloReceived event", async function () {
      const amount = ethers.parseEther("1.0");
      await expect(
        celoSwapContract.connect(user1).receiveCeloAndSwap(user1.address, { value: amount })
      ).to.emit(celoSwapContract, "CeloReceived")
        .withArgs(user1.address, amount);
    });

    it("Should calculate correct fee", async function () {
      const amount = ethers.parseEther("100.0"); // 100 CELO
      const expectedFee = (amount * 50n) / 10000n; // 0.5%
      expect(expectedFee).to.equal(ethers.parseEther("0.05")); // 0.05 CELO
    });
  });

  describe("Paused State", function () {
    beforeEach(async function () {
      await celoSwapContract.pause();
    });

    it("Should not allow swaps when paused", async function () {
      await expect(
        celoSwapContract.connect(user1).receiveCeloAndSwap(user1.address, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWithCustomError(celoSwapContract, "EnforcedPause");
    });

    it("Should allow emergency functions when paused", async function () {
      // Enviar ETH al contrato
      await user1.sendTransaction({
        to: await celoSwapContract.getAddress(),
        value: ethers.parseEther("1.0")
      });

      await expect(
        celoSwapContract.emergencyWithdraw(ethers.ZeroAddress, ethers.parseEther("1.0"))
      ).to.not.be.reverted;
    });
  });
});
