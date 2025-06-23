// WalletsTab.tsx

import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Keypair } from '@solana/web3.js'
import { decode } from 'bs58'
import { secureStorage, type StoredWallet } from '../services/SecureStorage'
import { validateEvmPrivateKey, validateSolanaPrivateKey } from '../services/validation'
import { mainStyles, getTabStyles } from './WalletDialogStyles'
import type { QuickwalletMode, WalletState } from '../types/wallet'

interface WalletsTabProps {
    walletState: WalletState
    error: string | null
    evmKey: string
    setEvmKey: (key: string) => void
    solanaKey: string
    setSolanaKey: (key: string) => void
    evmLoading: boolean
    solanaLoading: boolean
    isAnyLoading: boolean
    onEvmConnect: () => void
    onSolanaConnect: () => void
    onDisconnect: (chain: 'evm' | 'solana') => void
    setNotification: (notification: any) => void
}



export const WalletsTab: React.FC<WalletsTabProps> = ({
    walletState,
    error,
    evmKey,
    setEvmKey,
    solanaKey,
    setSolanaKey,
    evmLoading,
    solanaLoading,
    isAnyLoading,
    onEvmConnect,
    onSolanaConnect,
    onDisconnect,
    setNotification,
}) => {
    // États pour les wallets stockés de manière sécurisée
    const [evmWallets, setEvmWallets] = useState<StoredWallet[]>([])
    const [solanaWallets, setSolanaWallets] = useState<StoredWallet[]>([])
    const [selectedEvmWallet, setSelectedEvmWallet] = useState<string>('')
    const [selectedSolanaWallet, setSelectedSolanaWallet] = useState<string>('')

    // États pour les wallets temporaires (en mémoire uniquement)
    const [tempEvmWallets, setTempEvmWallets] = useState<StoredWallet[]>([])
    const [tempSolanaWallets, setTempSolanaWallets] = useState<StoredWallet[]>([])

    // États pour l'ajout de nouveaux wallets
    const [showAddEvm, setShowAddEvm] = useState(false)
    const [showAddSolana, setShowAddSolana] = useState(false)
    const [newEvmKey, setNewEvmKey] = useState('')
    const [newEvmName, setNewEvmName] = useState('')
    const [newEvmSave, setNewEvmSave] = useState(false)
    const [newSolanaKey, setNewSolanaKey] = useState('')
    const [newSolanaName, setNewSolanaName] = useState('')
    const [newSolanaSave, setNewSolanaSave] = useState(false)

    // Mode de signature sélectionné pour chaque wallet
    const [evmMode, setEvmMode] = useState<QuickwalletMode>('classic')
    const [solanaMode, setSolanaMode] = useState<QuickwalletMode>('classic')
    const [isConnectedOnTabEvm, setIsConnectedOnTabEvm] = useState(false)
    const [isConnectedOnTabSolana, setIsConnectedOnTabSolana] = useState(false)

    const tabStyles = getTabStyles({ autoSign: false, autoConnectEnabled: false })

    // Charger les wallets au montage
    useEffect(() => {
        loadWallets()
    }, [])

    // Mettre à jour la sélection quand un wallet se connecte
    useEffect(() => {
        if (walletState.evm.isConnected && walletState.evm.address) {
            const connectedWallet = evmWallets.find(w => w.address === walletState.evm.address)
            if (connectedWallet) {
                setSelectedEvmWallet(connectedWallet.id)
            }
        }
    }, [walletState.evm.isConnected, walletState.evm.address, evmWallets])

    useEffect(() => {
        if (walletState.solana.isConnected && walletState.solana.address) {
            const connectedWallet = solanaWallets.find(w => w.address === walletState.solana.address)
            if (connectedWallet) {
                setSelectedSolanaWallet(connectedWallet.id)
            }
        }
    }, [walletState.solana.isConnected, walletState.solana.address, solanaWallets])

    // Relire les modes sauvegardés au montage
    useEffect(() => {
        const savedEvmMode = localStorage.getItem('quickwallet-evm-mode') as QuickwalletMode;
        const savedSolanaMode = localStorage.getItem('quickwallet-solana-mode') as QuickwalletMode;

        if (savedEvmMode) {
            setEvmMode(savedEvmMode)
        }
        if (savedSolanaMode) {
            setSolanaMode(savedSolanaMode)
        }
    }, [])

    // Activer QuickWallet quand les wallets se connectent avec le mode quickwallet
    useEffect(() => {
        const savedEvmMode = localStorage.getItem('quickwallet-evm-mode') as QuickwalletMode;
        if (savedEvmMode !== 'classic' && walletState.evm.isConnected) {
            updateQuickWalletMode('evm', savedEvmMode, true)
        }
    }, [walletState.evm.isConnected])

    useEffect(() => {
        const savedSolanaMode = localStorage.getItem('quickwallet-solana-mode') as QuickwalletMode;
        if (savedSolanaMode !== 'classic' && walletState.solana.isConnected) {
            updateQuickWalletMode('solana', savedSolanaMode, true)
        }
    }, [walletState.solana.isConnected])

    const loadWallets = async () => {
        console.log('Loading wallets...')
        try {
            // Essayer de charger les wallets depuis le système sécurisé
            try {
                const walletsData = await secureStorage.loadWallets()
                if (walletsData && walletsData.wallets.length > 0) {
                    console.log('Loaded from secure system:', walletsData)
                    const evmList = walletsData.wallets.filter(w => w.type === 'evm')
                    const solanaList = walletsData.wallets.filter(w => w.type === 'solana')
                    setEvmWallets(evmList)
                    setSolanaWallets(solanaList)
                    return
                }
            } catch (error) {
                console.log('Secure system not available, trying legacy system')
            }

            // Fallback vers l'ancien système sécurisé
            try {
                const oldKeys = await secureStorage.loadKeys()
                console.log('Loaded old keys from secure storage')

                if (oldKeys) {
                    const fallbackWallets: StoredWallet[] = []
                    if (oldKeys.evm) {
                        const wallet = new ethers.Wallet(oldKeys.evm)
                        fallbackWallets.push({
                            id: 'legacy-evm-' + Date.now(),
                            name: 'Wallet EVM Principal',
                            type: 'evm',
                            privateKey: oldKeys.evm,
                            address: wallet.address,
                            timestamp: oldKeys.timestamp
                        })
                    }
                    if (oldKeys.solana) {
                        const secretKey = decode(oldKeys.solana)
                        const keypair = Keypair.fromSecretKey(secretKey)
                        fallbackWallets.push({
                            id: 'legacy-solana-' + Date.now(),
                            name: 'Wallet Solana Principal',
                            type: 'solana',
                            privateKey: oldKeys.solana,
                            address: keypair.publicKey.toBase58(),
                            timestamp: oldKeys.timestamp
                        })
                    }

                    const evmList = fallbackWallets.filter(w => w.type === 'evm')
                    const solanaList = fallbackWallets.filter(w => w.type === 'solana')
                    setEvmWallets(evmList)
                    setSolanaWallets(solanaList)
                } else {
                    console.log('No secure keys found')
                    setEvmWallets([])
                    setSolanaWallets([])
                }
            } catch (error) {
                console.log('Error loading secure keys:', error)
                setEvmWallets([])
                setSolanaWallets([])
            }
        } catch (error) {
            console.error('Erreur lors du chargement des wallets:', error)
            setEvmWallets([])
            setSolanaWallets([])
        }
    }

    // Fonction pour activer/désactiver QuickWallet selon le mode
    const updateQuickWalletMode = (chain: 'evm' | 'solana', mode: QuickwalletMode, connected: boolean) => {
        const shouldActivate = mode !== 'classic' && connected

        // Envoyer un événement pour activer/désactiver QuickWallet
        window.dispatchEvent(new CustomEvent('QuickWalletModeChange', {
            detail: {
                chain,
                mode,
                active: shouldActivate
            }
        }))

        if (chain === 'evm') {
            setIsConnectedOnTabEvm(shouldActivate)
        } else {
            setIsConnectedOnTabSolana(shouldActivate)
        }
    }

    // Gestionnaires pour les changements de mode EVM
    const handleEvmModeChange = (mode: QuickwalletMode) => {
        setEvmMode(mode)
        localStorage.setItem('quickwallet-evm-mode', mode)

        if (walletState.evm.isConnected) {
            updateQuickWalletMode('evm', mode, true)

            const modeMessages: Record<QuickwalletMode, string> = {
                'classic': 'Mode Classic activé pour EVM - utilisez MetaMask pour signer',
                'quickwallet-manual': 'Mode QuickWallet activé pour EVM - signature manuelle',
                'quickwallet-auto': 'Mode QuickWallet activé pour EVM - signature automatique',
                'quickwallet-external-sign': 'Mode External-Sign sélectionné pour EVM - non implémenté',
                'quickwallet-external-tx': 'Mode External-TX sélectionné pour EVM - non implémenté',
            }

            setNotification({
                show: true,
                message: modeMessages[mode],
                type: mode === 'quickwallet-external-sign' ? 'warning' : 'info'
            })
        }
    }

    // Gestionnaires pour les changements de mode Solana
    const handleSolanaModeChange = (mode: QuickwalletMode) => {
        setSolanaMode(mode)
        localStorage.setItem('quickwallet-solana-mode', mode)

        if (walletState.solana.isConnected) {
            updateQuickWalletMode('solana', mode, true)

            const modeMessages: Record<QuickwalletMode, string> = {
                'classic': 'Mode Classic activé pour Solana - utilisez Phantom pour signer',
                'quickwallet-manual': 'Mode QuickWallet activé pour Solana - signature manuelle',
                'quickwallet-auto': 'Mode QuickWallet activé pour Solana - signature automatique',
                'quickwallet-external-sign': 'Mode External-Sign sélectionné pour Solana - non implémenté',
                'quickwallet-external-tx': 'Mode External-TX sélectionné pour Solana - non implémenté',
            }

            setNotification({
                show: true,
                message: modeMessages[mode],
                type: mode === 'quickwallet-external-sign' ? 'warning' : 'info'
            })
        }
    }

    const handleEvmConnect = async () => {
        const wallet = evmWallets.find(w => w.id === selectedEvmWallet)
        if (!wallet) return

        setEvmKey(wallet.privateKey)
        await onEvmConnect()

        // Activer le mode selon la sélection
        if (evmMode !== 'classic') {
            updateQuickWalletMode('evm', evmMode, true)
        }
    }

    const handleSolanaConnect = async () => {
        const wallet = solanaWallets.find(w => w.id === selectedSolanaWallet)
        if (!wallet) return

        setSolanaKey(wallet.privateKey)
        await onSolanaConnect()

        // Activer le mode selon la sélection
        if (solanaMode !== 'classic') {
            updateQuickWalletMode('solana', solanaMode, true)
        }
    }

    const handleDisconnect = (chain: 'evm' | 'solana') => {
        // Désactiver QuickWallet avant de déconnecter
        updateQuickWalletMode(chain, 'classic', false)

        onDisconnect(chain)
    }

    const handleAddEvmWallet = async () => {
        if (!newEvmKey || !newEvmName) return
        console.log('Adding EVM wallet:', newEvmName, 'Save:', newEvmSave)

        try {
            const validKey = validateEvmPrivateKey(newEvmKey)
            if (!validKey) {
                setNotification({
                    show: true,
                    message: 'Clé privée EVM invalide',
                    type: 'error'
                })
                return
            }

            const wallet = new ethers.Wallet(validKey)
            const address = wallet.address

            // Vérifier si le wallet existe déjà (dans les deux listes)
            const allEvmWallets = [...evmWallets, ...tempEvmWallets]
            const existingWallet = allEvmWallets.find(w => w.address === address)

            if (existingWallet) {
                setNotification({
                    show: true,
                    message: 'Ce wallet existe déjà',
                    type: 'warning'
                })
                return
            }

            // Connecter le nouveau wallet
            setEvmKey(validKey)
            await onEvmConnect()
            console.log('Connected EVM wallet')

            const newWallet: StoredWallet = {
                id: 'evm-' + Date.now(),
                name: newEvmName,
                type: 'evm',
                privateKey: validKey,
                address: address,
                timestamp: Date.now()
            }

            if (newEvmSave) {
                // Sauvegarder de manière sécurisée via le background
                try {
                    await secureStorage.addWallet(newWallet)
                    console.log('Saved wallet securely')
                    await loadWallets() // Recharger depuis le stockage sécurisé
                } catch (error) {
                    console.error('Error saving wallet securely:', error)
                    setNotification({
                        show: true,
                        message: 'Erreur lors de la sauvegarde sécurisée. Wallet connecté temporairement.',
                        type: 'warning'
                    })
                    // Ajouter en temporaire si la sauvegarde sécurisée échoue
                    setTempEvmWallets(prev => [...prev, newWallet])
                }
            } else {
                // Ajouter seulement en mémoire (temporaire)
                setTempEvmWallets(prev => [...prev, newWallet])
                console.log('Added wallet to temporary memory')
            }

            setNewEvmKey('')
            setNewEvmName('')
            setNewEvmSave(false)
            setShowAddEvm(false)
            setNotification({
                show: true,
                message: newEvmSave ? 'Wallet EVM sauvegardé et connecté avec succès' : 'Wallet EVM connecté temporairement',
                type: 'success'
            })
        } catch (error) {
            console.error('Error in handleAddEvmWallet:', error)
            setNotification({
                show: true,
                message: 'Erreur lors de l\'ajout du wallet EVM: ' + (error instanceof Error ? error.message : 'Erreur inconnue'),
                type: 'error'
            })
        }
    }

    const handleAddSolanaWallet = async () => {
        if (!newSolanaKey || !newSolanaName) return
        console.log('Adding Solana wallet:', newSolanaName, 'Save:', newSolanaSave)

        try {
            const validKey = validateSolanaPrivateKey(newSolanaKey)
            if (!validKey) {
                setNotification({
                    show: true,
                    message: 'Clé privée Solana invalide',
                    type: 'error'
                })
                return
            }

            const secretKey = decode(validKey)
            const keypair = Keypair.fromSecretKey(secretKey)
            const address = keypair.publicKey.toBase58()

            // Vérifier si le wallet existe déjà (dans les deux listes)
            const allSolanaWallets = [...solanaWallets, ...tempSolanaWallets]
            const existingWallet = allSolanaWallets.find(w => w.address === address)

            if (existingWallet) {
                setNotification({
                    show: true,
                    message: 'Ce wallet existe déjà',
                    type: 'warning'
                })
                return
            }

            // Connecter le nouveau wallet
            setSolanaKey(validKey)
            await onSolanaConnect()
            console.log('Connected Solana wallet')

            const newWallet: StoredWallet = {
                id: 'solana-' + Date.now(),
                name: newSolanaName,
                type: 'solana',
                privateKey: validKey,
                address: address,
                timestamp: Date.now()
            }

            if (newSolanaSave) {
                // Sauvegarder de manière sécurisée via le background
                try {
                    await secureStorage.addWallet(newWallet)
                    console.log('Saved wallet securely')
                    await loadWallets() // Recharger depuis le stockage sécurisé
                } catch (error) {
                    console.error('Error saving wallet securely:', error)
                    setNotification({
                        show: true,
                        message: 'Erreur lors de la sauvegarde sécurisée. Wallet connecté temporairement.',
                        type: 'warning'
                    })
                    // Ajouter en temporaire si la sauvegarde sécurisée échoue
                    setTempSolanaWallets(prev => [...prev, newWallet])
                }
            } else {
                // Ajouter seulement en mémoire (temporaire)
                setTempSolanaWallets(prev => [...prev, newWallet])
                console.log('Added wallet to temporary memory')
            }

            setNewSolanaKey('')
            setNewSolanaName('')
            setNewSolanaSave(false)
            setShowAddSolana(false)
            setNotification({
                show: true,
                message: newSolanaSave ? 'Wallet Solana sauvegardé et connecté avec succès' : 'Wallet Solana connecté temporairement',
                type: 'success'
            })
        } catch (error) {
            console.error('Error in handleAddSolanaWallet:', error)
            setNotification({
                show: true,
                message: 'Erreur lors de l\'ajout du wallet Solana: ' + (error instanceof Error ? error.message : 'Erreur inconnue'),
                type: 'error'
            })
        }
    }

    const handleRemoveWallet = async (walletId: string, type: 'evm' | 'solana') => {
        try {
            // Trouver le wallet à supprimer dans les listes appropriées
            const allWallets = type === 'evm' ? [...evmWallets, ...tempEvmWallets] : [...solanaWallets, ...tempSolanaWallets]
            const walletToRemove = allWallets.find(w => w.id === walletId)
            
            if (!walletToRemove) {
                setNotification({
                    show: true,
                    message: 'Wallet non trouvé',
                    type: 'error'
                })
                return
            }

            // Si c'est le wallet connecté, le déconnecter
            if (type === 'evm' && walletState.evm.isConnected && walletState.evm.address === walletToRemove.address) {
                handleDisconnect('evm')
            }
            if (type === 'solana' && walletState.solana.isConnected && walletState.solana.address === walletToRemove.address) {
                handleDisconnect('solana')
            }

            // Vérifier si c'est un wallet sécurisé ou temporaire
            const isSecureWallet = type === 'evm' ? evmWallets.find(w => w.id === walletId) : solanaWallets.find(w => w.id === walletId)
            
            if (isSecureWallet) {
                // Supprimer du stockage sécurisé
                try {
                    await secureStorage.removeWallet(walletId)
                    console.log('Removed wallet from secure storage')
                } catch (error) {
                    console.error('Error removing from secure storage:', error)
                    setNotification({
                        show: true,
                        message: 'Erreur lors de la suppression du stockage sécurisé',
                        type: 'warning'
                    })
                }
            } else {
                // Supprimer des wallets temporaires
                if (type === 'evm') {
                    setTempEvmWallets(prev => prev.filter(w => w.id !== walletId))
                } else {
                    setTempSolanaWallets(prev => prev.filter(w => w.id !== walletId))
                }
            }

            // Recharger les wallets
            await loadWallets()

            // Réinitialiser la sélection
            if (type === 'evm') {
                setSelectedEvmWallet('')
            } else {
                setSelectedSolanaWallet('')
            }

            setNotification({
                show: true,
                message: `Wallet ${type.toUpperCase()} supprimé`,
                type: 'info'
            })
        } catch (error) {
            console.error('Error in handleRemoveWallet:', error)
            setNotification({
                show: true,
                message: 'Erreur lors de la suppression du wallet',
                type: 'error'
            })
        }
    }

    const truncateAddress = (address: string, startChars = 6, endChars = 4) => {
        if (address.length <= startChars + endChars) return address
        return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
    }

    return (
        <div style={mainStyles.body}>
            {error && (
                <div style={mainStyles.error}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* EVM Section - Compact Design */}
            <div style={{
                ...mainStyles.section,
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                padding: '16px',
                marginBottom: 16
            }}>
                {/* Header avec statut */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                    paddingBottom: 8,
                    borderBottom: '1px solid #f0f0f0'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>🦊</span>
                        <span style={{ fontWeight: 'bold', fontSize: 16 }}>EVM Networks</span>
                        {walletState.evm.isConnected && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{
                                    ...mainStyles.badge,
                                    backgroundColor: '#e8f5e8',
                                    color: '#2d5a2d',
                                    border: '1px solid #65F152',
                                    fontSize: 11,
                                    padding: '2px 6px'
                                }}>
                                    🟢 {truncateAddress(walletState.evm.address || '', 4, 3)}
                                </span>
                                {walletState.evm.chainId && (
                                    <span style={{
                                        ...mainStyles.badge,
                                        backgroundColor: '#6c757d',
                                        color: '#fff',
                                        fontSize: 11,
                                        padding: '2px 6px'
                                    }}>
                                        Chain {walletState.evm.chainId}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Actions rapides */}
                    {walletState.evm.isConnected && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <select
                                value={evmMode}
                                onChange={e => handleEvmModeChange(e.target.value as QuickwalletMode)}
                                style={{
                                    padding: '4px 8px',
                                    borderRadius: 4,
                                    border: '1px solid #ddd',
                                    fontSize: 12,
                                    background: '#fff'
                                }}
                                disabled={isAnyLoading}
                            >
                                <option value="classic">Classic</option>
                                <option value="quickwallet-manual">Manual</option>
                                <option value="quickwallet-auto">Auto</option>
                                <option value="quickwallet-external-sign">Ext-Sign</option>
                                <option value="quickwallet-external-tx">Ext-TX</option>
                            </select>
                            {isConnectedOnTabEvm && (
                                <span style={{
                                    background: '#65F152',
                                    color: '#000',
                                    fontWeight: 'bold',
                                    borderRadius: 3,
                                    padding: '2px 6px',
                                    fontSize: 10
                                }}>
                                    QW
                                </span>
                            )}
                            <button
                                type="button"
                                style={{
                                    ...mainStyles.button,
                                    ...mainStyles.dangerButton,
                                    padding: '4px 8px',
                                    fontSize: 12
                                }}
                                onClick={() => handleDisconnect('evm')}
                                disabled={isAnyLoading}
                            >
                                ✖
                            </button>
                        </div>
                    )}
                </div>

                {/* Sélection et connexion compacte */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    {(evmWallets.length > 0 || tempEvmWallets.length > 0) ? (
                        <>
                            <select
                                style={{
                                    ...mainStyles.input,
                                    flex: 1,
                                    minWidth: 0,
                                    fontSize: 14
                                }}
                                value={selectedEvmWallet}
                                onChange={(e) => setSelectedEvmWallet(e.target.value)}
                                disabled={isAnyLoading}
                            >
                                <option value="">Choisir un wallet EVM...</option>
                                {[...evmWallets, ...tempEvmWallets].map(wallet => (
                                    <option key={wallet.id} value={wallet.id}>
                                        {wallet.name} ({truncateAddress(wallet.address, 4, 3)})
                                        {walletState.evm.isConnected && walletState.evm.address === wallet.address ? ' ✓' : ''}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                style={{
                                    ...mainStyles.button,
                                    ...mainStyles.primaryButton,
                                    padding: '8px 12px',
                                    fontSize: 14,
                                    minWidth: 80,
                                    ...((!selectedEvmWallet || evmLoading) && mainStyles.disabledButton)
                                }}
                                onClick={handleEvmConnect}
                                disabled={!selectedEvmWallet || isAnyLoading}
                            >
                                {evmLoading ? '⏳' : (walletState.evm.isConnected ? 'Switch' : 'Connect')}
                            </button>
                        </>
                    ) : (
                        <div style={{
                            flex: 1,
                            textAlign: 'center',
                            padding: '12px',
                            color: '#6c757d',
                            fontSize: 14,
                            fontStyle: 'italic'
                        }}>
                            Aucun wallet EVM configuré
                        </div>
                    )}
                    
                    <button
                        type="button"
                        style={{
                            ...mainStyles.button,
                            ...mainStyles.secondaryButton,
                            padding: '8px 12px',
                            fontSize: 14,
                            minWidth: 80
                        }}
                        onClick={() => setShowAddEvm(!showAddEvm)}
                        disabled={isAnyLoading}
                    >
                        {showAddEvm ? 'Annuler' : '+ Ajouter'}
                    </button>
                </div>

                {/* Formulaire d'ajout compact */}
                {showAddEvm && (
                    <div style={{
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e9ecef',
                        borderRadius: 6,
                        padding: 12,
                        marginBottom: 8
                    }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <input
                                style={{
                                    ...mainStyles.input,
                                    flex: 1,
                                    fontSize: 14
                                }}
                                type="text"
                                placeholder="Nom du wallet"
                                value={newEvmName}
                                onChange={(e) => setNewEvmName(e.target.value)}
                                disabled={isAnyLoading}
                            />
                            <input
                                style={{
                                    ...mainStyles.input,
                                    flex: 2,
                                    fontSize: 14
                                }}
                                type="password"
                                placeholder="Clé privée EVM (0x...)"
                                value={newEvmKey}
                                onChange={(e) => setNewEvmKey(e.target.value)}
                                disabled={isAnyLoading}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: '#6c757d' }}>
                                <input
                                    type="checkbox"
                                    checked={newEvmSave}
                                    onChange={(e) => setNewEvmSave(e.target.checked)}
                                    style={{ marginRight: 6 }}
                                    disabled={isAnyLoading}
                                />
                                Sauvegarder
                            </label>
                            <button
                                type="button"
                                style={{
                                    ...mainStyles.button,
                                    ...mainStyles.primaryButton,
                                    padding: '6px 12px',
                                    fontSize: 14
                                }}
                                onClick={handleAddEvmWallet}
                                disabled={!newEvmKey || !newEvmName || isAnyLoading}
                            >
                                Ajouter
                            </button>
                        </div>
                    </div>
                )}

                {/* Liste des wallets compacte */}
                {(evmWallets.length > 0 || tempEvmWallets.length > 0) && (
                    <div style={{ fontSize: 12 }}>
                        <div style={{ color: '#6c757d', marginBottom: 4, fontWeight: 'bold' }}>
                            Wallets configurés ({evmWallets.length + tempEvmWallets.length}):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {[...evmWallets, ...tempEvmWallets].map(wallet => (
                                <div key={wallet.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '4px 8px',
                                    border: '1px solid #ddd',
                                    borderRadius: 4,
                                    fontSize: 11,
                                    backgroundColor: walletState.evm.isConnected && walletState.evm.address === wallet.address ? '#e8f5e8' : '#fff'
                                }}>
                                    <span style={{ fontWeight: 'bold' }}>{wallet.name}</span>
                                    <span style={{ color: '#6c757d' }}>({truncateAddress(wallet.address, 3, 2)})</span>
                                    {walletState.evm.isConnected && walletState.evm.address === wallet.address && (
                                        <span style={{ color: '#65F152' }}>✓</span>
                                    )}
                                    <button
                                        type="button"
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#dc3545',
                                            cursor: 'pointer',
                                            padding: 0,
                                            fontSize: 10
                                        }}
                                        onClick={() => handleRemoveWallet(wallet.id, 'evm')}
                                        disabled={isAnyLoading}
                                        title="Supprimer"
                                    >
                                        ✖
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Solana Section - Compact Design */}
            <div style={{
                ...mainStyles.section,
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                padding: '16px',
                marginBottom: 16
            }}>
                {/* Header avec statut */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                    paddingBottom: 8,
                    borderBottom: '1px solid #f0f0f0'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>👾</span>
                        <span style={{ fontWeight: 'bold', fontSize: 16 }}>Solana Network</span>
                        {walletState.solana.isConnected && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{
                                    ...mainStyles.badge,
                                    backgroundColor: '#e8f5e8',
                                    color: '#2d5a2d',
                                    border: '1px solid #65F152',
                                    fontSize: 11,
                                    padding: '2px 6px'
                                }}>
                                    🟢 {truncateAddress(walletState.solana.address || '', 4, 3)}
                                </span>
                            </div>
                        )}
                    </div>
                    
                    {/* Actions rapides */}
                    {walletState.solana.isConnected && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <select
                                value={solanaMode}
                                onChange={e => handleSolanaModeChange(e.target.value as QuickwalletMode)}
                                style={{
                                    padding: '4px 8px',
                                    borderRadius: 4,
                                    border: '1px solid #ddd',
                                    fontSize: 12,
                                    background: '#fff'
                                }}
                                disabled={isAnyLoading}
                            >
                                <option value="classic">Classic</option>
                                <option value="quickwallet-manual">Manual</option>
                                <option value="quickwallet-auto">Auto</option>
                                <option value="quickwallet-external-sign">Ext-Sign</option>
                                <option value="quickwallet-external-tx">Ext-TX</option>
                            </select>
                            {isConnectedOnTabSolana && (
                                <span style={{
                                    background: '#65F152',
                                    color: '#000',
                                    fontWeight: 'bold',
                                    borderRadius: 3,
                                    padding: '2px 6px',
                                    fontSize: 10
                                }}>
                                    QW
                                </span>
                            )}
                            <button
                                type="button"
                                style={{
                                    ...mainStyles.button,
                                    ...mainStyles.dangerButton,
                                    padding: '4px 8px',
                                    fontSize: 12
                                }}
                                onClick={() => handleDisconnect('solana')}
                                disabled={isAnyLoading}
                            >
                                ✖
                            </button>
                        </div>
                    )}
                </div>

                {/* Sélection et connexion compacte */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    {(solanaWallets.length > 0 || tempSolanaWallets.length > 0) ? (
                        <>
                            <select
                                style={{
                                    ...mainStyles.input,
                                    flex: 1,
                                    minWidth: 0,
                                    fontSize: 14
                                }}
                                value={selectedSolanaWallet}
                                onChange={(e) => setSelectedSolanaWallet(e.target.value)}
                                disabled={isAnyLoading}
                            >
                                <option value="">Choisir un wallet Solana...</option>
                                {[...solanaWallets, ...tempSolanaWallets].map(wallet => (
                                    <option key={wallet.id} value={wallet.id}>
                                        {wallet.name} ({truncateAddress(wallet.address, 4, 3)})
                                        {walletState.solana.isConnected && walletState.solana.address === wallet.address ? ' ✓' : ''}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                style={{
                                    ...mainStyles.button,
                                    ...mainStyles.primaryButton,
                                    padding: '8px 12px',
                                    fontSize: 14,
                                    minWidth: 80,
                                    ...((!selectedSolanaWallet || solanaLoading) && mainStyles.disabledButton)
                                }}
                                onClick={handleSolanaConnect}
                                disabled={!selectedSolanaWallet || isAnyLoading}
                            >
                                {solanaLoading ? '⏳' : (walletState.solana.isConnected ? 'Switch' : 'Connect')}
                            </button>
                        </>
                    ) : (
                        <div style={{
                            flex: 1,
                            textAlign: 'center',
                            padding: '12px',
                            color: '#6c757d',
                            fontSize: 14,
                            fontStyle: 'italic'
                        }}>
                            Aucun wallet Solana configuré
                        </div>
                    )}
                    
                    <button
                        type="button"
                        style={{
                            ...mainStyles.button,
                            ...mainStyles.secondaryButton,
                            padding: '8px 12px',
                            fontSize: 14,
                            minWidth: 80
                        }}
                        onClick={() => setShowAddSolana(!showAddSolana)}
                        disabled={isAnyLoading}
                    >
                        {showAddSolana ? 'Annuler' : '+ Ajouter'}
                    </button>
                </div>

                {/* Formulaire d'ajout compact */}
                {showAddSolana && (
                    <div style={{
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e9ecef',
                        borderRadius: 6,
                        padding: 12,
                        marginBottom: 8
                    }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <input
                                style={{
                                    ...mainStyles.input,
                                    flex: 1,
                                    fontSize: 14
                                }}
                                type="text"
                                placeholder="Nom du wallet"
                                value={newSolanaName}
                                onChange={(e) => setNewSolanaName(e.target.value)}
                                disabled={isAnyLoading}
                            />
                            <input
                                style={{
                                    ...mainStyles.input,
                                    flex: 2,
                                    fontSize: 14
                                }}
                                type="password"
                                placeholder="Clé privée Solana (Base58)"
                                value={newSolanaKey}
                                onChange={(e) => setNewSolanaKey(e.target.value)}
                                disabled={isAnyLoading}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: '#6c757d' }}>
                                <input
                                    type="checkbox"
                                    checked={newSolanaSave}
                                    onChange={(e) => setNewSolanaSave(e.target.checked)}
                                    style={{ marginRight: 6 }}
                                    disabled={isAnyLoading}
                                />
                                Sauvegarder
                            </label>
                            <button
                                type="button"
                                style={{
                                    ...mainStyles.button,
                                    ...mainStyles.primaryButton,
                                    padding: '6px 12px',
                                    fontSize: 14
                                }}
                                onClick={handleAddSolanaWallet}
                                disabled={!newSolanaKey || !newSolanaName || isAnyLoading}
                            >
                                Ajouter
                            </button>
                        </div>
                    </div>
                )}

                {/* Liste des wallets compacte */}
                {(solanaWallets.length > 0 || tempSolanaWallets.length > 0) && (
                    <div style={{ fontSize: 12 }}>
                        <div style={{ color: '#6c757d', marginBottom: 4, fontWeight: 'bold' }}>
                            Wallets configurés ({solanaWallets.length + tempSolanaWallets.length}):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {[...solanaWallets, ...tempSolanaWallets].map(wallet => (
                                <div key={wallet.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '4px 8px',
                                    border: '1px solid #ddd',
                                    borderRadius: 4,
                                    fontSize: 11,
                                    backgroundColor: walletState.solana.isConnected && walletState.solana.address === wallet.address ? '#e8f5e8' : '#fff'
                                }}>
                                    <span style={{ fontWeight: 'bold' }}>{wallet.name}</span>
                                    <span style={{ color: '#6c757d' }}>({truncateAddress(wallet.address, 3, 2)})</span>
                                    {walletState.solana.isConnected && walletState.solana.address === wallet.address && (
                                        <span style={{ color: '#65F152' }}>✓</span>
                                    )}
                                    <button
                                        type="button"
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#dc3545',
                                            cursor: 'pointer',
                                            padding: 0,
                                            fontSize: 10
                                        }}
                                        onClick={() => handleRemoveWallet(wallet.id, 'solana')}
                                        disabled={isAnyLoading}
                                        title="Supprimer"
                                    >
                                        ✖
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Warning */}
            <div style={mainStyles.warning}>
                <strong>⚠️ Development Tool:</strong> Use only with testnet accounts.
                QuickWallet automatically signs transactions without confirmation prompts.
                <br /><br />
                <strong>🔑 Private Key Note:</strong> The private key must match the account connected in your wallet (MetaMask/Phantom).
            </div>
        </div>
    )
}