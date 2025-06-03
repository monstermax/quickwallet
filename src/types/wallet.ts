// wallet.ts

import { NotificationType } from "../injected/injected"

export interface WalletState {
    evm: EVMWalletState
    solana: SolanaWalletState
}

export interface EVMWalletState {
    privateKey: string | null
    address: string | null
    chainId: number | null
    isConnected: boolean
}

export interface SolanaWalletState {
    privateKey: string | null
    address: string | null
    isConnected: boolean
}

export interface WalletDialogProps {
    isOpen: boolean
    walletState: WalletState
    onClose: () => void
    onConnect: (chain: 'evm' | 'solana', privateKey: string) => void
    onDisconnect: (chain: 'evm' | 'solana') => void,
    setNotification: React.Dispatch<React.SetStateAction<NotificationType>>,
}

export interface NotificationProps {
    message: string
    type?: 'info' | 'success' | 'warning' | 'error'
    show: boolean
    onClose: () => void
}
