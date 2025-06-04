// content.tsx

// Content script pour injecter le script React

function injectScript(url: string, scriptType = '') {
    try {
        const container = document.head || document.documentElement
        const scriptTag = document.createElement('script')

        scriptTag.src = url
        scriptTag.type = scriptType
        scriptTag.onload = () => {
            console.log('QuickWallet React script injected successfully')
        }

        container.insertBefore(scriptTag, container.children[0])
    } catch (error) {
        console.error('Erreur lors de l\'injection du script:', error)
    }
}


// Injecter le script principal
injectScript(chrome.runtime.getURL('injected.js'), 'module')

// Fonction pour déclencher l'auto-connexion
async function triggerAutoConnect() {
    try {
        const currentDomain = window.location.hostname + (window.location.port ? ':' + window.location.port : '')
        
        // Vérifier si le domaine est autorisé via le background script
        chrome.runtime.sendMessage(
            { action: 'checkDomainAllowed', domain: currentDomain },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Erreur lors de la vérification du domaine:', chrome.runtime.lastError.message)
                    return
                }
                
                if (response.success && response.data) {
                    // Le domaine est autorisé, déclencher l'auto-connexion
                    window.dispatchEvent(new CustomEvent('QuickWalletEvent', {
                        detail: {
                            action: "auto-connect",
                        }
                    }))
                }
            }
        )
    } catch (error) {
        console.error('Erreur lors de l\'auto-connexion:', error)
    }
}

// Pont de communication entre la page web et le background script
window.addEventListener('QuickWalletRequest', (event: any) => {
    const { requestId, action, data } = event.detail
    
    chrome.runtime.sendMessage(
        { action, data },
        (response) => {
            // Renvoyer la réponse à la page web
            window.dispatchEvent(new CustomEvent('QuickWalletResponse', {
                detail: {
                    requestId,
                    success: response ? response.success : false,
                    data: response ? response.data : null,
                    error: response ? response.error : 'Pas de réponse du background script'
                }
            }))
        }
    )
})

// Déclencher l'auto-connexion après un court délai pour s'assurer que la page est chargée
setTimeout(triggerAutoConnect, 1000)

// Écouter les messages du background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script received message:', message)

    if (message.action === "show-wallet-on-tab") {
        window.dispatchEvent(new CustomEvent('QuickWalletEvent', {
            detail: {
                action: "show-wallet-on-page",
            }
        }))
    }
})
