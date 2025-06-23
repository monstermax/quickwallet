// injected.tsx

import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'

import { WalletDialog } from '../components/WalletDialog'
import { Notification } from '../components/Notification'
import { ConfirmationDialog } from '../components/ConfirmationDialog'
import { useWallet } from '../hooks/useWallet'
import { useConfirmation } from '../hooks/useConfirmation'


export type NotificationType = {
    show: boolean,
    message: string,
    type: 'info' | 'success' | 'error'
};


console.log("%cQuickWallet React enabled", "color:#65F152; font-size:50px; font-weight: bold; -webkit-text-stroke: 1px black;")


const QuickWalletApp: React.FC = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [notification, setNotification] = useState<NotificationType>({
        show: false,
        message: '',
        type: 'info' as 'info' | 'success' | 'error'
    })

    const {
        walletState,
        connectEVM,
        connectSolana,
        disconnectEVM,
        disconnectSolana,
        evmWallet,
        solanaWallet,
    } = useWallet()

    const {
        confirmationState,
        showConfirmation,
        handleConfirm,
        handleCancel
    } = useConfirmation()

    // Fonction pour l'auto-connexion
    const handleAutoConnect = async () => {
        try {
            // Importer le service de stockage sécurisé
            const { secureStorage } = await import('../services/SecureStorage')

            const keys = await secureStorage.loadKeys()
            if (!keys) return

            let connectedCount = 0

            // Auto-connexion EVM
            if (keys.evm) {
                try {
                    await handleConnect('evm', keys.evm)
                    connectedCount++
                } catch (error) {
                    console.error('Erreur auto-connexion EVM:', error)
                }
            }

            // Auto-connexion Solana
            if (keys.solana) {
                try {
                    await handleConnect('solana', keys.solana)
                    connectedCount++
                } catch (error) {
                    console.error('Erreur auto-connexion Solana:', error)
                }
            }

            // Afficher une notification si des wallets ont été connectés
            if (connectedCount > 0) {
                setNotification({
                    show: true,
                    type: 'success',
                    message: `🔐 Auto-connexion réussie: ${connectedCount} wallet(s) connecté(s)`
                })
            }

        } catch (error) {
            console.error('Erreur lors de l\'auto-connexion:', error)
        }
    }

    const showWallet = () => {
        setIsDialogOpen(true)
    }

    const handleConnect = async (chain: 'evm' | 'solana', privateKey: string) => {
        try {
            if (chain === 'evm') {
                connectEVM(privateKey);

            } else {
                connectSolana(privateKey);
            }

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

    // Écouter les événements de changement de mode
    useEffect(() => {
        const handleModeChange = (event: CustomEvent) => {
            const { chain, mode, active } = event.detail
            console.log(`Mode change received: ${chain} -> ${mode} (${active ? 'active' : 'inactive'})`)

            // Passer l'événement aux services wallet (ils ont leurs propres listeners)
            // Pas besoin de faire quoi que ce soit ici, les services écoutent directement
        }

        window.addEventListener('QuickWalletModeChange', handleModeChange as EventListener)

        return () => {
            window.removeEventListener('QuickWalletModeChange', handleModeChange as EventListener)
        }
    }, [])

    // Exposer l'API globale et écouter l'auto-connexion
    useEffect(() => {
        (window as any).QuickWallet = {
            show: showWallet,
            confirm: showConfirmation,
            evm: {
                getAddress: () => walletState.evm.address,
                setPrivateKey: (key: string | null) => {
                    if (key) {
                        try {
                            connectEVM(key);

                        } catch (e) {
                            console.error('Failed to set EVM private key:', e);
                        }

                    } else {
                        disconnectEVM()
                    }
                },
            },
            solana: {
                getAddress: () => walletState.solana.address,
                setPrivateKey: (key: string | null) => {
                    if (key) {
                        try {
                            connectSolana(key);

                        } catch (e) {
                            console.error('Failed to set Solana private key:', e);
                        }

                    } else {
                        disconnectSolana();
                    }
                }
            }
        }

        // Écouter l'événement d'auto-connexion
        const handleAutoConnectEvent = () => {
            handleAutoConnect()
        }

        window.addEventListener('QuickWalletAutoConnect', handleAutoConnectEvent)

        return () => {
            window.removeEventListener('QuickWalletAutoConnect', handleAutoConnectEvent)
        }
    }, [walletState, connectEVM, connectSolana, disconnectEVM, disconnectSolana, showConfirmation]);

    return (
        <>
            <WalletDialog
                isOpen={isDialogOpen}
                walletState={walletState}
                onClose={() => setIsDialogOpen(false)}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                setNotification={setNotification}
            />

            <Notification
                show={notification.show}
                message={notification.message}
                type={notification.type}
                onClose={() => setNotification(prev => ({ ...prev, show: false }))}
            />

            <ConfirmationDialog
                isOpen={confirmationState.isOpen}
                title={confirmationState.title}
                message={confirmationState.message}
                details={confirmationState.details}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
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
            event.preventDefault();
            (window as any).QuickWallet?.show();
        }
    })

    window.addEventListener('QuickWalletEvent', (event: any) => {
        if (event.detail.action === "show-wallet-on-page" && (window as any).QuickWallet) {
            (window as any).QuickWallet.show();

        } else if (event.detail.action === "auto-connect") {
            // Déclencher l'auto-connexion
            setTimeout(() => {
                const app = document.querySelector('#quickwallet-react-root');

                if (app) {
                    // Déclencher l'auto-connexion via un événement personnalisé
                    window.dispatchEvent(new CustomEvent('QuickWalletAutoConnect'));
                }
            }, 100);
        }
    })
}



window.addEventListener('load', (event: any) => {
    // Lancer l'initialisation
    initializeQuickWallet()
});
