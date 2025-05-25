
import { solanaWeb3 } from './lib/solana-web3.js';
import { base58 } from './lib/base58.js';


let _autoSign = true;


export function initializeQuickWallet_Solana() {
    console.log(`QuickWallet.solana loaded`);

    window.QuickWallet = window.QuickWallet || {};

    window.QuickWallet.lib = window.QuickWallet.lib || {};
    window.QuickWallet.lib.solanaWeb3 = window.QuickWallet.lib.solanaWeb3 || solanaWeb3;
    window.QuickWallet.lib.base58 = window.QuickWallet.lib.base58 || base58;

    window.QuickWallet.solana = window.QuickWallet.solana || Wallet_Solana()
}



function Wallet_Solana(privateKey = null) {

    const setPrivateKey = (newPrivateKey) => {
        if (!privateKey && newPrivateKey) {
            injectWallet(newPrivateKey)
        }

        privateKey = newPrivateKey;
    }

    const getAddress = () => {
        if (!privateKey) return null;

        const secretKey = base58.decode(privateKey);
        const keypair = solanaWeb3.Keypair.fromSecretKey(secretKey);

        return keypair.publicKey.toBase58();
    }


    const wallet = {
        setPrivateKey,
        getAddress,
    }

    return wallet;
}




function injectWallet(privateKeyBase58) {
    privateKeyBase58 = privateKeyBase58 || prompt('Private Key ? (format base58)');

    // Sauvegarder les méthodes originales de Phantom
    const originalPhantom = window.phantom?.solana;
    const originalSolana = window.solana;

    // Intercepter window.solana
    if (window.solana) {
        var _sol_connect = window.solana.connect;
        var _sol_disconnect = window.solana.disconnect;
        var _sol_signTransaction = window.solana.signTransaction;
        var _sol_signAllTransactions = window.solana.signAllTransactions;
        var _sol_signMessage = window.solana.signMessage;
        var _sol_request = window.solana.request;

        window.solana.connect = async (options) => {
            console.log('window.solana.connect intercepted', options);

            if (privateKeyBase58) {
                const publicKey = _getPublicKeyFromPrivate(privateKeyBase58);
                return {
                    publicKey: new solanaWeb3.PublicKey(publicKey)
                };
            }

            const result = await _sol_connect(options);
            console.log(' => connect result =', result);
            return result;
        };

        window.solana.disconnect = async () => {
            console.log('window.solana.disconnect intercepted');
            const result = await _sol_disconnect();
            console.log(' => disconnect result =', result);
            return result;
        };

        window.solana.signTransaction = async (transaction) => {
            console.log('window.solana.signTransaction intercepted', transaction);

            if (privateKeyBase58) {
                return await signTransaction(transaction, privateKeyBase58);
            }

            const result = await _sol_signTransaction(transaction);
            console.log(' => signTransaction result =', result);
            return result;
        };

        window.solana.signAllTransactions = async (transactions) => {
            console.log('window.solana.signAllTransactions intercepted', transactions);

            if (privateKeyBase58) {
                const signedTransactions = [];
                for (const tx of transactions) {
                    signedTransactions.push(await signTransaction(tx, privateKeyBase58));
                }
                return signedTransactions;
            }

            const result = await _sol_signAllTransactions(transactions);
            console.log(' => signAllTransactions result =', result);
            return result;
        };

        window.solana.signMessage = async (message, encoding) => {
            console.log('window.solana.signMessage intercepted', message, encoding);

            if (privateKeyBase58) {
                return await signMessage(message, privateKeyBase58, encoding);
            }

            const result = await _sol_signMessage(message, encoding);
            console.log(' => signMessage result =', result);
            return result;
        };

        if (window.solana.request) {
            window.solana.request = async (request) => {
                console.log('window.solana.request intercepted', request);

                if (request.method === 'connect' && privateKeyBase58) {
                    const publicKey = _getPublicKeyFromPrivate(privateKeyBase58);
                    return {
                        publicKey: new solanaWeb3.PublicKey(publicKey)
                    };
                }

                const result = await _sol_request(request);
                console.log(' => request result =', result);
                return result;
            };
        }
    }

    // Intercepter window.phantom.solana si disponible
    if (window.phantom) {
        //window.phantom.solana = window.solana;
    }

}


async function signTransaction(transaction, privateKeyBase58) {
    console.log('signTransaction called with:', transaction);

    // Simuler une demande de signature
    const approved = _autoSign || confirm(`Confirmer la transaction Solana?`);

    if (approved) {
        try {
            // Créer le keypair à partir de la clé privée
            const secretKey = base58.decode(privateKeyBase58);
            const keypair = solanaWeb3.Keypair.fromSecretKey(secretKey);

            // Signer la transaction
            transaction.sign([keypair]);

            return transaction;

        } catch (error) {
            console.error('Transaction signing failed:', error);
            throw new Error(`Erreur lors de la signature: ${error.message}`);
        }

    } else {
        throw new Error('User rejected the transaction');
    }
}


async function signMessage(message, privateKeyBase58, encoding = 'utf8') {
    console.log('signMessage called with:', message, encoding);

    // Simuler une demande de signature
    const approved = _autoSign || confirm(`Confirmer la signature du message?`);

    if (approved) {
        try {
            // Créer le keypair à partir de la clé privée
            const secretKey = base58.decode(privateKeyBase58);
            const keypair = solanaWeb3.Keypair.fromSecretKey(secretKey);

            // Convertir le message en Uint8Array si nécessaire
            let messageBytes;
            if (typeof message === 'string') {
                messageBytes = new TextEncoder().encode(message);

            } else if (message instanceof Uint8Array) {
                messageBytes = message;

            } else {
                messageBytes = new Uint8Array(message);
            }

            // Signer le message
            const signature = solanaWeb3.sign.detached(messageBytes, keypair.secretKey);

            return {
                signature: signature,
                publicKey: keypair.publicKey.toBase58()
            };

        } catch (error) {
            console.error('Message signing failed:', error);
            throw new Error(`Erreur lors de la signature: ${error.message}`);
        }
    } else {
        throw new Error('User rejected the message signing');
    }
}


function _getPublicKeyFromPrivate(privateKeyBase58) {
    try {
        const secretKey = base58.decode(privateKeyBase58);
        const keypair = solanaWeb3.Keypair.fromSecretKey(secretKey);
        return keypair.publicKey.toBase58();

    } catch (error) {
        console.error('Error getting public key:', error);
        throw error;
    }
}



export function validateSolanaPrivateKey(key) {
    if (!key) return null;

    // Nettoyer les espaces
    key = key.replace(/\s/g, '');

    // Validation longueur base58
    if (!/^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(key)) {
        console.warn('Invalid Solana private key format');
        return null;
    }

    // Test de décodage
    try {
        const decoded = window.QuickWallet.lib.base58.decode(key);
        if (decoded.length !== 64) {
            throw new Error('Invalid key length after decode');
        }

    } catch (e) {
        console.warn('Invalid Solana private key:', e.message);
        return null;
    }

    return key;
}


