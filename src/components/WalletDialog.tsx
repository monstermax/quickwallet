// WalletDialog.tsx

import React, { useState, useEffect } from 'react'

import type { WalletDialogProps } from '../types/wallet'


export const WalletDialog: React.FC<WalletDialogProps> = ({
    isOpen,
    walletState,
    onClose,
    onConnect,
    onDisconnect
}) => {
    const [evmKey, setEvmKey] = useState('')
    const [solanaKey, setSolanaKey] = useState('')
    const [evmLoading, setEvmLoading] = useState(false)
    const [solanaLoading, setSolanaLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            setEvmKey('')
            setSolanaKey('')
            setError(null)
            setEvmLoading(false)
            setSolanaLoading(false)
        }
    }, [isOpen])

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
                    </div>
                </div>

                {/* Footer simplifié */}
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
        fontFamily: 'inherit'
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

