import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { networkConfig, getSupportedChainId } from "./config";
import "./App.css";
const isDevelopment = false; // Change to true for debugging mode


export default function App() {
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [lpBalance, setLpBalance] = useState("0");
  const [stakedBalance, setStakedBalance] = useState("0");
  const [pendingRewards, setPendingRewards] = useState("0");
  const [depositAmount, setDepositAmount] = useState("");

  // Verificar y manejar cambios de red
  const handleChainChanged = (chainId, isInitialConnection = false) => {
    const newChainId = getSupportedChainId(chainId);
    setChainId(newChainId);
    setWrongNetwork(!newChainId);

    // Solo cargar balances si hay un chainId válido y NO es la conexión inicial
    if (newChainId && account && !isInitialConnection) {
      loadBalances();
    }   
  };

  // Conectar wallet con soporte de red
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        // Obtener cuenta
        const accounts = await window.ethereum.request({method: "eth_requestAccounts",});
        setAccount(accounts[0]);

        // Obtener y verificar red
        const chainId = await window.ethereum.request({method: "eth_chainId",});
        handleChainChanged(chainId, true); // true indica que es la conexión inicial

        // Escuchar cambios de red
        window.ethereum.on("chainChanged", handleChainChanged);

      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const fetchAbi = async (contractName) => {
    console.log("Contract Name:", contractName);
    try {
      const response = await fetch(`/abi/${contractName}.json`);
      if (!response.ok) throw new Error("Failed to fetch ABI");
      const data = await response.json();
      return data.abi;
    } catch (error) {
      console.error(`Error fetching ABI for ${contractName}:`, error);
      return [];
    }
  };

  const getContract = async (contractName, signer) => {
    console.log("Contract Name:", contractName);

    if (!chainId || !networkConfig[chainId]) {
      const error = new Error("Chain ID or network configuration is missing.");
      console.error(error);
      throw error;
    }

    try {
      // Cargar contratos basados en la red actual
      const { DAPP_TOKEN_ADDRESS, LP_TOKEN_ADDRESS, TOKEN_FARM_ADDRESS } = networkConfig[chainId];
      const contracts = {
        DAPP_TOKEN_ADDRESS,
        LP_TOKEN_ADDRESS,
        TOKEN_FARM_ADDRESS,
      };

      if (!contracts) {
        const error = new Error("Contracts not found for the current network.");
        console.error(error);
        throw error;
      }

      // Cargar ABI y dirección del contrato solicitado
      const abi = await fetchAbi(contractName);

      const address = contracts[`${contractName.toUpperCase()}_ADDRESS`];
      //const address = contracts[`${contractName.toUpperCase()}`];
      //const address = contracts[contractName];

      if (!abi) {
        const error = new Error(`Missing ABI or address for contract: ${contractName}`);
        console.error(error);
        throw error;
      }
      
      if (!address) {
        const error = new Error(`Missing address for contract: ${contractName}`);
        console.error(error);
        throw error;
      }

      // Retornar instancia del contrato de la red actual
      return new ethers.Contract(address, abi, signer);
    } catch (error) {
      console.error("Error in getContract:", error);
      throw error;  // Re-throw the error after logging it
    }
  };

  // Load balances
  const loadBalances = async () => {
    if (!chainId) {
      const error = new Error("Chain ID is missing.");
      console.error(error);
      throw error;
    }

    if (!account) {
      const error = new Error("Account is missing.");
      console.error(error);
      throw error;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Cargar contratos con las direcciones de la red actual
      const lpToken = await getContract("LP_Token", signer);
      const tokenFarm = await getContract("Token_Farm", signer);

      if (!lpToken || !tokenFarm) {
        const error = new Error("Error loading contracts");
        console.error(error);
        throw error;
      }

      // Obtener balances
      const lpBal = await lpToken.balanceOf(account);
      const stakedBal = await tokenFarm.stakingBalance(account);
      const rewards = await tokenFarm.pendingRewards(account);

      setLpBalance(ethers.formatEther(lpBal));
      setStakedBalance(ethers.formatEther(stakedBal));
      setPendingRewards(ethers.formatEther(rewards));

    } catch (error) {
      console.error("Error loading balances:", error);
    }
  };

  // Depositar LP tokens
  const deposit = async () => {
  
    // Verificación de los parámetros antes de proceder
    if (!account) {
      const error = new Error("Account is missing.");
      console.error(error);
      throw error;
    }

    if (!depositAmount) {
      const error = new Error("Deposit amount is missing.");
      console.error(error);
      throw error;
    }
    setLoading(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Cargar contratos con las direcciones de la red actual
      const lpToken = await getContract("LP_Token", signer);
      const tokenFarm = await getContract("Token_Farm", signer);

      if (!lpToken || !tokenFarm) {
        const error = new Error("Error loading contracts.");
        console.error(error);
        throw error;
      }

      // Obtener la dirección del contrato TokenFarm directamente desde networkConfig
      const tokenFarmAddress = networkConfig[chainId].TOKEN_FARM_ADDRESS;

      // Aprobar tokens
      const amount = ethers.parseEther(depositAmount);
      await lpToken.approve(tokenFarmAddress, amount);

      // Depositar
      const tx = await tokenFarm.deposit(amount);
      await tx.wait();

      loadBalances();
      setDepositAmount("");

    } catch (error) {
      console.error("Error depositing:", error);
    } finally {
      setLoading(false);
    }
  };

  // Retirar LP tokens
  const withdraw = async () => {
    if (!account) {
      const error = new Error("Account is missing.");
      console.error(error);
      throw error;
    }

    setLoading(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Cargar contratos con las direcciones de la red actual
      const tokenFarm = await getContract("Token_Farm", signer);

      if (!tokenFarm) {
        const error = new Error("Error loading TokenFarm contract");
        console.error(error);
        throw error;
      }

      const tx = await tokenFarm.withdraw();
      await tx.wait();

      loadBalances();
    } catch (error) {
      console.error("Error withdrawing:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reclamar recompensas
  const claimRewards = async () => {
    if (!account) {
      const error = new Error("Account is missing.");
      console.error(error);
      throw error;
    }

    console.log("Pending Rewards:", pendingRewards); // Verifica que hay recompensas pendientes

    setLoading(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Cargar el contrato
      const tokenFarm = await getContract("Token_Farm", signer);

      if (!tokenFarm) {
        const error = new Error("Error loading TokenFarm contract");
        console.error(error);
        throw error;
      }

      // Verificar recompensas pendientes antes de llamar
      const rewards = await tokenFarm.pendingRewards(account);
      console.log("Pending rewards (raw):", rewards.toString());
      
      if (rewards.toString() === "0") {
          throw new Error("No pending rewards to claim");
      }

      // Verificar el checkpoint del usuario
      const userInfo = await tokenFarm.checkpoints(account);
      console.log("Last checkpoint:", userInfo.toString());
      console.log("Current block:", await provider.getBlockNumber());

      // Verificar el balance stakeado
      const stakedBalance = await tokenFarm.stakingBalance(account);
      console.log("Staked balance:", ethers.formatEther(stakedBalance));

      // Intentar estimar el gas primero
      try {
        const estimatedGas = await tokenFarm.claimRewards.estimateGas();
        console.log("Estimated gas:", estimatedGas.toString());
      } catch (gasError) {
          console.error("Gas estimation failed:", gasError);
      }

      // Intentar reclamar recompensas
      const tx = await tokenFarm.claimRewards();
      console.log("Transaction sent:", tx.hash);

      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      await loadBalances();

    } catch (error) {
      console.error("Error claiming rewards:", error);
      // Si el error tiene datos adicionales, mostrarlos
      if (error.data) {
        console.error("Error data:", error.data);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };


  // Funcion Debug para verificar que las recompensas se están distribuyendo correctamente.
  // Se agrega un botón temporal para el debuggeo:
  const debugRewardsCalculation = async () => {
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const tokenFarm = await getContract("Token_Farm", signer);

        // Obtener datos relevantes
        const totalStaked = await tokenFarm.totalStakingBalance();
        const userStaked = await tokenFarm.stakingBalance(account);
        const checkpoint = await tokenFarm.checkpoints(account);
        const currentBlock = await provider.getBlockNumber();
        const pendingRewards = await tokenFarm.pendingRewards(account);

        console.log("Debug info:");
        console.log("Total staked:", ethers.formatEther(totalStaked));
        console.log("User staked:", ethers.formatEther(userStaked));
        console.log("Last checkpoint:", checkpoint.toString());
        console.log("Current block:", currentBlock);
        console.log("Blocks passed:", currentBlock - checkpoint);
        console.log("Pending rewards:", ethers.formatEther(pendingRewards));

    } catch (error) {
        console.error("Error debugging rewards:", error);
    }
  };

  // Funcion Debug para verificar que el TokenFarm tiene permisos para acuñar DappTokens
  // Se llama a esta función después de conectar la wallet (buscalo en el useEffect)

  const checkMintingPermissions = async () => {
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        const tokenFarm = await getContract("Token_Farm", signer);
        const dappToken = await getContract("Dapp_Token", signer);
        
        const tokenFarmAddress = await tokenFarm.getAddress();
        const dappTokenOwner = await dappToken.owner();
        
        console.log("TokenFarm address:", tokenFarmAddress);
        console.log("DappToken owner:", dappTokenOwner);
        
        if (tokenFarmAddress.toLowerCase() !== dappTokenOwner.toLowerCase()) {
            console.error("TokenFarm does not have permission to mint DappTokens!");
        }
        
    } catch (error) {
        console.error("Error checking permissions:", error);
    }
};

 // Funcion Debug para verificar las direcciones actuales
 // Se agrega un botón temporal para el debuggeo
 const debugOwnership = async () => {
  try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const tokenFarm = await getContract("Token_Farm", signer);
      const dappToken = await getContract("Dapp_Token", signer);
      
      const tokenFarmAddress = await tokenFarm.getAddress();
      const currentOwner = await dappToken.owner();
      
      console.log("Current setup:");
      console.log("TokenFarm address:", tokenFarmAddress);
      console.log("DappToken current owner:", currentOwner);
      console.log("Your address:", account);
      
  } catch (error) {
      console.error("Error checking ownership:", error);
  }
};

 // Funcion para transferir la propiedad del contrato DAppToken al contrato TokenFarm
 // Se agrega un botón temporal
 const transferDappTokenOwnership = async () => {
  try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const tokenFarm = await getContract("Token_Farm", signer);
      const dappToken = await getContract("Dapp_Token", signer);
      
      const tokenFarmAddress = await tokenFarm.getAddress();
      
      console.log("Transferring ownership to TokenFarm:", tokenFarmAddress);
      
      const tx = await dappToken.transferOwnership(tokenFarmAddress);
      await tx.wait();
      
      console.log("Ownership transferred successfully!");
      
      // Verificar el cambio
      const newOwner = await dappToken.owner();
      console.log("New DappToken owner:", newOwner);
      
  } catch (error) {
      console.error("Error transferring ownership:", error);
  }
};

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

    useEffect(() => {
      console.log("Account:", account);
      console.log("ChainId:", chainId);
    }, [account, chainId]);
  

  useEffect(() => {
    if (account && chainId) {
      loadBalances();
      checkMintingPermissions();
    }
  }, [account, chainId]);

  useEffect(() => {
    // Si ya hay una wallet conectada al cargar la página
    if (window.ethereum && window.ethereum.selectedAddress) {
      connectWallet();
    }
  }, []); // Solo se ejecuta una vez al montar el componente

    return (
      <div className="container">
        <div className="content-wrapper">
          <div className="header">
            <h1>Token Farm</h1>

            <div className="wallet-section">
              {!account ? (
                <button onClick={connectWallet}>Connect Wallet</button>
              ) : (
                <span className="wallet-address">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
              )}
            </div>

            {wrongNetwork && (
              <div className="alert">
                <div className="alert-description">
                  Please connect to a supported network (
                  {Object.values(networkConfig)
                    .map((net) => net.networkName)
                    .join(", ")}
                  )
                </div>
              </div>
            )}
          </div>

          {account && (
            <div className="account-details">

              <div className="balance-grid">
                <div className="card">
                  <h3>LP Balance</h3>
                  <p>{lpBalance} LP</p>
                </div>
                <div className="card">
                  <h3>Staked Balance</h3>
                  <p>{stakedBalance} LP</p>
                </div>
                <div className="card">
                  <h3>Pending Rewards</h3>
                  <p>{pendingRewards} DAPP</p>
                </div>
              </div>

              <div className="transaction-actions">
                <div className="deposit-container">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Amount to deposit"
                  />
                  <button onClick={deposit} disabled={loading}>
                    Deposit
                  </button>
                </div>

                <div className="withdraw-reward">
                  <button onClick={withdraw} disabled={loading}>
                    Withdraw All
                  </button>
                  <button onClick={claimRewards} disabled={loading}>
                    Claim Rewards
                  </button>                  
                </div>
              </div>
              
              {isDevelopment && (
                <div className="debug-section">
                  <button onClick={debugOwnership}>Check Ownership</button>
                  <button onClick={transferDappTokenOwnership}>Transfer Ownership</button>
                  <button onClick={debugRewardsCalculation}>Rewards Info</button>
                </div>
              )}
            </div>

          )}
        </div>
      </div>
    );
}
