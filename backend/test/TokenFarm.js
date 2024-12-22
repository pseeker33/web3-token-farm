const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("TokenFarm", function () {
  let TokenFarm, DappToken, LPToken;
  let tokenFarm, dappToken, lpToken;
  let owner, user1;
  const INITIAL_LP_SUPPLY = ethers.parseEther("1000");
  const STAKE_AMOUNT = ethers.parseEther("100");

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    // Deploy tokens
    DappToken = await ethers.getContractFactory("DappToken");
    dappToken = await DappToken.deploy(owner.address);

    LPToken = await ethers.getContractFactory("LPToken");
    lpToken = await LPToken.deploy(owner.address);

    // Deploy TokenFarm
    TokenFarm = await ethers.getContractFactory("TokenFarm");
    tokenFarm = await TokenFarm.deploy(await dappToken.getAddress(), await lpToken.getAddress());

    // Transfer ownership of DappToken to TokenFarm
    await dappToken.transferOwnership(await tokenFarm.getAddress());
    
    // Mint initial LP tokens to user1
    await lpToken.mint(user1.address, INITIAL_LP_SUPPLY);

    // Approve TokenFarm to spend user1's LP tokens
    await lpToken.connect(user1).approve(await tokenFarm.getAddress(), INITIAL_LP_SUPPLY);

  });

  describe("Basic Functionality", function () {
    it("Should deploy with correct initial state", async function () {
      expect(await tokenFarm.name()).to.equal("Proportional Token Farm");
      expect(await tokenFarm.owner()).to.equal(owner.address);
      expect(await tokenFarm.dappToken()).to.equal(await dappToken.getAddress());
      expect(await tokenFarm.lpToken()).to.equal(await lpToken.getAddress());
    });

    it("Should allow users to stake LP tokens", async function () {
      await tokenFarm.connect(user1).deposit(STAKE_AMOUNT);
      
      expect(await tokenFarm.stakingBalance(user1.address)).to.equal(STAKE_AMOUNT);
      expect(await tokenFarm.totalStakingBalance()).to.equal(STAKE_AMOUNT);
      expect(await tokenFarm.isStaking(user1.address)).to.be.true;
    });

    it("Should allow users to withdraw staked tokens", async function () {
      await tokenFarm.connect(user1).deposit(STAKE_AMOUNT);
      await tokenFarm.connect(user1).withdraw();

      expect(await tokenFarm.stakingBalance(user1.address)).to.equal(0);
      expect(await tokenFarm.totalStakingBalance()).to.equal(0);
      expect(await tokenFarm.isStaking(user1.address)).to.be.false;
    });

    it("Should distribute rewards correctly", async function () {
      // Stake tokens
      await tokenFarm.connect(user1).deposit(STAKE_AMOUNT);
      
      // Mine 5 blocks to generate rewards
      for(let i = 0; i < 5; i++) {
        await network.provider.send("evm_mine");
      }

      // Distribute rewards
      await tokenFarm.connect(owner).distributeRewardsAll();
      
      // Check if rewards were generated
      const pendingRewards = await tokenFarm.pendingRewards(user1.address);
      expect(pendingRewards).to.be.gt(0);
    });

    it("Should allow users to claim rewards", async function () {
      // Stake tokens
      await tokenFarm.connect(user1).deposit(STAKE_AMOUNT);
      
      // Mine 5 blocks to generate rewards
      for(let i = 0; i < 5; i++) {
        await network.provider.send("evm_mine");
      }

      // Distribute rewards
      await tokenFarm.connect(owner).distributeRewardsAll();
      
      // Get initial rewards balance
      const initialRewards = await tokenFarm.pendingRewards(user1.address);
      
      // Claim rewards
      await tokenFarm.connect(user1).claimRewards();
      
      // Check rewards were claimed
      expect(await tokenFarm.pendingRewards(user1.address)).to.equal(0);
      expect(await dappToken.balanceOf(user1.address)).to.equal(initialRewards);
    });
  });

  describe("Error cases", function () {
    it("Should not allow zero deposits", async function () {
      await expect(
        tokenFarm.connect(user1).deposit(0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should not allow withdrawal without stake", async function () {
      await expect(
        tokenFarm.connect(user1).withdraw()
      ).to.be.revertedWith("User is not staking");
    });

    it("Should not allow non-owners to distribute rewards", async function () {
      await expect(
        tokenFarm.connect(user1).distributeRewardsAll()
      ).to.be.revertedWith("Only the owner can distribute rewards");
    });
  });
});