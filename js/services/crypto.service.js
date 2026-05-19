
/**
 * 加密服务
 * 使用 Web Crypto API (Crypto.subtle) 进行加密和解密操作
 */
const CryptoService = (function() {
    const ALGORITHM = 'AES-GCM';
    const KEY_LENGTH = 256;
    const IV_LENGTH = 12;
    const SALT_LENGTH = 16;
    const ITERATIONS = 100000;
    const KEY_WRAP_ALGORITHM = 'AES-KW';
    
    const SESSION_MASTER_KEY = 'session_master_key';
    const SESSION_KEY = 'session_key';
    const SESSION_KEYSTORE = 'session_keystore';
    
    let masterKey = null;
    
    async function generateKey() {
        return await crypto.subtle.generateKey(
            { name: ALGORITHM, length: KEY_LENGTH },
            true,
            ['encrypt', 'decrypt']
        );
    }
    
    async function deriveKeyFromPassword(password, salt) {
        const encoder = new TextEncoder();
        const passwordKey = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );
        
        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: ITERATIONS,
                hash: 'SHA-256'
            },
            passwordKey,
            { name: ALGORITHM, length: KEY_LENGTH },
            true,
            ['encrypt', 'decrypt']
        );
    }
    
    async function exportKey(key) {
        const exported = await crypto.subtle.exportKey('raw', key);
        return arrayBufferToBase64(exported);
    }
    
    async function importKey(keyData) {
        const keyBuffer = base64ToArrayBuffer(keyData);
        return await crypto.subtle.importKey(
            'raw',
            keyBuffer,
            { name: ALGORITHM, length: KEY_LENGTH },
            true,
            ['encrypt', 'decrypt']
        );
    }
    
    async function wrapKey(keyToWrap, wrappingKey) {
        const exportedKey = await crypto.subtle.exportKey('raw', keyToWrap);
        const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
        
        const encryptedKeyBuffer = await crypto.subtle.encrypt(
            { name: ALGORITHM, iv: iv },
            wrappingKey,
            exportedKey
        );
        
        const result = new Uint8Array(iv.length + encryptedKeyBuffer.byteLength);
        result.set(iv, 0);
        result.set(new Uint8Array(encryptedKeyBuffer), iv.length);
        
        return arrayBufferToBase64(result);
    }
    
    async function unwrapKey(wrappedKeyData, unwrappingKey) {
        const wrappedKeyBuffer = base64ToArrayBuffer(wrappedKeyData);
        
        const iv = wrappedKeyBuffer.slice(0, IV_LENGTH);
        const encryptedKey = wrappedKeyBuffer.slice(IV_LENGTH);
        
        const decryptedKeyBuffer = await crypto.subtle.decrypt(
            { name: ALGORITHM, iv: new Uint8Array(iv) },
            unwrappingKey,
            new Uint8Array(encryptedKey)
        );
        
        return await crypto.subtle.importKey(
            'raw',
            decryptedKeyBuffer,
            { name: ALGORITHM, length: KEY_LENGTH },
            true,
            ['encrypt', 'decrypt']
        );
    }
    
    async function encrypt(data, key) {
        const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
        
        let dataBuffer;
        if (typeof data === 'string') {
            const encoder = new TextEncoder();
            dataBuffer = encoder.encode(data);
        } else if (data instanceof ArrayBuffer) {
            dataBuffer = new Uint8Array(data);
        } else {
            const encoder = new TextEncoder();
            dataBuffer = encoder.encode(JSON.stringify(data));
        }
        
        const encryptedBuffer = await crypto.subtle.encrypt(
            { name: ALGORITHM, iv: iv },
            key,
            dataBuffer
        );
        
        const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
        result.set(iv, 0);
        result.set(new Uint8Array(encryptedBuffer), iv.length);
        
        return arrayBufferToBase64(result);
    }
    
    async function decrypt(encryptedData, key) {
        const encryptedBuffer = base64ToArrayBuffer(encryptedData);
        
        const iv = encryptedBuffer.slice(0, IV_LENGTH);
        const data = encryptedBuffer.slice(IV_LENGTH);
        
        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: ALGORITHM, iv: new Uint8Array(iv) },
            key,
            new Uint8Array(data)
        );
        
        const decoder = new TextDecoder();
        const decryptedText = decoder.decode(decryptedBuffer);
        
        try {
            return JSON.parse(decryptedText);
        } catch (e) {
            return decryptedText;
        }
    }
    
    async function hash(data) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        return arrayBufferToBase64(hashBuffer);
    }
    
    function generateSalt() {
        return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    }
    
    function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
    
    function base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }
    
    async function createUserKeyStore(password) {
        const salt = generateSalt();
        const passwordKey = await deriveKeyFromPassword(password, salt);
        
        const masterKey = await generateKey();
        
        const wrappedMasterKey = await wrapKey(masterKey, passwordKey);
        
        return {
            salt: arrayBufferToBase64(salt),
            wrappedMasterKey: wrappedMasterKey
        };
    }
    
    async function unlockUserKeyStore(keyStore, password) {
        const salt = base64ToArrayBuffer(keyStore.salt);
        const passwordKey = await deriveKeyFromPassword(password, salt);
        
        try {
            masterKey = await unwrapKey(keyStore.wrappedMasterKey, passwordKey);
            return true;
        } catch (e) {
            console.error('Unlock key store failed:', e);
            return false;
        }
    }
    
    function setMasterKey(key) {
        masterKey = key;
    }
    
    function getMasterKey() {
        return masterKey;
    }
    
    function isMasterKeyAvailable() {
        return masterKey !== null;
    }
    
    async function encryptWithMasterKey(data) {
        if (!masterKey) {
            throw new Error('Master key not available');
        }
        return await encrypt(data, masterKey);
    }
    
    async function decryptWithMasterKey(encryptedData) {
        if (!masterKey) {
            throw new Error('Master key not available');
        }
        return await decrypt(encryptedData, masterKey);
    }
    
    async function saveSession() {
        if (!masterKey) {
            return false;
        }
        
        try {
            const sessionKey = await generateKey();
            const sessionKeyData = await exportKey(sessionKey);
            
            const wrappedMasterKey = await wrapKey(masterKey, sessionKey);
            
            sessionStorage.setItem(SESSION_KEY, sessionKeyData);
            sessionStorage.setItem(SESSION_MASTER_KEY, wrappedMasterKey);
            
            return true;
        } catch (e) {
            console.error('Save session error:', e);
            return false;
        }
    }
    
    async function restoreSession() {
        const sessionKeyData = sessionStorage.getItem(SESSION_KEY);
        const wrappedMasterKey = sessionStorage.getItem(SESSION_MASTER_KEY);
        
        if (!sessionKeyData || !wrappedMasterKey) {
            return false;
        }
        
        try {
            const sessionKey = await importKey(sessionKeyData);
            
            masterKey = await unwrapKey(wrappedMasterKey, sessionKey);
            
            return true;
        } catch (e) {
            console.error('Restore session error:', e);
            clearSession();
            return false;
        }
    }
    
    function clearSession() {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_MASTER_KEY);
        sessionStorage.removeItem(SESSION_KEYSTORE);
        masterKey = null;
    }
    
    function hasSession() {
        const sessionKeyData = sessionStorage.getItem(SESSION_KEY);
        const wrappedMasterKey = sessionStorage.getItem(SESSION_MASTER_KEY);
        return sessionKeyData !== null && wrappedMasterKey !== null;
    }
    
    function saveKeyStoreToSession(keyStore) {
        if (keyStore) {
            sessionStorage.setItem(SESSION_KEYSTORE, JSON.stringify(keyStore));
        }
    }
    
    function getKeyStoreFromSession() {
        const keyStoreStr = sessionStorage.getItem(SESSION_KEYSTORE);
        if (keyStoreStr) {
            try {
                return JSON.parse(keyStoreStr);
            } catch (e) {
                return null;
            }
        }
        return null;
    }
    
    return {
        generateKey,
        deriveKeyFromPassword,
        exportKey,
        importKey,
        wrapKey,
        unwrapKey,
        encrypt,
        decrypt,
        hash,
        generateSalt,
        arrayBufferToBase64,
        base64ToArrayBuffer,
        createUserKeyStore,
        unlockUserKeyStore,
        setMasterKey,
        getMasterKey,
        isMasterKeyAvailable,
        encryptWithMasterKey,
        decryptWithMasterKey,
        saveSession,
        restoreSession,
        clearSession,
        hasSession,
        saveKeyStoreToSession,
        getKeyStoreFromSession
    };
})();
