export default {
    data() {
        return {
            userName: localStorage.getItem('full_name') || 'User',
            loading: false,
            dashboardData: null,
            error: null,
            quizzes: [
                { id: 1, title: 'Introduction to Python', subject: 'Programming', questions: 15, completed: true, score: 85 },
                { id: 2, title: 'Data Structures', subject: 'Computer Science', questions: 20, completed: false },
                { id: 3, title: 'Web Development Basics', subject: 'Web Development', questions: 12, completed: true, score: 92 },
                { id: 4, title: 'Database Management', subject: 'Database', questions: 18, completed: false }
            ]
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
                // In a real application, you would use the data from the API
                // this.quizzes = response.data.quizzes;
            } catch (error) {
                this.error = 'Failed to load dashboard data';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        logout() {
            this.$emit('logout');
        },
        startQuiz(quizId) {
            // In a real application, this would navigate to the quiz page
            alert(`Starting quiz ${quizId}`);
        },
        continueQuiz(quizId) {
            // In a real application, this would navigate to the quiz page
            alert(`Continuing quiz ${quizId}`);
        },
        viewResults(quizId) {
            // In a real application, this would navigate to the results page
            alert(`Viewing results for quiz ${quizId}`);
        }
    },
    template: `
        <div class="d-flex">
            <!-- Sidebar -->
            <div class="sidebar" style="width: 250px;">
                <div class="sidebar-brand d-flex align-items-center justify-content-center py-4">
                    <div class="sidebar-brand-icon me-2">
                        <i class="fas fa-brain"></i>
                    </div>
                    <div class="sidebar-brand-text">Quiz Master</div>
                </div>
                
                <hr class="sidebar-divider my-0">
                
                <ul class="nav flex-column">
                    <li class="nav-item">
                        <a class="nav-link active" href="#">
                            <i class="fas fa-fw fa-tachometer-alt"></i>
                            <span>Dashboard</span>
                        </a>
                    </li>
                    
                    <hr class="sidebar-divider">
                    <div class="sidebar-heading px-3 py-2 text-uppercase opacity-75 small">
                        Learning
                    </div>
                    
                    <li class="nav-item">
                        <a class="nav-link" href="#">
                            <i class="fas fa-fw fa-book"></i>
                            <span>My Courses</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#">
                            <i class="fas fa-fw fa-question-circle"></i>
                            <span>Available Quizzes</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#">
                            <i class="fas fa-fw fa-chart-line"></i>
                            <span>My Progress</span>
                        </a>
                    </li>
                    
                    <hr class="sidebar-divider">
                    <div class="sidebar-heading px-3 py-2 text-uppercase opacity-75 small">
                        Account
                    </div>
                    
                    <li class="nav-item">
                        <a class="nav-link" href="#">
                            <i class="fas fa-fw fa-user"></i>
                            <span>Profile</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#">
                            <i class="fas fa-fw fa-cog"></i>
                            <span>Settings</span>
                        </a>
                    </li>
                </ul>
            </div>
            
            <!-- Main Content -->
            <div class="flex-grow-1">
                <!-- Topbar -->
                <nav class="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow">
                    <button class="btn btn-link d-md-none rounded-circle mr-3">
                        <i class="fa fa-bars"></i>
                    </button>
                    
                    <ul class="navbar-nav ms-auto">
                        <li class="nav-item dropdown no-arrow">
                            <a class="nav-link dropdown-toggle text-dark me-3" href="#" id="userDropdown" role="button"
                                data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                <span class="me-2 d-none d-lg-inline text-gray-600">{{ userName }}</span>
                                <i class="fas fa-user-circle fa-fw"></i>
                            </a>
                            <div class="dropdown-menu dropdown-menu-end shadow animated--grow-in"
                                aria-labelledby="userDropdown">
                                <a class="dropdown-item" href="#">
                                    <i class="fas fa-user fa-sm fa-fw me-2 text-gray-400"></i>
                                    Profile
                                </a>
                                <a class="dropdown-item" href="#">
                                    <i class="fas fa-cogs fa-sm fa-fw me-2 text-gray-400"></i>
                                    Settings
                                </a>
                                <div class="dropdown-divider"></div>
                                <a class="dropdown-item" href="#" @click.prevent="logout">
                                    <i class="fas fa-sign-out-alt fa-sm fa-fw me-2 text-gray-400"></i>
                                    Logout
                                </a>
                            </div>
                        </li>
                    </ul>
                </nav>
                
                <!-- Begin Page Content -->
                <div class="container-fluid px-4">
                    <div class="d-sm-flex align-items-center justify-content-between mb-4">
                        <h1 class="h3 mb-0 text-gray-800">My Dashboard</h1>
                        <a href="#" class="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
                            <i class="fas fa-download fa-sm text-white-50 me-1"></i> Download Progress Report
                        </a>
                    </div>
                    
                    <div v-if="loading" class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                    
                    <div v-else-if="error" class="alert alert-danger" role="alert">
                        {{ error }}
                    </div>
                    
                    <div v-else>
                        <!-- Welcome Card -->
                        <div class="card shadow mb-4">
                            <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                                <h6 class="m-0 font-weight-bold text-primary">Welcome Back!</h6>
                            </div>
                            <div class="card-body">
                                <p>Welcome back to Quiz Master, {{ userName }}! Continue your learning journey by taking quizzes and improving your knowledge.</p>
                                <div class="mt-3">
                                    <a href="#" class="btn btn-primary me-2">
                                        <i class="fas fa-play me-1"></i> Start New Quiz
                                    </a>
                                    <a href="#" class="btn btn-outline-primary">
                                        <i class="fas fa-chart-line me-1"></i> View Progress
                                    </a>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Quizzes Section -->
                        <h4 class="mb-3 text-gray-800">My Quizzes</h4>
                        <div class="row">
                            <div v-for="quiz in quizzes" :key="quiz.id" class="col-lg-6 mb-4">
                                <div class="card shadow h-100">
                                    <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                                        <h6 class="m-0 font-weight-bold text-primary">{{ quiz.title }}</h6>
                                        <div class="dropdown no-arrow">
                                            <a class="dropdown-toggle" href="#" role="button" id="dropdownMenuLink"
                                                data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                                <i class="fas fa-ellipsis-v fa-sm fa-fw text-gray-400"></i>
                                            </a>
                                            <div class="dropdown-menu dropdown-menu-end shadow animated--fade-in"
                                                aria-labelledby="dropdownMenuLink">
                                                <div class="dropdown-header">Quiz Actions:</div>
                                                <a class="dropdown-item" href="#" @click.prevent="startQuiz(quiz.id)">Start</a>
                                                <a class="dropdown-item" href="#" @click.prevent="viewResults(quiz.id)" v-if="quiz.completed">View Results</a>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="card-body">
                                        <div class="mb-2">
                                            <span class="badge bg-info me-2">{{ quiz.subject }}</span>
                                            <span class="badge bg-secondary">{{ quiz.questions }} Questions</span>
                                        </div>
                                        <div v-if="quiz.completed" class="d-flex align-items-center mb-3">
                                            <div class="me-3">
                                                <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Score</div>
                                                <div class="h5 mb-0 font-weight-bold text-gray-800">{{ quiz.score }}%</div>
                                            </div>
                                            <div class="col">
                                                <div class="progress progress-sm">
                                                    <div class="progress-bar bg-success" role="progressbar"
                                                        :style="{ width: quiz.score + '%' }" :aria-valuenow="quiz.score"
                                                        aria-valuemin="0" aria-valuemax="100"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-if="quiz.completed">
                                            <button class="btn btn-success btn-sm me-2" @click="viewResults(quiz.id)">
                                                <i class="fas fa-chart-bar me-1"></i> View Results
                                            </button>
                                            <button class="btn btn-primary btn-sm" @click="startQuiz(quiz.id)">
                                                <i class="fas fa-redo me-1"></i> Retake Quiz
                                            </button>
                                        </div>
                                        <div v-else>
                                            <button class="btn btn-primary btn-sm" @click="startQuiz(quiz.id)">
                                                <i class="fas fa-play me-1"></i> Start Quiz
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}