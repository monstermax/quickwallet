// background.ts

// Background script avec gestion sécurisée des clés privées

// Interface pour les clés stockées
interface StoredKeys {
    evm?: string
    solana?: string
    timestamp: number
}

interface AutoConnectSettings {
    enabled: boolean
    domains: string[]
}

// Fonction simple de chiffrement (XOR avec une clé dérivée)
function simpleEncrypt(text: string, password: string): string {
    const key = Array.from(password).reduce((a, b) => a + b.charCodeAt(0), 0)
    return btoa(Array.from(text).map((char, i) =>
        String.fromCharCode(char.charCodeAt(0) ^ (key + i) % 256)
    ).join(''))
}

function simpleDecrypt(encrypted: string, password: string): string {
    const key = Array.from(password).reduce((a, b) => a + b.charCodeAt(0), 0)
    const decoded = atob(encrypted)
    return Array.from(decoded).map((char, i) =>
        String.fromCharCode(char.charCodeAt(0) ^ (key + i) % 256)
    ).join('')
}

// Générer une clé de chiffrement basée sur l'ID de l'extension
function getEncryptionKey(): string {
    return chrome.runtime.id + '_quickwallet_key_2024'
}

// Créer le menu contextuel au chargement de l'extension
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "show-wallet",
        title: "QuickWallet settings (Alt+W)",
        contexts: ["all"]
    })
})

// Ajouter un listener pour l'événement de clic sur le menu
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "show-wallet" && tab?.id) {
        chrome.tabs.sendMessage(tab.id, { action: "show-wallet-on-tab" })
    }
})

// Gestionnaire des messages pour le stockage sécurisé
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'saveKeys':
            handleSaveKeys(request.data)
                .then(result => sendResponse({ success: true, data: result }))
                .catch(error => sendResponse({ success: false, error: error.message }))
            return true // Indique que la réponse sera asynchrone

        case 'loadKeys':
            handleLoadKeys()
                .then(result => sendResponse({ success: true, data: result }))
                .catch(error => sendResponse({ success: false, error: error.message }))
            return true

        case 'deleteKeys':
            handleDeleteKeys()
                .then(result => sendResponse({ success: true, data: result }))
                .catch(error => sendResponse({ success: false, error: error.message }))
            return true

        case 'saveAutoConnectSettings':
            handleSaveAutoConnectSettings(request.data)
                .then(result => sendResponse({ success: true, data: result }))
                .catch(error => sendResponse({ success: false, error: error.message }))
            return true

        case 'loadAutoConnectSettings':
            handleLoadAutoConnectSettings()
                .then(result => sendResponse({ success: true, data: result }))
                .catch(error => sendResponse({ success: false, error: error.message }))
            return true

        case 'checkDomainAllowed':
            handleCheckDomainAllowed(request.domain)
                .then(result => sendResponse({ success: true, data: result }))
                .catch(error => sendResponse({ success: false, error: error.message }))
            return true
    }
})

// Fonctions de gestion du stockage
async function handleSaveKeys(keys: StoredKeys): Promise<void> {
    try {
        const encryptionKey = getEncryptionKey()
        const encryptedKeys: any = {
            timestamp: keys.timestamp
        }

        if (keys.evm) {
            encryptedKeys.evm = simpleEncrypt(keys.evm, encryptionKey)
        }
        if (keys.solana) {
            encryptedKeys.solana = simpleEncrypt(keys.solana, encryptionKey)
        }

        await chrome.storage.local.set({ 'quickwallet_private_keys': encryptedKeys })
    } catch (error) {
        throw new Error('Erreur lors de la sauvegarde des clés')
    }
}

async function handleLoadKeys(): Promise<StoredKeys | null> {
    try {
        const result = await chrome.storage.local.get(['quickwallet_private_keys'])
        const encryptedKeys = result.quickwallet_private_keys

        if (!encryptedKeys) {
            return null
        }

        const encryptionKey = getEncryptionKey()
        const decryptedKeys: StoredKeys = {
            timestamp: encryptedKeys.timestamp
        }

        if (encryptedKeys.evm) {
            decryptedKeys.evm = simpleDecrypt(encryptedKeys.evm, encryptionKey)
        }
        if (encryptedKeys.solana) {
            decryptedKeys.solana = simpleDecrypt(encryptedKeys.solana, encryptionKey)
        }

        return decryptedKeys
    } catch (error) {
        throw new Error('Erreur lors du chargement des clés')
    }
}

async function handleDeleteKeys(): Promise<void> {
    try {
        await chrome.storage.local.remove(['quickwallet_private_keys'])
    } catch (error) {
        throw new Error('Erreur lors de la suppression des clés')
    }
}

async function handleSaveAutoConnectSettings(settings: AutoConnectSettings): Promise<void> {
    try {
        await chrome.storage.local.set({ 'quickwallet_autoconnect_settings': settings })
    } catch (error) {
        throw new Error('Erreur lors de la sauvegarde des paramètres d\'auto-connexion')
    }
}

async function handleLoadAutoConnectSettings(): Promise<AutoConnectSettings | null> {
    try {
        const result = await chrome.storage.local.get(['quickwallet_autoconnect_settings'])
        return result.quickwallet_autoconnect_settings || null
    } catch (error) {
        throw new Error('Erreur lors du chargement des paramètres d\'auto-connexion')
    }
}

async function handleCheckDomainAllowed(domain: string): Promise<boolean> {
    try {
        const settings = await handleLoadAutoConnectSettings()
        if (!settings || !settings.enabled) {
            return false
        }
        return settings.domains.includes(domain)
    } catch (error) {
        return false
    }
}





