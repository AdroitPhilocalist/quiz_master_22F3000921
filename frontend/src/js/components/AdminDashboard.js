export default {
    data() {
        return {
            userName: localStorage.getItem('full_name') || 'Admin',
            loading: false,
            dashboardData: null,
            error: null,
            stats: {
                totalUsers: 0,
                totalQuizzes: 0,
                totalSubjects: 0,
                totalChapters: 0
            },
            recentQuizzes: [],
            recentAttempts: []
        }
    },
    created() {
        this.fetchDashboardData();
    },
    methods: {
        async fetchDashboardData() {
            this.loading = true;
            try {
                const response = await axios.get('/api/admin/dashboard', {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                
                // Log the full response to debug
                // console.log('Dashboard API response:', response.data);
                
                // Store the full response
                this.dashboardData = response.data;
                
                // Set stats from API data
                if (response.data && response.data.stats) {
                    this.stats = {
                        totalUsers: response.data.stats.total_users || 0,
                        totalQuizzes: response.data.stats.total_quizzes || 0,
                        totalSubjects: response.data.stats.total_subjects || 0,
                        totalChapters: response.data.stats.total_chapters || 0,
                        totalAttempts: response.data.stats.total_attempts || 0,
                        averageScore: response.data.stats.average_score || 0
                    };
                    
                    // Use actual recent quizzes data
                    this.recentQuizzes = response.data.recent_quizzes || [];
                    
                    // Use actual recent attempts data
                    this.recentAttempts = response.data.recent_attempts || [];
                } else {
                    console.error('Invalid response format:', response.data);
                    this.error = 'Invalid response format from server';
                }
            } catch (error) {
                this.error = 'Failed to load dashboard data';
                console.error('API error:', error);
                if (error.response) {
                    console.error('Error response:', error.response.data);
                }
            } finally {
                this.loading = false;
            }
        },
        showToast(message, title = "Notification", variant = "success") {
            const toastEl = document.createElement("div");
            toastEl.className = `toast align-items-center text-white bg-${variant} border-0`;
            toastEl.setAttribute("role", "alert");
            toastEl.setAttribute("aria-live", "assertive");
            toastEl.setAttribute("aria-atomic", "true");
            toastEl.innerHTML = `
              <div class="d-flex">
                  <div class="toast-body">
                      <strong>${title}:</strong> ${message}
                  </div>
                   <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
              </div>
          `;
            let toastContainer = document.querySelector(".toast-container");
            if (!toastContainer) {
              toastContainer = document.createElement("div");
              toastContainer.className =
                "toast-container position-fixed top-0 end-0 p-3";
              toastContainer.style.zIndex = "1100";
              document.body.appendChild(toastContainer);
            }
      
            // Add toast to container
            toastContainer.appendChild(toastEl);
      
            // Initialize Bootstrap toast
            const toast = new bootstrap.Toast(toastEl, {
              autohide: true,
              delay: 3000,
            });
      
            // Show toast
            toast.show();
      
            // Remove toast element after it's hidden
            toastEl.addEventListener("hidden.bs.toast", () => {
              toastEl.remove();
            });
        },
        async exportQuizzes() {
            this.loading = true;
            try {
                const response = await axios.post('/api/admin/quizzes/export', {}, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token'),
                        'Content-Type': 'application/json'
                    }
                });
                
                // Check if we have a download URL in the response
                if (response.data.download_url) {
                    alert(`Export completed successfully. You can download the file at: ${response.data.download_url}`);
          
                } else {
                    alert(response.data.message || "Export started successfully. You will receive an email when it is ready.");
                }
            } catch (error) {
                console.error('Export error:', error);
                alert(`Export failed: ${error.response?.data?.message || 'Unknown error'}`);
            } finally {
                this.loading = false;
            }
        },
        logout() {
            this.$emit('logout');
        },
        formatDate(dateString) {
            return new Date(dateString).toLocaleString();
        },
        getScoreClass(score) {
            if (score >= 80) return 'bg-success';
            if (score >= 60) return 'bg-primary';
            if (score >= 40) return 'bg-warning';
            return 'bg-danger';
        },
        navigateToUsers() {
            this.$router.push('/admin/users');
        },
        navigateToSubjects() {
            this.$router.push('/admin/subjects');
        },
        navigateToChapters() {
            this.$router.push('/admin/chapters');
        },
        navigateToQuizzes() {
            this.$router.push('/admin/quizzes');
        },
        navigateToAnalytics() {
            this.$router.push('/admin/analytics');
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
                        Management
                    </div>
                    
                    <li class="nav-item">
                        <a class="nav-link" href="#" @click.prevent="navigateToUsers">
                            <i class="fas fa-fw fa-users"></i>
                            <span>Users</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" @click.prevent="navigateToSubjects">
                            <i class="fas fa-fw fa-book"></i>
                            <span>Subjects</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" @click.prevent="navigateToChapters">
                            <i class="fas fa-fw fa-bookmark"></i>
                            <span>Chapters</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" @click.prevent="navigateToQuizzes">
                            <i class="fas fa-fw fa-question-circle"></i>
                            <span>Quizzes</span>
                        </a>
                    </li>
                    
                    <hr class="sidebar-divider">
                    <div class="sidebar-heading px-3 py-2 text-uppercase opacity-75 small">
                        Reports
                    </div>
                    
                    <li class="nav-item">
                        <a class="nav-link" href="#" @click.prevent="navigateToAnalytics">
                            <i class="fas fa-fw fa-chart-bar"></i>
                            <span>Analytics</span>
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
                         <span class="me-2 d-none d-lg-inline">{{ userName }}</span>
                         <i class="fas fa-user-circle fa-fw text-dark"></i>
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
                        <h1 class="h3 mb-0 text-gray-800">Admin Dashboard</h1>
                        <a href="#" class="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm" @click.prevent="exportQuizzes">
                            <i class="fas fa-download fa-sm text-white-50 me-1"></i> Export Quizzes
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
                        <!-- Content Row -->
                        <div class="row">
                            <!-- Total Users Card -->
                            <div class="col-xl-3 col-md-6 mb-4">
                                <div class="card border-left-primary shadow h-100 py-2">
                                    <div class="card-body">
                                        <div class="row no-gutters align-items-center">
                                            <div class="col mr-2">
                                                <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                                    Total Users</div>
                                                <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.totalUsers }}</div>
                                            </div>
                                            <div class="col-auto">
                                                <i class="fas fa-users fa-2x text-gray-300"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Total Quizzes Card -->
                            <div class="col-xl-3 col-md-6 mb-4">
                                <div class="card border-left-success shadow h-100 py-2">
                                    <div class="card-body">
                                        <div class="row no-gutters align-items-center">
                                            <div class="col mr-2">
                                                <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                                                    Total Quizzes</div>
                                                <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.totalQuizzes }}</div>
                                            </div>
                                            <div class="col-auto">
                                                <i class="fas fa-question-circle fa-2x text-gray-300"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Total Subjects Card -->
                            <div class="col-xl-3 col-md-6 mb-4">
                                <div class="card border-left-info shadow h-100 py-2">
                                    <div class="card-body">
                                        <div class="row no-gutters align-items-center">
                                            <div class="col mr-2">
                                                <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                                                    Total Subjects
                                                </div>
                                                <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.totalSubjects }}</div>
                                            </div>
                                            <div class="col-auto">
                                                <i class="fas fa-book fa-2x text-gray-300"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Total Chapters Card -->
                            <div class="col-xl-3 col-md-6 mb-4">
                                <div class="card border-left-warning shadow h-100 py-2">
                                    <div class="card-body">
                                        <div class="row no-gutters align-items-center">
                                            <div class="col mr-2">
                                                <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                                    Total Chapters
                                                </div>
                                                <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.totalChapters }}</div>
                                            </div>
                                            <div class="col-auto">
                                                <i class="fas fa-bookmark fa-2x text-gray-300"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Additional Stats Row -->
                        <div class="row mb-4">
                            <!-- Total Attempts Card -->
                            <div class="col-xl-6 col-md-6 mb-4">
                                <div class="card border-left-primary shadow h-100 py-2">
                                    <div class="card-body">
                                        <div class="row no-gutters align-items-center">
                                            <div class="col mr-2">
                                                <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                                    Total Quiz Attempts</div>
                                                <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.totalAttempts }}</div>
                                            </div>
                                            <div class="col-auto">
                                                <i class="fas fa-clipboard-check fa-2x text-gray-300"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        
                            <!-- Average Score Card -->
                            <div class="col-xl-6 col-md-6 mb-4">
                                <div class="card border-left-success shadow h-100 py-2">
                                    <div class="card-body">
                                        <div class="row no-gutters align-items-center">
                                            <div class="col mr-2">
                                                <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                                                    Average Quiz Score</div>
                                                <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.averageScore.toFixed(1) }}%</div>
                                            </div>
                                            <div class="col-auto">
                                                <i class="fas fa-chart-line fa-2x text-gray-300"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Recent Data Row -->
                        <div class="row">
                            <!-- Recent Quizzes -->
                            <div class="col-lg-6 mb-4">
                                <div class="card shadow mb-4">
                                    <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                                        <h6 class="m-0 font-weight-bold text-primary">Recent Quizzes</h6>
                                        <a href="#" @click.prevent="navigateToQuizzes" class="btn btn-sm btn-primary">
                                            View All
                                        </a>
                                    </div>
                                    <div class="card-body">
                                        <div v-if="recentQuizzes.length === 0" class="text-center py-3">
                                            <p class="text-muted">No quizzes created yet</p>
                                        </div>
                                        <div v-else class="table-responsive">
                                            <table class="table table-bordered" width="100%" cellspacing="0">
                                                <thead>
                                                    <tr>
                                                        <th>Title</th>
                                                        <th>Chapter</th>
                                                        <th>Questions</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr v-for="quiz in recentQuizzes" :key="quiz.id">
                                                        <td>{{ quiz.title }}</td>
                                                        <td>{{ quiz.chapter_name }}</td>
                                                        <td>{{ quiz.question_count }}</td>
                                                        <td>
                                                            <span class="badge" :class="quiz.is_published ? 'bg-success' : 'bg-warning'">
                                                                {{ quiz.is_published ? 'Published' : 'Draft' }}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Recent Attempts -->
                            <div class="col-lg-6 mb-4">
                                <div class="card shadow mb-4">
                                    <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                                        <h6 class="m-0 font-weight-bold text-primary">Recent Quiz Attempts</h6>
                                        <a href="#" @click.prevent="navigateToAnalytics" class="btn btn-sm btn-primary">
                                            View All
                                        </a>
                                    </div>
                                    <div class="card-body">
                                        <div v-if="recentAttempts.length === 0" class="text-center py-3">
                                            <p class="text-muted">No quiz attempts yet</p>
                                        </div>
                                        <div v-else class="table-responsive">
                                            <table class="table table-bordered" width="100%" cellspacing="0">
                                                <thead>
                                                    <tr>
                                                        <th>Student</th>
                                                        <th>Quiz</th>
                                                        <th>Date</th>
                                                        <th>Score</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr v-for="attempt in recentAttempts" :key="attempt.id">
                                                        <td>{{ attempt.student_name }}</td>
                                                        <td>{{ attempt.quiz_title }}</td>
                                                        <td>{{ formatDate(attempt.completed_at) }}</td>
                                                        <td>
                                                            <span class="badge" :class="getScoreClass(attempt.score)">
                                                                {{ attempt.score.toFixed(1) }}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Quick Actions Row -->
                        <div class="row">
                            <div class="col-12">
                                <div class="card shadow mb-4">
                                    <div class="card-header py-3">
                                        <h6 class="m-0 font-weight-bold text-primary">Quick Actions</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-md-3 mb-3">
                                                <div class="card bg-primary text-white h-100">
                                                    <div class="card-body text-center">
                                                        <i class="fas fa-users fa-3x mb-3"></i>
                                                        <h5>Manage Users</h5>
                                                        <button class="btn btn-light mt-3" @click="navigateToUsers">
                                                            <i class="fas fa-arrow-right"></i> Go
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-md-3 mb-3">
                                                <div class="card bg-success text-white h-100">
                                                    <div class="card-body text-center">
                                                        <i class="fas fa-book fa-3x mb-3"></i>
                                                        <h5>Manage Subjects</h5>
                                                        <button class="btn btn-light mt-3" @click="navigateToSubjects">
                                                            <i class="fas fa-arrow-right"></i> Go
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-md-3 mb-3">
                                                <div class="card bg-info text-white h-100">
                                                    <div class="card-body text-center">
                                                        <i class="fas fa-bookmark fa-3x mb-3"></i>
                                                        <h5>Manage Chapters</h5>
                                                        <button class="btn btn-light mt-3" @click="navigateToChapters">
                                                            <i class="fas fa-arrow-right"></i> Go
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-md-3 mb-3">
                                                <div class="card bg-warning text-white h-100">
                                                    <div class="card-body text-center">
                                                        <i class="fas fa-question-circle fa-3x mb-3"></i>
                                                        <h5>Manage Quizzes</h5>
                                                        <button class="btn btn-light mt-3" @click="navigateToQuizzes">
                                                            <i class="fas fa-arrow-right"></i> Go
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
                </div>
            </div>
        </div>
    `
}