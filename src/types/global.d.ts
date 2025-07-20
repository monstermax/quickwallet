// global.d.ts

import { QuickwalletMode } from "./wallet"


declare global {
    interface Window {
        ethereum?: {
            request: (args: any) => Promise<any>
            enable?: (args?: any) => Promise<any>
            send?: (args: any) => Promise<any>
            sendAsync?: (args: any) => Promise<any>
            _sendSync?: (args: any) => Promise<any>
            _rpcRequest?: (args: any, callback: any) => Promise<any>
            isMetaMask?: boolean
            isRabby?: boolean
            selectedAddress?: string
            chainId?: string
            networkVersion?: string
        }
        rabby?: {
            request: (args: any) => Promise<any>
            enable?: (args?: any) => Promise<any>
            send?: (args: any) => Promise<any>
            sendAsync?: (args: any) => Promise<any>
            _sendSync?: (args: any) => Promise<any>
            _rpcRequest?: (args: any, callback: any) => Promise<any>
            isMetaMask?: boolean
            isRabby?: boolean
            selectedAddress?: string
            chainId?: string
            networkVersion?: string
        }
        solana?: {
            connect: (options?: any) => Promise<{ publicKey: any }>
            disconnect: () => Promise<void>
            signTransaction: (transaction: any) => Promise<any>
            signAllTransactions: (transactions: any[]) => Promise<any[]>
            signMessage: (message: Uint8Array, encoding?: string) => Promise<any>
            request?: (request: any) => Promise<any>
            isPhantom?: boolean
            publicKey?: any
        }
        phantom?: {
            solana?: {
                connect: (options?: any) => Promise<{ publicKey: any }>
                disconnect: () => Promise<void>
                signTransaction: (transaction: any) => Promise<any>
                signAllTransactions: (transactions: any[]) => Promise<any[]>
                signMessage: (message: Uint8Array, encoding?: string) => Promise<any>
                request?: (request: any) => Promise<any>
                isPhantom?: boolean
                publicKey?: any
            }
        }
        QuickWallet?: {
            show: () => void
            evm: {
                getAddress: () => string | null
                setPrivateKey: (key: string | null) => void
            }
            solana: {
                getAddress: () => string | null
                setPrivateKey: (key: string | null) => void
            }
            nostr: {
                getPublicKey: () => string | null
                setPrivateKey: (key: string | null) => void
            }
        }
        nostr?: {
            getPublicKey: () => Promise<string>  // Asynchrone pour window.nostr
            signEvent: (event: any) => Promise<any>
            getRelays: () => Promise<Record<string, any>>
            nip04: {
                encrypt: (peer: string, plaintext: string) => Promise<string>
                decrypt: (peer: string, ciphertext: string) => Promise<string>
            }
            nip44: {
                encrypt: (peer: string, plaintext: string) => Promise<string>
                decrypt: (peer: string, ciphertext: string) => Promise<string>
            }
            _call?: (type: string, params: any) => Promise<any>
            _requests?: any
            _pubkey?: string | null
        }
    }

    // Étendre l'interface WindowEventMap pour inclure nos événements personnalisés
    interface WindowEventMap {
        'QuickWalletModeChange': CustomEvent<{
            chain: 'evm' | 'solana' | 'nostr'
            mode: QuickwalletMode
            active: boolean
        }>
        'QuickWalletAutoConnect': CustomEvent
        'QuickWalletEvent': CustomEvent<{
            action: string
        }>
        'QuickWalletRequest': CustomEvent<{
            requestId: string
            action: string
            data?: any
        }>
        'QuickWalletResponse': CustomEvent<{
            requestId: string
            success: boolean
            data?: any
            error?: string
        }>
    }
}

export { }
