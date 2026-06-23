const CryptoEngine = {
    async generateKey(saltStr) {
        const enc = new TextEncoder();
        const baseKey = await crypto.subtle.importKey(
            "raw", enc.encode(saltStr), "PBKDF2", false, ["deriveKey"]
        );
        return await crypto.subtle.deriveKey(
            { name: "PBKDF2", salt: enc.encode("SaltEngineMsg"), iterations: 1000, hash: "SHA-256" },
            baseKey, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
        );
    },
    async encrypt(text, secret) {
        const key = await this.generateKey(secret);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(text);
        const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
        return {
            cipher: btoa(String.fromCharCode(...new Uint8Array(cipher))),
            iv: btoa(String.fromCharCode(...iv))
        };
    },
    async decrypt(cipherB64, ivB64, secret) {
        try {
            const key = await this.generateKey(secret);
            const iv = new Uint8Array(atob(ivB64).split("").map(c => c.charCodeAt(0)));
            const cipher = new Uint8Array(atob(cipherB64).split("").map(c => c.charCodeAt(0)));
            const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
            return new TextDecoder().decode(plain);
        } catch(e) {
            return "[Decryption Failure]";
        }
    }
};
