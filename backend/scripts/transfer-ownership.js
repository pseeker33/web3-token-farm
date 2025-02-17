// Transfer ownership of DappToken to TokenFarm
// npx hardhat run scripts/transfer-ownership.js --network sepolia

const hre = require("hardhat");

async function main() {
  const DappToken = await ethers.getContractFactory("DappToken");
  const dappToken = await DappToken.attach("0xd981743539c1fdf3aD462EFEC1d874F39EbE8b7E");
  
  console.log("Transferring ownership to TokenFarm...");
  
  const tx = await dappToken.transferOwnership("0x3e8F761bA259eAB22c0B92E94bB9Ea51128223B5");
  await tx.wait();
  
  const newOwner = await dappToken.owner();
  console.log("New owner:", newOwner);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });