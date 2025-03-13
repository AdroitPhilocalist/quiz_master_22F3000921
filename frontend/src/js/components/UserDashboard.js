export default {
    data() {
        return {
            userName: localStorage.getItem('full_name') || 'User',
            loading: false,
            dashboardData: null,
            error: null,
            stats: {
                totalQuizzesTaken: 0,
                quizzesInProgress: 0,
                averageScore: 0,
                bestScore: 0
            },
            recentAttempts: [],
            inProgressQuizzes: [],
            recommendedQuizzes: [],
            subjects: []
        }
    },
    created() {
        this.fetchDashboardData();
    },
    methods: {
        async fetchDashboardData() {
            this.loading = true;
            try {
                const response = await axios.get('/api/user/dashboard', {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                
                this.dashboardData = response.data;
                this.userName = response.data.user.name;
                this.stats = response.data.stats;
                this.recentAttempts = response.data.recent_attempts;
                this.inProgressQuizzes = response.data.in_progress_quizzes;
                this.recommendedQuizzes = response.data.recommended_quizzes;
                this.subjects = response.data.subjects;
            } catch (error) {
                this.error = 'Failed to load dashboard data';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        
        formatDate(dateString) {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        
        startQuiz(quizId) {
            this.$router.push(`/quiz/${quizId}`);
        },
        
        continueQuiz(attemptId) {
            this.$router.push(`/quiz-attempt/${attemptId}`);
        },
        
        viewResult(attemptId) {
            this.$router.push(`/quiz-result/${attemptId}`);
        },
        
        browseSubject(subjectId) {
            this.$router.push(`/subject/${subjectId}`);
        },
        
        getScoreClass(score) {
            if (score >= 90) return 'text-success';
            if (score >= 70) return 'text-primary';
            if (score >= 50) return 'text-warning';
            return 'text-danger';
        }
    },
    template: `
        <div class="container-fluid py-4">
            <div v-if="loading" class="text-center my-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading your dashboard...</p>
            </div>
            
            <div v-else-if="error" class="alert alert-danger" role="alert">
                {{ error }}
            </div>
            
            <div v-else>
                <!-- Welcome Section -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card bg-gradient-primary border-0 shadow-lg">
                            <div class="card-body p-4">
                                <div class="row align-items-center">
                                    <div class="col-md-8">
                                        <h2 class="text-white mb-0">Welcome back, {{ userName }}!</h2>
                                        <p class="text-white-50 mb-0">Ready to challenge yourself with some quizzes today?</p>
                                    </div>
                                    <div class="col-md-4 text-md-end mt-3 mt-md-0">
                                        <button class="btn btn-light" @click="fetchDashboardData">
                                            <i class="fas fa-sync-alt me-1"></i> Refresh
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Stats Cards -->
                <div class="row mb-4">
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card border-0 shadow-sm h-100">
                            <div class="card-body">
                                <div class="row align-items-center">
                                    <div class="col-3">
                                        <div class="icon-shape bg-gradient-primary text-white rounded-circle shadow-sm">
                                            <i class="fas fa-clipboard-check"></i>
                                        </div>
                                    </div>
                                    <div class="col-9">
                                        <div class="numbers">
                                            <p class="text-sm mb-0 text-uppercase font-weight-bold">Quizzes Taken</p>
                                            <h5 class="font-weight-bolder mb-0">
                                                {{ stats.totalQuizzesTaken }}
                                            </h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card border-0 shadow-sm h-100">
                            <div class="card-body">
                                <div class="row align-items-center">
                                    <div class="col-3">
                                        <div class="icon-shape bg-gradient-info text-white rounded-circle shadow-sm">
                                            <i class="fas fa-hourglass-half"></i>
                                        </div>
                                    </div>
                                    <div class="col-9">
                                        <div class="numbers">
                                            <p class="text-sm mb-0 text-uppercase font-weight-bold">In Progress</p>
                                            <h5 class="font-weight-bolder mb-0">
                                                {{ stats.quizzesInProgress }}
                                            </h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card border-0 shadow-sm h-100">
                            <div class="card-body">
                                <div class="row align-items-center">
                                    <div class="col-3">
                                        <div class="icon-shape bg-gradient-success text-white rounded-circle shadow-sm">
                                            <i class="fas fa-chart-line"></i>
                                        </div>
                                    </div>
                                    <div class="col-9">
                                        <div class="numbers">
                                            <p class="text-sm mb-0 text-uppercase font-weight-bold">Average Score</p>
                                            <h5 class="font-weight-bolder mb-0">
                                                {{ stats.averageScore }}%
                                            </h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card border-0 shadow-sm h-100">
                            <div class="card-body">
                                <div class="row align-items-center">
                                    <div class="col-3">
                                        <div class="icon-shape bg-gradient-warning text-white rounded-circle shadow-sm">
                                            <i class="fas fa-trophy"></i>
                                        </div>
                                    </div>
                                    <div class="col-9">
                                        <div class="numbers">
                                            <p class="text-sm mb-0 text-uppercase font-weight-bold">Best Score</p>
                                            <h5 class="font-weight-bolder mb-0">
                                                {{ stats.bestScore }}%
                                            </h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Main Content -->
                <div class="row">
                    <!-- Left Column -->
                    <div class="col-lg-8">
                        <!-- In Progress Quizzes -->
                        <div class="card border-0 shadow-sm mb-4">
                            <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                                <h6 class="mb-0 fw-bold">Continue Your Quizzes</h6>
                            </div>
                            <div class="card-body">
                                <div v-if="inProgressQuizzes.length === 0" class="text-center py-4">
                                    <img src="/static/img/empty-state.svg" alt="No quizzes in progress" class="img-fluid mb-3" style="max-height: 150px;">
                                    <h5>No quizzes in progress</h5>
                                    <p class="text-muted">Start a new quiz from the recommended section below.</p>
                                </div>
                                <div v-else class="table-responsive">
                                    <table class="table align-middle">
                                        <thead class="text-uppercase text-muted" style="font-size: 0.85rem;">
                                            <tr>
                                                <th>Quiz</th>
                                                <th>Subject</th>
                                                <th>Started</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="quiz in inProgressQuizzes" :key="quiz.id" class="animate__animated animate__fadeIn">
                                                <td>
                                                    <div class="d-flex align-items-center">
                                                        <div class="avatar avatar-sm bg-gradient-info rounded-circle me-2">
                                                            <span class="avatar-text">{{ quiz.title.charAt(0) }}</span>
                                                        </div>
                                                        <div>{{ quiz.title }}</div>
                                                    </div>
                                                </td>
                                                <td>{{ quiz.subject }}</td>
                                                <td>{{ formatDate(quiz.started_at) }}</td>
                                                <td>
                                                    <button class="btn btn-sm btn-primary" @click="continueQuiz(quiz.attempt_id)">
                                                        <i class="fas fa-play-circle me-1"></i> Continue
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Recommended Quizzes -->
                        <div class="card border-0 shadow-sm mb-4">
                            <div class="card-header bg-white py-3">
                                <h6 class="mb-0 fw-bold">Recommended Quizzes</h6>
                            </div>
                            <div class="card-body">
                                <div v-if="recommendedQuizzes.length === 0" class="text-center py-4">
                                    <img src="/static/img/completed.svg" alt="All caught up" class="img-fluid mb-3" style="max-height: 150px;">
                                    <h5>You've completed all available quizzes!</h5>
                                    <p class="text-muted">Check back later for new content.</p>
                                </div>
                                <div v-else class="row">
                                    <div v-for="quiz in recommendedQuizzes" :key="quiz.id" class="col-md-6 mb-4 animate__animated animate__fadeIn">
                                        <div class="card h-100 border-0 shadow-sm hover-card">
                                            <div class="card-body">
                                                <div class="d-flex justify-content-between align-items-center mb-2">
                                                    <h5 class="card-title mb-0">{{ quiz.title }}</h5>
                                                    <span class="badge bg-light text-dark">{{ quiz.question_count }} Questions</span>
                                                </div>
                                                <p class="card-text text-muted mb-3">
                                                    <i class="fas fa-book-open me-1"></i> {{ quiz.subject }} - {{ quiz.chapter }}
                                                </p>
                                                <p class="card-text text-muted mb-3">
                                                    <i class="fas fa-clock me-1"></i> {{ quiz.time_limit }} minutes
                                                </p>
                                                <button class="btn btn-primary w-100" @click="startQuiz(quiz.id)">
                                                    <i class="fas fa-play-circle me-1"></i> Start Quiz
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Right Column -->
                    <div class="col-lg-4">
                        <!-- Recent Results -->
                        <div class="card border-0 shadow-sm mb-4">
                            <div class="card-header bg-white py-3">
                                <h6 class="mb-0 fw-bold">Recent Results</h6>
                            </div>
                            <div class="card-body p-0">
                                <div v-if="recentAttempts.length === 0" class="text-center py-4">
                                    <img src="/static/img/no-data.svg" alt="No results yet" class="img-fluid mb-3" style="max-height: 150px;">
                                    <h5>No quiz results yet</h5>
                                    <p class="text-muted">Complete a quiz to see your results here.</p>
                                </div>
                                <ul v-else class="list-group list-group-flush">
                                    <li v-for="attempt in recentAttempts" :key="attempt.id" 
                                        class="list-group-item d-flex justify-content-between align-items-center p-3 animate__animated animate__fadeIn">
                                        <div>
                                            <h6 class="mb-1">{{ attempt.quiz_title }}</h6>
                                            <p class="text-muted small mb-0">{{ attempt.subject_name }} - {{ attempt.chapter_name }}</p>
                                            <p class="text-muted small mb-0">{{ formatDate(attempt.completed_at) }}</p>
                                        </div>
                                        <div class="text-end">
                                            <h5 :class="getScoreClass(attempt.score)">{{ attempt.score }}%</h5>
                                            <button class="btn btn-sm btn-outline-primary" @click="viewResult(attempt.id)">
                                                <i class="fas fa-eye me-1"></i> View
                                            </button>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        
                        <!-- Browse Subjects -->
                        <div class="card border-0 shadow-sm mb-4">
                            <div class="card-header bg-white py-3">
                                <h6 class="mb-0 fw-bold">Browse by Subject</h6>
                            </div>
                            <div class="card-body p-0">
                                <div v-if="subjects.length === 0" class="text-center py-4">
                                    <img src="/static/img/empty-folder.svg" alt="No subjects" class="img-fluid mb-3" style="max-height: 150px;">
                                    <h5>No subjects available</h5>
                                    <p class="text-muted">Check back later for new content.</p>
                                </div>
                                <ul v-else class="list-group list-group-flush">
                                    <li v-for="subject in subjects" :key="subject.id" 
                                        class="list-group-item p-3 animate__animated animate__fadeIn">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div>
                                                <h6 class="mb-1">{{ subject.name }}</h6>
                                                <p class="text-muted small mb-0">{{ subject.chapters.length }} chapters</p>
                                            </div>
                                            <button class="btn btn-sm btn-outline-primary" @click="browseSubject(subject.id)">
                                                <i class="fas fa-arrow-right"></i>
                                            </button>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}