# 🌾 DeFi Token Farm Project 

<p align="center">
    <img src="./frontend/public/defi-farm.jpg" height=400>
</p>

[![Solidity](https://img.shields.io/badge/Solidity-%23363636.svg?style=for-the-badge&logo=solidity&logoColor=white)](https://docs.soliditylang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=Ethereum&logoColor=white)](https://ethereum.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-yellow?style=for-the-badge)](https://hardhat.org/)

## 🌐 Overview

A DeFi yield farming platform where users can stake LP tokens and earn DAPP token rewards. The system implements a proportional reward distribution mechanism based on stake amount and time.

## 🎯 Features

- Stake LP tokens
- Earn DAPP token rewards
- Proportional reward distribution
- Real-time balance tracking
- User-friendly interface

## 🛠 Tech Stack

- **Smart Contracts**: Solidity ^0.8.x
- **Blockchain**: Ethereum
- **Development**: Hardhat
- **Frontend**: React + Vite
- **Web3**: ethers.js

## 📁 Project Structure

```
DeFi-Farm/
├── contracts/
│   ├── DappToken.sol
│   ├── LPToken.sol
│   └── TokenFarm.sol
├── scripts/
│   ├── deploy.js
│   └── transfer-ownership.js
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── config.js
│   └── package.json
└── hardhat.config.js
```

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 14.0.0
- MetaMask
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/defi-farm.git
cd defi-farm

# Install dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
```

### Deploy Contracts

```bash
# Start local node
npx hardhat node

# Deploy contracts
npx hardhat run scripts/deploy.js --network localhost
```

### Run Frontend

```bash
cd frontend
npm run dev
```

## 📖 Smart Contract Functions

### TokenFarm.sol
- `deposit(uint256 amount)`: Stake LP tokens
- `withdraw()`: Withdraw staked tokens
- `claimRewards()`: Claim accumulated DAPP rewards
- `distributeRewardsAll()`: Distribute rewards to all stakers

### DappToken.sol & LPToken.sol
- ERC20 tokens with minting capability
- Owner-controlled token distribution

## 🤝 Contributing

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add: Amazing Feature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📫 Contact

[Tu Nombre]
Email: [tu.email@ejemplo.com]
LinkedIn: [tu-perfil-linkedin]
Twitter: [@tu_usuario]

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
