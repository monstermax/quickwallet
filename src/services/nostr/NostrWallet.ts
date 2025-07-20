// src/services/nostr/NostrWallet.ts

import { getPublicKey, finalizeEvent, verifyEvent } from 'nostr-tools'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils'

import type { QuickwalletMode } from '../../types/wallet'


export class NostrWallet {
    private privateKey: string | null = null
    private publicKey: string | null = null
    private isQuickWalletActive: boolean = false
    private quickWalletMode: QuickwalletMode = 'classic'
    private originalNostr: any = null
    private debug: boolean = false
    private _requests: Map<string, { resolve: (value: any) => void, reject: (error: any) => void }> = new Map()

    constructor() {
        // Écouter les changements de mode
        window.addEventListener('QuickWalletModeChange', this.handleModeChange.bind(this))
        // Écouter les messages postMessage pour nos2x compatibility
        window.addEventListener('message', this.handleMessage.bind(this))
    }

    private handleModeChange = (event: CustomEvent<{ chain: 'evm' | 'solana' | 'nostr', mode: QuickwalletMode, active: boolean }>) => {
        if (event.detail.chain === 'nostr') {
            this.isQuickWalletActive = event.detail.active
            this.quickWalletMode = event.detail.mode

            if (this.debug) {
                console.log('Nostr QuickWallet mode:', this.isQuickWalletActive ? 'ACTIVE' : 'INACTIVE')
            }
        }
    }

    private handleMessage = (event: MessageEvent) => {
        if (!event.data || event.data.ext !== 'quickwallet-nostr' || !this._requests.has(event.data.id)) {
            return
        }

        const request = this._requests.get(event.data.id)
        if (!request) return

        if (event.data.response?.error) {
            const error = new Error('QuickWallet Nostr: ' + event.data.response.error.message)
            error.stack = event.data.response.error.stack
            request.reject(error)
        } else {
            request.resolve(event.data.response)
        }

        this._requests.delete(event.data.id)
    }

    setPrivateKey(key: string | null): void {
        this.privateKey = key
        if (key) {
            try {
                // Calculer la clé publique depuis la clé privée
                this.publicKey = getPublicKey(hexToBytes(key))
            } catch (error) {
                console.error('Failed to derive Nostr public key:', error)
                this.publicKey = null
            }
        } else {
            this.publicKey = null
        }
    }

    getPublicKey(): string | null {
        return this.publicKey
    }

    getDebug(): boolean {
        return this.debug
    }

    setDebug(debug: boolean): void {
        this.debug = debug
    }

    injectWalletProvider(_window?: Window): void {
        _window = _window || window

        // Sauvegarder le provider original s'il existe
        if (_window.nostr && !this.originalNostr) {
            this.originalNostr = _window.nostr
        }

        // Injecter notre provider Nostr
        _window.nostr = {
            _requests: {},
            _pubkey: null,

            getPublicKey: async () => {
                if (this.debug) {
                    console.log('nostr.getPublicKey intercepted, QuickWallet active:', this.isQuickWalletActive)
                }

                if (this.isQuickWalletActive && this.publicKey) {
                    if (this.debug) {
                        console.log('QuickWallet handling nostr.getPublicKey')
                    }
                    return this.publicKey
                }

                // Fallback vers le provider original ou nos2x
                return this.callOriginalOrNos2x('getPublicKey', {})
            },

            signEvent: async (event: any) => {
                if (this.debug) {
                    console.log('nostr.signEvent intercepted:', event, 'QuickWallet active:', this.isQuickWalletActive)
                }

                if (this.isQuickWalletActive && this.privateKey) {
                    if (this.debug) {
                        console.log('QuickWallet handling nostr.signEvent')
                    }
                    return this.signEvent(event)
                }

                // Fallback vers le provider original ou nos2x
                return this.callOriginalOrNos2x('signEvent', { event })
            },

            getRelays: async () => {
                if (this.isQuickWalletActive) {
                    return {} // Pas de relais configurés par défaut
                }
                return this.callOriginalOrNos2x('getRelays', {})
            },

            nip04: {
                encrypt: async (peer: string, plaintext: string) => {
                    if (this.isQuickWalletActive && this.privateKey) {
                        return this.nip04Encrypt(peer, plaintext)
                    }
                    return this.callOriginalOrNos2x('nip04.encrypt', { peer, plaintext })
                },

                decrypt: async (peer: string, ciphertext: string) => {
                    if (this.isQuickWalletActive && this.privateKey) {
                        return this.nip04Decrypt(peer, ciphertext)
                    }
                    return this.callOriginalOrNos2x('nip04.decrypt', { peer, ciphertext })
                }
            },

            nip44: {
                encrypt: async (peer: string, plaintext: string) => {
                    if (this.isQuickWalletActive && this.privateKey) {
                        return this.nip44Encrypt(peer, plaintext)
                    }
                    return this.callOriginalOrNos2x('nip44.encrypt', { peer, plaintext })
                },

                decrypt: async (peer: string, ciphertext: string) => {
                    if (this.isQuickWalletActive && this.privateKey) {
                        return this.nip44Decrypt(peer, ciphertext)
                    }
                    return this.callOriginalOrNos2x('nip44.decrypt', { peer, ciphertext })
                }
            },

            _call: (type: string, params: any) => {
                return this.callOriginalOrNos2x(type, params)
            }
        }
    }

