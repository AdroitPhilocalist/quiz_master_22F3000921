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
            }
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
                this.dashboardData = response.data;
                
                // For demo purposes, set some sample stats
                this.stats = {
                    totalUsers: 24,
                    totalQuizzes: 15,
                    totalSubjects: 8,
                    totalChapters: 32
                };
            } catch (error) {
                this.error = 'Failed to load dashboard data';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        logout() {
            this.$emit('logout');
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
                        <a class="nav-link" href="#">
                            <i class="fas fa-fw fa-users"></i>
                            <span>Users</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#">
                            <i class="fas fa-fw fa-book"></i>
                            <span>Subjects</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#">
                            <i class="fas fa-fw fa-bookmark"></i>
                            <span>Chapters</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#">
                            <i class="fas fa-fw fa-question-circle"></i>
                            <span>Quizzes</span>
                        </a>
                    </li>
                    
                    <hr class="sidebar-divider">
                    <div class="sidebar-heading px-3 py-2 text-uppercase opacity-75 small">
                        Reports
                    </div>
                    
                    <li class="nav-item">
                        <a class="nav-link" href="#">
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
                        <a href="#" class="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
                            <i class="fas fa-download fa-sm text-white-50 me-1"></i> Generate Report
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
                    </div>
                </div>
            </div>
        </div>
    `
}