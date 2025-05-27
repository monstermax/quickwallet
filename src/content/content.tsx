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
