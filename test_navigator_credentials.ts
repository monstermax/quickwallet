
// https://passkeys.dev/docs/use-cases/bootstrapping/
// https://fidoalliance.org/developers/resources/
// https://webauthn.io/

// https://developers.google.com/identity/passkeys?hl=fr
// https://passkeys-demo.appspot.com/


navigator.credentials.create({
  publicKey: {
    rp: {
      // user friendly name of your service
      name: "Passkeys Developer",
      // Relying Party (RP) identifier (hostname/FQDN)
      id: "passkeys.dev"
    },
    user: {
      // persistent, unique identifier for the user account in your backend
      id: Uint8Array.from("0525bc79-5a63-4e47-b7d1-597e25f5caba", c => c.charCodeAt(0)),
      // user friendly identifier often displayed to the user (e.g. email address)
      name: "julia@passkeys.dev",
      // human readable display name, sometimes displayed by the client
      displayName: "Julia Coleman"
    },
    // the challenge is a buffer of cryptographically random bytes generated on your backend
    // and should be tightly bound to the current user session
    challenge: Uint8Array.from("XZJscsUqtBH7ZB90t2g0EbZTZYlbSRK6lq7zlN2lJKuoYMnp7Qo2OLzD7xawL3s", c => c.charCodeAt(0)),
    pubKeyCredParams: [
      // an array of objects describing what public key types are acceptable to a server.
      {
        "type": "public-key",
        "alg": -7 // EC P256
      },
      {
        "type": "public-key",
        "alg": -257 // RSA
      }
    ],
    excludeCredentials: [
      // array of credential IDs for existing passkeys tied to the user account.
      // this avoids creating a new passkey in an authenticator that already has 
      // a passkey tied to the user account
    ],
    authenticatorSelection: {
      // tells the authenticator to create a passkey
      residentKey: "required",
      // tells the client / authenticator to request user verification where possible
      // e.g. biometric or device PIN
      userVerification: "preferred"
    },
    "extensions": {
      // returns back details about the passkey
      "credProps": true
    }
  }
})