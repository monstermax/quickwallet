// src/services/evm/EvmWallet.ts

import { ethers } from 'ethers'

import { rpcService } from './rpcService'
import { TransactionRequest } from 'ethers'


export class EvmWallet {
    private wallet: ethers.Wallet | null = null
    private chainId: number | null = null
    private autoSign: boolean = true

    constructor() {
        //this.injectWalletProvider()
    }

    async test() {
        const args = {
            params: [
                "0xCCF8BA457dCad7eE6A0361c96846a0f79744b113",
                JSON.parse("{\"domain\":{\"name\":\"Monad Core Coin\",\"version\":\"1\",\"chainId\":10143,\"verifyingContract\":\"0x0f2bf3be151cb75bb9dcf3f895a2106c491ee733\"},\"message\":{\"owner\":\"0xccf8ba457dcad7ee6a0361c96846a0f79744b113\",\"spender\":\"0x4267f317adee7c6478a5ee92985c2bd5d855e274\",\"value\":\"19514602811998466282\",\"nonce\":\"3\",\"deadline\":\"1748939927205\"},\"primaryType\":\"Permit\",\"types\":{\"EIP712Domain\":[{\"name\":\"name\",\"type\":\"string\"},{\"name\":\"version\",\"type\":\"string\"},{\"name\":\"chainId\",\"type\":\"uint256\"},{\"name\":\"verifyingContract\",\"type\":\"address\"}],\"Permit\":[{\"name\":\"owner\",\"type\":\"address\"},{\"name\":\"spender\",\"type\":\"address\"},{\"name\":\"value\",\"type\":\"uint256\"},{\"name\":\"nonce\",\"type\":\"uint256\"},{\"name\":\"deadline\",\"type\":\"uint256\"}]}}"),
            ],
        };

        const signed = await this.signTypedData(args);
        console.log('signed:', signed)
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

    injectWalletProvider(_window?: Window): void {
        _window = _window || window;
        if (!_window.ethereum) return

        // Sauvegarder les méthodes originales
        const originalRequest = _window.ethereum.request
        const originalEnable = _window.ethereum.enable
        const originalSend = _window.ethereum.send

        // Intercepter ethereum.request
        _window.ethereum.request = async (args: any) => {
            console.log('ethereum.request intercepted:', args)

            switch (args.method) {
                case 'eth_requestAccounts':
                    if (this.wallet) {
                        return [this.wallet.address];
                    }
                    break

                case 'eth_sendTransaction':
                    if (this.wallet) {
                        return await this.sendTransaction(args);
                    }
                    break

                case 'personal_sign':
                    if (this.wallet) {
                        return await this.signMessage(args);
                    }
                    break

                case 'eth_signTypedData_v4':
                    if (this.wallet) {
                        //return await this.signTypedData(args); // TODO: a debugger

                        //const args2 = { params: [...args.params].reverse() }
                        //return await this.signMessage(args2); // ce "hack" ne fonctionne pas
                    }
                    break

                case 'wallet_addEthereumChain':
                    if (true) {
                        const chainId = parseInt(args.params[0].chainId, 16);
                        this.setChainId(chainId);
                        break;
                    }

                case 'wallet_switchEthereumChain':
                    if (true) {
                        // Gérer le changement de chaîne
                        const chainId = parseInt(args.params[0].chainId, 16);
                        this.setChainId(chainId);
                        break;
                    }

                default:
                    break
            }

            // Appeler la méthode originale pour les autres cas
            const result = await originalRequest.call(_window.ethereum, args);

            // Intercepter la réponse pour eth_chainId
            if (args.method === 'eth_chainId') {
                const chainId = parseInt(result, 16);
                this.setChainId(chainId);
            }

            if (args.method === 'eth_estimateGas') {
                //console.log('eth_estimateGas result:', result);
            }

            if (args.method === 'eth_signTypedData_v4') {
                //console.log('eth_signTypedData_v4 result:', result);
            }

            if (args.method === 'personal_sign') {
                //console.log('personal_sign result:', result);
            }

            if (args.method === 'eth_sendTransaction') {
                console.log('eth_sendTransaction result:', result);
            }

            return result
        }

        // Intercepter les autres méthodes si nécessaire
        if (originalEnable) {
            _window.ethereum.enable = async (...args: any[]) => {
                console.log('ethereum.enable intercepted:', args)
                // @ts-ignore
                return originalEnable.apply(_window.ethereum, args)
            }
        }

        if (originalSend) {
            _window.ethereum.send = async (...args: any[]) => {
                console.log('ethereum.send intercepted:', args)
                // @ts-ignore
                return originalSend.apply(_window.ethereum, args)
            }
        }
    }

    private async sendTransaction(args: any): Promise<string> {
        const tx = args.params[0] as ethers.TransactionLike;

        // Demander confirmation si autoSign est désactivé
        const approved = this.autoSign || confirm(
            `Confirmer la transaction?\nDe: ${tx.from}\nÀ: ${tx.to}\nValeur: ${(parseInt(tx.value?.toString() ?? '0', 16) / 1e18).toFixed(5) || '0'} ETH`
        )

        if (!approved) {
            throw new Error('User rejected the transaction')
        }

        if (!this.wallet || !this.chainId) {
            throw new Error('Wallet not connected')
        }

        if (!tx.from) {
            throw new Error('Unknown tx from')
        }

        try {
            const rpcUrl = rpcService.getRpcUrl(this.chainId)

            // Récupérer les données nécessaires
            const nonce = await rpcService.getTransactionCount(rpcUrl, tx.from);
            const gasLimit = tx.gasLimit ?? await rpcService.estimateGas(rpcUrl, tx);

            // Vérifier le support EIP-1559
            const supportsEIP1559 = await rpcService.checkEIP1559Support(rpcUrl)

            let txRequest: TransactionRequest;

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
                    gasLimit: BigInt(gasLimit),
                };

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
                    gasLimit: BigInt(gasLimit),
                };
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

            const signature = await this.wallet.signTypedData(
                parsedData.domain,
                parsedData.types,
                parsedData.message
            );

            //const signature = await this.wallet.signMessage(typedData);

            console.log('signature:', signature)

            return signature;

        } catch (error) {
            console.error('Typed data signing failed:', error)
            throw error
        }
    }
}


