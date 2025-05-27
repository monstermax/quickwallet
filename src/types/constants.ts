// constants.ts

export const CHAIN_NAMES: Record<number, string> = {
    1: 'Ethereum Mainnet',
    137: 'Polygon',
    10: 'Optimism',
    56: 'BSC',
    8453: 'Base',
    42161: 'Arbitrum',
    43114: 'Avalanche',
    250: 'Fantom',
    11155111: 'Sepolia Testnet',
    84532: 'Base Sepolia',
    421614: 'Arbitrum Sepolia',
}

export const SUPPORTED_EVM_CHAINS = Object.keys(CHAIN_NAMES).map(Number)

export const HOTKEY_COMBINATIONS = {
    SHOW_WALLET: 'Alt+W'
}

export const NOTIFICATION_DURATION = 3000 // ms

