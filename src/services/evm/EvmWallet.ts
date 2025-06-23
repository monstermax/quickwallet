// src/services/evm/EvmWallet.ts

import { ethers } from 'ethers'

import { rpcService } from './rpcService'
import { TransactionRequest } from 'ethers'
import { QuickwalletMode } from '../../types/wallet'


const backendEndpoint = 'http://localhost:9876';
const walletAuthToken = 'test'; // TODO


export class EvmWallet {
    private wallet: ethers.Wallet | null = null;
    private chainId: number | null = null;
    private isQuickWalletActive: boolean = false;
    private quickWalletMode: QuickwalletMode = 'classic';
    private originalRequest: any = null;

    constructor() {
        // Écouter les changements de mode
        window.addEventListener('QuickWalletModeChange', this.handleModeChange.bind(this))
    }

    private handleModeChange = (event: CustomEvent<{ chain: 'evm' | 'solana', mode: QuickwalletMode, active: boolean }>) => {
        if (event.detail.chain === 'evm') {
            this.isQuickWalletActive = event.detail.active;
            this.quickWalletMode = event.detail.mode;
            console.log('EVM QuickWallet mode:', this.isQuickWalletActive ? 'ACTIVE' : 'INACTIVE')
        }
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

    injectWalletProvider(_window?: Window): void {
        _window = _window || window;
        if (!_window.ethereum) return

        // Sauvegarder les méthodes originales une seule fois
        if (!this.originalRequest) {
            this.originalRequest = _window.ethereum.request
        }

        // Intercepter ethereum.request
        _window.ethereum.request = async (args: any) => {
            console.log('ethereum.request intercepted:', args, 'QuickWallet active:', this.isQuickWalletActive)

            switch (args.method) {
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
            }


            // Seulement traiter avec QuickWallet si le mode est actif ET qu'on a un wallet
            if (this.isQuickWalletActive && this.wallet) {
                switch (args.method) {
                    case 'eth_requestAccounts':
                        console.log('QuickWallet handling eth_requestAccounts')
                        return [this.wallet.address];

                    case 'eth_sendTransaction':
                        console.log('QuickWallet handling eth_sendTransaction');

                        if (['quickwallet-external-tx', 'quickwallet-external-sign'].includes(this.quickWalletMode)) {
                            return await this.sendTransactionExternal(args);

                        } else if (['quickwallet-auto', 'quickwallet-manual'].includes(this.quickWalletMode)) {
                            return await this.sendTransaction(args);
                        }
                        break;

                    case 'personal_sign':
                        if (this.quickWalletMode === 'quickwallet-manual') {
                            // TODO
                        }
                        if (this.quickWalletMode === 'quickwallet-auto') {
                            console.log('QuickWallet handling personal_sign')
                            return await this.signMessage(args);
                        }
                        if (this.quickWalletMode === 'quickwallet-external-sign' || this.quickWalletMode === 'quickwallet-external-tx') {
                            // TODO
                        }
                        break;

                    case 'eth_signTypedData_v4':
                        console.log('QuickWallet handling eth_signTypedData_v4')
                        // return await this.signTypedData(args); // TODO: a debugger
                        break;

                    default:
                        // Pour les autres méthodes, passer à MetaMask
                        break
                }
            }

            // Appeler la méthode originale pour tous les autres cas
            const result = await this.originalRequest.call(_window.ethereum, args);

            // Intercepter la réponse pour eth_chainId même en mode MetaMask
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
    }

    private async sendTransaction(args: any): Promise<string> {
        const tx = args.params[0] as ethers.TransactionLike;

        // Demander confirmation si autoSign est désactivé
        const approved = this.quickWalletMode === 'quickwallet-auto' || confirm(
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


    private async sendTransactionExternal(args: any): Promise<string> {
        const tx = args.params[0] as ethers.TransactionLike;

        // Demander confirmation si autoSign est désactivé
        const approved = this.quickWalletMode === 'quickwallet-auto' || confirm(
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

        let txRequest: TransactionRequest = {
            chainId: this.chainId,
            to: tx.to,
            value: tx.value || '0x0',
            data: tx.data || '0x',
        };

        if (this.quickWalletMode === 'quickwallet-external-tx') {
            // sign and send external

            // send tx to backend then backend will sign and send

            const response = await fetch(`${backendEndpoint}/send-transaction`, {
                method: 'POST',
                body: JSON.stringify(txRequest),
                headers: {
                    'X-Wallet-Token': walletAuthToken,
                }
            });

            const result = await response.json();
            const txHash = result.txHash as string;
            return txHash;

        } else {
            // sign external then send here

            // TODO: send tx to backend and obtain the signed tx ready to send

            try {
                const rpcUrl = rpcService.getRpcUrl(this.chainId)

                // Récupérer les données nécessaires
                const nonce = await rpcService.getTransactionCount(rpcUrl, tx.from);
                const gasLimit = tx.gasLimit ?? await rpcService.estimateGas(rpcUrl, tx);

                // Vérifier le support EIP-1559
                const supportsEIP1559 = await rpcService.checkEIP1559Support(rpcUrl)

                if (supportsEIP1559 && !tx.gasPrice) {
                    // Transaction EIP-1559
                    const feeData = await rpcService.getFeeData(rpcUrl);

                    txRequest = {
                        ...txRequest,
                        type: 2,
                        nonce: parseInt(nonce, 16),
                        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas.toString(),
                        maxFeePerGas: feeData.maxFeePerGas.toString(),
                        gasLimit: BigInt(gasLimit).toString(),
                    };

                } else {
                    // Transaction legacy
                    const gasPrice = tx.gasPrice || await rpcService.getGasPrice(rpcUrl)

                    txRequest = {
                        ...txRequest,
                        nonce: parseInt(nonce, 16),
                        gasPrice: BigInt(gasPrice).toString(),
                        gasLimit: BigInt(gasLimit).toString(),
                    };
                }

                // Signer et envoyer la transaction
                //const signedTx = await this.wallet.signTransaction(txRequest);

                const response = await fetch(`${backendEndpoint}/sign-transaction`, {
                    method: 'POST',
                    body: JSON.stringify(txRequest),
                    headers: {
                        'X-Wallet-Token': walletAuthToken,
                    }
                });

                const result = await response.json();
                const signedTx = result.signedTx as string;

                const txHash = await rpcService.sendRawTransaction(rpcUrl, signedTx);

                return txHash;

            } catch (error) {
                console.error('Transaction failed:', error);
                throw new Error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
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

        const approved = this.quickWalletMode === 'quickwallet-auto' || confirm(`Signer le message?\n${message}`)

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

        const approved = this.quickWalletMode === 'quickwallet-auto' || confirm(`Signer les données typées?\n${JSON.stringify(typedData, null, 2)}`)

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

            console.log('signature:', signature)

            return signature;

        } catch (error) {
            console.error('Typed data signing failed:', error)
            throw error
        }
    }
}