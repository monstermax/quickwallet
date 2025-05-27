// src/services/evm/rpcService.ts

export class RpcService {
    private rpcUrls: Record<number, string> = {
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
    }

    getRpcUrl(chainId: number): string {
        const url = this.rpcUrls[chainId]
        if (!url) {
            throw new Error(`Unsupported chain ID: ${chainId}`)
        }
        return url
    }

    async callRpc(rpcUrl: string, method: string, params: any[] = []): Promise<any> {
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
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const data = await response.json()

            if (data.error) {
                throw new Error(data.error.message || 'RPC Error')
            }

            return data.result
        } catch (error) {
            console.error('RPC call failed:', error)
            throw error
        }
    }

    async getTransactionCount(rpcUrl: string, address: string): Promise<string> {
        return this.callRpc(rpcUrl, 'eth_getTransactionCount', [address, 'latest'])
    }

    async getGasPrice(rpcUrl: string): Promise<string> {
        return this.callRpc(rpcUrl, 'eth_gasPrice', [])
    }

    async estimateGas(rpcUrl: string, tx: any): Promise<string> {
        return this.callRpc(rpcUrl, 'eth_estimateGas', [tx])
    }

    async sendRawTransaction(rpcUrl: string, signedTx: string): Promise<string> {
        return this.callRpc(rpcUrl, 'eth_sendRawTransaction', [signedTx])
    }

    async checkEIP1559Support(rpcUrl: string): Promise<boolean> {
        try {
            const block = await this.callRpc(rpcUrl, 'eth_getBlockByNumber', ['latest', false])
            return !!block.baseFeePerGas
        } catch (error) {
            console.warn("Couldn't determine EIP-1559 support:", error)
            return false
        }
    }

    async getFeeData(rpcUrl: string): Promise<{ maxPriorityFeePerGas: bigint; maxFeePerGas: bigint }> {
        const block = await this.callRpc(rpcUrl, 'eth_getBlockByNumber', ['latest', false])

        const baseFee = BigInt(block.baseFeePerGas || '0x0')
        const priorityFee = BigInt('0x77359400') // 2 Gwei
        const maxFeePerGas = baseFee * BigInt(2) + priorityFee // Remplacer 2n par BigInt(2)

        return {
            maxPriorityFeePerGas: priorityFee,
            maxFeePerGas: maxFeePerGas,
        }
    }
}


export const rpcService = new RpcService()

