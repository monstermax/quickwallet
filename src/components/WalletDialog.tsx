// WalletDialog.tsx

import React, { useState, useEffect } from 'react'

import { useWallet } from '../hooks/useWallet'
import { secureStorage } from '../services/SecureStorage'
import { WalletsTab } from './WalletsTab'
import { SettingsTab } from './SettingsTab'
import { getTabStyles, mainStyles } from './WalletDialogStyles'

import type { WalletDialogProps } from '../types/wallet'

export const WalletDialog: React.FC<WalletDialogProps> = ({
    isOpen,
    walletState,
    onClose,
    onConnect,
    onDisconnect,
    setNotification,
}) => {
    const [evmKey, setEvmKey] = useState('')
    const [solanaKey, setSolanaKey] = useState('')
    const [evmKeySaved, setEvmKeySaved] = useState(true)
    const [solanaKeySaved, setSolanaKeySaved] = useState(true)
    const [evmLoading, setEvmLoading] = useState(false)
    const [solanaLoading, setSolanaLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'wallets' | 'settings'>('wallets')

    // États pour les fonctionnalités settings
    const [autoConnectDomains, setAutoConnectDomains] = useState<{ domain: string, enabled: boolean }[]>([])
    const [autoConnectEnabled, setAutoConnectEnabled] = useState(false)
    const [isDomainAllowed, setIsDomainAllowed] = useState(false)

    const tabStyles = getTabStyles({ autoConnectEnabled })

    useEffect(() => {
        if (isOpen) {
            setEvmKey('')
            setSolanaKey('')
            setError(null)
            setEvmLoading(false)
            setSolanaLoading(false)
            setEvmKeySaved(true)
            setSolanaKeySaved(true)
            loadAutoConnectSettings()
        }
    }, [isOpen])

    // Sauvegarde automatique des clés
    useEffect(() => {
        if (evmKeySaved && evmKey && evmKey.length > 0) {
            secureStorage.saveKeys({
                evm: evmKey,
                solana: (solanaKeySaved && solanaKey && solanaKey.length > 0) ? solanaKey : undefined,
                timestamp: Date.now()
            })
        }
    }, [evmKey, evmKeySaved])

    useEffect(() => {
        if (solanaKeySaved && solanaKey && solanaKey.length > 0) {
            secureStorage.saveKeys({
                evm: (evmKeySaved && evmKey && evmKey.length > 0) ? evmKey : undefined,
                solana: solanaKey,
                timestamp: Date.now()
            })
        }
    }, [solanaKey, solanaKeySaved])

    const loadAutoConnectSettings = async () => {
        try {
            const settings = await secureStorage.loadAutoConnectSettings()
            if (settings) {
                setAutoConnectEnabled(settings.enabled)
                setAutoConnectDomains(
                    settings.domains.map(domain => ({ domain, enabled: true }))
                )
            }
            const currentDomain = secureStorage.getCurrentDomain()
            const isAllowed = await secureStorage.checkDomainAllowed(currentDomain)
            setIsDomainAllowed(isAllowed)

            // Charger les wallets sauvegardés
            const walletsData = await secureStorage.loadWallets()
            if (walletsData && walletsData.wallets.length > 0) {
                // Si l'auto-connexion est activée et le domaine autorisé, connecter automatiquement
                if (settings?.enabled && isAllowed) {
                    // Prendre le premier wallet de chaque type pour l'auto-connexion
                    const evmWallet = walletsData.wallets.find(w => w.type === 'evm')
                    const solanaWallet = walletsData.wallets.find(w => w.type === 'solana')

                    if (evmWallet) {
                        try {
                            await onConnect('evm', evmWallet.privateKey)
                        } catch (error) {
                            console.error('Auto-connexion EVM échouée:', error)
                        }
                    }
                    if (solanaWallet) {
                        try {
                            await onConnect('solana', solanaWallet.privateKey)
                        } catch (error) {
                            console.error('Auto-connexion Solana échouée:', error)
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres:', error)
        }
    }

    const handleEvmConnect = async () => {
        if (!evmKey) return

        setEvmLoading(true)
        setError(null)

        try {
            await onConnect('evm', evmKey)
            setEvmKey('')
        } catch (error) {
            console.error('EVM connection failed:', error)
            setError(error instanceof Error ? error.message : 'EVM connection failed')
        } finally {
            setEvmLoading(false)
        }
    }

    const handleSolanaConnect = async () => {
        if (!solanaKey) return

        setSolanaLoading(true)
        setError(null)

        try {
            await onConnect('solana', solanaKey)
            setSolanaKey('')
        } catch (error) {
            console.error('Solana connection failed:', error)
            setError(error instanceof Error ? error.message : 'Solana connection failed')
        } finally {
            setSolanaLoading(false)
        }
    }

    if (!isOpen) return null

    const isAnyLoading = evmLoading || solanaLoading

    return (
        <div
            style={mainStyles.overlay}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div style={mainStyles.modal}>
                <div style={mainStyles.header}>
                    <div>
                        <span style={mainStyles.title}>QuickWallet</span>
                        <span style={mainStyles.subtitle}>React Edition</span>
                    </div>
                    <button
                        style={mainStyles.closeButton}
                        onClick={onClose}
                        disabled={isAnyLoading}
                    >
                        ×
                    </button>
                </div>

                <div style={tabStyles.tabContainer}>
                    <button
                        style={{
                            ...tabStyles.tab,
                            ...(activeTab === 'wallets' ? tabStyles.activeTab : tabStyles.inactiveTab)
                        }}
                        onClick={() => setActiveTab('wallets')}
                    >
                        🔗 Wallets
                    </button>
                    <button
                        style={{
                            ...tabStyles.tab,
                            ...(activeTab === 'settings' ? tabStyles.activeTab : tabStyles.inactiveTab)
                        }}
                        onClick={() => setActiveTab('settings')}
                    >
                        ⚙️ Settings
                    </button>
                </div>

                {activeTab === 'wallets' ? (
                    <WalletsTab
                        walletState={walletState}
                        error={error}
                        evmKey={evmKey}
                        setEvmKey={setEvmKey}
                        solanaKey={solanaKey}
                        setSolanaKey={setSolanaKey}
                        evmLoading={evmLoading}
                        solanaLoading={solanaLoading}
                        isAnyLoading={isAnyLoading}
                        onEvmConnect={handleEvmConnect}
                        onSolanaConnect={handleSolanaConnect}
                        onDisconnect={onDisconnect}
                        setNotification={setNotification}
                    />
                ) : (
                    <SettingsTab
                        error={error}
                        autoConnectDomains={autoConnectDomains}
                        setAutoConnectDomains={setAutoConnectDomains}
                        autoConnectEnabled={autoConnectEnabled}
                        setAutoConnectEnabled={setAutoConnectEnabled}
                        isDomainAllowed={isDomainAllowed}
                        setNotification={setNotification}
                    />
                )}

                <div style={mainStyles.footer}>
                    <button
                        type="button"
                        style={{ ...mainStyles.button, ...mainStyles.secondaryButton }}
                        onClick={onClose}
                        disabled={isAnyLoading}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}