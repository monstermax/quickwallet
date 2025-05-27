// src/hooks/useWallet.ts

import { useState, useCallback, useEffect, useRef } from 'react'
import { ethers } from 'ethers'
import { Keypair } from '@solana/web3.js'
import { decode } from 'bs58'

import { walletManager } from '../services/WalletManager'
import { validateEvmPrivateKey, validateSolanaPrivateKey } from '../services/validation'
import { EvmWallet } from '../services/evm/EvmWallet'
import { SolanaWallet } from '../services/solana/SolanaWallet'

import type { WalletState } from '../types/wallet'


export const useWallet = () => {
    const [walletState, setWalletState] = useState<WalletState>({
        evm: {
            privateKey: null,
            address: null,
            chainId: null,
            isConnected: false
        },
        solana: {
            privateKey: null,
            address: null,
            isConnected: false
        }
    })

    const evmWallet = walletManager.evmWallet
    const solanaWallet = walletManager.solanaWallet
    const [autoSign, setAutoSign] = useState(() => walletManager.getAutoSign())


    const connectEVM = useCallback((privateKey: string) => {
        const validKey = validateEvmPrivateKey(privateKey)

        if (!validKey) {
            throw new Error('Invalid EVM private key format')
        }

        try {
            // Calculer l'adresse avec ethers
            const wallet = new ethers.Wallet(validKey)
            const address = wallet.address

            // Configurer le service wallet
            evmWallet.setPrivateKey(validKey)

            setWalletState(prev => ({
                ...prev,
                evm: {
                    privateKey: validKey,
                    address: address,
                    chainId: prev.evm.chainId,
                    isConnected: true
                }
            }))

        } catch (error) {
            console.error('Failed to connect EVM wallet:', error)
            throw new Error('Failed to create EVM wallet from private key')
        }
    }, [])


    const connectSolana = useCallback((privateKey: string) => {
        const validKey = validateSolanaPrivateKey(privateKey)

        if (!validKey) {
            throw new Error('Invalid Solana private key format')
        }

        try {
            // Calculer l'adresse avec @solana/web3.js
            const secretKey = decode(validKey)
            const keypair = Keypair.fromSecretKey(secretKey)
            const address = keypair.publicKey.toBase58()

            // Configurer le service wallet
            solanaWallet.setPrivateKey(validKey)

            setWalletState(prev => ({
                ...prev,
                solana: {
                    privateKey: validKey,
                    address: address,
                    isConnected: true
                }
            }))

        } catch (error) {
            console.error('Failed to connect Solana wallet:', error)
            throw new Error('Failed to create Solana wallet from private key')
        }
    }, [])


    const disconnectEVM = useCallback(() => {
        evmWallet.setPrivateKey(null)
        setWalletState(prev => ({
            ...prev,
            evm: {
                privateKey: null,
                address: null,
                chainId: prev.evm.chainId,
                isConnected: false
            }
        }))
    }, [])


    const disconnectSolana = useCallback(() => {
        solanaWallet.setPrivateKey(null)
        setWalletState(prev => ({
            ...prev,
            solana: {
                privateKey: null,
                address: null,
                isConnected: false
            }
        }))
    }, [])


    useEffect(() => {
        walletManager.setAutoSign(autoSign)
    }, [autoSign])


    return {
        walletState,
        connectEVM,
        connectSolana,
        disconnectEVM,
        disconnectSolana,
        evmWallet,
        solanaWallet,
        autoSign,
        setAutoSign,
    }
}

