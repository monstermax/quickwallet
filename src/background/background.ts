// background.ts

// Background script reste identique mais en TypeScript


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





