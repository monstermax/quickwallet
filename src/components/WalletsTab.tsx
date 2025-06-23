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

            // Vérifier si le wallet existe déjà
            const existingWallets = JSON.parse(localStorage.getItem('quickwallet-temp-wallets') || '[]') as StoredWallet[]
            const existingWallet = existingWallets.find(w => w.address === address && w.type === 'solana')

            if (existingWallet) {
                setNotification({
                    show: true,
                    message: 'Ce wallet existe déjà',
                    type: 'warning'
                })
                return
            }

            const newWallet: StoredWallet = {
                id: 'solana-' + Date.now(),
                name: newSolanaName,
                type: 'solana',
                privateKey: validKey,
                address: address,
                timestamp: Date.now()
            }

            // Ajouter à la liste existante
            const updatedWallets = [...existingWallets, newWallet]
            localStorage.setItem('quickwallet-temp-wallets', JSON.stringify(updatedWallets))

            // Connecter le nouveau wallet
            setSolanaKey(validKey)
            await onSolanaConnect()

            setNewSolanaKey('')
            setNewSolanaName('')
            setShowAddSolana(false)
            setNotification({
                show: true,
                message: 'Wallet Solana ajouté et connecté avec succès',
                type: 'success'
            })

            // Recharger la liste
            await loadWallets()
        } catch (error) {
            setNotification({
                show: true,
                message: 'Erreur lors de l\'ajout du wallet Solana',
                type: 'error'
            })
        }
    }

    const handleRemoveWallet = async (walletId: string, type: 'evm' | 'solana') => {
        try {
            // Supprimer de localStorage
            const existingWallets = JSON.parse(localStorage.getItem('quickwallet-temp-wallets') || '[]') as StoredWallet[]
            const updatedWallets = existingWallets.filter(w => w.id !== walletId)
            localStorage.setItem('quickwallet-temp-wallets', JSON.stringify(updatedWallets))

            // Si c'est le wallet connecté, le déconnecter
            const walletToRemove = existingWallets.find(w => w.id === walletId)
            if (walletToRemove) {
                if (type === 'evm' && walletState.evm.isConnected && walletState.evm.address === walletToRemove.address) {
                    handleDisconnect('evm')
                }
                if (type === 'solana' && walletState.solana.isConnected && walletState.solana.address === walletToRemove.address) {
                    handleDisconnect('solana')
                }
            }

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

            {/* EVM Section */}
            <div style={mainStyles.section}>
                <label style={mainStyles.label}>
                    🦊 EVM Networks (Ethereum, Polygon, BSC, Arbitrum...)
                </label>

                {/* Statut de connexion */}
                {walletState.evm.isConnected && (
                    <div style={{
                        padding: '12px',
                        backgroundColor: '#e8f5e8',
                        border: '1px solid #65F152',
                        borderRadius: 8,
                        marginBottom: 12
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div>
                                    <span style={mainStyles.badge}>🟢 Connected</span>
                                    {walletState.evm.chainId && (
                                        <span style={{ ...mainStyles.badge, backgroundColor: '#6c757d', color: '#fff' }}>
                                            Chain {walletState.evm.chainId}
                                        </span>
                                    )}
                                </div>
                                <div style={mainStyles.address}>
                                    {truncateAddress(walletState.evm.address || '')}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <select
                                        value={evmMode}
                                        onChange={e => handleEvmModeChange(e.target.value as QuickwalletMode)}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: 4,
                                            border: '1px solid #65F152',
                                            fontSize: 14,
                                            marginBottom: 2,
                                            minWidth: 140,
                                            background: '#fff',
                                            color: '#111'
                                        }}
                                        disabled={isAnyLoading}
                                    >
                                        <option value="classic">Classic (MetaMask)</option>
                                        <option value="quickwallet-manual">QuickWallet (manual-sign)</option>
                                        <option value="quickwallet-auto">QuickWallet (auto-sign)</option>
                                        <option value="quickwallet-external-sign">QuickWallet (external-sign)</option>
                                        <option value="quickwallet-external-tx">QuickWallet (external-tx)</option>
                                    </select>
                                    {isConnectedOnTabEvm && (
                                        <span style={{
                                            background: '#65F152',
                                            color: '#000',
                                            fontWeight: 'bold',
                                            borderRadius: 4,
                                            padding: '2px 8px',
                                            fontSize: 12
                                        }}>
                                            QuickWallet Active
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    style={{ ...mainStyles.button, ...mainStyles.dangerButton }}
                                    onClick={() => handleDisconnect('evm')}
                                    disabled={isAnyLoading}
                                >
                                    Disconnect
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sélection de wallet (toujours visible) */}
                <div>
                    {evmWallets.length > 0 ? (
                        <div style={mainStyles.inputGroup}>
                            <span style={mainStyles.inputIcon}>🔑</span>
                            <select
                                style={mainStyles.input}
                                value={selectedEvmWallet}
                                onChange={(e) => setSelectedEvmWallet(e.target.value)}
                                disabled={isAnyLoading}
                            >
                                <option value="">Sélectionner un wallet EVM...</option>
                                {[...evmWallets, ...tempEvmWallets].map(wallet => (
                                    <option key={wallet.id} value={wallet.id}>
                                        {wallet.name} ({truncateAddress(wallet.address)})
                                        {walletState.evm.isConnected && walletState.evm.address === wallet.address ? ' ✓ Connecté' : ''}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                style={{
                                    ...mainStyles.inputButton,
                                    ...((!selectedEvmWallet || evmLoading) && mainStyles.disabledButton)
                                }}
                                onClick={handleEvmConnect}
                                disabled={!selectedEvmWallet || isAnyLoading}
                            >
                                {evmLoading ? (
                                    <span style={mainStyles.loadingContent}>
                                        <span style={mainStyles.spinner} />
                                    </span>
                                ) : (
                                    walletState.evm.isConnected ? 'Switch' : 'Connect'
                                )}
                            </button>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                            Aucun wallet EVM enregistré
                        </div>
                    )}

                    <div style={{ marginTop: 12 }}>
                        {!showAddEvm ? (
                            <button
                                type="button"
                                style={{ ...mainStyles.button, ...mainStyles.secondaryButton }}
                                onClick={() => setShowAddEvm(true)}
                                disabled={isAnyLoading}
                            >
                                + Ajouter un wallet EVM
                            </button>
                        ) : (
                            <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginTop: 8 }}>
                                <div style={{ marginBottom: 12 }}>
                                    <input
                                        style={{ ...mainStyles.input, marginBottom: 8 }}
                                        type="text"
                                        placeholder="Nom du wallet (ex: Mon Wallet Principal)"
                                        value={newEvmName}
                                        onChange={(e) => setNewEvmName(e.target.value)}
                                        disabled={isAnyLoading}
                                    />
                                    <input
                                        style={mainStyles.input}
                                        type="password"
                                        placeholder="Clé privée EVM (0x123abc...)"
                                        value={newEvmKey}
                                        onChange={(e) => setNewEvmKey(e.target.value)}
                                        disabled={isAnyLoading}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        type="button"
                                        style={{ ...mainStyles.button, ...mainStyles.primaryButton }}
                                        onClick={handleAddEvmWallet}
                                        disabled={!newEvmKey || !newEvmName || isAnyLoading}
                                    >
                                        Ajouter
                                    </button>
                                    <button
                                        type="button"
                                        style={{ ...mainStyles.button, ...mainStyles.secondaryButton }}
                                        onClick={() => {
                                            setShowAddEvm(false)
                                            setNewEvmKey('')
                                            setNewEvmName('')
                                        }}
                                        disabled={isAnyLoading}
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {evmWallets.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                            <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>Wallets EVM enregistrés:</div>
                            {evmWallets.map(wallet => (
                                <div key={wallet.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px 12px',
                                    border: '1px solid #eee',
                                    borderRadius: 4,
                                    marginBottom: 4,
                                    backgroundColor: walletState.evm.isConnected && walletState.evm.address === wallet.address ? '#e8f5e8' : '#f9f9f9'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>
                                            {wallet.name}
                                            {walletState.evm.isConnected && walletState.evm.address === wallet.address && (
                                                <span style={{ color: '#65F152', marginLeft: 8 }}>✓ Connecté</span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#6c757d' }}>{truncateAddress(wallet.address)}</div>
                                    </div>
                                    <button
                                        type="button"
                                        style={{
                                            ...mainStyles.button,
                                            ...mainStyles.dangerButton,
                                            padding: '4px 8px',
                                            fontSize: 12
                                        }}
                                        onClick={() => handleRemoveWallet(wallet.id, 'evm')}
                                        disabled={isAnyLoading}
                                    >
                                        ✖
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Solana Section */}
            <div style={mainStyles.section}>
                <label style={mainStyles.label}>
                    👾 Solana Network
                </label>

                {/* Statut de connexion */}
                {walletState.solana.isConnected && (
                    <div style={{
                        padding: '12px',
                        backgroundColor: '#e8f5e8',
                        border: '1px solid #65F152',
                        borderRadius: 8,
                        marginBottom: 12
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div>
                                    <span style={mainStyles.badge}>🟢 Connected</span>
                                </div>
                                <div style={mainStyles.address}>
                                    {truncateAddress(walletState.solana.address || '')}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <select
                                        value={solanaMode}
                                        onChange={e => handleSolanaModeChange(e.target.value as QuickwalletMode)}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: 4,
                                            border: '1px solid #65F152',
                                            fontSize: 14,
                                            marginBottom: 2,
                                            minWidth: 140,
                                            background: '#fff',
                                            color: '#111'
                                        }}
                                        disabled={isAnyLoading}
                                    >
                                        <option value="classic">Classic (Phantom)</option>
                                        <option value="quickwallet-manual">QuickWallet (manual-sign)</option>
                                        <option value="quickwallet-auto">QuickWallet (auto-sign)</option>
                                        <option value="quickwallet-external-sign">QuickWallet (external-sign)</option>
                                        <option value="quickwallet-external-tx">QuickWallet (external-tx)</option>
                                    </select>
                                    {isConnectedOnTabSolana && (
                                        <span style={{
                                            background: '#65F152',
                                            color: '#000',
                                            fontWeight: 'bold',
                                            borderRadius: 4,
                                            padding: '2px 8px',
                                            fontSize: 12
                                        }}>
                                            QuickWallet Active
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    style={{ ...mainStyles.button, ...mainStyles.dangerButton }}
                                    onClick={() => handleDisconnect('solana')}
                                    disabled={isAnyLoading}
                                >
                                    Disconnect
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sélection de wallet (toujours visible) */}
                <div>
                    {solanaWallets.length > 0 ? (
                        <div style={mainStyles.inputGroup}>
                            <span style={mainStyles.inputIcon}>🔑</span>
                            <select
                                style={mainStyles.input}
                                value={selectedSolanaWallet}
                                onChange={(e) => setSelectedSolanaWallet(e.target.value)}
                                disabled={isAnyLoading}
                            >
                                <option value="">Sélectionner un wallet Solana...</option>
                                {[...solanaWallets, ...tempSolanaWallets].map(wallet => (
                                    <option key={wallet.id} value={wallet.id}>
                                        {wallet.name} ({truncateAddress(wallet.address)})
                                        {walletState.solana.isConnected && walletState.solana.address === wallet.address ? ' ✓ Connecté' : ''}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                style={{
                                    ...mainStyles.inputButton,
                                    ...((!selectedSolanaWallet || solanaLoading) && mainStyles.disabledButton)
                                }}
                                onClick={handleSolanaConnect}
                                disabled={!selectedSolanaWallet || isAnyLoading}
                            >
                                {solanaLoading ? (
                                    <span style={mainStyles.loadingContent}>
                                        <span style={mainStyles.spinner} />
                                    </span>
                                ) : (
                                    walletState.solana.isConnected ? 'Switch' : 'Connect'
                                )}
                            </button>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                            Aucun wallet Solana enregistré
                        </div>
                    )}

                    <div style={{ marginTop: 12 }}>
                        {!showAddSolana ? (
                            <button
                                type="button"
                                style={{ ...mainStyles.button, ...mainStyles.secondaryButton }}
                                onClick={() => setShowAddSolana(true)}
                                disabled={isAnyLoading}
                            >
                                + Ajouter un wallet Solana
                            </button>
                        ) : (
                            <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginTop: 8 }}>
                                <div style={{ marginBottom: 12 }}>
                                    <input
                                        style={{ ...mainStyles.input, marginBottom: 8 }}
                                        type="text"
                                        placeholder="Nom du wallet (ex: Mon Wallet Solana)"
                                        value={newSolanaName}
                                        onChange={(e) => setNewSolanaName(e.target.value)}
                                        disabled={isAnyLoading}
                                    />
                                    <input
                                        style={mainStyles.input}
                                        type="password"
                                        placeholder="Clé privée Solana (Base58 format)"
                                        value={newSolanaKey}
                                        onChange={(e) => setNewSolanaKey(e.target.value)}
                                        disabled={isAnyLoading}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        type="button"
                                        style={{ ...mainStyles.button, ...mainStyles.primaryButton }}
                                        onClick={handleAddSolanaWallet}
                                        disabled={!newSolanaKey || !newSolanaName || isAnyLoading}
                                    >
                                        Ajouter
                                    </button>
                                    <button
                                        type="button"
                                        style={{ ...mainStyles.button, ...mainStyles.secondaryButton }}
                                        onClick={() => {
                                            setShowAddSolana(false)
                                            setNewSolanaKey('')
                                            setNewSolanaName('')
                                        }}
                                        disabled={isAnyLoading}
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {solanaWallets.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                            <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>Wallets Solana enregistrés:</div>
                            {solanaWallets.map(wallet => (
                                <div key={wallet.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px 12px',
                                    border: '1px solid #eee',
                                    borderRadius: 4,
                                    marginBottom: 4,
                                    backgroundColor: walletState.solana.isConnected && walletState.solana.address === wallet.address ? '#e8f5e8' : '#f9f9f9'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>
                                            {wallet.name}
                                            {walletState.solana.isConnected && walletState.solana.address === wallet.address && (
                                                <span style={{ color: '#65F152', marginLeft: 8 }}>✓ Connecté</span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#6c757d' }}>{truncateAddress(wallet.address)}</div>
                                    </div>
                                    <button
                                        type="button"
                                        style={{
                                            ...mainStyles.button,
                                            ...mainStyles.dangerButton,
                                            padding: '4px 8px',
                                            fontSize: 12
                                        }}
                                        onClick={() => handleRemoveWallet(wallet.id, 'solana')}
                                        disabled={isAnyLoading}
                                    >
                                        ✖
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
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