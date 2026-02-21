const admin = {
    methods: {
        openAdminQuizList() { 
            this.view = 'admin_quiz_list'; 
        },

        resetNewQuiz() { 
            this.newQuiz = { 
                id: null, 
                title: '', 
                description: '', 
                timeLimit: 10, 
                noTimer: false, 
                startTime: '', 
                endTime: '', 
                questions: [], 
                channelReq: false, 
                channelLink: '', 
                channelText: '', 
                musicUrl: '' 
            }; 
            this.view = 'admin_create'; 
        },

        openConfigModal() { 
            this.configForm = { ...this.systemConfig }; 
            this.view = 'admin_config'; 
        },

        async saveConfig() { 
            if(this.isDemo) return; 
            await api.admin.saveConfig(this.userId, this.configForm); 
            this.systemConfig = { ...this.configForm }; 
            this.showToast('تنظیمات ذخیره شد', 'success'); 
            this.view = 'admin_dash'; 
        },

        async saveQuiz() {
            if(!this.newQuiz.title || this.newQuiz.questions.length === 0) 
                return this.showToast('اطلاعات ناقص است', 'error');
            
            if(this.isDemo) return;
            
            const payload = { 
                ...this.newQuiz, 
                startTime: new Date(this.newQuiz.startTime).getTime(), 
                endTime: new Date(this.newQuiz.endTime).getTime() 
            };
            
            await api.admin.createQuiz(this.userId, payload);
            this.showToast('مسابقه ذخیره شد', 'success'); 
            this.initApp(); 
            this.view = 'admin_dash';
        },

        async togglePromote(q) { 
            if(this.isDemo) return; 
            const newStatus = !q.promoted; 
            await api.admin.togglePromote(this.userId, q.id, newStatus); 
            q.promoted = newStatus; 
        },

        addQuestion(type) { 
            this.newQuiz.questions.push({ 
                type, 
                points: 1, 
                text: '', 
                options: type === 'choice' ? ['', '', '', ''] : [], 
                correctAnswer: '' 
            }); 
        },

        removeQuestion(idx) { 
            this.newQuiz.questions.splice(idx, 1); 
        },

        editQuiz(q) { 
            this.newQuiz = JSON.parse(JSON.stringify(q)); 
            this.newQuiz.startTime = helpers.formatDateTime(q.startTime); 
            this.newQuiz.endTime = helpers.formatDateTime(q.endTime); 
            this.view = 'admin_create'; 
        },

        async deleteQuiz(id) { 
            if(this.isDemo) return; 
            await api.admin.deleteQuiz(this.userId, id); 
            this.showToast('حذف شد', 'success'); 
            this.quizzes = this.quizzes.filter(q => q.id !== id); 
        },

        async fetchUsers() { 
            if(this.isDemo) return; 
            const d = await api.admin.getUsers(this.userId); 
            this.userList = d.users; 
            this.view = 'admin_users'; 
        },

        manageUser(u) { 
            this.targetUser = u; 
            this.view = 'admin_user_detail'; 
        },

        async deleteMessage(msgId) {
            if(this.isDemo) return;
            if(!confirm('آیا از حذف این پیام اطمینان دارید؟')) return;
            
            const data = await api.admin.deleteMessage(this.userId, this.targetUser.id, msgId);
            
            if(data.success) {
                this.targetUser.messages = this.targetUser.messages.filter(m => m.id !== msgId);
                this.showToast('پیام حذف شد', 'success');
            }
        },

        async sendMessageToUser(ids = null) { 
            if(this.isDemo) return; 
            const targetIds = ids || [this.targetUser.id]; 
            if(!this.messageText && !ids) return; 
            const msg = this.messageText || "تبریک! شما در قرعه‌کشی برنده شدید."; 
            await api.admin.sendMessage(this.userId, targetIds, msg); 
            this.showToast('پیام ارسال شد', 'success'); 
            this.messageText = ''; 
            if(!ids) this.fetchUsers(); 
        },

        async loadStats(qid) { 
            if(this.isDemo) return; 
            this.view = 'loading'; 
            this.stats = await api.admin.getStats(this.userId, qid); 
            this.stats.id = qid; 
            this.winners = []; 
            this.view = 'admin_stats_view'; 
        },
        
        runLottery() {
            const best = this.stats.participants.filter(p => p.score === p.total);
            if(!best.length) return this.showToast('کسی نمره کامل نگرفته است', 'error');
            this.winners = [...best].sort(() => 0.5 - Math.random()).slice(0, this.lotteryCount);
            if(this.winners.length > 0) this.showToast('قرعه‌کشی انجام شد. لطفا ثبت نهایی کنید.', 'info');
        },

        async saveLotteryResults() {
            if(!this.winners.length) return this.showToast('لیست برندگان خالی است', 'error');
            if(this.isDemo) return;
            
            const winnerIds = this.winners.map(w => w.userId);
            await api.admin.saveLottery(this.userId, this.stats.id, winnerIds);
            this.stats.winners = winnerIds;
            this.showToast('نتایج قرعه‌کشی با موفقیت ثبت شد', 'success');
        },
        
        async resetLottery() {
            if(!confirm('آیا مطمئن هستید؟ لیست برندگان حذف خواهد شد و می‌توانید دوباره قرعه‌کشی کنید.')) return;
            if(this.isDemo) return;
            await api.admin.resetLottery(this.userId, this.stats.id);
            this.stats.winners = [];
            this.winners = [];
            this.showToast('قرعه‌کشی بازنشانی شد', 'success');
        },

        async deleteSubmission(targetUserId) {
            if(!confirm('آیا از حذف پاسخ‌نامه این کاربر اطمینان دارید؟')) return;
            if(this.isDemo) return;
            
            await api.admin.deleteSubmission(this.userId, this.stats.id, targetUserId);
            
            this.stats.participants = this.stats.participants.filter(p => p.userId !== targetUserId);
            this.showToast('پاسخ‌نامه حذف شد', 'success');
        },

        openGrading(p) {
            this.selectedParticipant = p;
            this.manualGrades = {}; 
            this.stats.questions.forEach((q, idx) => {
                if(q.type === 'choice') {
                    const u = p.answers[idx];
                    const c = q.correctAnswer;
                    if(u && u == c) this.manualGrades[idx] = q.points;
                }
            });
        },

        getGradeStatus(qIdx) { 
            if (this.manualGrades[qIdx] === undefined) return 'none'; 
            return this.manualGrades[qIdx] > 0 ? 'correct' : 'wrong'; 
        },

        isQuestionCorrect(qIdx) { 
            return this.getGradeStatus(qIdx) === 'correct'; 
        },

        gradeQuestion(qIdx, points) { 
            this.manualGrades[qIdx] = points; 
        },

        calculateCurrentGrade() { 
            let s = 0; 
            Object.values(this.manualGrades).forEach(v => s+=v); 
            return s; 
        },

        async saveGrades() { 
            const newScore = this.calculateCurrentGrade(); 
            await api.admin.updateScore(this.userId, this.stats.id, this.selectedParticipant.userId, newScore); 
            const pIndex = this.stats.participants.findIndex(p => p.userId === this.selectedParticipant.userId); 
            if(pIndex > -1) this.stats.participants[pIndex].score = newScore; 
            this.showToast('نمره ثبت شد', 'success'); 
            this.selectedParticipant = null; 
        },

        exportToCSV(data, filename) { 
            const csvContent = "\uFEFF" + data.map(e => e.join(",")).join("\n"); 
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); 
            const link = document.createElement("a"); 
            link.href = URL.createObjectURL(blob); 
            link.download = filename; 
            link.style.display = "none"; 
            document.body.appendChild(link); 
            link.click(); 
            document.body.removeChild(link); 
        },

        exportAllUsers() { 
            if (!this.userList || this.userList.length === 0) 
                return this.showToast('لیستی وجود ندارد', 'error'); 
            
            const header = ["نام", "نام خانوادگی", "شماره تماس", "تاریخ تولد"]; 
            const rows = this.filteredUserList.map(u => [ 
                u.firstName, 
                u.lastName, 
                u.phone || '', 
                helpers.formatBirthDate(u.birthDate) 
            ]); 
            this.exportToCSV([header, ...rows], "users_list.csv"); 
        },

        exportParticipants() { 
            const header = ["نام", "نام خانوادگی", "شماره", "نمره", "کل", "زمان ثبت"]; 
            const rows = this.stats.participants.map(p => [ 
                p.userInfo.firstName, 
                p.userInfo.lastName, 
                p.userInfo.phone || '', 
                p.score, 
                p.total, 
                new Date(p.submittedAt).toLocaleDateString('fa-IR') 
            ]); 
            this.exportToCSV([header, ...rows], "quiz_results.csv"); 
        }
    }
};
