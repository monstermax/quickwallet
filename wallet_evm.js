
import { ethers } from './lib/ethers-6.13.5.js';


let _autoSign = true;


export function initializeQuickWallet_Evm() {
    console.log(`QuickWallet.evm loaded`);

    window.QuickWallet = window.QuickWallet || {};

    window.QuickWallet.lib = window.QuickWallet.lib || {};
    window.QuickWallet.lib.ethers = window.QuickWallet.lib.ethers || ethers;

    window.QuickWallet.evm = window.QuickWallet.evm || Wallet_EVM();

}



function Wallet_EVM(privateKey = null, chainId = null) {

    const setPrivateKey = (newPrivateKey) => {
        if (!privateKey && newPrivateKey) {
            injectWallet(newPrivateKey)
        }

        privateKey = newPrivateKey;
    }

    const getAddress = () => {
        if (!privateKey) return null;

        const wallet = new ethers.Wallet(privateKey);
        return wallet.address;
    }

    const getChainId = () => chainId;

    const setChainId = (newChainId) => { chainId = newChainId };


    const wallet = {
        setPrivateKey,
        getAddress,
        getChainId,
        setChainId,
    }

    return wallet;
}





function injectWallet(privateKey) {
    privateKey = privateKey || prompt('Private Key ? (format: 0x12354....)');

    var _mm_enable = window.ethereum.enable;

    window.ethereum.enable = async (e) => {
        console.log('window.ethereum.enable intercepted', e);
        const result = _mm_enable(e);
        return result.then(r => {
            console.log(' => enable result =', r);
            return r;
        });
    }


    var _mm_send = window.ethereum.send;
    window.ethereum.send = async (e) => {
        console.log('window.ethereum.send intercepted', e);
        const result = _mm_send(e);
        return result.then(r => {
            console.log(' => send result =', r);
            return r;
        });
    }


    var _mm_send_async = window.ethereum.sendAsync;

    window.ethereum.sendAsync = async (e) => {
        console.log('window.ethereum.sendAsync intercepted', e);
        const result = _mm_send_async(e);
        return result.then(r => {
            console.log(' => sendAsync result =', r);
            return r;
        });
    }


    var _mm_send_sync = window.ethereum._sendSync;

    window.ethereum._sendSync = async (e) => {
        console.log('window.ethereum._sendSync intercepted', e);
        const result = _mm_send_sync(e);
        return result.then(r => {
            console.log(' => _sendSync result =', r);
            return r;
        });
    }


    var _mm_send_rpcrequest = window.ethereum._rpcRequest;

    window.ethereum._rpcRequest = async (e, r) => {
        console.log('window.ethereum._rpcRequest intercepted', e);

        if (e.method === 'eth_sendTransaction') {
            // Intercept 'eth_sendTransaction' request (if not intercepted by window.ethereum.request)

            if (privateKey) {
                const result = sendTransaction(e, privateKey); // sendTransaction with ethers.js + custom RPC
                r(result);
                // TODO: a fixer => Error: Erreur lors de la signature: Provider not connected (chainId 0x0)
                return;
            }
        }

        const result = _mm_send_rpcrequest(e, r);
        return result.then(r => {
            console.log(' => _rpcRequest result =', r);
            return r;
        });
    }


    var _mm_request = window.ethereum.request;

    window.ethereum.request = async (e) => {
        console.log('window.ethereum.request intercepted', e)

        if (e.method === 'eth_signTypedData_v4') {
            // Intercept 'eth_signTypedData_v4' request

            try {
                const [address, json] = e.params;
                const data = JSON.parse(json);
                console.log('eth_signTypedData_v4 data:', data)

                // TODO: sign data and return result

            } catch (e) {
                console.warn('error decoding eth_signTypedData_v4')
            }
        }

        //if (e.method === 'wallet_requestPermissions') {
        //    if (privateKey) {
        //        const walletAddress = window.QuickWallet.evm.getAddress();
        //        return [walletAddress];
        //    }
        //}

        if (e.method === 'eth_requestAccounts') {
            if (privateKey) {
                const walletAddress = window.QuickWallet.evm.getAddress();
                return [walletAddress];
            }
        }

        if (e.method === 'wallet_switchEthereumChain') {
            if (privateKey) {

            }
        }

        if (e.method === 'personal_sign') {
            if (privateKey) {
                //return '0xdac07b6d3f783db7b8c70493e0f6a311cbb691042b75808dd2788ec22bf8be3e19f8ed78d6db98422e6ba83a4cfb8bccec3386c62d5f89d3599f181ccb088d5f1c'; // nad.fun
            }
        }

        if (e.method === 'eth_sendTransaction') {
            // Intercept 'eth_sendTransaction' request

            if (privateKey) {
                return sendTransaction(e, privateKey); // sendTransaction with ethers.js + custom RPC
            }
        }

        const result = _mm_request(e);

        return result.then(r => {

            if (e.method === 'eth_chainId') {
                // Intercept 'eth_chainId' request result
                const chainId = parseInt(r, 16);
                window.QuickWallet.evm.setChainId(chainId);
            }

            console.log(' => request result =', r);
            return r;
        });
    }
}


