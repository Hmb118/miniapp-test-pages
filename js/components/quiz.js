const quiz = {
    methods: {
        handleQuizClick(q) {
            if (q.userStatus !== 'active') return;
            if (!this.registered) { 
                this.showToast('برای شرکت در مسابقه ابتدا ثبت‌نام کنید', 'info'); 
                this.view = 'register'; 
                return; 
            }
            
            if (q.channelReq && !this.isAdmin) {
                this.modal = {
                    show: true,
                    type: 'channel_check',
                    data: {
                        link: q.channelLink,
                        text: q.channelText,
                        linkClicked: false,
                        nextAction: 'start_quiz',
                        quiz: q
                    }
                };
                return;
            }

            this.askConfirm('start', q);
        },

        startQuizConfirmed() {
            let q = this.modal.data;
            if (this.modal.data && this.modal.data.quiz) {
                q = this.modal.data.quiz;
            }
            
            this.activeQuiz = q;
            this.answers = {};
            this.view = 'take_quiz';
            
            if (q.musicUrl && this.$refs.bgMusic) {
                this.$refs.bgMusic.src = q.musicUrl;
                this.$refs.bgMusic.play().catch(e => console.log('Music autoplay prevented', e));
            }

            if (!q.noTimer) { 
                this.timeLeft = (q.timeLimit || 5) * 60; 
                this.startTimer(); 
            } else { 
                this.timeLeft = 0; 
            }
            
            if (window.Eitaa?.WebApp) {
                window.Eitaa.WebApp.MainButton
                    .setText('ثبت پاسخ‌نامه')
                    .show()
                    .onClick(() => this.askConfirm('submit'));
            }
        },

        startTimer() { 
            if(this.timerInterval) clearInterval(this.timerInterval); 
            this.timerInterval = setInterval(() => { 
                if (this.timeLeft > 0) this.timeLeft--; 
                else this.submitAnswers(); 
            }, 1000); 
        },

        async submitAnswers() {
            clearInterval(this.timerInterval);
            if(this.$refs.bgMusic) { 
                this.$refs.bgMusic.pause(); 
                this.$refs.bgMusic.currentTime = 0; 
            }
            
            if (window.Eitaa?.WebApp) window.Eitaa.WebApp.MainButton.hide();
            this.view = 'loading';
            
            if(this.isDemo) { 
                this.showToast('ثبت شد (حالت دمو)', 'success'); 
                this.view = 'landing'; 
                return; 
            }
            
            try {
                const d = await api.submitQuiz(this.userId, this.activeQuiz.id, this.answers);
                if(d.error) throw new Error(d.error);
                await this.initApp(); 
                this.showToast('پاسخ‌نامه ثبت شد.', 'success'); 
                this.view = 'quiz_list'; 
                this.quizTab = 'history';
            } catch(e) { 
                this.showToast(e.message, 'error'); 
                this.view = 'landing'; 
            }
        },
        
        closeQuiz() { 
            clearInterval(this.timerInterval);
            if(this.$refs.bgMusic) { 
                this.$refs.bgMusic.pause(); 
                this.$refs.bgMusic.currentTime = 0; 
            }
            if (window.Eitaa?.WebApp) window.Eitaa.WebApp.MainButton.hide(); 
            this.view = 'landing'; 
        },

        showLotteryResult(q) {
            this.modal = {
                show: true,
                type: 'lottery_result',
                data: q
            };
        }
    }
};