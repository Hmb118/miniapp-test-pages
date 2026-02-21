function app() {
    return {
        // State
        view: 'loading',
        userId: null,
        isAdmin: false,
        registered: false,
        isDemo: false,
        userData: {},
        userHistory: [],
        quizzes: [],
        systemConfig: {},
        configForm: { 
            systemTitle: '', 
            announcement: '', 
            headerImage: '', 
            bgImage: '', 
            globalChannelReq: false, 
            globalChannelLink: '', 
            globalChannelText: '', 
            botUsername: '' 
        },
        adminMeta: {},
        quizTab: 'active',
        toasts: [],
        modal: { show: false, type: '', title: '', desc: '', data: null },
        userSearch: '',
        activeQuiz: null,
        answers: {},
        timeLeft: 0,
        timerInterval: null,
        newQuiz: {},
        stats: { participants: [], questions: [] },
        userList: [],
        targetUser: null,
        selectedParticipant: null,
        manualGrades: {},
        messageText: '',
        winners: [],
        lotteryCount: 1,
        regForm: { firstName: '', lastName: '', phone: '', birthDate: { year: '', month: '', day: '' }},

        // Computed
        get unreadCount() { 
            return this.userData.messages?.filter(m => !m.read).length || 0; 
        },
        
        get displayName() { 
            return (this.userData.firstName && this.userData.lastName) ? 
                this.userData.firstName + ' ' + this.userData.lastName : 
                'کاربر مهمان'; 
        },
        
        get filteredQuizzes() {
            if (this.quizTab === 'active') {
                return this.quizzes.filter(q => q.userStatus === 'active' || q.userStatus === 'pending');
            } else {
                return this.quizzes.filter(q => q.userStatus === 'submitted' || q.userStatus === 'expired').map(q => {
                    const hist = this.userHistory.find(h => h.id === q.id);
                    return { ...q, lastScore: hist?.score || 0, totalPoints: hist?.total || 0 };
                });
            }
        },
        
        get pinnedQuizzes() { 
            return this.quizzes.filter(q => q.promoted && q.userStatus === 'active'); 
        },
        
        get filteredUserList() {
            if(!this.userSearch) return this.userList;
            const s = this.userSearch.toLowerCase();
            return this.userList.filter(u => 
                (u.firstName + ' ' + u.lastName).toLowerCase().includes(s) || 
                u.phone?.includes(s)
            );
        },
        
        get fullScoreCount() { 
            return this.stats.participants.filter(p => p.score === p.total).length; 
        },

        get showNavbar() {
            return this.registered && 
                   !this.view.startsWith('admin') && 
                   !['loading', 'take_quiz', 'register'].includes(this.view);
        },

        // Template Components
        get navbarComponent() {
            return components.navbar(this.view, this.unreadCount);
        },

        get toastComponent() {
            return components.toast(this.toasts);
        },

        get modalComponent() {
            return components.modal(this.modal);
        },

        get currentPage() {
            const pages = {
                loading: () => components.loading(),
                landing: () => pages.landing(this),
                profile_view: () => pages.profile(this),
                register: () => pages.register(this),
                edit_profile: () => pages.register(this, true),
                quiz_list: () => pages.quizList(this),
                take_quiz: () => pages.takeQuiz(this),
                admin_dash: () => pages.admin.dashboard(this),
                admin_quiz_list: () => pages.admin.quizList(this),
                admin_stats_view: () => pages.admin.stats(this),
                admin_config: () => pages.admin.config(this),
                admin_users: () => pages.admin.users(this),
                admin_user_detail: () => pages.admin.userDetail(this),
                admin_create: () => pages.admin.createQuiz(this)
            };
            return pages[this.view]?.() || '';
        },

        // Methods
        async init() {
            helpers.initIcons();
            await this.initApp();
            
            this.$watch('view', () => {
                helpers.initIcons();
                window.scrollTo(0, 0);
            });
        },

        showToast(message, type = 'info') {
            const id = Date.now();
            const icons = { success: '✅', error: '❌', info: 'ℹ️' };
            this.toasts.push({ id, message, icon: icons[type], visible: true });
            setTimeout(() => { 
                this.toasts = this.toasts.filter(t => t.id !== id); 
            }, 3000);
        },

        navigateTo(target) { 
            if(target === 'profile_view') this.markRead(); 
            this.view = target; 
        },

        async markRead() { 
            if (this.unreadCount > 0 && !this.isDemo) { 
                await api.markRead(this.userId); 
                this.userData.messages.forEach(m => m.read = true); 
            }
        },

        async initApp() {
            let startParam = null;
            if (window.Eitaa?.WebApp?.initDataUnsafe?.start_param) {
                startParam = window.Eitaa.WebApp.initDataUnsafe.start_param;
            }

            if (window.Eitaa?.WebApp?.initDataUnsafe?.user) { 
                this.userId = window.Eitaa.WebApp.initDataUnsafe.user.id; 
                window.Eitaa.WebApp.expand(); 
            } else { 
                this.userId = localStorage.getItem('mock_user_id') || "TEST_USER"; 
            }
            
            try {
                const data = await api.init(this.userId);
                if(data.error) throw new Error(data.error);
                
                this.isAdmin = data.isAdmin;
                this.registered = data.registered;
                this.userData = data.userData;
                this.regForm = { 
                    firstName: data.userData.firstName || '', 
                    lastName: data.userData.lastName || '', 
                    phone: data.userData.phone || '', 
                    birthDate: data.userData.birthDate || { year: '', month: '', day: '' }
                };
                this.quizzes = data.quizzes;
                this.userHistory = data.history || [];
                this.adminMeta = data.meta || {};
                this.systemConfig = data.config || {};
                this.configForm = { ...this.systemConfig }; 
                this.isDemo = data.isDemo || false;
                this.view = 'landing';
                
                if (startParam) {
                    const targetQuiz = this.quizzes.find(q => q.id === startParam);
                    if (targetQuiz) {
                        setTimeout(() => {
                            this.handleQuizClick(targetQuiz);
                        }, 500);
                    }
                }

                if (this.systemConfig.globalChannelReq && !this.isAdmin && !startParam) {
                    setTimeout(() => {
                        this.modal = {
                            show: true,
                            type: 'channel_check',
                            data: {
                                link: this.systemConfig.globalChannelLink,
                                text: this.systemConfig.globalChannelText,
                                linkClicked: false,
                                nextAction: 'enter_app'
                            }
                        };
                    }, 500);
                }

            } catch (e) {
                this.showToast('عدم دسترسی به سرور. حالت آفلاین.', 'error');
                this.view = 'landing'; 
                this.isDemo = true;
                this.userData = { firstName: 'کاربر', lastName: 'آفلاین' };
            }
        },

        // Delegate to component methods
        ...auth.methods,
        ...quiz.methods,
        ...profile.methods,
        ...admin.methods
    };
}