    private async callOriginalOrNos2x(type: string, params: any): Promise<any> {
        // Si on a un provider original, l'utiliser
        if (this.originalNostr && typeof this.originalNostr._call === 'function') {
            return this.originalNostr._call(type, params)
        }

        // Sinon, utiliser le système nos2x
        const id = Math.random().toString().slice(-4)

        if (this.debug) {
            console.log(`%c[QuickWallet-Nostr:${id}] calling ${type} with`, 'color: #65F152; font-weight: bold', params)
        }

        return new Promise((resolve, reject) => {
            this._requests.set(id, { resolve, reject })

            window.postMessage({
                id,
                ext: 'nos2x', // Compatibilité nos2x
                type,
                params
            }, '*')

            // Timeout après 30 secondes
            setTimeout(() => {
                if (this._requests.has(id)) {
                    this._requests.delete(id)
                    reject(new Error('Nostr request timeout'))
                }
            }, 30000)
        })
    }

    private async signEvent(event: any): Promise<any> {
        if (!this.privateKey || !this.publicKey) {
            throw new Error('Nostr wallet not connected')
        }

        // Demander confirmation si nécessaire
        let approved = this.quickWalletMode === 'quickwallet-auto'
        if (!approved) {
            approved = await (window as any).QuickWallet?.confirm({
                title: 'Signer l\'événement Nostr',
                message: 'Voulez-vous signer cet événement Nostr ?',
                details: `Kind: ${event.kind}\nContent: ${event.content || '(vide)'}`
            }) || false
        }

        if (!approved) {
            throw new Error('User rejected the event signing')
        }

        try {
            // Finaliser l'événement avec notre clé privée
            const signedEvent = finalizeEvent(event, hexToBytes(this.privateKey))

            if (this.debug) {
                console.log('Signed Nostr event:', signedEvent)
            }

            return signedEvent

        } catch (error) {
            console.error('Nostr event signing failed:', error)
            throw new Error(`Event signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    private async nip04Encrypt(peer: string, plaintext: string): Promise<string> {
        // TODO: Implémenter NIP-04 encryption
        // Pour l'instant, déléguer à nos2x si disponible
        return this.callOriginalOrNos2x('nip04.encrypt', { peer, plaintext })
    }

    private async nip04Decrypt(peer: string, ciphertext: string): Promise<string> {
        // TODO: Implémenter NIP-04 decryption
        return this.callOriginalOrNos2x('nip04.decrypt', { peer, ciphertext })
    }

    private async nip44Encrypt(peer: string, plaintext: string): Promise<string> {
        // TODO: Implémenter NIP-44 encryption
        return this.callOriginalOrNos2x('nip44.encrypt', { peer, plaintext })
    }

    private async nip44Decrypt(peer: string, ciphertext: string): Promise<string> {
        // TODO: Implémenter NIP-44 decryption
        return this.callOriginalOrNos2x('nip44.decrypt', { peer, ciphertext })
    }
}
