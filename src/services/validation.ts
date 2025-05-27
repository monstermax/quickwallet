// validation.ts

export function validateEvmPrivateKey(key: string | null): string | null {
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

export function validateSolanaPrivateKey(key: string | null): string | null {
    if (!key) return null;

    // Nettoyer les espaces
    key = key.replace(/\s/g, '');

    // Validation longueur base58
    if (!/^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(key)) {
        console.warn('Invalid Solana private key format');
        return null;
    }

    // Test de décodage basique (sans importer bs58 ici)
    try {
        // Validation plus approfondie sera faite dans le service Solana
        return key;
    } catch (e) {
        console.warn('Invalid Solana private key:', e);
        return null;
    }
}
