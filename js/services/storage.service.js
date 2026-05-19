
/**
 * 本地存储服务
 * 封装 localStorage 操作，提供类型安全的存储接口
 */
const StorageService = (function() {
    const STORAGE_PREFIX = 'secure_diary_';
    const CACHE_TTL = 24 * 60 * 60 * 1000;
    
    function getKey(key) {
        return STORAGE_PREFIX + key;
    }
    
    function set(key, value, options = {}) {
        try {
            const data = {
                value: value,
                timestamp: Date.now(),
                ttl: options.ttl || null
            };
            localStorage.setItem(getKey(key), JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('StorageService set error:', e);
            return false;
        }
    }
    
    function get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(getKey(key));
            if (!item) return defaultValue;
            
            const data = JSON.parse(item);
            
            if (data.ttl && Date.now() - data.timestamp > data.ttl) {
                remove(key);
                return defaultValue;
            }
            
            return data.value;
        } catch (e) {
            console.error('StorageService get error:', e);
            return defaultValue;
        }
    }
    
    function remove(key) {
        try {
            localStorage.removeItem(getKey(key));
            return true;
        } catch (e) {
            console.error('StorageService remove error:', e);
            return false;
        }
    }
    
    function clear() {
        try {
            const keys = Object.keys(localStorage).filter(key => 
                key.startsWith(STORAGE_PREFIX)
            );
            keys.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (e) {
            console.error('StorageService clear error:', e);
            return false;
        }
    }
    
    function getAll() {
        const result = {};
        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(STORAGE_PREFIX)) {
                    const originalKey = key.replace(STORAGE_PREFIX, '');
                    result[originalKey] = get(originalKey);
                }
            });
        } catch (e) {
            console.error('StorageService getAll error:', e);
        }
        return result;
    }
    
    function has(key) {
        return get(key) !== null;
    }
    
    function setCache(key, value, ttl = CACHE_TTL) {
        return set(key, value, { ttl });
    }
    
    function getCache(key, defaultValue = null) {
        return get(key, defaultValue);
    }
    
    function clearCache() {
        const now = Date.now();
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(STORAGE_PREFIX)) {
                try {
                    const item = localStorage.getItem(key);
                    if (item) {
                        const data = JSON.parse(item);
                        if (data.ttl && now - data.timestamp > data.ttl) {
                            localStorage.removeItem(key);
                        }
                    }
                } catch (e) {
                }
            }
        });
    }
    
    return {
        set,
        get,
        remove,
        clear,
        getAll,
        has,
        setCache,
        getCache,
        clearCache
    };
})();
