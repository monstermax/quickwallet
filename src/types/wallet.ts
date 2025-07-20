// wallet.ts

import { NotificationType } from "../injected/injected"


export type QuickwalletMode = 'classic'
    | 'quickwallet-manual'
    | 'quickwallet-auto' 
    | 'quickwallet-external-sign'
    | 'quickwallet-external-tx';


export interface WalletState {
    evm: EVMWalletState
    solana: SolanaWalletState
    nostr: NostrWalletState 
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
    onConnect: (chain: 'evm' | 'solana' | 'nostr', privateKey: string) => void
    onDisconnect: (chain: 'evm' | 'solana' | 'nostr') => void,
    setNotification: React.Dispatch<React.SetStateAction<NotificationType>>,
}

export interface NotificationProps {
    message: string
    type?: 'info' | 'success' | 'warning' | 'error'
    show: boolean
    onClose: () => void
}

export interface NostrWalletState {
    privateKey: string | null
    publicKey: string | null
    isConnected: boolean
}