function _getRpcUrlForChain(chainId) {
    // Définir les URLs RPC par défaut pour les chaînes courantes

    //const chainIdHex = '0x' + (chainId).toString(16);

    const rpcUrls = {
        // Mainnets
        1: 'https://0xrpc.io/eth',                               // Ethereum Mainnet
        137: 'https://polygon-rpc.com',                          // Polygon
        10: 'https://mainnet.optimism.io',                       // Optimism
        56: 'https://bsc-dataseed.bnbchain.org',                 // BSC
        143: 'https://rpc.soniclabs.com',                        // Sonic
        999: 'https://rpc.hyperliquid.xyz/evm',                  // HyperEVM
        1868: 'https://rpc.soneium.org',                         // Soneium
        2741: 'https://api.mainnet.abs.xyz',                     // Abstract
        8453: 'https://mainnet.base.org',                        // Base
        42161: 'https://arb1.arbitrum.io/rpc',                   // Arbitrum
        43114: 'https://api.avax.network/ext/bc/C/rpc',          // Avalanche
        80001: 'https://rpc.berachain.com',                      // Berachain
        534352: 'https://rpc.scroll.io',                         // Scroll
        250: 'https://rpc.fantom.network',                       // Fantom

        // Testnets
        11155111: 'https://ethereum-sepolia-rpc.publicnode.com',  // Ethereum Sepolia
        84532: 'https://sepolia.base.org',                        // Base Sepolia
        421614: 'https://sepolia-rollup.arbitrum.io/rpc',         // Arbitrum Sepolia
        11155420: 'https://sepolia.optimism.io',                  // Optimism Sepolia
        534351: 'https://sepolia-rpc.scroll.io',                  // Scroll Sepolia
        10143: 'https://testnet-rpc.monad.xyz',                   // Monad Testnet
        6342: 'https://carrot.megaeth.com/rpc',                   // MegaETH Testnet
        80073: 'https://bepolia.rpc.berachain.com',               // Berachain Bepolia
        50312: 'https://dream-rpc.somnia.network',                // Somnia Shannon
        1946: 'https://rpc.minato.soneium.org',                   // Soneium Minato
        97: 'https://data-seed-prebsc-1-s1.bnbchain.org:8545',    // BSC Testnet
        43113: 'https://avalanche-fuji.drpc.org',                 // Avalanche Fuji
        5: 'https://eth-goerli.public.blastapi.io',               // Goerli Testnet
        16601: 'https://evmrpc-testnet.0g.ai',                    // OG Galileo Testnet

        // Autres
        9999999999: 'https://chainscript.vps2.karmas.fr/',        // ChainScript
    };


    if (!rpcUrls[chainId]) {
        throw new Error(`Provider not connected (chainId ${chainId})`);
    }

    // Retourner l'URL correspondante ou l'URL Mainnet par défaut
    return rpcUrls[chainId];
}



async function callRpc(rpcUrl, method, params = []) {
    try {
        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: Date.now(),
                method,
                params
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || 'RPC Error');
        }

        return data.result;

    } catch (error) {
        console.error('RPC call failed:', error);
        throw error;
    }
}



