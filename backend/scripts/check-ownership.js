// Check ownership of the DappToken contract
// npx hardhat run scripts/check-ownership.js --network sepolia

const hre = require("hardhat");

async function main() {
  const DappToken = await ethers.getContractFactory("DappToken");
  const dappToken = await DappToken.attach("0xd981743539c1fdf3aD462EFEC1d874F39EbE8b7E");
  
  const currentOwner = await dappToken.owner();
  const tokenFarmAddress = "0x3e8F761bA259eAB22c0B92E94bB9Ea51128223B5";
  
  console.log("Current DappToken owner:", currentOwner);
  console.log("TokenFarm address:", tokenFarmAddress);
  console.log("Are they the same?", currentOwner.toLowerCase() === tokenFarmAddress.toLowerCase());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });