// WalletsTab.tsx

import React, { useState } from 'react'
import { secureStorage } from '../services/SecureStorage'
import { mainStyles, getTabStyles } from './WalletDialogStyles'
import type { WalletState } from '../types/wallet'

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
    evmKeySaved: boolean
    setEvmKeySaved: (saved: boolean) => void
    evmKeyTemp: string | null
    setEvmKeyTemp: (key: string | null) => void
    solanaKeySaved: boolean
    setSolanaKeySaved: (saved: boolean) => void
    solanaKeyTemp: string | null
    setSolanaKeyTemp: (key: string | null) => void
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
    evmKeySaved,
    setEvmKeySaved,
    evmKeyTemp,
    setEvmKeyTemp,
    solanaKeySaved,
    setSolanaKeySaved,
    solanaKeyTemp,
    setSolanaKeyTemp
}) => {
    // Mode de signature sélectionné pour chaque wallet
    const [evmMode, setEvmMode] = useState<'metamask' | 'quickwallet' | 'external'>('metamask')
    const [solanaMode, setSolanaMode] = useState<'metamask' | 'quickwallet' | 'external'>('metamask')
    const [isConnectedOnTabEvm, setIsConnectedOnTabEvm] = useState(false)
    const [isConnectedOnTabSolana, setIsConnectedOnTabSolana] = useState(false)

    const tabStyles = getTabStyles({ autoSign: false, autoConnectEnabled: false })

    // Fonction pour activer/désactiver QuickWallet selon le mode
    const updateQuickWalletMode = (chain: 'evm' | 'solana', mode: 'metamask' | 'quickwallet' | 'external', connected: boolean) => {
        const shouldActivate = mode === 'quickwallet' && connected
        
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
    const handleEvmModeChange = (mode: 'metamask' | 'quickwallet' | 'external') => {
        setEvmMode(mode)
        
        if (walletState.evm.isConnected) {
            updateQuickWalletMode('evm', mode, true)
            
            const modeMessages = {
                'metamask': 'Mode MetaMask activé pour EVM - utilisez MetaMask pour signer',
                'quickwallet': 'Mode QuickWallet activé pour EVM - signature automatique',
                'external': 'Mode External sélectionné pour EVM - non implémenté'
            }
            
            setNotification({
                show: true,
                message: modeMessages[mode],
                type: mode === 'external' ? 'warning' : 'info'
            })
        }
    }

    // Gestionnaires pour les changements de mode Solana
    const handleSolanaModeChange = (mode: 'metamask' | 'quickwallet' | 'external') => {
        setSolanaMode(mode)
        
        if (walletState.solana.isConnected) {
            updateQuickWalletMode('solana', mode, true)
            
            const modeMessages = {
                'metamask': 'Mode Phantom activé pour Solana - utilisez Phantom pour signer',
                'quickwallet': 'Mode QuickWallet activé pour Solana - signature automatique',
                'external': 'Mode External sélectionné pour Solana - non implémenté'
            }
            
            setNotification({
                show: true,
                message: modeMessages[mode],
                type: mode === 'external' ? 'warning' : 'info'
            })
        }
    }

    const handleEvmConnect = async () => {
        await onEvmConnect()
        
        // Activer le mode selon la sélection
        if (evmMode === 'quickwallet') {
            updateQuickWalletMode('evm', evmMode, true)
        }
    }

    const handleSolanaConnect = async () => {
        await onSolanaConnect()
        
        // Activer le mode selon la sélection
        if (solanaMode === 'quickwallet') {
            updateQuickWalletMode('solana', solanaMode, true)
        }
    }

    const handleDisconnect = (chain: 'evm' | 'solana') => {
        // Désactiver QuickWallet avant de déconnecter
        updateQuickWalletMode(chain, 'metamask', false)
        
        onDisconnect(chain)
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

                {walletState.evm.isConnected ? (
                    <div style={mainStyles.connectedCard}>
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
                                    onChange={e => handleEvmModeChange(e.target.value as 'metamask' | 'quickwallet' | 'external')}
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
                                    <option value="metamask">MetaMask (classic)</option>
                                    <option value="quickwallet">QuickWallet (auto-sign)</option>
                                    <option value="external">External (backend)</option>
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
                                Remove key
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={mainStyles.inputGroup}>
                        <span style={mainStyles.inputIcon}>🔑</span>
                        <input
                            style={mainStyles.input}
                            type="password"
                            placeholder="Enter your private key (0x123abc...)"
                            value={evmKey}
                            onChange={(e) => setEvmKey(e.target.value)}
                            autoComplete="off"
                            disabled={isAnyLoading}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && evmKey) {
                                    e.preventDefault()
                                    handleEvmConnect()
                                }
                            }}
                        />
                        <button
                            type="button"
                            style={{
                                ...mainStyles.inputButton,
                                ...((!evmKey || evmLoading) && mainStyles.disabledButton)
                            }}
                            onClick={handleEvmConnect}
                            disabled={!evmKey || isAnyLoading}
                        >
                            {evmLoading ? (
                                <span style={mainStyles.loadingContent}>
                                    <span style={mainStyles.spinner} />
                                </span>
                            ) : (
                                'Add key'
                            )}
                        </button>
                    </div>
                )}
                
                {/* Checkbox for saving key locally */}
                <div style={{ display: 'flex', alignItems: 'center', marginTop: 12, marginBottom: 8 }}>
                    <input
                        type="checkbox"
                        id="saveEvmKeyLocally"
                        checked={evmKeySaved}
                        onChange={async (e) => {
                            if (e.target.checked) {
                                const keyToSave = walletState.evm.privateKey || evmKey || evmKeyTemp;
                                if (keyToSave) {
                                    await secureStorage.saveKeys({
                                        evm: keyToSave,
                                        solana: walletState.solana.isConnected && walletState.solana.privateKey ? walletState.solana.privateKey : undefined,
                                        timestamp: Date.now()
                                    })
                                    setNotification({ show: true, message: 'Private key saved in background!', type: 'success' })
                                }
                                setEvmKeySaved(true)
                            } else {
                                const keyToKeep = walletState.evm.privateKey || evmKey;
                                if (keyToKeep) setEvmKeyTemp(keyToKeep)
                                await secureStorage.saveKeys({
                                    evm: undefined,
                                    solana: walletState.solana.isConnected && walletState.solana.privateKey ? walletState.solana.privateKey : undefined,
                                    timestamp: Date.now()
                                })
                                setNotification({ show: true, message: 'Private key removed from background (still in memory until popup closed)', type: 'info' })
                                setEvmKeySaved(false)
                            }
                        }}
                        style={tabStyles.checkbox}
                    />
                    <label htmlFor="saveEvmKeyLocally" style={{ fontSize: 14, cursor: 'pointer', marginLeft: 4 }}>
                        Save the private key locally (encrypted)
                    </label>
                </div>
            </div>

            {/* Solana Section */}
            <div style={mainStyles.section}>
                <label style={mainStyles.label}>
                    👾 Solana Network
                </label>

                {walletState.solana.isConnected ? (
                    <div style={mainStyles.connectedCard}>
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
                                    onChange={e => handleSolanaModeChange(e.target.value as 'metamask' | 'quickwallet' | 'external')}
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
                                    <option value="metamask">Phantom (classic)</option>
                                    <option value="quickwallet">QuickWallet (auto-sign)</option>
                                    <option value="external">External (backend)</option>
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
                                Remove key
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={mainStyles.inputGroup}>
                        <span style={mainStyles.inputIcon}>🔑</span>
                        <input
                            style={mainStyles.input}
                            type="password"
                            placeholder="Enter your private key (Base58 format)"
                            value={solanaKey}
                            onChange={(e) => setSolanaKey(e.target.value)}
                            autoComplete="off"
                            disabled={isAnyLoading}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && solanaKey) {
                                    e.preventDefault()
                                    handleSolanaConnect()
                                }
                            }}
                        />
                    </div>
                )}
                
                {/* Checkbox for saving key locally */}
                <div style={{ display: 'flex', alignItems: 'center', marginTop: 12, marginBottom: 8 }}>
                    <input
                        type="checkbox"
                        id="saveSolanaKeyLocally"
                        checked={solanaKeySaved}
                        onChange={async (e) => {
                            if (e.target.checked) {
                                const keyToSave = walletState.solana.privateKey || solanaKey || solanaKeyTemp;
                                if (keyToSave) {
                                    await secureStorage.saveKeys({
                                        evm: walletState.evm.isConnected && walletState.evm.privateKey ? walletState.evm.privateKey : undefined,
                                        solana: keyToSave,
                                        timestamp: Date.now()
                                    })
                                    setNotification({ show: true, message: 'Private key saved in background!', type: 'success' })
                                }
                                setSolanaKeySaved(true)
                            } else {
                                const keyToKeep = walletState.solana.privateKey || solanaKey;
                                if (keyToKeep) setSolanaKeyTemp(keyToKeep)
                                await secureStorage.saveKeys({
                                    evm: walletState.evm.isConnected && walletState.evm.privateKey ? walletState.evm.privateKey : undefined,
                                    solana: undefined,
                                    timestamp: Date.now()
                                })
                                setNotification({ show: true, message: 'Private key removed from background (still in memory until popup closed)', type: 'info' })
                                setSolanaKeySaved(false)
                            }
                        }}
                        style={tabStyles.checkbox}
                    />
                    <label htmlFor="saveSolanaKeyLocally" style={{ fontSize: 14, cursor: 'pointer', marginLeft: 4 }}>
                        Save the private key locally (encrypted)
                    </label>
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