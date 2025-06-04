function injectScript(url, scriptType = "") {
  try {
    const container = document.head || document.documentElement;
    const scriptTag = document.createElement("script");
    scriptTag.src = url;
    scriptTag.type = scriptType;
    scriptTag.onload = () => {
      console.log("QuickWallet React script injected successfully");
    };
    container.insertBefore(scriptTag, container.children[0]);
  } catch (error) {
    console.error("Erreur lors de l'injection du script:", error);
  }
}
injectScript(chrome.runtime.getURL("injected.js"), "module");
async function triggerAutoConnect() {
  try {
    const currentDomain = window.location.hostname + (window.location.port ? ":" + window.location.port : "");
    chrome.runtime.sendMessage(
      { action: "checkDomainAllowed", domain: currentDomain },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("Erreur lors de la vérification du domaine:", chrome.runtime.lastError.message);
          return;
        }
        if (response.success && response.data) {
          window.dispatchEvent(new CustomEvent("QuickWalletEvent", {
            detail: {
              action: "auto-connect"
            }
          }));
        }
      }
    );
  } catch (error) {
    console.error("Erreur lors de l'auto-connexion:", error);
  }
}
window.addEventListener("QuickWalletRequest", (event) => {
  const { requestId, action, data } = event.detail;
  chrome.runtime.sendMessage(
    { action, data },
    (response) => {
      window.dispatchEvent(new CustomEvent("QuickWalletResponse", {
        detail: {
          requestId,
          success: response ? response.success : false,
          data: response ? response.data : null,
          error: response ? response.error : "Pas de réponse du background script"
        }
      }));
    }
  );
});
setTimeout(triggerAutoConnect, 1e3);
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Content script received message:", message);
  if (message.action === "show-wallet-on-tab") {
    window.dispatchEvent(new CustomEvent("QuickWalletEvent", {
      detail: {
        action: "show-wallet-on-page"
      }
    }));
  }
});
