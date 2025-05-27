// src/services/evm/EvmWallet.ts

import { ethers } from 'ethers'

import { rpcService } from './rpcService'


export class EvmWallet {
    private wallet: ethers.Wallet | null = null
    private chainId: number | null = null
    private autoSign: boolean = true

    constructor() {
        //this.injectWalletProvider()
    }

    setPrivateKey(key: string | null): void {
        this.wallet = key ? new ethers.Wallet(key) : null
    }

    getAddress(): string | null {
        return this.wallet?.address || null
    }

    getChainId(): number | null {
        return this.chainId
    }

    setChainId(chainId: number): void {
        this.chainId = chainId
    }

    setAutoSign(autoSign: boolean): void {
        this.autoSign = autoSign
    }

    injectWalletProvider(): void {
        if (!window.ethereum) return

        // Sauvegarder les méthodes originales
        const originalRequest = window.ethereum.request
        const originalEnable = window.ethereum.enable
        const originalSend = window.ethereum.send

        // Intercepter ethereum.request
        window.ethereum.request = async (args: any) => {
            console.log('ethereum.request intercepted:', args)

            switch (args.method) {
                case 'eth_requestAccounts':
                    if (this.wallet) {
                        return [this.wallet.address]
                    }
                    break

                case 'eth_sendTransaction':
                    if (this.wallet) {
                        return await this.sendTransaction(args)
                    }
                    break

                case 'personal_sign':
                    if (this.wallet) {
                        return await this.signMessage(args)
                    }
                    break

                case 'eth_signTypedData_v4':
                    if (this.wallet) {
                        return await this.signTypedData(args)
                    }
                    break

                case 'wallet_switchEthereumChain':
                    // Gérer le changement de chaîne
                    const chainId = parseInt(args.params[0].chainId, 16)
                    this.setChainId(chainId)
                    return null

                default:
                    break
            }

            // Appeler la méthode originale pour les autres cas
            const result = await originalRequest.call(window.ethereum, args)

            // Intercepter la réponse pour eth_chainId
            if (args.method === 'eth_chainId') {
                const chainId = parseInt(result, 16)
                this.setChainId(chainId)
            }

            return result
        }

        // Intercepter les autres méthodes si nécessaire
        if (originalEnable) {
            window.ethereum.enable = async (...args: any[]) => {
                console.log('ethereum.enable intercepted:', args)
                // @ts-ignore
                return originalEnable.apply(window.ethereum, args)
            }
        }

        if (originalSend) {
            window.ethereum.send = async (...args: any[]) => {
                console.log('ethereum.send intercepted:', args)
                // @ts-ignore
                return originalSend.apply(window.ethereum, args)
            }
        }
    }

    private async sendTransaction(args: any): Promise<string> {
        const tx = args.params[0]

        // Demander confirmation si autoSign est désactivé
        const approved = this.autoSign || confirm(
            `Confirmer la transaction?\nDe: ${tx.from}\nÀ: ${tx.to}\nValeur: ${(parseInt(tx.value, 16) / 1e18).toFixed(5) || '0'} ETH`
        )

        if (!approved) {
            throw new Error('User rejected the transaction')
        }

        if (!this.wallet || !this.chainId) {
            throw new Error('Wallet not connected')
        }

        try {
            const rpcUrl = rpcService.getRpcUrl(this.chainId)

            // Récupérer les données nécessaires
            const nonce = await rpcService.getTransactionCount(rpcUrl, tx.from)
            const gasLimit = tx.gas || tx.gasLimit || await rpcService.estimateGas(rpcUrl, tx)

            // Vérifier le support EIP-1559
            const supportsEIP1559 = await rpcService.checkEIP1559Support(rpcUrl)

            let txRequest: any

            if (supportsEIP1559 && !tx.gasPrice) {
                // Transaction EIP-1559
                const feeData = await rpcService.getFeeData(rpcUrl)

                txRequest = {
                    type: 2,
                    chainId: this.chainId,
                    nonce: parseInt(nonce, 16),
                    to: tx.to,
                    value: tx.value || '0x0',
                    data: tx.data || '0x',
                    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                    maxFeePerGas: feeData.maxFeePerGas,
                    gasLimit: BigInt(gasLimit)
                }
            } else {
                // Transaction legacy
                const gasPrice = tx.gasPrice || await rpcService.getGasPrice(rpcUrl)

                txRequest = {
                    chainId: this.chainId,
                    nonce: parseInt(nonce, 16),
                    to: tx.to,
                    value: tx.value || '0x0',
                    data: tx.data || '0x',
                    gasPrice: BigInt(gasPrice),
                    gasLimit: BigInt(gasLimit)
                }
            }

            // Signer et envoyer la transaction
            const signedTx = await this.wallet.signTransaction(txRequest)
            const txHash = await rpcService.sendRawTransaction(rpcUrl, signedTx)

            return txHash

        } catch (error) {
            console.error('Transaction failed:', error)
            throw new Error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    private async signMessage(args: any): Promise<string> {
        if (!this.wallet) {
            throw new Error('Wallet not connected')
        }

        const [message, address] = args.params

        // Vérifier que l'adresse correspond
        if (address.toLowerCase() !== this.wallet.address.toLowerCase()) {
            throw new Error('Address mismatch')
        }

        const approved = this.autoSign || confirm(`Signer le message?\n${message}`)

        if (!approved) {
            throw new Error('User rejected the message signing')
        }

        try {
            return await this.wallet.signMessage(message)

        } catch (error) {
            console.error('Message signing failed:', error)
            throw error
        }
    }

    private async signTypedData(args: any): Promise<string> {
        if (!this.wallet) {
            throw new Error('Wallet not connected')
        }

        const [address, typedData] = args.params

        // Vérifier que l'adresse correspond
        if (address.toLowerCase() !== this.wallet.address.toLowerCase()) {
            throw new Error('Address mismatch')
        }

        const approved = this.autoSign || confirm(`Signer les données typées?\n${JSON.stringify(typedData, null, 2)}`)

        if (!approved) {
            throw new Error('User rejected the typed data signing')
        }

        try {
            const parsedData = typeof typedData === 'string' ? JSON.parse(typedData) : typedData
            return await this.wallet.signTypedData(
                parsedData.domain,
                parsedData.types,
                parsedData.message
            )

        } catch (error) {
            console.error('Typed data signing failed:', error)
            throw error
        }
    }
}


