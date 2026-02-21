// Helper Functions
const helpers = {
    formatTime(s) { 
        return Math.floor(s/60) + ":" + (s%60).toString().padStart(2,'0'); 
    },

    formatBirthDate(bd) { 
        if (!bd || !bd.year) return '---'; 
        return `${bd.year}/${bd.month}/${bd.day}`; 
    },

    getStatusText(q) { 
        const map = { 
            active: 'در حال برگزاری', 
            submitted: 'شرکت کرده‌اید', 
            expired: 'پایان یافته', 
            pending: 'شروع نشده' 
        }; 
        return map[q.userStatus] || ''; 
    },

    formatDateTime(ts) { 
        return ts ? new Date(new Date(ts).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ''; 
    },

    initIcons() { 
        setTimeout(() => { 
            if(typeof lucice !== 'undefined') lucide.createIcons(); 
        }, 100); 
    },

    months: ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"],
    
    years: Array.from({length: 100}, (_, i) => 1403 - i)
};