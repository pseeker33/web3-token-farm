// Configuración de redes y contratos
export const networkConfig = {
  // Red local de Hardhat
  1337: {
    networkName: "Localhost 8545",
    DAPP_TOKEN_ADDRESS: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    LP_TOKEN_ADDRESS: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    TOKEN_FARM_ADDRESS: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  },
  // Sepolia testnet
  11155111: {
    networkName: "Sepolia",
    DAPP_TOKEN_ADDRESS: "0xd981743539c1fdf3aD462EFEC1d874F39EbE8b7E",
    LP_TOKEN_ADDRESS: "0x0086b6aA12B3B896BB862923aef9D848638Db116",
    TOKEN_FARM_ADDRESS: "0x3e8F761bA259eAB22c0B92E94bB9Ea51128223B5",
  },
  // Arbitrum Sepolia testnet (aun sin desplegar)
  421614: {
    networkName: "Arbitrum Sepolia",
    DAPP_TOKEN_ADDRESS: "",
    LP_TOKEN_ADDRESS: "",
    TOKEN_FARM_ADDRESS: "",
  },
  // Mainnet (ejemplo)
  1: {
    networkName: "Ethereum Mainnet",
    DAPP_TOKEN_ADDRESS: "0xYourMainnetDappTokenAddress",
    LP_TOKEN_ADDRESS: "0xYourMainnetLPTokenAddress",
    TOKEN_FARM_ADDRESS: "0xYourMainnetTokenFarmAddress",
  },
};

export const getSupportedChainId = (chainId) => {
  return networkConfig[parseInt(chainId)] ? parseInt(chainId) : null;
};

export const getNetworkName = (chainId) => {
  return networkConfig[chainId]?.networkName || "Unsupported Network";
};