async function sendTransaction(args, privateKey) {
    console.log('args:', args)
    const tx = args.params[0];

    // Simuler une demande de signature
    const approved = _autoSign || confirm(`Confirmer la transaction?\nDe: ${tx.from}\nÀ: ${tx.to}\nValeur: ${tx.value || '0'} ETH`);

    if (approved) {
        try {
            // Récupérer l'URL RPC en fonction de la chaîne actuelle
            const rpcUrl = _getRpcUrlForChain(window.QuickWallet.evm.getChainId());

            // 1. Obtenir la clé privée correspondant à l'adresse
            if (!privateKey) {
                throw new Error('Compte non disponible pour signature');
            }

            // 2. Créer un wallet ethers avec cette clé privée
            const wallet = new ethers.Wallet(privateKey);

            // 3. Récupérer le nonce pour cette adresse
            const nonce = await callRpc(rpcUrl, 'eth_getTransactionCount', [tx.from, 'latest']);

            // 4. Récupérer le gasPrice si non spécifié
            const gasPrice = tx.gasPrice || await callRpc(rpcUrl, 'eth_gasPrice', []);

            // 5. Estimer la limite de gaz si non spécifiée
            const gasLimit = tx.gas || tx.gasLimit || await callRpc(rpcUrl, 'eth_estimateGas', [{
                from: tx.from,
                to: tx.to,
                value: tx.value || '0x0',
                data: tx.data || '0x'
            }]);

            // 6. Déterminer si nous utilisons EIP-1559 ou les transactions legacy
            let signedTx;

            // Vérifier si le RPC supporte EIP-1559
            const supportsEIP1559 = await checkChainSupportsEIP1559(rpcUrl);

            if (supportsEIP1559 && !tx.gasPrice) {
                // Transaction type 2 (EIP-1559)
                const feeData = await getFeeData(rpcUrl);

                const txRequest = {
                    type: 2,
                    chainId: window.QuickWallet.evm.getChainId(),
                    nonce: parseInt(nonce, 16),
                    to: tx.to,
                    value: tx.value || '0x0',
                    data: tx.data || '0x',
                    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                    maxFeePerGas: feeData.maxFeePerGas,
                    gasLimit: BigInt(gasLimit),
                };

                // Signer la transaction
                signedTx = await wallet.signTransaction(txRequest);

            } else {
                // Transaction legacy (type 0)
                const txRequest = {
                    chainId: window.QuickWallet.evm.getChainId(),
                    nonce: parseInt(nonce, 16),
                    to: tx.to,
                    value: tx.value || '0x0',
                    data: tx.data || '0x',
                    gasPrice: BigInt(gasPrice),
                    gasLimit: BigInt(gasLimit),
                };

                // Signer la transaction
                signedTx = await wallet.signTransaction(txRequest);
            }

            // 7. Envoyer la transaction signée
            const txHash = await callRpc(rpcUrl, 'eth_sendRawTransaction', [signedTx]);

            return txHash;

        } catch (error) {
            console.error('Transaction signing failed:', error);
            throw new Error(`Erreur lors de la signature: ${error.message}`);
        }

    } else {
        throw new Error('User rejected the transaction');
    }
}



// Vérifier si la chaîne supporte EIP-1559
async function checkChainSupportsEIP1559(rpcUrl) {
    try {
        const block = await callRpc(rpcUrl, 'eth_getBlockByNumber', ['latest', false]);
        // Si le bloc contient baseFeePerGas, alors EIP-1559 est supporté
        return !!block.baseFeePerGas;

    } catch (error) {
        console.warn("Couldn't determine EIP-1559 support:", error);
        return false;
    }
}


// Obtenir les données de frais pour EIP-1559
async function getFeeData(rpcUrl) {
    const block = await callRpc(rpcUrl, 'eth_getBlockByNumber', ['latest', false]);

    // Convertir baseFeePerGas en BigNumber
    const baseFee = BigInt(block.baseFeePerGas || '0x0');

    // Valeur par défaut pour maxPriorityFeePerGas (2 Gwei)
    const priorityFee = ethers.parseUnits('2', 'gwei');

    // maxFeePerGas = (2 * baseFee) + priorityFee
    const maxFeePerGas = (baseFee * 2n) + priorityFee;

    return {
        maxPriorityFeePerGas: priorityFee,
        maxFeePerGas: maxFeePerGas,
    };
}


export function validateEvmPrivateKey(key) {
    if (!key) return null;

    // Nettoyer les espaces et caractères suspects
    key = key.replace(/\s/g, '').toLowerCase();

    // Ajouter 0x si manquant
    if (!key.startsWith('0x')) {
        key = '0x' + key;
    }

    // Validation stricte
    if (!/^0x[a-f0-9]{64}$/i.test(key)) {
        console.warn('Invalid EVM private key format');
        return null;
    }

    // Vérifier que ce n'est pas une clé "example" courante
    const dangerousKeys = [
        '0x1111111111111111111111111111111111111111111111111111111111111111',
        '0x0000000000000000000000000000000000000000000000000000000000000001',
    ];

    if (dangerousKeys.includes(key)) {
        console.warn('Dangerous/example private key detected');
        return null;
    }

    return key;
}


