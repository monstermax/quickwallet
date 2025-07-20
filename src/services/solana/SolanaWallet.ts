// src/services/solana/SolanaWallet.ts

import { Keypair, PublicKey, Transaction, Message } from '@solana/web3.js'
import { decode } from 'bs58'
import * as Noble from '@noble/ed25519';
import { QuickwalletMode } from '../../types/wallet';


export class SolanaWallet {
    private keypair: Keypair | null = null;
    private isQuickWalletActive: boolean = false;
    private quickWalletMode: QuickwalletMode = 'classic';
    private originalProviders: Map<any, any> = new Map();
    private debug: boolean = false;

    constructor() {
        // Écouter les changements de mode
        window.addEventListener('QuickWalletModeChange', this.handleModeChange.bind(this))
    }

    private handleModeChange = (event: CustomEvent<{ chain: 'evm' | 'solana' | 'nostr', mode: QuickwalletMode, active: boolean }>) => {
        if (event.detail.chain === 'solana') {
            this.isQuickWalletActive = event.detail.active;
            this.quickWalletMode = event.detail.mode;

            if (this.debug) {
                console.log('Solana QuickWallet mode:', this.isQuickWalletActive ? 'ACTIVE' : 'INACTIVE')
            }
        }
    }

    setPrivateKey(key: string | null): void {
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

    injectWalletProvider(_window?: Window): void {
        _window = _window || window;

        if (_window.solana) {
            this.interceptSolanaProvider(_window.solana)
        }

        // Intercepter window.phantom.solana si disponible
        if (_window.phantom?.solana) {
            this.interceptSolanaProvider(_window.phantom.solana)
        }
    }

    getDebug(): boolean {
        return this.debug
    }

    setDebug(debug: boolean): void {
        this.debug = debug
    }

    private interceptSolanaProvider(provider: any): void {
        // Sauvegarder les méthodes originales si pas déjà fait
        if (!this.originalProviders.has(provider)) {
            this.originalProviders.set(provider, {
                connect: provider.connect,
                signTransaction: provider.signTransaction,
                signAllTransactions: provider.signAllTransactions,
                signMessage: provider.signMessage,
                request: provider.request
            })
        }

        const original = this.originalProviders.get(provider)

        // Intercepter connect
        provider.connect = async (options?: any) => {
            if (this.debug) {
                console.log('solana.connect intercepted:', options, 'QuickWallet active:', this.isQuickWalletActive)
            }

            if (this.isQuickWalletActive && this.keypair) {
                if (this.debug) {
                    console.log('QuickWallet handling solana.connect')
                }

                return {
                    publicKey: this.keypair.publicKey
                }
            }

            return original.connect?.call(provider, options)
        }

        // Intercepter signTransaction
        provider.signTransaction = async (transaction: Transaction) => {
            if (this.debug) {
                console.log('solana.signTransaction intercepted:', transaction, 'QuickWallet active:', this.isQuickWalletActive)
            }

            if (this.isQuickWalletActive && this.keypair) {
                if (this.debug) {
                    console.log('QuickWallet handling solana.signTransaction')
                }

                return this.signTransaction(transaction)
            }

            return original.signTransaction?.call(provider, transaction)
        }

        // Intercepter signAllTransactions
        provider.signAllTransactions = async (transactions: Transaction[]) => {
            if (this.debug) {
                console.log('solana.signAllTransactions intercepted:', transactions, 'QuickWallet active:', this.isQuickWalletActive)
            }

            if (this.isQuickWalletActive && this.keypair) {
                if (this.debug) {
                    console.log('QuickWallet handling solana.signAllTransactions')
                }

                const signedTransactions: Transaction[] = []
                for (const tx of transactions) {
                    signedTransactions.push(await this.signTransaction(tx))
                }
                return signedTransactions
            }

            return original.signAllTransactions?.call(provider, transactions)
        }

        // Intercepter signMessage
        provider.signMessage = async (message: Uint8Array, encoding?: string) => {
            if (this.debug) {
                console.log('solana.signMessage intercepted:', message, encoding, 'QuickWallet active:', this.isQuickWalletActive)
            }

            if (this.isQuickWalletActive && this.keypair) {
                if (this.debug) {
                    console.log('QuickWallet handling solana.signMessage')
                }

                return this.signMessage(message, encoding)
            }

            return original.signMessage?.call(provider, message, encoding)
        }

        // Intercepter request
        if (original.request) {
            provider.request = async (request: any) => {
                if (this.debug) {
                    console.log('solana.request intercepted:', request, 'QuickWallet active:', this.isQuickWalletActive)
                }

                if (request.method === 'connect' && this.isQuickWalletActive && this.keypair) {
                    if (this.debug) {
                        console.log('QuickWallet handling solana.request connect')
                    }

                    return {
                        publicKey: this.keypair.publicKey
                    }
                }

                return original.request.call(provider, request)
            }
        }
    }

    private async signTransaction(transaction: Transaction): Promise<Transaction> {
        if (!this.keypair) {
            throw new Error('Solana wallet not connected')
        }
let approved = this.quickWalletMode === 'quickwallet-auto'
if (!approved) {
    approved = await (window as any).QuickWallet?.confirm({
        title: 'Confirmer la transaction Solana',
        message: 'Voulez-vous confirmer cette transaction Solana ?',
        details: `Transaction: ${transaction.instructions.length} instruction(s)`
    }) || false
}


        if (!approved) {
            throw new Error('User rejected the transaction')
        }

        try {
            // @ts-ignore
            transaction.sign([this.keypair])
            return transaction

        } catch (error: any) {
            console.error('Solana transaction signing failed:', error)
            throw new Error(`Transaction signing failed: ${error?.message ? error.message : 'Unknown error'}`)
        }
    }

    private async signMessage(message: Uint8Array, encoding?: string): Promise<{ signature: Uint8Array; publicKey: string }> {
        if (!this.keypair) {
            throw new Error('Solana wallet not connected')
        }
let approved = this.quickWalletMode === 'quickwallet-auto'
if (!approved) {
    approved = await (window as any).QuickWallet?.confirm({
        title: 'Signer le message Solana',
        message: 'Voulez-vous signer ce message Solana ?',
        details: typeof message === 'string' ? message : new TextDecoder().decode(message)
    }) || false
}


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
            const signature = await Noble.sign(messageBytes, this.keypair.secretKey.slice(0, 32))

            return {
                signature: new Uint8Array(signature),
                publicKey: this.keypair.publicKey.toBase58()
            }
        } catch (error: any) {
            console.error('Solana message signing failed:', error)
            throw new Error(`Message signing failed: ${error?.message ? error.message : 'Unknown error'}`)
        }
    }
}