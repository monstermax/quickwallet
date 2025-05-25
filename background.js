// background.js


// Créer le menu contextuel au chargement de l'extension
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "show-wallet",
        title: "Set QuickWallet private keys (Alt+W)",
        contexts: ["all"] // ou ["page", "selection", etc.]
    });
});


// Ajouter un listener pour l'événement de clic sur le menu
chrome.contextMenus.onClicked.addListener((info, tab) => {

    if (info.menuItemId === "show-wallet") {
        // Vous pouvez aussi envoyer un message à un content script
        chrome.tabs.sendMessage(tab.id, { action: "show-wallet-on-tab" });
    }
});

