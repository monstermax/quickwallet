// injected_script.js

import { initializeQuickWallet_Evm, validateEvmPrivateKey } from "./wallet_evm.js";
import { initializeQuickWallet_Solana, validateSolanaPrivateKey } from "./wallet_solana.js";
import { showNotification } from "./utils.js";


console.log("%cQuickWallet enabled", "color:#65F152; font-size:50px; font-weight: bold; -webkit-text-stroke: 1px black;")


function initializeQuickWallet() {
    console.log(`QuickWallet loaded`);

    window.QuickWallet = window.QuickWallet || { show: showWallet };


    initializeQuickWallet_Evm();
    initializeQuickWallet_Solana();


    window.addEventListener('keydown', function (event) {
        if (event.altKey && (event.keyCode === 87 || event.which === 87)) {
            // ALT + W
            event.preventDefault();
            showWallet();
        }
    });

}


function showWallet() {
    const existingOverlay = document.getElementById('quickwallet-overlay');

    if (existingOverlay) {
        document.body.removeChild(existingOverlay);
    }

    const dialog = showWalletDialog({
        ethAddress: window.QuickWallet.evm.getAddress(),
        solAddress: window.QuickWallet.solana.getAddress(),
    });

    dialog.onDisconnect((chain) => {
        console.log('Disconnect from', chain);

        if (chain === 'evm') {
            window.QuickWallet.evm.setPrivateKey(null);
        }

        if (chain === 'solana') {
            window.QuickWallet.solana.setPrivateKey(null);
        }


        dialog.close()
        showWallet()
    });

    //dialog.onSubmit((data) => {
    //    console.log('Submitted private key for', data);
    //});

    const dialogBox = document.getElementById('quickwallet-dialogbox');
    const btnAccept = dialogBox.querySelector('.dialog-accept');
    const privateKeyInputs = dialogBox.querySelectorAll('.wallet-input');

    btnAccept.addEventListener('click', (e) => {
        e.preventDefault();

        const actives = {
            'evm': !!window.QuickWallet.evm.getAddress(),
            'solana': !!window.QuickWallet.solana.getAddress(),
        };

        for (const input of privateKeyInputs) {
            const chain = input.dataset.chain; // string
            let privateKey = input.value.trim(); // string | null

            if (chain === 'evm') {
                privateKey = validateEvmPrivateKey(privateKey);

                window.QuickWallet.evm.setPrivateKey(privateKey);
                actives['evm'] = !!privateKey;
            }

            if (chain === 'solana') {
                privateKey = validateSolanaPrivateKey(privateKey);

                window.QuickWallet.solana.setPrivateKey(privateKey);
                actives['solana'] = !!privateKey;
            }
        }

        dialog.close();

        showNotification(`
            <div><b>QuickWallet</b></div>
            <br />
            <div>🦊 EVM: &nbsp; &nbsp; ${actives['evm'] ? '🟢 Connected' : '🔴 Not connected'}</div>
            <div>👾 Solana: ${actives['solana'] ? '🟢 Connected' : '🔴 Not connected'}</div>
        `);
    })

}



