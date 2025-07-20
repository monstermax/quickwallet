// src/services/SecureStorage.ts

// Service pour communiquer de manière sécurisée avec le background script via le content script
// context = injected script


interface StoredKeys {
    evm?: string
    solana?: string
    nostr?: string
    timestamp: number
}

interface StoredWallet {
    id: string
    name: string
    type: 'evm' | 'solana' | 'nostr'
    privateKey: string
    address: string
    timestamp: number
}

interface StoredWallets {
    wallets: StoredWallet[]
    timestamp: number
}

interface AutoConnectSettings {
    enabled: boolean
    domains: string[]
}

class SecureStorage {
    private sendMessageToBackground(action: string, data?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            // Créer un ID unique pour cette requête
            const requestId = Math.random().toString(36).substr(2, 9)

            // Écouter la réponse
            const handleResponse = (event: CustomEvent) => {
                if (event.detail.requestId === requestId) {
                    window.removeEventListener('QuickWalletResponse', handleResponse as EventListener)
                    if (event.detail.success) {
                        resolve(event.detail.data)
                    } else {
                        reject(new Error(event.detail.error))
                    }
                }
            }

            window.addEventListener('QuickWalletResponse', handleResponse as EventListener)

            // Envoyer la requête via le content script
            window.dispatchEvent(new CustomEvent('QuickWalletRequest', {
                detail: {
                    requestId,
                    action,
                    data
                }
            }))

            // Timeout après 10 secondes
            setTimeout(() => {
                window.removeEventListener('QuickWalletResponse', handleResponse as EventListener)
                reject(new Error('Timeout: Pas de réponse du background script'))
            }, 10000)
        })
    }

    // Sauvegarder les clés privées de manière sécurisée
    async saveKeys(keys: StoredKeys): Promise<void> {
        await this.sendMessageToBackground('saveKeys', keys)
    }

    // Charger les clés privées
    async loadKeys(): Promise<StoredKeys | null> {
        return await this.sendMessageToBackground('loadKeys')
    }

    // Supprimer les clés privées
    async deleteKeys(): Promise<void> {
        await this.sendMessageToBackground('deleteKeys')
    }

    // Sauvegarder les paramètres d'auto-connexion
    async saveAutoConnectSettings(settings: AutoConnectSettings): Promise<void> {
        await this.sendMessageToBackground('saveAutoConnectSettings', settings)
    }

    // Charger les paramètres d'auto-connexion
    async loadAutoConnectSettings(): Promise<AutoConnectSettings | null> {
        return await this.sendMessageToBackground('loadAutoConnectSettings')
    }

    // Vérifier si un domaine est autorisé
    async checkDomainAllowed(domain: string): Promise<boolean> {
        return await this.sendMessageToBackground('checkDomainAllowed', domain)
    }

    // Obtenir le domaine actuel
    getCurrentDomain(): string {
        return window.location.hostname + (window.location.port ? ':' + window.location.port : '')
    }

    // Nouvelles méthodes pour gérer plusieurs wallets
    async saveWallets(wallets: StoredWallets): Promise<void> {
        await this.sendMessageToBackground('saveWallets', wallets)
    }

    async loadWallets(): Promise<StoredWallets | null> {
        return await this.sendMessageToBackground('loadWallets')
    }

    async addWallet(wallet: StoredWallet): Promise<void> {
        await this.sendMessageToBackground('addWallet', wallet)
    }

    async removeWallet(walletId: string): Promise<void> {
        await this.sendMessageToBackground('removeWallet', walletId)
    }
}

export const secureStorage = new SecureStorage()
export type { StoredKeys, StoredWallet, StoredWallets, AutoConnectSettings }