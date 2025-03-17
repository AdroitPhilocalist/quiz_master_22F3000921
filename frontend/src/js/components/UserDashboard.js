export default {
  data() {
    return {
      userName: localStorage.getItem("full_name") || "User",
      loading: false,
      dashboardData: null,
      error: null,
      stats: {
        total_quizzes_taken: 0,
        quizzes_in_progress: 0,
        average_score: 0,
        best_score: 0,
      },
      recentAttempts: [],
      inProgressQuizzes: [],
      recommendedQuizzes: [],
      subjects: [],
    };
  },
  created() {
    this.fetchDashboardData();
  },
  methods: {
    async fetchDashboardData() {
      this.loading = true;
      try {
        const response = await axios.get("/api/user/dashboard", {
          headers: {
            "Authentication-Token": localStorage.getItem("token"),
          },
        });

        this.dashboardData = response.data;
        this.userName = response.data.user.name;
        this.stats = response.data.stats;
        this.recentAttempts = response.data.recent_attempts;
        this.inProgressQuizzes = response.data.in_progress_quizzes;
        this.recommendedQuizzes = response.data.recommended_quizzes;
        this.subjects = response.data.subjects;
        console.log(this.stats);
        
      } catch (error) {
        this.error = "Failed to load dashboard data";
        console.error(error);
      } finally {
        this.loading = false;
      }
    },

    formatDate(dateString) {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
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
      if (score >= 90) return "text-success";
      if (score >= 70) return "text-primary";
      if (score >= 50) return "text-warning";
      return "text-danger";
    },
    logout() {
        // Remove all stored user data
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userName');
        localStorage.removeItem('userId');
        localStorage.removeItem('full_name');
        
        // Redirect to login page
        this.$router.push('/login');
      },
      viewProfile() {
        // You can implement this later or show a modal
        alert('Profile view functionality will be implemented soon');
      },
      
      // Add settings method (placeholder for now)
      viewSettings() {
        // You can implement this later or show a modal
        alert('Settings functionality will be implemented soon');
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
                <!-- Welcome Section (Enhanced) -->
<div class="row mb-4">
    <div class="col-12">
        <div class="card border-0 overflow-hidden position-relative">
            <!-- Decorative background elements -->
            <div class="position-absolute top-0 start-0 w-100 h-100 overflow-hidden" style="z-index: 0">
                <div class="position-absolute" style="width: 300px; height: 300px; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%); top: -150px; left: -50px;"></div>
                <div class="position-absolute" style="width: 200px; height: 200px; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%); bottom: -100px; right: 20%;"></div>
                <div class="position-absolute rounded-circle" style="width: 40px; height: 40px; background-color: rgba(255,255,255,0.1); top: 20%; left: 10%;"></div>
                <div class="position-absolute rounded-circle" style="width: 20px; height: 20px; background-color: rgba(255,255,255,0.1); top: 30%; right: 20%;"></div>
                <div class="position-absolute rounded-circle" style="width: 15px; height: 15px; background-color: rgba(255,255,255,0.1); bottom: 20%; right: 30%;"></div>
            </div>
            
            <!-- Main content -->
            <div class="card-body p-0">
                <div class="bg-gradient-primary p-4" style="background-image: linear-gradient(135deg, #000DFF 0%, #6B73FF 80%);">
                    <div class="row align-items-center">
                        <div class="col-md-12">
                            <div class="d-flex align-items-center mb-3">
                                <!-- User avatar/icon -->
                                <div class="avatar-circle me-3 bg-white shadow-sm d-flex align-items-center justify-content-center" 
                                     style="width: 60px; height: 60px; border-radius: 50%;">
                                    <span style="font-size: 26px; color: #000DFF;">{{ userName.charAt(0).toUpperCase() }}</span>
                                </div>
                                <div>
                                    <h2 class="text-white fw-bold mb-0">Welcome back, {{ userName }}!</h2>
                                    <div class="d-flex align-items-center">
                                        <span class="badge bg-white text-primary me-2">
                                            <i class="fas fa-bolt me-1"></i>{{ stats.total_quizzes_taken }} Quizzes Completed
                                        </span>
                                        <span class="badge bg-white text-primary">
                                            <i class="fas fa-star me-1"></i>Best: {{ stats.best_score }}%
                                        </span>
                                    </div>
                                </div>
                                <button class="btn btn-link d-md-none rounded-circle">
                    <i class="fa fa-bars"></i>
                </button>
                
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item dropdown no-arrow">
                        <a class="nav-link dropdown-toggle text-white me-3" href="#" id="userDropdown" role="button"
                            data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <span class="me-2 d-none d-lg-inline">{{ userName }}</span>
                            <i class="fas fa-user-circle fa-fw text-dark"></i>
                        </a>
                        
                        <div class="dropdown-menu dropdown-menu-end shadow animated--grow-in"
                            aria-labelledby="userDropdown">
                            <a class="dropdown-item" href="#" @click.prevent="viewProfile">
                                <i class="fas fa-user fa-sm fa-fw me-2 text-gray-400"></i>
                                Profile
                            </a>
                            <a class="dropdown-item" href="#" @click.prevent="viewSettings">
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
                            </div>
                            <p class="text-white mb-0 opacity-90 fw-light">Ready to challenge yourself with some quizzes today?</p>
                            
                        </div>
                        
                        
                    </div>
                </div>
                
                <!-- Additional dashboard quick stats -->
                <div class="bg-white px-4 py-3 border-top d-flex justify-content-between flex-wrap">
                    <div class="py-1 me-3">
                        <span class="text-muted small">Today's Goal</span>
                        <div class="d-flex align-items-center">
                            <div class="progress flex-grow-1 me-2" style="height: 6px; width: 100px;">
                                <div class="progress-bar bg-success" role="progressbar" style="width: 40%"></div>
                            </div>
                            <span class="text-dark fw-bold">2/5</span>
                        </div>
                    </div>
                    <div class="py-1 me-3">
                        <span class="text-muted small">Study Streak</span>
                        <div class="d-flex align-items-center">
                            <i class="fas fa-fire text-warning me-1"></i>
                            <span class="text-dark fw-bold">3 Days</span>
                        </div>
                    </div>
                    <div class="py-1">
                        <span class="text-muted small">Next Quiz</span>
                        <div class="d-flex align-items-center">
                            <i class="fas fa-calendar-alt text-primary me-1"></i>
                            <span class="text-dark fw-bold">In Progress</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- Stats Cards -->             
<div class="row mb-4">
    <!-- Quizzes Taken Card -->
    <div class="col-xl-3 col-md-6 mb-4">
        <div class="card border-0 h-100" style="border-radius: 12px; box-shadow: 0 6px 16px rgba(0,0,0,0.07); overflow: hidden; transition: all 0.3s ease;" 
             onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 10px 20px rgba(0,0,0,0.12)';" 
             onmouseout="this.style.transform=''; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.07)';">
            <div style="width: 4px; height: 100%; background: linear-gradient(to bottom, #000DFF, #6B73FF); position: absolute; left: 0; top: 0;"></div>
            <div class="card-body" style="padding: 1.25rem;">
                <div class="row align-items-center">
                    <div class="col-3">
                        <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #000DFF, #6B73FF); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,13,255,0.2); transition: transform 0.3s ease;"
                             onmouseover="this.style.transform='scale(1.1)';" 
                             onmouseout="this.style.transform='';">
                            <i class="fas fa-clipboard-check fa-lg text-white"></i>
                        </div>
                    </div>
                    <div class="col-9">
                        <div class="numbers">
                            <p class="text-sm mb-0 text-uppercase fw-bold" style="letter-spacing: 1px; color: #555; font-size: 0.75rem;">Quizzes Taken</p>
                            <h3 class="fw-bold mb-0" style="font-size: 1.75rem;">
                                {{ stats.total_quizzes_taken }}
                            </h3>
                        </div>
                    </div>
                </div>
                <div style="height: 4px; background-color: rgba(0,0,0,0.05); margin-top: 15px; border-radius: 4px; overflow: hidden;">
                    <div style="width: 100%; height: 100%; background: linear-gradient(to right, #000DFF, #6B73FF);"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- In Progress Card -->
    <div class="col-xl-3 col-md-6 mb-4">
        <div class="card border-0 h-100" style="border-radius: 12px; box-shadow: 0 6px 16px rgba(0,0,0,0.07); overflow: hidden; transition: all 0.3s ease;"
             onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 10px 20px rgba(0,0,0,0.12)';" 
             onmouseout="this.style.transform=''; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.07)';">
            <div style="width: 4px; height: 100%; background: linear-gradient(to bottom, #0dcaf0, #36b9cc); position: absolute; left: 0; top: 0;"></div>
            <div class="card-body" style="padding: 1.25rem;">
                <div class="row align-items-center">
                    <div class="col-3">
                        <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #0dcaf0, #36b9cc); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(13,202,240,0.2); transition: transform 0.3s ease;"
                             onmouseover="this.style.transform='scale(1.1)';" 
                             onmouseout="this.style.transform='';">
                            <i class="fas fa-hourglass-half fa-lg text-white"></i>
                        </div>
                    </div>
                    <div class="col-9">
                        <div class="numbers">
                            <p class="text-sm mb-0 text-uppercase fw-bold" style="letter-spacing: 1px; color: #555; font-size: 0.75rem;">In Progress</p>
                            <div class="d-flex align-items-center">
                                <h3 class="fw-bold mb-0 me-2" style="font-size: 1.75rem;">
                                    {{ stats.quizzes_in_progress }}
                                </h3>
                                <span v-if="stats.quizzes_in_progress > 0" class="badge" style="background-color: rgba(13, 202, 240, 0.1); color: #0dcaf0; font-size: 0.7rem; padding: 5px 8px; border-radius: 4px;">
                                    ONGOING
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="height: 4px; background-color: rgba(0,0,0,0.05); margin-top: 15px; border-radius: 4px; overflow: hidden;">
                    <div style="width: 70%; height: 100%; background: linear-gradient(to right, #0dcaf0, #36b9cc);"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Average Score Card -->
    <div class="col-xl-3 col-md-6 mb-4">
        <div class="card border-0 h-100" style="border-radius: 12px; box-shadow: 0 6px 16px rgba(0,0,0,0.07); overflow: hidden; transition: all 0.3s ease;"
             onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 10px 20px rgba(0,0,0,0.12)';" 
             onmouseout="this.style.transform=''; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.07)';">
            <div style="width: 4px; height: 100%; background: linear-gradient(to bottom, #1cc88a, #0f9e67); position: absolute; left: 0; top: 0;"></div>
            <div class="card-body" style="padding: 1.25rem;">
                <div class="row align-items-center">
                    <div class="col-3">
                        <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #1cc88a, #0f9e67); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(28,200,138,0.2); transition: transform 0.3s ease;"
                             onmouseover="this.style.transform='scale(1.1)';" 
                             onmouseout="this.style.transform='';">
                            <i class="fas fa-chart-line fa-lg text-white"></i>
                        </div>
                    </div>
                    <div class="col-9">
                        <div class="numbers">
                            <p class="text-sm mb-0 text-uppercase fw-bold" style="letter-spacing: 1px; color: #555; font-size: 0.75rem;">Average Score</p>
                            <div class="d-flex align-items-baseline">
                                <h3 class="fw-bold mb-0" style="font-size: 1.75rem;">
                                    {{ stats.average_score }}
                                </h3>
                                <span style="font-size: 1rem; font-weight: 500; margin-left: 2px;">%</span>
                                <i class="fas fa-arrow-up ms-2" style="color: #1cc88a; font-size: 0.875rem;" v-if="stats.average_score > 50"></i>
                                <i class="fas fa-arrow-down ms-2" style="color: #e74a3b; font-size: 0.875rem;" v-else></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="height: 4px; background-color: rgba(0,0,0,0.05); margin-top: 15px; border-radius: 4px; overflow: hidden;">
                    <div :style="'width: ' + stats.average_score + '%; height: 100%; background: linear-gradient(to right, #1cc88a, #0f9e67);'"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Best Score Card -->
    <div class="col-xl-3 col-md-6 mb-4">
        <div class="card border-0 h-100" style="border-radius: 12px; box-shadow: 0 6px 16px rgba(0,0,0,0.07); overflow: hidden; transition: all 0.3s ease;"
             onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 10px 20px rgba(0,0,0,0.12)';" 
             onmouseout="this.style.transform=''; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.07)';">
            <div style="width: 4px; height: 100%; background: linear-gradient(to bottom, #f6c23e, #dda20a); position: absolute; left: 0; top: 0;"></div>
            <div class="card-body" style="padding: 1.25rem;">
                <div class="row align-items-center">
                    <div class="col-3">
                        <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #f6c23e, #dda20a); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(246,194,62,0.2); transition: transform 0.3s ease;"
                             onmouseover="this.style.transform='scale(1.1)';" 
                             onmouseout="this.style.transform='';">
                            <i class="fas fa-trophy fa-lg text-white"></i>
                        </div>
                    </div>
                    <div class="col-9">
                        <div class="numbers">
                            <p class="text-sm mb-0 text-uppercase fw-bold" style="letter-spacing: 1px; color: #555; font-size: 0.75rem;">Best Score</p>
                            <div class="d-flex align-items-baseline">
                                <h3 class="fw-bold mb-0" style="font-size: 1.75rem;">
                                    {{ stats.best_score }}
                                </h3>
                                <span style="font-size: 1rem; font-weight: 500; margin-left: 2px;">%</span>
                                <i class="fas fa-crown ms-2" style="color: #f6c23e; font-size: 0.875rem;" v-if="stats.best_score >= 90"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Star rating -->
                <div class="d-flex justify-content-between align-items-center mt-3" style="padding: 0 5px;">
                    <i class="fas fa-star" :style="stats.best_score >= 20 ? 'color: #f6c23e; opacity: 0.7;' : 'color: #dedede; opacity: 0.7;'"></i>
                    <i class="fas fa-star" :style="stats.best_score >= 40 ? 'color: #f6c23e; opacity: 0.8;' : 'color: #dedede; opacity: 0.7;'"></i>
                    <i class="fas fa-star" :style="stats.best_score >= 60 ? 'color: #f6c23e; opacity: 0.9;' : 'color: #dedede; opacity: 0.7;'"></i>
                    <i class="fas fa-star" :style="stats.best_score >= 80 ? 'color: #f6c23e; opacity: 0.95;' : 'color: #dedede; opacity: 0.7;'"></i>
                    <i class="fas fa-star" :style="stats.best_score >= 90 ? 'color: #f6c23e; opacity: 1;' : 'color: #dedede; opacity: 0.7;'"></i>
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
                                <i class="fas fa-hourglass-half fa-4x text-muted mb-3"></i>
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
                                <i class="fas fa-check-circle fa-4x text-success mb-3"></i>
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
                                <i class="fas fa-chart-bar fa-4x text-muted mb-3"></i>
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
                                <i class="fas fa-book fa-4x text-muted mb-3"></i>
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
    `,
};