function showWalletDialog(walletStates = {}) {
    // Default wallet states
    const {
        ethAddress = '',
        solAddress = '',
        width = '500px'
    } = walletStates;

    const ethConnected = !!ethAddress;
    const solConnected = !!solAddress;

    // Create overlay and dialog elements
    const overlay = document.createElement('div');
    overlay.id = 'quickwallet-overlay';

    const dialogBox = document.createElement('div');
    dialogBox.id = 'quickwallet-dialogbox';

    // Generate input fields based on connection status
    const ethField = ethConnected
        ? `<div class="wallet-info">
              <span class="wallet-label">EVM:</span>
              <span class="wallet-address">${ethAddress}</span>
              <button class="wallet-disconnect" data-chain="evm">Disconnect</button>
           </div>`
        : `<div class="wallet-input-group">
              <label class="wallet-label">EVM:</label>
              <input type="password" class="wallet-input" data-chain="evm" placeholder="Enter your private key">
           </div>`;

    const solField = solConnected
        ? `<div class="wallet-info">
              <span class="wallet-label">Solana:</span>
              <span class="wallet-address">${solAddress}</span>
              <button class="wallet-disconnect" data-chain="solana">Disconnect</button>
           </div>`
        : `<div class="wallet-input-group">
              <label class="wallet-label">Solana:</label>
              <input type="password" class="wallet-input" data-chain="solana" placeholder="Enter your private key">
           </div>`;

    // Set HTML content
    dialogBox.innerHTML = `
        <button class="dialog-close-cross" aria-label="Close dialog">×</button>
        <h3 class="dialog-title">QuickWallet Connections</h3>
        ${ethField}
        ${solField}
        <div class="dialog-buttons">
            <button class="dialog-accept">Accept</button>
            <button class="dialog-close">Close</button>
        </div>
    `;

    // Styling
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    dialogBox.style.cssText = `
        background-color: #ffffff;
        padding: 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        width: ${width};
        position: relative;
        color: #1f2937;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    `;

    // Add styles for child elements
    const style = document.createElement('style');
    style.textContent = `
        .dialog-title {
            margin-top: 0;
            margin-bottom: 20px;
            font-size: 18px;
            font-weight: 600;
            color: #111827;
        }
        .wallet-input-group, .wallet-info {
            margin-bottom: 20px;
        }
        .wallet-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            font-size: 14px;
            color: #374151;
        }
        .wallet-input {
            width: 100%;
            padding: 10px 12px;
            box-sizing: border-box;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            font-size: 14px;
            background-color: #f9fafb;
        }
        .wallet-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
        .wallet-address {
            font-family: monospace;
            font-size: 11px;
            color: #1e40af;
            background-color: #eff6ff;
            padding: 4px 8px;
            border-radius: 4px;
            word-break: break-all;
            display: inline-block;
            margin-right: 10px;
        }
        .wallet-disconnect {
            padding: 4px 8px;
            background-color: #fee2e2;
            color: #b91c1c;
            border: none;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .wallet-disconnect:hover {
            background-color: #fecaca;
        }
        .dialog-buttons {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            margin-top: 24px;
        }
        .dialog-accept {
            padding: 8px 16px;
            background-color: #e4f4e4;
            color: #374151;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .dialog-accept:hover {
            background-color: #d4e4d4;
        }
        .dialog-close {
            padding: 8px 16px;
            background-color: #f4e4e4;
            color: #374151;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .dialog-close:hover {
            background-color: #e4d4d4;
        }
        .dialog-close-cross {
            position: absolute;
            top: 12px;
            right: 12px;
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #6b7280;
            padding: 4px;
        }
        .dialog-close-cross:hover {
            color: #111827;
        }
    `;
    document.head.appendChild(style);

    // Get references to important elements
    const closeBtn = dialogBox.querySelector('.dialog-close');
    const closeCross = dialogBox.querySelector('.dialog-close-cross');
    const disconnectButtons = dialogBox.querySelectorAll('.wallet-disconnect');
    //const privateKeyInputs = dialogBox.querySelectorAll('.wallet-input');

    // Event handlers
    const closeDialog = () => {
        document.body.removeChild(overlay);
        document.head.removeChild(style);
    };

    closeCross.onclick = closeDialog;
    closeBtn.onclick = closeDialog;

    overlay.onclick = (e) => e.target === overlay && closeDialog();
    dialogBox.onclick = (e) => e.stopPropagation();

    // Add to DOM
    overlay.appendChild(dialogBox);
    document.body.appendChild(overlay);

    // Return API with additional methods
    return {
        element: overlay,
        close: closeDialog,
        onDisconnect: (callback) => {
            disconnectButtons.forEach(btn => {
                btn.onclick = (e) => {
                    callback(e.target.dataset.chain);
                    //closeDialog();
                };
            });
        },
    };
}


window.addEventListener('QuickWalletEvent', (event) => {
    if (event.detail.action === "show-wallet-on-page" && window.QuickWallet) {
        window.QuickWallet.show()
    }
});



initializeQuickWallet();

