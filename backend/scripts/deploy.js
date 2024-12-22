const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account: ", deployer.address);
  console.log("Account balance: ", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy DappToken
  const DappToken = await hre.ethers.getContractFactory("DappToken");
  const dappToken = await DappToken.deploy(deployer.address);
  await dappToken.waitForDeployment();
  console.log("DappToken deployed to: ", await dappToken.getAddress());

  // Deploy LPToken
  const LPToken = await hre.ethers.getContractFactory("LPToken");
  const lpToken = await LPToken.deploy(deployer.address);
  await lpToken.waitForDeployment();
  console.log("LPToken deployed to: ", await lpToken.getAddress());

  // Deploy TokenFarm
  const TokenFarm = await hre.ethers.getContractFactory("TokenFarm");
  const tokenFarm = await TokenFarm.deploy(
    await dappToken.getAddress(),
    await lpToken.getAddress()
  );
  await tokenFarm.waitForDeployment();
  console.log("TokenFarm deployed to: ", await tokenFarm.getAddress());

  // Transferir la propiedad del DappToken al TokenFarm
  console.log("\nTransferring DappToken ownership to TokenFarm...");
  await dappToken.transferOwnership(await tokenFarm.getAddress());
  console.log("DappToken ownership transferred to TokenFarm");

  // Opcional: Mint algunos tokens iniciales para testing
  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1 millón de tokens
  await lpToken.mint(deployer.address, INITIAL_SUPPLY);
  console.log("Minted ", ethers.formatEther(INITIAL_SUPPLY), " LP tokens to deployer");

  // Guardar las direcciones de los contratos para fácil acceso
  console.log("\nContract Addresses:");
  console.log("==================");
  console.log(`export const DAPP_TOKEN_ADDRESS = "${await dappToken.getAddress()}"`);
  console.log(`export const LP_TOKEN_ADDRESS = "${await lpToken.getAddress()}"`);
  console.log(`export const TOKEN_FARM_ADDRESS = "${await tokenFarm.getAddress()}"`);

  // Verificar los contratos en Etherscan (solo para redes públicas)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\nVerifying contracts...");
    
    await hre.run("verify:verify", {
      address: await dappToken.getAddress(),
      contract: "contracts/DappToken.sol:DappToken",
      constructorArguments: [deployer.address],
    });

    await hre.run("verify:verify", {
      address: await lpToken.getAddress(),
      contract: "contracts/LPToken.sol:LPToken",      
      constructorArguments: [deployer.address],
    });

    await hre.run("verify:verify", {
      address: await tokenFarm.getAddress(),
      contract: "contracts/TokenFarm.sol:TokenFarm",
      constructorArguments: [
        await dappToken.getAddress(),
        await lpToken.getAddress(),
      ],
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });