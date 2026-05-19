
/**
 * 日期工具函数
 */
const DateUtils = (function() {
    
    function format(date, format = 'YYYY-MM-DD HH:mm:ss') {
        const d = new Date(date);
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    }
    
    function getDateDisplay(date) {
        const d = new Date(date);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const compareDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        
        if (compareDate.getTime() === today.getTime()) {
            return '今天';
        } else if (compareDate.getTime() === yesterday.getTime()) {
            return '昨天';
        } else if (now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000) {
            const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            return days[d.getDay()];
        } else {
            return format(date, 'MM-DD');
        }
    }
    
    function getTimeDisplay(date) {
        return format(date, 'HH:mm');
    }
    
    function getDateTimeDisplay(date) {
        return `${getDateDisplay(date)} ${getTimeDisplay(date)}`;
    }
    
    function getCurrentDateString() {
        return format(new Date(), 'YYYY年MM月DD日');
    }
    
    function getCurrentTimeString() {
        return format(new Date(), 'HH:mm');
    }
    
    function getCurrentDateTimeString() {
        return format(new Date(), 'YYYY年MM月DD日 HH:mm');
    }
    
    function isToday(date) {
        const d = new Date(date);
        const now = new Date();
        return d.getFullYear() === now.getFullYear() &&
               d.getMonth() === now.getMonth() &&
               d.getDate() === now.getDate();
    }
    
    function isThisWeek(date) {
        const d = new Date(date);
        const now = new Date();
        
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        return d >= startOfWeek && d <= endOfWeek;
    }
    
    function isThisMonth(date) {
        const d = new Date(date);
        const now = new Date();
        return d.getFullYear() === now.getFullYear() &&
               d.getMonth() === now.getMonth();
    }
    
    function isThisYear(date) {
        const d = new Date(date);
        const now = new Date();
        return d.getFullYear() === now.getFullYear();
    }
    
    function getDayOfWeek(date) {
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return days[new Date(date).getDay()];
    }
    
    function getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }
    
    function addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
    
    function addHours(date, hours) {
        const result = new Date(date);
        result.setHours(result.getHours() + hours);
        return result;
    }
    
    function addMinutes(date, minutes) {
        const result = new Date(date);
        result.setMinutes(result.getMinutes() + minutes);
        return result;
    }
    
    function diffDays(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    function diffHours(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60));
    }
    
    return {
        format,
        getDateDisplay,
        getTimeDisplay,
        getDateTimeDisplay,
        getCurrentDateString,
        getCurrentTimeString,
        getCurrentDateTimeString,
        isToday,
        isThisWeek,
        isThisMonth,
        isThisYear,
        getDayOfWeek,
        getDaysInMonth,
        addDays,
        addHours,
        addMinutes,
        diffDays,
        diffHours
    };
})();
