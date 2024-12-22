// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./DappToken.sol";
import "./LPToken.sol";

/**
 * @title Proportional Token Farm
 * @notice Una granja de staking donde las recompensas se distribuyen proporcionalmente al total stakeado.
 */
contract TokenFarm {
    //
    // Variables de estado
    //
    string public name = "Proportional Token Farm";
    address public owner;
    DappToken public dappToken;
    LPToken public lpToken;

    uint256 public constant REWARD_PER_BLOCK = 1e18; // Recompensa por bloque (total para todos los usuarios)
    uint256 public totalStakingBalance; // Total de tokens en staking

    address[] public stakers;
    mapping(address => uint256) public stakingBalance;
    mapping(address => uint256) public checkpoints;
    mapping(address => uint256) public pendingRewards;
    mapping(address => bool) public hasStaked;
    mapping(address => bool) public isStaking;

    // Eventos
    // Agregar eventos para Deposit, Withdraw, RewardsClaimed y RewardsDistributed.
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsDistributed(uint256 totalDistributed, uint256 blockNumber);
    

    // Constructor
    constructor(DappToken _dappToken, LPToken _lpToken) {
        // Configurar las instancias de los contratos de DappToken y LPToken.
        // Configurar al owner del contrato como el creador de este contrato.
        dappToken = _dappToken;
        lpToken = _lpToken;
        owner = msg.sender; 
    }

    /**
     * @notice Deposita tokens LP para staking.
     * @param _amount Cantidad de tokens LP a depositar.
     */
    function deposit(uint256 _amount) external {

        // Verificar que _amount sea mayor a 0.
        require(_amount > 0, "Amount must be greater than 0");

        // Transferir tokens LP del usuario a este contrato.
        lpToken.transferFrom(msg.sender, address(this), _amount);

        // Actualizar el balance de staking del usuario en stakingBalance.
        stakingBalance[msg.sender] += _amount;

        // Incrementar totalStakingBalance con _amount.
        totalStakingBalance += _amount;

        // Si el usuario deposita porprimera vez, inicializar su checkpoint con el bloque actual.
        if (checkpoints[msg.sender] == 0) {
            checkpoints[msg.sender] = block.number;
        }

        // Si el usuario nunca ha hecho staking antes, agregarlo al array stakers y marcar hasStaked como true.
        if (!hasStaked[msg.sender]) {
            stakers.push(msg.sender);
            hasStaked[msg.sender] = true;
        }

        // Actualizar isStaking del usuario a true.
        isStaking[msg.sender] = true;


        // Calcular y registrar las recompensas pendientes del usuario antes de actualizar balances
        distributeRewards(msg.sender);

        // Emitir un evento de depósito.
        emit Deposit(msg.sender, _amount);

    }

    /**
     * @notice Retira todos los tokens LP en staking.
     */
    function withdraw() external {

        // Verificar que el usuario está haciendo staking (isStaking == true).
        require(isStaking[msg.sender], "User is not staking");

        // Obtener el balance de staking del usuario.
        uint256 balance = stakingBalance[msg.sender];

        // Verificar que el balance de staking sea mayor a 0.
        require(balance > 0, "Staking balance must be greater than 0");

        // Llamar a distributeRewards para calcular y actualizar las recompensas pendientes antes de restablecer el balance.
        distributeRewards(msg.sender);

        // Restablecer stakingBalance del usuario a 0.
        stakingBalance[msg.sender] = 0;

        // Reducir totalStakingBalance en el balance que se está retirando.
        totalStakingBalance -= balance;

        // Actualizar isStaking del usuario a false.
        isStaking[msg.sender] = false;

        // Transferir los tokens LP de vuelta al usuario.
        lpToken.transfer(msg.sender, balance);
        
        // Emitir un evento de retiro.
        emit Withdraw(msg.sender, balance);

    }

    /**
     * @notice Reclama recompensas pendientes.
     */
    function claimRewards() external {

        // Obtener el monto de recompensas pendientes del usuario desde pendingRewards.
        uint256 pendingAmount = pendingRewards[msg.sender];

        // Verificar que el monto de recompensas pendientes sea mayor a 0.
        require(pendingAmount > 0, "No rewards to claim");

        // Restablecer las recompensas pendientes del usuario a 0.
        pendingRewards[msg.sender] = 0;

        // Llamar a la función de acuñación (mint) en el contrato DappToken para transferir las recompensas al usuario.
        dappToken.mint(msg.sender, pendingAmount);

        // Emitir un evento de reclamo de recompensas.
        emit RewardsClaimed(msg.sender, pendingAmount);

    }

    /**
     * @notice Distribuye recompensas a todos los usuarios en staking.
     */
    function distributeRewardsAll() external {

        // Verificar que la llamada sea realizada por el owner.
         require(msg.sender == owner, "Only the owner can distribute rewards");

         uint256 totalDistributed = 0;

        // Iterar sobre todos los usuarios en staking almacenados en el array stakers.        
        // Para cada usuario, si están haciendo staking (isStaking == true), llamar a distributeRewards.
        for (uint256 i = 0; i < stakers.length; i++) {
            address staker = stakers[i];
            if (isStaking[staker]) {
                uint256 rewardsBefore = pendingRewards[staker];
                distributeRewards(staker);
                totalDistributed += pendingRewards[staker] - rewardsBefore;
            }
        }

        // Emitir un evento indicando que las recompensas han sido distribuidas.
        emit RewardsDistributed(totalDistributed, block.number);
    }
    
    /**
     * @notice Calcula y distribuye las recompensas proporcionalmente al staking total.
     * @dev La función toma en cuenta el porcentaje de tokens que cada usuario tiene en staking con respecto
     */
    function distributeRewards(address beneficiary) private {

        // Obtener el último checkpoint del usuario desde checkpoints.
        uint256 lastCheckpoint = checkpoints[beneficiary];

        // Si es el primer checkpoint o estamos en el mismo bloque, solo actualizar
        if (lastCheckpoint == 0 || block.number == lastCheckpoint) {
            checkpoints[beneficiary] = block.number;
            return;
        }

        // Verificar que el número de bloque actual sea mayor al checkpoint y que totalStakingBalance sea mayor a 0.
        require(block.number > lastCheckpoint, "Rewards already distributed for this block");
        require(totalStakingBalance > 0, "Total staking balance must be greater than 0");

        // Calcular la cantidad de bloques transcurridos desde el último checkpoint.
        uint256 blocksPassed = block.number - lastCheckpoint;
        
        // Calcular la proporción del staking del usuario en relación al total staking (stakingBalance[beneficiary] / totalStakingBalance).
        uint256 userShare = (stakingBalance[beneficiary] * 1e36) / totalStakingBalance;

        // Calcular las recompensas del usuario multiplicando la proporción por REWARD_PER_BLOCK y los bloques transcurridos.
        uint256 reward = (REWARD_PER_BLOCK * blocksPassed * userShare) / 1e36;

        // Actualizar las recompensas pendientes del usuario en pendingRewards.
        pendingRewards[beneficiary] += reward;

        // Actualizar el checkpoint del usuario al bloque actual.
        checkpoints[beneficiary] = block.number;
    }
}
