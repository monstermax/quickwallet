// WalletDialog.tsx

import React, { useState, useEffect } from 'react'

import { useWallet } from '../hooks/useWallet'

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
    const [evmLoading, setEvmLoading] = useState(false)
    const [solanaLoading, setSolanaLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'wallets' | 'settings'>('wallets')
    const { autoSign, setAutoSign } = useWallet()

    // Nouveaux états pour les fonctionnalités settings
    const [autoConnectDomains, setAutoConnectDomains] = useState('')
    const [autoConnectEnabled, setAutoConnectEnabled] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setEvmKey('')
            setSolanaKey('')
            setError(null)
            setEvmLoading(false)
            setSolanaLoading(false)

            // Charger les paramètres depuis le localStorage
            const savedDomains = localStorage.getItem('quickwallet_autoconnect_domains')
            const savedAutoConnect = localStorage.getItem('quickwallet_autoconnect_enabled')

            if (savedDomains) {
                setAutoConnectDomains(savedDomains)
            }
            if (savedAutoConnect) {
                setAutoConnectEnabled(savedAutoConnect === 'true')
            }
        }
    }, [isOpen])

    // Fonctions pour gérer les clés privées
    const handleSaveKeys = () => {
        try {
            const keys = {
                evm: walletState.evm.isConnected ? walletState.evm.privateKey : null,
                solana: walletState.solana.isConnected ? walletState.solana.privateKey : null,
                timestamp: Date.now()
            }
            localStorage.setItem('quickwallet_private_keys', JSON.stringify(keys))
            setError(null)
            setNotification({ show: true, message: 'Clés privées sauvegardées avec succès!', type: 'success' })

        } catch (error) {
            setError('Erreur lors de la sauvegarde des clés')
        }
    }

    const handleDeleteKeys = () => {
        try {
            localStorage.removeItem('quickwallet_private_keys')
            setError(null)
            setNotification({ show: true, message: 'Clés privées supprimées du localStorage!', type: 'success' })

        } catch (error) {
            setError('Erreur lors de la suppression des clés')
        }
    }

    // Fonction pour sauvegarder les domaines d'auto-connexion
    const handleSaveAutoConnectSettings = () => {
        try {
            localStorage.setItem('quickwallet_autoconnect_domains', autoConnectDomains)
            localStorage.setItem('quickwallet_autoconnect_enabled', autoConnectEnabled.toString())
            setError(null)
            setNotification({ show: true, message: 'Paramètres d\'auto-connexion sauvegardés!', type: 'success' })

        } catch (error) {
            setError('Erreur lors de la sauvegarde des paramètres')
        }
    }

    // Fonction pour vérifier si le domaine actuel est autorisé
    const isCurrentDomainAllowed = () => {
        try {
            const savedDomains = localStorage.getItem('quickwallet_autoconnect_domains')
            const savedAutoConnect = localStorage.getItem('quickwallet_autoconnect_enabled')

            if (savedAutoConnect !== 'true' || !savedDomains) {
                return false
            }

            const currentDomain = window.location.hostname + (window.location.port ? ':' + window.location.port : '')
            const allowedDomains = savedDomains.split('\n').map(d => d.trim()).filter(d => d.length > 0)

            return allowedDomains.includes(currentDomain)

        } catch (error) {
            console.error('Erreur lors de la vérification du domaine:', error)
            return false
        }
    }

    // Fonction pour charger automatiquement les clés privées
    const autoConnectWallets = async () => {
        try {
            const savedKeys = localStorage.getItem('quickwallet_private_keys')
            if (!savedKeys) return

            const keys = JSON.parse(savedKeys)

            // Auto-connexion EVM
            if (keys.evm) {
                try {
                    await onConnect('evm', keys.evm);

                } catch (error) {
                    console.error('Erreur auto-connexion EVM:', error)
                }
            }

            // Auto-connexion Solana
            if (keys.solana) {
                try {
                    await onConnect('solana', keys.solana);

                } catch (error) {
                    console.error('Erreur auto-connexion Solana:', error)
                }
            }

        } catch (error) {
            console.error('Erreur lors de l\'auto-connexion:', error)
        }
    }

    // Effet pour l'auto-connexion au chargement de la page
    useEffect(() => {
        if (isCurrentDomainAllowed()) {
            autoConnectWallets()
        }
    }, []) // Exécuté une seule fois au montage du composant

    if (!isOpen) return null

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

    const handleDisconnect = (chain: 'evm' | 'solana') => {
        onDisconnect(chain)
        setError(null)
    }

    const truncateAddress = (address: string, startChars = 6, endChars = 4) => {
        if (address.length <= startChars + endChars) return address
        return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
    }

    const isAnyLoading = evmLoading || solanaLoading

    const tabStyles = {
        tabContainer: {
            display: 'flex',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f8f9fa'
        },
        tab: {
            flex: 1,
            padding: '12px 16px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s'
        },
        activeTab: {
            backgroundColor: '#ffffff',
            borderBottom: '2px solid #65F152',
            color: '#65F152'
        },
        inactiveTab: {
            color: '#6c757d'
        },
        settingsContainer: {
            padding: '24px'
        },
        settingRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 0',
            borderBottom: '1px solid #e5e7eb'
        },
        settingLabel: {
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151'
        },
        settingDescription: {
            fontSize: '12px',
            color: '#6c757d',
            marginTop: '4px'
        },
        toggle: {
            width: '48px',
            height: '24px',
            backgroundColor: autoSign ? '#65F152' : '#d1d5db',
            borderRadius: '12px',
            position: 'relative' as const,
            cursor: 'pointer',
            transition: 'all 0.2s'
        },
        toggleKnob: {
            width: '20px',
            height: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '50%',
            position: 'absolute' as const,
            top: '2px',
            left: autoSign ? '26px' : '2px',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        },
        settingsButton: {
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginRight: '8px',
            marginBottom: '8px'
        },
        saveButton: {
            backgroundColor: '#65F152',
            color: '#000'
        },
        deleteButton: {
            backgroundColor: '#fee2e2',
            color: '#b91c1c'
        },
        textarea: {
            width: '100%',
            minHeight: '100px',
            padding: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical' as const,
            outline: 'none'
        },
        checkbox: {
            width: '18px',
            height: '18px',
            marginRight: '8px',
            cursor: 'pointer'
        },
        settingsSection: {
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid #e5e7eb'
        },
        buttonGroup: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: '8px',
            marginTop: '12px'
        },
        autoConnectToggle: {
            width: '48px',
            height: '24px',
            backgroundColor: autoConnectEnabled ? '#65F152' : '#d1d5db',
            borderRadius: '12px',
            position: 'relative' as const,
            cursor: 'pointer',
            transition: 'all 0.2s'
        },
        autoConnectKnob: {
            width: '20px',
            height: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '50%',
            position: 'absolute' as const,
            top: '2px',
            left: autoConnectEnabled ? '26px' : '2px',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }
    }

    return (
        <div
            style={styles.overlay}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div style={styles.modal}>
                <div style={styles.header}>
                    <div>
                        <span style={styles.title}>QuickWallet</span>
                        <span style={styles.subtitle}>React Edition</span>
                    </div>
                    <button
                        style={styles.closeButton}
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
                    <div style={styles.body}>
                        {error && (
                            <div style={styles.error}>
                                <strong>Error:</strong> {error}
                            </div>
                        )}

                        {/* EVM Section */}
                        <div style={styles.section}>
                            <label style={styles.label}>
                                🦊 EVM Networks (Ethereum, Polygon, BSC, Arbitrum...)
                            </label>

                            {walletState.evm.isConnected ? (
                                <div style={styles.connectedCard}>
                                    <div>
                                        <div>
                                            <span style={styles.badge}>🟢 Connected</span>
                                            {walletState.evm.chainId && (
                                                <span style={{ ...styles.badge, backgroundColor: '#6c757d', color: '#fff' }}>
                                                    Chain {walletState.evm.chainId}
                                                </span>
                                            )}
                                        </div>
                                        <div style={styles.address}>
                                            {truncateAddress(walletState.evm.address || '')}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        style={{ ...styles.button, ...styles.dangerButton }}
                                        onClick={() => handleDisconnect('evm')}
                                        disabled={isAnyLoading}
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            ) : (
                                <div style={styles.inputGroup}>
                                    <span style={styles.inputIcon}>🔑</span>
                                    <input
                                        style={styles.input}
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
                                            ...styles.inputButton,
                                            ...((!evmKey || evmLoading) && styles.disabledButton)
                                        }}
                                        onClick={handleEvmConnect}
                                        disabled={!evmKey || isAnyLoading}
                                    >
                                        {evmLoading ? (
                                            <span style={styles.loadingContent}>
                                                <span style={styles.spinner} />
                                            </span>
                                        ) : (
                                            'Connect'
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Solana Section */}
                        <div style={styles.section}>
                            <label style={styles.label}>
                                👾 Solana Network
                            </label>

                            {walletState.solana.isConnected ? (
                                <div style={styles.connectedCard}>
                                    <div>
                                        <div>
                                            <span style={styles.badge}>🟢 Connected</span>
                                        </div>
                                        <div style={styles.address}>
                                            {truncateAddress(walletState.solana.address || '')}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        style={{ ...styles.button, ...styles.dangerButton }}
                                        onClick={() => handleDisconnect('solana')}
                                        disabled={isAnyLoading}
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            ) : (
                                <div style={styles.inputGroup}>
                                    <span style={styles.inputIcon}>🔑</span>
                                    <input
                                        style={styles.input}
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
                                    <button
                                        type="button"
                                        style={{
                                            ...styles.inputButton,
                                            ...((!solanaKey || solanaLoading) && styles.disabledButton)
                                        }}
                                        onClick={handleSolanaConnect}
                                        disabled={!solanaKey || isAnyLoading}
                                    >
                                        {solanaLoading ? (
                                            <span style={styles.loadingContent}>
                                                <span style={styles.spinner} />
                                            </span>
                                        ) : (
                                            'Connect'
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Warning */}
                        <div style={styles.warning}>
                            <strong>⚠️ Development Tool:</strong> Use only with testnet accounts.
                            QuickWallet automatically signs transactions without confirmation prompts.
                            <br /><br />
                            <strong>🔑 Private Key Note:</strong> The private key must match the account connected in your wallet (MetaMask/Phantom).
                        </div>
                    </div>
                ) : (
                    <div style={tabStyles.settingsContainer}>
                        {error && (
                            <div style={styles.error}>
                                <strong>Error:</strong> {error}
                            </div>
                        )}

                        {/* Auto Sign Transactions */}
                        <div style={tabStyles.settingRow}>
                            <div>
                                <div style={tabStyles.settingLabel}>Auto Sign Transactions</div>
                                <div style={tabStyles.settingDescription}>
                                    Automatically sign transactions without confirmation prompts (EVM & Solana)
                                </div>
                            </div>
                            <div
                                style={tabStyles.toggle}
                                onClick={() => setAutoSign(!autoSign)}
                            >
                                <div style={tabStyles.toggleKnob} />
                            </div>
                        </div>

                        {/* Gestion des clés privées */}
                        <div style={tabStyles.settingsSection}>
                            <div style={tabStyles.settingLabel}>🔑 Gestion des clés privées</div>
                            <div style={tabStyles.settingDescription}>
                                Sauvegarder ou supprimer les clés privées du localStorage
                            </div>
                            <div style={tabStyles.buttonGroup}>
                                <button
                                    style={{
                                        ...tabStyles.settingsButton,
                                        ...tabStyles.saveButton
                                    }}
                                    onClick={handleSaveKeys}
                                >
                                    💾 Enregistrer les clés
                                </button>
                                <button
                                    style={{
                                        ...tabStyles.settingsButton,
                                        ...tabStyles.deleteButton
                                    }}
                                    onClick={handleDeleteKeys}
                                >
                                    🗑️ Supprimer les clés
                                </button>
                            </div>
                        </div>

                        {/* Auto-connexion par domaine */}
                        <div style={tabStyles.settingsSection}>
                            <div style={tabStyles.settingRow}>
                                <div>
                                    <div style={tabStyles.settingLabel}>🌐 Auto-connexion par domaine</div>
                                    <div style={tabStyles.settingDescription}>
                                        Activer la connexion automatique pour certains domaines
                                        {isCurrentDomainAllowed() && (
                                            <div style={{ color: '#65F152', fontWeight: 'bold', marginTop: '4px' }}>
                                                ✅ Domaine actuel autorisé: {window.location.hostname + (window.location.port ? ':' + window.location.port : '')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div
                                    style={tabStyles.autoConnectToggle}
                                    onClick={() => setAutoConnectEnabled(!autoConnectEnabled)}
                                >
                                    <div style={tabStyles.autoConnectKnob} />
                                </div>
                            </div>

                            {autoConnectEnabled && (
                                <div style={{ marginTop: '16px' }}>
                                    <div style={tabStyles.settingLabel}>Domaines autorisés (un par ligne) :</div>
                                    <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px' }}>
                                        Domaine actuel: {window.location.hostname + (window.location.port ? ':' + window.location.port : '')}
                                    </div>
                                    <textarea
                                        style={tabStyles.textarea}
                                        placeholder="exemple.com&#10;localhost:3000&#10;app.monsite.fr"
                                        value={autoConnectDomains}
                                        onChange={(e) => setAutoConnectDomains(e.target.value)}
                                    />
                                    <div style={tabStyles.buttonGroup}>
                                        <button
                                            style={{
                                                ...tabStyles.settingsButton,
                                                ...tabStyles.saveButton
                                            }}
                                            onClick={handleSaveAutoConnectSettings}
                                        >
                                            💾 Sauvegarder les domaines
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div style={styles.footer}>
                    <button
                        type="button"
                        style={{ ...styles.button, ...styles.secondaryButton }}
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


const styles = {
    overlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999999,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    modal: {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        width: '500px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'hidden',
        border: '2px solid #65F152'
    },
    header: {
        padding: '20px 24px',
        borderBottom: '2px solid #65F152',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        margin: 0,
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#65F152',
        textShadow: '1px 1px 2px black'
    },
    subtitle: {
        color: '#6c757d',
        fontSize: '14px',
        marginLeft: '8px'
    },
    closeButton: {
        background: 'none',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        color: '#6c757d',
        padding: '4px'
    },
    body: {
        padding: '24px'
    },
    section: {
        marginBottom: '24px'
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        fontWeight: '600',
        fontSize: '14px',
        color: '#374151'
    },
    connectedCard: {
        border: '1px solid #65F152',
        borderRadius: '6px',
        padding: '16px',
        backgroundColor: '#f0f9f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    badge: {
        backgroundColor: '#65F152',
        color: '#000',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        marginRight: '8px'
    },
    address: {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#1e40af',
        backgroundColor: '#eff6ff',
        padding: '4px 8px',
        borderRadius: '4px',
        wordBreak: 'break-all' as const
    },
    inputSection: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px'
    },
    inputGroup: {
        display: 'flex',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        overflow: 'hidden'
    },
    inputIcon: {
        padding: '12px',
        backgroundColor: '#f9fafb',
        borderRight: '1px solid #d1d5db',
        fontSize: '16px'
    },
    input: {
        flex: 1,
        padding: '12px',
        border: 'none',
        outline: 'none',
        fontSize: '14px',
        fontFamily: 'inherit',
        color: '#374151',
        backgroundColor: '#ffffff',
    },
    inputButton: {
        padding: '8px 16px',
        border: 'none',
        borderLeft: '1px solid #d1d5db',
        backgroundColor: '#65F152',
        color: '#000',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '80px',
        whiteSpace: 'nowrap' as const
    },
    button: {
        padding: '8px 16px',
        border: 'none',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    primaryButton: {
        backgroundColor: '#65F152',
        color: '#000'
    },
    secondaryButton: {
        backgroundColor: '#f3f4f6',
        color: '#374151'
    },
    dangerButton: {
        backgroundColor: '#fee2e2',
        color: '#b91c1c'
    },
    connectButton: {
        padding: '10px 20px',
        fontSize: '14px',
        fontWeight: '600',
        minHeight: '40px'
    },
    disabledButton: {
        opacity: 0.6,
        cursor: 'not-allowed'
    },
    loadingContent: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    },
    spinner: {
        width: '14px',
        height: '14px',
        border: '2px solid transparent',
        borderTop: '2px solid currentColor',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    },
    footer: {
        padding: '16px 24px',
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'flex-end'
    },
    warning: {
        backgroundColor: '#fffbeb',
        border: '1px solid #fbbf24',
        borderLeft: '4px solid #f59e0b',
        borderRadius: '4px',
        padding: '12px',
        fontSize: '12px',
        color: '#92400e'
    },
    error: {
        backgroundColor: '#fef2f2',
        border: '1px solid #f87171',
        borderRadius: '4px',
        padding: '12px',
        fontSize: '14px',
        color: '#b91c1c',
        marginBottom: '16px'
    }
}

// Animation CSS pour le spinner
const spinnerCSS = `
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`

// Injecter le CSS d'animation une seule fois
if (!document.getElementById('quickwallet-spinner-css')) {
    const styleElement = document.createElement('style')
    styleElement.id = 'quickwallet-spinner-css'
    styleElement.textContent = spinnerCSS
    document.head.appendChild(styleElement)
}

