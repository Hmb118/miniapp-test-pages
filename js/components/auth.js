const auth = {
    methods: {
        async updateProfile() {
            if(!this.regForm.firstName || !this.regForm.phone) 
                return this.showToast('نام و شماره تماس الزامی است', 'error');
            
            if(this.isDemo) 
                return this.showToast('در حالت دمو امکان ذخیره وجود ندارد', 'info');
            
            const data = await api.register(this.userId, this.regForm);
            
            if(data.success) { 
                this.registered = true; 
                this.userData = data.user; 
                this.showToast('اطلاعات ذخیره شد', 'success'); 
                this.view = 'profile_view'; 
            } else if (data.error) { 
                this.showToast(data.error, 'error'); 
            }
        },

        askConfirm(type, data = null) {
            const modalConfig = {
                exit: { title: 'خروج از مسابقه', desc: 'با خروج از مسابقه، پیشرفت شما از دست می‌رود. خارج می‌شوید؟' },
                submit: { title: 'ثبت پاسخ‌نامه', desc: 'آیا از ثبت نهایی اطمینان دارید؟' },
                delete_quiz: { title: 'حذف مسابقه', desc: 'آیا از حذف این مسابقه اطمینان دارید؟' },
                start: { title: data?.title, desc: '' }
            };

            this.modal = {
                show: true,
                type: type,
                title: modalConfig[type]?.title || '',
                desc: modalConfig[type]?.desc || '',
                data: data
            };
        },

        confirmAction() {
            const t = this.modal.type;
            const d = this.modal.data;
            
            if (t === 'channel_check') {
                this.modal.show = false;
                if(d.nextAction === 'start_quiz') {
                    this.startQuizConfirmed();
                }
                return;
            }
            
            this.modal.show = false;
            if(t === 'exit') this.closeQuiz();
            if(t === 'submit') this.submitAnswers();
            if(t === 'delete_quiz') this.deleteQuiz(this.modal.data);
            if(t === 'start') this.startQuizConfirmed();
        },

        openChannelLink(url) {
            if (!url) return;
            if (window.Eitaa && window.Eitaa.WebApp && window.Eitaa.WebApp.openEitaaLink) {
                if(url.includes('eitaa.com')) {
                    window.Eitaa.WebApp.openEitaaLink(url);
                } else {
                    window.Eitaa.WebApp.openLink(url);
                }
            } else {
                window.open(url, '_blank');
            }
            if(this.modal.type === 'channel_check' && this.modal.data) {
                this.modal.data.linkClicked = true;
            }
        },

        copyQuizLink(quizId) {
            if(!this.systemConfig.botUsername) 
                return this.showToast('لطفا ابتدا آیدی بات را در تنظیمات وارد کنید', 'error');
            
            const link = `https://eitaa.com/${this.systemConfig.botUsername}?startapp=${quizId}`;
            
            navigator.clipboard.writeText(link).then(() => {
                this.showToast('لینک مسابقه کپی شد', 'success');
            }).catch(err => {
                this.showToast('خطا در کپی لینک', 'error');
            });
        }
    }
};