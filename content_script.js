// content_script.js


// Injecter le script dans la page
function injectScript(url, scriptType = '') {
    try {
        const container = document.head || document.documentElement;
        const scriptTag = document.createElement('script');

        scriptTag.src = url;
        scriptTag.type = scriptType;
        scriptTag.onload = () => {};

        container.insertBefore(scriptTag, container.children[0]);
        //console.log('Script injecté:', url);

    } catch (error) {
        console.error('Erreur lors de l\'injection du script:', error);
    }
}


injectScript(chrome.runtime.getURL('injected_script.js'), 'module');



chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('message received', message);

    if (message.action === "show-wallet-on-tab") {
        window.dispatchEvent(new CustomEvent('QuickWalletEvent', {
            detail: {
                action: "show-wallet-on-page",
            }
        }));
    }
});

