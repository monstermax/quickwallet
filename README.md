# QuickWallet

🚀 **A developer-focused Chrome extension for seamless EVM & Solana wallet integration during dApp testing and development.**

QuickWallet allows developers to quickly inject private keys into web applications to automatically sign transactions on both Ethereum-compatible chains (EVM) and Solana, streamlining the development and testing workflow.

![QuickWallet Demo](https://img.shields.io/badge/version-1.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Chrome Extension](https://img.shields.io/badge/platform-Chrome%20Extension-yellow)

## ⚠️ Important Security Notice

**This extension is designed for DEVELOPMENT and TESTING purposes only.** 

- ❌ **DO NOT use with mainnet funds or production environments**
- ❌ **DO NOT store real private keys with significant value**
- ✅ **USE ONLY with testnet accounts and development wallets**
- ✅ **Perfect for local development, testnets, and dApp testing**
- NOTE: I actually use it on mainnet, but I'm careful about the sites I activate it on.

Please note: The purpose of this wallet is to automatically sign (without confirmation) all transactions.
Only activate it on trusted sites (pump.fun, well-known AMMs, etc.).

## ✨ Features

### 🔗 **Dual Chain Support**
- **EVM Chains**: Ethereum, Polygon, BSC, Arbitrum, Optimism, Base, Avalanche, and 20+ networks
- **Solana**: Full Solana ecosystem support with Phantom wallet compatibility

### ⚡ **Developer-Friendly**
- **Quick Access**: `Alt + W` keyboard shortcut or right-click context menu
- **Auto-signing**: Optional automatic transaction approval for faster testing
- **Real-time Status**: Visual connection status for both chains
- **Clean UI**: Minimal, non-intrusive interface

### 🛠 **Technical Features**
- **EIP-1559 Support**: Automatic detection and handling of modern transaction types
- **Multi-RPC**: Built-in RPC endpoints for 25+ networks (mainnet & testnet)
- **Transaction Interception**: Seamless wallet provider injection
- **Input Validation**: Strict private key format validation and security checks

## 🎥 Demo

### Before QuickWallet
<video width="100%" controls>
 <source src="./docs/video/before.mp4" type="video/mp4">
 Your browser does not support the video tag.
</video>

### After QuickWallet
<video width="100%" controls>
 <source src="./docs/video/after.mp4" type="video/mp4">
 Your browser does not support the video tag.
</video>

*See the difference: from manual wallet confirmations to seamless auto-signing! 🚀*


## 🚀 Installation

### Option 1: Load Unpacked (Recommended for Development)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/quickwallet.git
   cd quickwallet
   ```

2. **Download required libraries**:
   Create a `lib/` folder and download:
   - `ethers-6.13.5.js` from [ethers.js releases](https://github.com/ethers-io/ethers.js/)
   - `solana-web3.js` from [Solana Web3.js](https://github.com/solana-labs/solana-web3.js)
   - `base58.js` from any Base58 library

3. **Load in Chrome**:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the QuickWallet folder

### Option 2: Chrome Web Store
*Coming soon - pending review for developer tools category*

## 📖 Usage

### Getting Started

1. **Activate QuickWallet**:
   - Press `Alt + W` on any webpage
   - OR right-click → "Set QuickWallet private keys"

2. **Connect Your Wallets**:
   - **EVM**: Enter your private key (format: `0x123abc...`)
   - **Solana**: Enter your private key (Base58 format)
   - Click "Accept"

3. **Start Testing**:
   - Visit any dApp (Uniswap, Raydium, etc.)
   - Connect wallet as usual
   - Transactions will be automatically signed! 🎉

### Supported Networks

<details>
<summary><b>EVM Networks (25+ supported)</b></summary>

**Mainnets**:
- Ethereum, Polygon, BSC, Arbitrum, Optimism, Base
- Avalanche, Fantom, Scroll, Sonic, Abstract
- Soneium, HyperEVM, Berachain, Monad

**Testnets**:
- Sepolia, Base Sepolia, Arbitrum Sepolia
- Optimism Sepolia, Scroll Sepolia, BSC Testnet
- Avalanche Fuji, Berachain Bepolia
- Monad Testnet, MegaETH Testnet

</details>

**Solana**: All Solana-based dApps and DEXs


## 🏗 Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌────────────────┐
│   Background    │    │  Content Script  │    │ Injected Script│
│   Service       │◄──►│                  │◄──►│                │
│   Worker        │    │  (Bridge)        │    │ (Wallet Logic) │
└─────────────────┘    └──────────────────┘    └────────────────┘
                                │                       │
                                ▼                       ▼
                        ┌──────────────┐    ┌─────────────────────┐
                        │ Context Menu │    │   Web3 Provider     │
                        │   Alt + W    │    │   Interception      │
                        └──────────────┘    └─────────────────────┘
```

**Key Components**:
- `background.js` - Context menu and extension lifecycle
- `content_script.js` - Bridge between extension and webpage
- `injected_script.js` - Main wallet interface and dialog
- `wallet_evm.js` - Ethereum transaction signing and RPC handling
- `wallet_solana.js` - Solana transaction signing and Phantom compatibility

## 🛡 Security Features

- **Input Validation**: Strict private key format checking
- **Auto-Clear**: Keys cleared on tab close
- **Memory-Only**: No persistent storage of sensitive data
- **Development Warning**: Clear messaging about intended use

## 🤝 Contributing

Contributions are welcome! This project is designed to help the developer community.

### Development Setup

1. **Fork and clone**:
   ```bash
   git fork https://github.com/monstermax/quickwallet.git
   git clone https://github.com/monstermax/quickwallet.git
   ```

2. **Install dependencies**:
   ```bash
   # Download libraries to lib/ folder
   # No npm build required - pure JavaScript
   ```

3. **Test your changes**:
   - Load unpacked extension in Chrome
   - Test with various dApps and networks
   - Ensure both EVM and Solana functionality works

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This software is provided "as is" for development purposes only. Users are responsible for:
- Keeping private keys secure
- Using only test/development accounts
- Understanding the security implications
- Complying with local regulations

**The authors are not responsible for any loss of funds or security breaches.**

---

**Made with ❤️ for the Web3 developer community**

*QuickWallet - Because developers shouldn't waste time on wallet UX during testing*
