// API Service
const api = {
    async init(userId) {
        const res = await fetch('/api/init', { 
            method: 'POST', 
            body: JSON.stringify({ userId }) 
        });
        return await res.json();
    },

    async register(userId, userData) {
        const res = await fetch('/api/register', { 
            method: 'POST', 
            body: JSON.stringify({ userId, userData }) 
        });
        return await res.json();
    },

    async markRead(userId) {
        await fetch('/api/mark-read', { 
            method: 'POST', 
            body: JSON.stringify({ userId }) 
        });
    },

    async submitQuiz(userId, quizId, answers) {
        const res = await fetch('/api/submit', { 
            method: 'POST', 
            body: JSON.stringify({ userId, quizId, answers }) 
        });
        return await res.json();
    },

    // Admin APIs
    admin: {
        async saveConfig(adminId, config) {
            await fetch('/api/admin/save-config', { 
                method: 'POST', 
                body: JSON.stringify({ adminId, config }) 
            });
        },

        async createQuiz(adminId, quiz) {
            await fetch('/api/admin/create-quiz', { 
                method: 'POST', 
                body: JSON.stringify({ adminId, quiz }) 
            });
        },

        async togglePromote(adminId, quizId, promoted) {
            await fetch('/api/admin/toggle-promote', { 
                method: 'POST', 
                body: JSON.stringify({ adminId, quizId, promoted }) 
            });
        },

        async deleteQuiz(adminId, quizId) {
            await fetch('/api/admin/delete-quiz', { 
                method: 'POST', 
                body: JSON.stringify({ adminId, quizId }) 
            });
        },

        async getUsers(adminId) {
            const res = await fetch('/api/admin/get-users', { 
                method: 'POST', 
                body: JSON.stringify({ adminId }) 
            });
            return await res.json();
        },

        async sendMessage(adminId, targetUserId, message) {
            await fetch('/api/admin/send-message', { 
                method: 'POST', 
                body: JSON.stringify({ adminId, targetUserId, message }) 
            });
        },

        async deleteMessage(adminId, targetUserId, messageId) {
            const res = await fetch('/api/admin/delete-message', {
                method: 'POST',
                body: JSON.stringify({ adminId, targetUserId, messageId })
            });
            return await res.json();
        },

        async getStats(adminId, quizId) {
            const res = await fetch('/api/admin/stats', { 
                method: 'POST', 
                body: JSON.stringify({ adminId, quizId }) 
            });
            return await res.json();
        },

        async saveLottery(adminId, quizId, winnerIds) {
            await fetch('/api/admin/save-lottery', { 
                method: 'POST', 
                body: JSON.stringify({ adminId, quizId, winnerIds }) 
            });
        },

        async resetLottery(adminId, quizId) {
            await fetch('/api/admin/reset-lottery', { 
                method: 'POST', 
                body: JSON.stringify({ adminId, quizId }) 
            });
        },

        async deleteSubmission(adminId, quizId, targetUserId) {
            await fetch('/api/admin/delete-submission', {
                method: 'POST',
                body: JSON.stringify({ adminId, quizId, targetUserId })
            });
        }
    }
};
