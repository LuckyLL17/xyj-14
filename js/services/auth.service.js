
/**
 * 认证服务
 * 处理用户登录、注册、会话管理
 */
const AuthService = (function() {
    const SESSION_KEY = 'session_user';
    const CURRENT_USER_KEY = 'current_user';
    
    function getCurrentUser() {
        const sessionData = sessionStorage.getItem(SESSION_KEY);
        if (sessionData) {
            try {
                return JSON.parse(sessionData);
            } catch (e) {
                console.error('Parse session data error:', e);
                return null;
            }
        }
        
        const storageUser = StorageService.get(CURRENT_USER_KEY);
        if (storageUser) {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(storageUser));
            return storageUser;
        }
        
        return null;
    }
    
    function isLoggedIn() {
        return getCurrentUser() !== null;
    }
    
    async function login(username, password) {
        if (!username || !password) {
            return {
                success: false,
                message: '用户名和密码不能为空'
            };
        }
        
        const response = await MockApiService.login(username, password);
        
        if (response.success) {
            const userData = {
                username: response.data.username,
                loginTime: Date.now()
            };
            
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
            
            StorageService.set(CURRENT_USER_KEY, userData);
            
            await CryptoService.saveSession();
            
            await loadUserDiaries(response.data.username);
        }
        
        return response;
    }
    
    async function register(username, password, confirmPassword) {
        if (!username || !password) {
            return {
                success: false,
                message: '用户名和密码不能为空'
            };
        }
        
        if (password.length < 6) {
            return {
                success: false,
                message: '密码长度至少为6位'
            };
        }
        
        if (password !== confirmPassword) {
            return {
                success: false,
                message: '两次密码输入不一致'
            };
        }
        
        if (username.length < 2) {
            return {
                success: false,
                message: '用户名长度至少为2位'
            };
        }
        
        return await MockApiService.register(username, password);
    }
    
    function logout() {
        sessionStorage.removeItem(SESSION_KEY);
        StorageService.remove(CURRENT_USER_KEY);
        
        CryptoService.clearSession();
        
        DiaryService.clearCache();
    }
    
    async function loadUserDiaries(username) {
        const userDiariesKey = `diaries_${username}`;
        const encryptedDiaries = StorageService.get(userDiariesKey);
        
        if (encryptedDiaries && CryptoService.isMasterKeyAvailable()) {
            try {
                const diaries = await CryptoService.decryptWithMasterKey(encryptedDiaries);
                DiaryService.setDiaries(diaries || []);
                return true;
            } catch (e) {
                console.error('Decrypt diaries error:', e);
                return false;
            }
        }
        
        DiaryService.setDiaries([]);
        return true;
    }
    
    async function saveUserDiaries(username, diaries) {
        if (!CryptoService.isMasterKeyAvailable()) {
            console.error('Master key not available, cannot save diaries');
            return false;
        }
        
        try {
            const encrypted = await CryptoService.encryptWithMasterKey(diaries);
            const userDiariesKey = `diaries_${username}`;
            StorageService.set(userDiariesKey, encrypted);
            return true;
        } catch (e) {
            console.error('Encrypt and save diaries error:', e);
            return false;
        }
    }
    
    return {
        getCurrentUser,
        isLoggedIn,
        login,
        register,
        logout,
        loadUserDiaries,
        saveUserDiaries
    };
})();
