// src/hooks/useWallet.ts

import { useState, useCallback, useEffect, useRef } from 'react'
import { ethers } from 'ethers'
import { Keypair } from '@solana/web3.js'
import { decode } from 'bs58'

import { walletManager } from '../services/WalletManager'
import { validateEvmPrivateKey, validateNostrPrivateKey, validateSolanaPrivateKey } from '../services/validation'
import { EvmWallet } from '../services/evm/EvmWallet'
import { SolanaWallet } from '../services/solana/SolanaWallet'
import { getPublicKey, nip19 } from 'nostr-tools'
import { hexToBytes } from '@noble/hashes/utils'

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
        },
        nostr: {
            privateKey: null,
            publicKey: null,
            isConnected: false
        },
    })

    const evmWallet = walletManager.evmWallet
    const solanaWallet = walletManager.solanaWallet
    const nostrWallet = walletManager.nostrWallet
    //const [autoSign, setAutoSign] = useState(() => walletManager.getAutoSign())


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

    const connectNostr = useCallback((privateKey: string) => {
        const validKey = validateNostrPrivateKey(privateKey)

        if (!validKey) {
            throw new Error('Invalid Nostr private key format')
        }

        try {
            // Calculer la clé publique
            const publicKey = getPublicKey(hexToBytes(validKey))

            // Configurer le service wallet
            nostrWallet.setPrivateKey(validKey)

            setWalletState(prev => ({
                ...prev,
                nostr: {
                    privateKey: validKey,
                    publicKey: publicKey,
                    isConnected: true
                }
            }))

        } catch (error) {
            console.error('Failed to connect Nostr wallet:', error)
            throw new Error('Failed to create Nostr wallet from private key')
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

    const disconnectNostr = useCallback(() => {
        nostrWallet.setPrivateKey(null)
        setWalletState(prev => ({
            ...prev,
            nostr: {
                privateKey: null,
                publicKey: null,
                isConnected: false
            }
        }))
    }, [])

    //useEffect(() => {
    //    walletManager.setAutoSign(autoSign)
    //}, [autoSign])


    return {
        walletState,
        connectEVM,
        connectSolana,
        connectNostr,
        disconnectEVM,
        disconnectSolana,
        disconnectNostr,
        evmWallet,
        solanaWallet,
        nostrWallet,
        //autoSign,
        //setAutoSign,
    }
}

