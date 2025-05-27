// global.d.ts

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
        }
    }
}

export { }

