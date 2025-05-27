// src/services/solana/SolanaWallet.ts

import { Keypair, PublicKey, Transaction, Message } from '@solana/web3.js'
import { decode } from 'bs58'
import * as Noble from '@noble/ed25519';


export class SolanaWallet {
    private privateKey: string | null = null
    private keypair: Keypair | null = null
    private autoSign: boolean = true

    constructor() {
        this.injectWalletProvider()
    }

    setPrivateKey(key: string | null): void {
        this.privateKey = key
        if (key) {
            try {
                const secretKey = decode(key)
                this.keypair = Keypair.fromSecretKey(secretKey)
            } catch (error) {
                console.error('Failed to create Solana keypair:', error)
                this.keypair = null
            }
        } else {
            this.keypair = null
        }
    }

    getAddress(): string | null {
        return this.keypair?.publicKey.toBase58() || null
    }

    private injectWalletProvider(): void {
        // Intercepter window.solana
        if (window.solana) {
            this.interceptSolanaProvider(window.solana)
        }

        // Intercepter window.phantom.solana si disponible
        if (window.phantom?.solana) {
            this.interceptSolanaProvider(window.phantom.solana)
        }
    }

    private interceptSolanaProvider(provider: any): void {
        const originalConnect = provider.connect
        const originalSignTransaction = provider.signTransaction
        const originalSignAllTransactions = provider.signAllTransactions
        const originalSignMessage = provider.signMessage
        const originalRequest = provider.request

        // Intercepter connect
        provider.connect = async (options?: any) => {
            console.log('solana.connect intercepted:', options)

            if (this.keypair) {
                return {
                    publicKey: this.keypair.publicKey
                }
            }

            return originalConnect?.call(provider, options)
        }

        // Intercepter signTransaction
        provider.signTransaction = async (transaction: Transaction) => {
            console.log('solana.signTransaction intercepted:', transaction)

            if (this.keypair) {
                return this.signTransaction(transaction)
            }

            return originalSignTransaction?.call(provider, transaction)
        }

        // Intercepter signAllTransactions
        provider.signAllTransactions = async (transactions: Transaction[]) => {
            console.log('solana.signAllTransactions intercepted:', transactions)

            if (this.keypair) {
                const signedTransactions = []
                for (const tx of transactions) {
                    signedTransactions.push(await this.signTransaction(tx))
                }
                return signedTransactions
            }

            return originalSignAllTransactions?.call(provider, transactions)
        }

        // Intercepter signMessage
        provider.signMessage = async (message: Uint8Array, encoding?: string) => {
            console.log('solana.signMessage intercepted:', message, encoding)

            if (this.keypair) {
                return this.signMessage(message, encoding)
            }

            return originalSignMessage?.call(provider, message, encoding)
        }

        // Intercepter request
        if (originalRequest) {
            provider.request = async (request: any) => {
                console.log('solana.request intercepted:', request)

                if (request.method === 'connect' && this.keypair) {
                    return {
                        publicKey: this.keypair.publicKey
                    }
                }

                return originalRequest.call(provider, request)
            }
        }
    }

    private async signTransaction(transaction: Transaction): Promise<Transaction> {
        if (!this.keypair) {
            throw new Error('Solana wallet not connected')
        }

        const approved = this.autoSign || confirm('Confirmer la transaction Solana?')

        if (!approved) {
            throw new Error('User rejected the transaction')
        }

        try {
            transaction.sign(this.keypair)
            return transaction

        } catch (error) {
            console.error('Solana transaction signing failed:', error)
            throw new Error(`Transaction signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    private async signMessage(message: Uint8Array, encoding?: string): Promise<{ signature: Uint8Array; publicKey: string }> {
        if (!this.keypair) {
            throw new Error('Solana wallet not connected')
        }

        const approved = this.autoSign || confirm('Confirmer la signature du message Solana?')

        if (!approved) {
            throw new Error('User rejected the message signing')
        }

        try {
            // Convertir le message en Uint8Array si nécessaire
            let messageBytes: Uint8Array
            if (typeof message === 'string') {
                messageBytes = new TextEncoder().encode(message)
            } else if (message instanceof Uint8Array) {
                messageBytes = message
            } else {
                messageBytes = new Uint8Array(message)
            }

            // Utiliser la fonction de signature de nacl (incluse dans @solana/web3.js)
            //const { sign } = await import('@noble/ed25519')
            const signature = await Noble.sign(messageBytes, this.keypair.secretKey.slice(0, 32))

            return {
                signature: new Uint8Array(signature),
                publicKey: this.keypair.publicKey.toBase58()
            }
        } catch (error) {
            console.error('Solana message signing failed:', error)
            throw new Error(`Message signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }
}

