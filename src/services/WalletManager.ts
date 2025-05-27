// WalletManager.ts

import { EvmWallet } from './evm/EvmWallet'
import { SolanaWallet } from './solana/SolanaWallet'


class WalletManager {
    private static instance: WalletManager
    public evmWallet: EvmWallet
    public solanaWallet: SolanaWallet
    private autoSign: boolean = true

    private constructor() {
        this.evmWallet = new EvmWallet()
        this.solanaWallet = new SolanaWallet()

        // Injection une seule fois
        setTimeout(() => {
            this.evmWallet.injectWalletProvider()
            this.solanaWallet.injectWalletProvider()
        }, 100)
    }

    static getInstance(): WalletManager {
        if (!WalletManager.instance) {
            WalletManager.instance = new WalletManager()
        }
        return WalletManager.instance
    }

    setAutoSign(enabled: boolean) {
        this.autoSign = enabled
        this.evmWallet.setAutoSign(enabled)
        this.solanaWallet.setAutoSign(enabled)
    }

    getAutoSign(): boolean {
        return this.autoSign
    }
}


export const walletManager = WalletManager.getInstance()

