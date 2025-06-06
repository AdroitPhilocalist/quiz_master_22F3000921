// Import components
import LoginComponent from './components/LoginComponent.js';
import RegisterComponent from './components/RegisterComponent.js';
import AdminDashboard from './components/AdminDashboard.js';
import UserDashboard from './components/UserDashboard.js';
import QuizTaking from './components/QuizTaking.js';
import QuizResult from './components/QuizResult.js';
import NotFound from './components/NotFound.js';
import SubjectManagement from './components/SubjectManagement.js';
import ChapterManagement from './components/ChapterManagement.js';
import QuizManagement from './components/QuizManagement.js';
import QuestionManagement from './components/QuestionManagement.js';
import AllChaptersManagement from './components/AllChaptersManagement.js';
import AllQuizzesManagement from './components/AllQuizzesManagement.js';
import UserManagement from './components/UserManagement.js';
import AdminStatistics from './components/AdminStatistics.js';
import UserStatistics from './components/UserStatistics.js';
// import { createRouter } from 'vue-router';
const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginComponent },
    { path: '/register', component: RegisterComponent },
    
    // Admin routes
    {
      path: '/admin',
      component: AdminDashboard,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/subjects',
      component: SubjectManagement,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/subjects/:subjectId/chapters',
      component: ChapterManagement,
      props: true,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/quizzes',
        component: AllQuizzesManagement,
        meta: {
            requiresAuth: true,
            role: 'admin'
        }
    },
    {
        path: '/admin/chapters',
        component: AllChaptersManagement,
        meta: { requiresAuth: true, requiresAdmin: true }
      },
    {
      path: '/admin/chapters/:chapterId/quizzes',
      component: QuizManagement,
      props: true,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/quizzes/:quizId/questions',
      component: QuestionManagement,
      props: true,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/users',
        component: UserManagement,
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/analytics',
        component: AdminStatistics,
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    { 
        path: '/user', 
        component: UserDashboard,
        meta: { requiresAuth: true, role: 'user' }
    },
    {
        path: '/user/analytics',
        component: UserStatistics,
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    { path: '/quiz/:quizId', component: QuizTaking, props: true, meta: { requiresAuth: true } },
    { path: '/quiz-result/:attemptId', component: QuizResult, props: true, meta: { requiresAuth: true } },
    { path: '*', component: NotFound }
  ]

const router = new VueRouter({
    routes
});

// Navigation guards for authentication
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');
    
    if (to.matched.some(record => record.meta.requiresAuth)) {
        // This route requires auth
        if (!token) {
            // No token, redirect to login
            next({ path: '/login' });
        } else if (to.meta.role && to.meta.role !== userRole) {
            // Role doesn't match, redirect to appropriate dashboard
            next({ path: userRole === 'admin' ? '/admin' : '/user' });
        } else {
            // Proceed to route
            next();
        }
    } else {
        // Non-protected route
        if (token && (to.path === '/login' || to.path === '/register')) {
            // Already logged in, redirect to dashboard
            next({ path: userRole === 'admin' ? '/admin' : '/user' });
        } else {
            // Proceed to route
            next();
        }
    }
});

// Create Vue app
const app= new Vue({
    el: '#app',
    router,
    data: {
        isAuthenticated: !!localStorage.getItem('token'),
        userRole: localStorage.getItem('role') || '',
        userName: localStorage.getItem('userName') || ''
    },
    methods: {
        logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('userName');
            localStorage.removeItem('userId');
            this.isAuthenticated = false;
            this.userRole = '';
            this.userName = '';
            router.push('/login');
        }
    },
    template: `
        <div>
            <transition name="fade" mode="out-in">
                <router-view @login-success="isAuthenticated = true" @logout="logout"></router-view>
            </transition>
            
        </div>
    `
});

// app.use(BootstrapVue3);
