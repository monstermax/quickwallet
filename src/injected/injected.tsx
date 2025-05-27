// injected.tsx

import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'

import { WalletDialog } from '../components/WalletDialog'
import { Notification } from '../components/Notification'
import { useWallet } from '../hooks/useWallet'


console.log("%cQuickWallet React enabled", "color:#65F152; font-size:50px; font-weight: bold; -webkit-text-stroke: 1px black;")


const QuickWalletApp: React.FC = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [notification, setNotification] = useState({
        show: false,
        message: '',
        type: 'info' as 'info' | 'success' | 'error'
    })

    const {
        walletState,
        connectEVM,
        connectSolana,
        disconnectEVM,
        disconnectSolana
    } = useWallet()

    const showWallet = () => {
        setIsDialogOpen(true)
    }

    const handleConnect = async (chain: 'evm' | 'solana', privateKey: string) => {
        try {
            if (chain === 'evm') {
                connectEVM(privateKey)
            } else {
                connectSolana(privateKey)
            }

            setTimeout(() => {
                setNotification({
                    show: true,
                    type: 'success',
                    message: `
            <div><b>QuickWallet React</b></div>
            <br />
            <div>🦊 EVM: ${walletState.evm.isConnected ? '🟢 Connected' : '🔴 Not connected'}</div>
            <div>👾 Solana: ${walletState.solana.isConnected ? '🟢 Connected' : '🔴 Not connected'}</div>
          `
                })
            }, 100)

        } catch (error) {
            setNotification({
                show: true,
                type: 'error',
                message: `<b>Connection Error:</b><br/>${error instanceof Error ? error.message : 'Unknown error'}`
            })
        }
    }

    const handleDisconnect = (chain: 'evm' | 'solana') => {
        if (chain === 'evm') {
            disconnectEVM()
        } else {
            disconnectSolana()
        }
    }


    // Exposer l'API globale
    useEffect(() => {
        (window as any).QuickWallet = {
            show: showWallet,
            evm: {
                getAddress: () => walletState.evm.address,
                setPrivateKey: (key: string | null) => {
                    if (key) {
                        try {
                            connectEVM(key)
                        } catch (e) {
                            console.error('Failed to set EVM private key:', e)
                        }

                    } else {
                        disconnectEVM()
                    }
                }
            },
            solana: {
                getAddress: () => walletState.solana.address,
                setPrivateKey: (key: string | null) => {
                    if (key) {
                        try {
                            connectSolana(key)
                        } catch (e) {
                            console.error('Failed to set Solana private key:', e)
                        }

                    } else {
                        disconnectSolana()
                    }
                }
            }
        }
    }, [walletState, connectEVM, connectSolana, disconnectEVM, disconnectSolana])

    return (
        <>
            <WalletDialog
                isOpen={isDialogOpen}
                walletState={walletState}
                onClose={() => setIsDialogOpen(false)}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
            />

            <Notification
                show={notification.show}
                message={notification.message}
                type={notification.type}
                onClose={() => setNotification(prev => ({ ...prev, show: false }))}
            />
        </>
    )
}


// Container React component pour encapsuler l'app
const QuickWalletContainer: React.FC = () => {
    return (
        <div
            id="quickwallet-react-root"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 999999,
                pointerEvents: 'none',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
        >
            <style>
                {`
          #quickwallet-react-root > div { pointer-events: auto; }
        `}
            </style>
            <QuickWalletApp />
        </div>
    )
}


// Initialisation 100% React
function initializeQuickWallet() {
    console.log(`QuickWallet React loaded`)

    // Créer le container avec React (pas de DOM manuel)
    const container = document.createElement('div')
    document.body.appendChild(container)

    // Monter l'app React complète
    const root = createRoot(container)
    root.render(<QuickWalletContainer />)

    // Event listeners
    window.addEventListener('keydown', (event) => {
        if (event.altKey && (event.keyCode === 87 || event.which === 87)) {
            event.preventDefault()
                ; (window as any).QuickWallet?.show()
        }
    })

    window.addEventListener('QuickWalletEvent', (event: any) => {
        if (event.detail.action === "show-wallet-on-page" && (window as any).QuickWallet) {
            ; (window as any).QuickWallet.show()
        }
    })
}


// Lancer l'initialisation
initializeQuickWallet()
