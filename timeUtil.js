/**
 * ============================================================
 * 时间处理工具 - IST (印度标准时间) 统一处理
 * ============================================================
 * 
 * 所有业务逻辑时间都应该使用 IST
 * UTC+5:30
 */

class TimeUtil {
    
    /**
     * 获取当前 IST 时间字符串
     * @returns {string} YYYY-MM-DD
     */
    static getTodayIST() {
        const istString = new Date().toLocaleString('en-US', { 
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const [month, day, year] = istString.split('/');
        return `${year}-${month}-${day}`;
    }

    /**
     * 获取当前 IST 完整时间字符串
     * @returns {string} ISO format with IST
     */
    static getNowIST() {
        return new Date().toLocaleString('en-US', { 
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    }

    /**
     * 将日期转换为 IST 日期字符串
     * @param {Date} date 
     * @returns {string} YYYY-MM-DD
     */
    static toISTDateString(date) {
        const istString = date.toLocaleString('en-US', { 
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const [month, day, year] = istString.split('/');
        return `${year}-${month}-${day}`;
    }

    /**
     * 检查日期是否是今天（IST）
     * @param {string} dateString - YYYY-MM-DD
     * @returns {boolean}
     */
    static isTodayIST(dateString) {
        return dateString === this.getTodayIST();
    }

    /**
     * 获取 IST 的当前小时（用于判断开奖时间）
     * @returns {number} 0-23
     */
    static getCurrentHourIST() {
        const istString = new Date().toLocaleString('en-US', { 
            timeZone: 'Asia/Kolkata',
            hour: 'numeric',
            hour12: false
        });
        return parseInt(istString);
    }

    /**
     * 创建 IST 时间的 Date 对象
     * @param {string} timeString - HH:MM
     * @returns {Date}
     */
    static createISTDate(timeString) {
        const today = this.getTodayIST();
        const dateStr = `${today}T${timeString}:00+05:30`;
        return new Date(dateStr);
    }

    /**
     * 格式化日期为 IST 显示格式
     * @param {string} dateString - YYYY-MM-DD
     * @returns {string} DD/MM/YYYY
     */
    static formatDisplayIST(dateString) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }
}

module.exports = TimeUtil;
