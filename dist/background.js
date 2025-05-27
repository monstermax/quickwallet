chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "show-wallet",
    title: "Set QuickWallet React private keys (Alt+W)",
    contexts: ["all"]
  });
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "show-wallet" && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { action: "show-wallet-on-tab" });
  }
});
