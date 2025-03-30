export default {
  data() {
    return {
      userName: localStorage.getItem("full_name") || "User",
      loading: false,
      dashboardData: null,
      error: null,
      showProfileModal: false,
      profileForm: {
        full_name: '',
        qualification: '',
        date_of_birth: ''
      },
      showViewProfileModal: false,
    userDetails: {
      email: '',
      full_name: '',
      qualification: '',
      date_of_birth: '',
      created_at: '',
      active: false,
      last_activity: ''
    },
      formErrors: {}, // To store validation errors from the backend
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
        console.log(response.data);
        
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
        this.$router.push('/login');
      },
      viewStatistics() {
        this.$router.push('/user/analytics');
      },
      viewProfile() {
        // console.log("hi");
        // Populate form with current user data
        this.profileForm = {
          full_name: this.dashboardData?.user?.name || '',
          qualification: this.dashboardData?.user?.qualification || '',
          date_of_birth: this.dashboardData?.user?.dob || ''
        };
        this.showProfileModal = true;
      },
      
      async updateProfile() {
        
        try {
          const response = await axios.put('/api/user/profile', this.profileForm, {
            headers: {
              'Authentication-Token': localStorage.getItem('token')
            }
          });
          
          // Update local data
          if (this.dashboardData?.user) {
            console.log("hi");
            this.dashboardData.user.name = this.profileForm.full_name;
            this.dashboardData.user.qualification = this.profileForm.qualification;
            this.dashboardData.user.dob = this.profileForm.date_of_birth;

            this.profileForm = {
                full_name: this.dashboardData?.user?.name || '',
                qualification: this.dashboardData?.user?.qualification || '',
                date_of_birth: this.dashboardData?.user?.dob || ''
              };

            console.log(this.profileForm);
          }
          
          this.userName = this.profileForm.full_name;
          localStorage.setItem('full_name', this.profileForm.full_name);
          
          this.showProfileModal = false;
          this.$toast.success('Profile updated successfully!', {
            position: 'top-right',
            timeout: 2000
          });
          
        } catch (error) {
            // More robust error handling
            const errorMessage = error.response?.data?.message || 
                               error.response?.data?.error || 
                               'Failed to update profile';
            
            this.formErrors = error.response?.data?.errors || {};
            
            this.$toast.error(errorMessage, {
                position: 'top-right',
                timeout: 2000
            });
        }
    },
      
      closeProfileModal() {
        this.showProfileModal = false;
        this.formErrors = {};
      },

      async viewUserProfile() {
        try {
          const response = await axios.get('/api/user/profile', {
            headers: {
              'Authentication-Token': localStorage.getItem('token')
            }
          });
          
          this.userDetails = {
            email: response.data.user.email,
            full_name: response.data.user.full_name,
            qualification: response.data.user.qualification || 'Not specified',
            date_of_birth: response.data.user.date_of_birth || 'Not specified',
            created_at: new Date(response.data.user.created_at).toLocaleString(),
            active: response.data.user.active ? 'Active' : 'Inactive',
            last_activity: response.data.last_activity || 'Recently'
          };
          
          this.showViewProfileModal = true;
        } catch (error) {
          this.$toast.error('Failed to load profile details', {
            position: 'top-right',
            timeout: 2000
          });
        }
      },
      
      closeViewProfileModal() {
        this.showViewProfileModal = false;
      },
    
      viewSettings() {
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
                                Edit Profile
                            </a>
                            <a class="dropdown-item" href="#" @click.prevent="viewUserProfile">
          <i class="fas fa-user-circle fa-sm fa-fw me-2 text-gray-400"></i>
          View Profile
      </a>
                            <a class="dropdown-item" href="#" @click.prevent="viewStatistics">
                                <i class="fas fa-user fa-sm fa-fw me-2 text-gray-400"></i>
                                Statistics
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
              <div class="card mb-4" style="border: none; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); overflow: hidden; transition: all 0.3s ease;">
                <div style="background: linear-gradient(135deg, #000DFF 0%, #6B73FF 100%); padding: 1.5rem; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                    <div style="position: absolute; bottom: -30px; left: 20px; width: 80px; height: 80px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
                    
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 16px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                                <i class="fas fa-layer-group fa-lg" style="color: white;"></i>
                            </div>
                            <h5 style="color: white; font-weight: 600; margin: 0;">Continue Your Learning Journey</h5>
                        </div>
                        <span style="background-color: rgba(255,255,255,0.2); color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">
                            <i class="fas fa-bolt me-1"></i> IN PROGRESS
                        </span>
                    </div>
                </div>
                
                <div class="card-body" style="padding: 0;">
                    <div v-if="inProgressQuizzes.length === 0" style="text-align: center; padding: 3rem 2rem; background: linear-gradient(to bottom, rgba(107, 115, 255, 0.05), rgba(255, 255, 255, 0));">
                        <div style="width: 120px; height: 120px; background: rgba(0, 13, 255, 0.03); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; box-shadow: 0 10px 30px rgba(0, 13, 255, 0.1);">
                            <i class="fas fa-hourglass-half fa-3x" style="color: #000DFF; opacity: 0.4;"></i>
                        </div>
                        <h5 style="font-weight: 600; color: #333; margin-bottom: 0.75rem;">No quizzes in progress</h5>
                        <p style="color: #6c757d; max-width: 300px; margin: 0 auto;">Start a new quiz from the recommended section below to track your progress.</p>
                        <button class="btn btn-primary mt-4" style="background: linear-gradient(135deg, #000DFF 0%, #6B73FF 100%); border: none; padding: 0.5rem 1.5rem; border-radius: 50px; box-shadow: 0 4px 15px rgba(0, 13, 255, 0.3); transition: all 0.3s ease;">
                            <i class="fas fa-play-circle me-2"></i> Explore Quizzes
                        </button>
                    </div>
                    
                    <div v-else style="padding: 0 1rem;">
                        <div class="row g-0" style="margin-top: -20px;">
                            <div v-for="quiz in inProgressQuizzes" :key="quiz.id" class="col-12 animate__animated animate__fadeIn">
                                <div style="background: white; border-radius: 12px; margin: 0.75rem 0; box-shadow: 0 5px 15px rgba(0,0,0,0.05); overflow: hidden; transition: all 0.3s ease; position: relative; border-left: 4px solid #000DFF;" 
                                     onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 12px 25px rgba(0,0,0,0.1)';" 
                                     onmouseout="this.style.transform=''; this.style.boxShadow='0 5px 15px rgba(0,0,0,0.05)';">
                                    
                                    <div class="row g-0 align-items-center">
                                        <div class="col-md-8 p-3">
                                            <div class="d-flex align-items-center">
                                                <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #000DFF, #6B73FF); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 16px; box-shadow: 0 5px 15px rgba(0, 13, 255, 0.2);">
                                                    <span style="color: white; font-weight: 600; font-size: 1.1rem;">{{ quiz.title.charAt(0) }}</span>
                                                </div>
                                                <div>
                                                    <h6 style="font-weight: 600; margin: 0; color: #333; font-size: 1.1rem;">{{ quiz.title }}</h6>
                                                    <div class="d-flex align-items-center mt-1">
                                                        <span style="color: #6c757d; font-size: 0.85rem; margin-right: 12px;">
                                                            <i class="fas fa-book me-1" style="color: #000DFF;"></i> {{ quiz.subject }}
                                                        </span>
                                                        <span style="color: #6c757d; font-size: 0.85rem;">
                                                            <i class="far fa-calendar-alt me-1" style="color: #000DFF;"></i> {{ formatDate(quiz.started_at) }}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-4 p-3 text-end">
                                            <div style="height: 6px; background-color: #f0f0f0; border-radius: 3px; margin-bottom: 12px; position: relative; overflow: hidden;">
                                            <div style="position: absolute; top: 0; left: 0; height: 100%; width: 35%; background: linear-gradient(to right, #000DFF, #6B73FF);"></div>
                                            </div>
                                            <button @click="continueQuiz(quiz.attempt_id)" 
                                                    style="background: linear-gradient(135deg, #000DFF 0%, #6B73FF 100%); color: white; border: none; padding: 8px 20px; border-radius: 50px; font-weight: 600; font-size: 0.9rem; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0, 13, 255, 0.2);"
                                                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0, 13, 255, 0.3)';" 
                                                    onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 15px rgba(0, 13, 255, 0.2)';">
                                                <i class="fas fa-play-circle me-1"></i> Continue
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              </div>

              
              <!-- Recommended Quizzes -->
              <div class="card mb-4" style="border: none; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); overflow: hidden;">
                  <div style="background: linear-gradient(135deg, #1cc88a 0%, #0f9e67 100%); padding: 1.5rem; position: relative; overflow: hidden;">
                      <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                      <div style="position: absolute; bottom: -30px; left: 20px; width: 80px; height: 80px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
                      
                      <div class="d-flex justify-content-between align-items-center">
                          <div class="d-flex align-items-center">
                              <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 16px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                                  <i class="fas fa-lightbulb fa-lg" style="color: white;"></i>
                              </div>
                              <h5 style="color: white; font-weight: 600; margin: 0;">Recommended For You</h5>
                          </div>
                          <span style="background-color: rgba(255,255,255,0.2); color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">
                              <i class="fas fa-star me-1"></i> PERSONALIZED
                          </span>
                      </div>
                  </div>
                  
                  <div style="background: linear-gradient(to bottom, rgba(28, 200, 138, 0.05), rgba(255, 255, 255, 0)); padding: 1.5rem;">
                      <div v-if="recommendedQuizzes.length === 0" style="text-align: center; padding: 3rem 2rem;">
                          <div style="width: 120px; height: 120px; background: rgba(28, 200, 138, 0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
                              <i class="fas fa-check-circle fa-3x" style="color: #1cc88a; opacity: 0.5;"></i>
                          </div>
                          <h5 style="font-weight: 600; color: #333; margin-bottom: 0.75rem;">You've completed all available quizzes!</h5>
                          <p style="color: #6c757d; max-width: 350px; margin: 0 auto;">Check back soon as we're constantly adding new content for you.</p>
                      </div>
                      
                      <div v-else class="row">
                          <div v-for="quiz in recommendedQuizzes" :key="quiz.id" class="col-md-6 mb-4 animate__animated animate__fadeIn">
                              <div style="background: white; border-radius: 16px; box-shadow: 0 8px 25px rgba(0,0,0,0.05); overflow: hidden; height: 100%; transition: all 0.3s ease; position: relative;"
                                   onmouseover="this.style.transform='translateY(-8px)'; this.style.boxShadow='0 20px 40px rgba(0,0,0,0.1)';" 
                                   onmouseout="this.style.transform=''; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.05)';">
                                  <div style="padding: 20px; position: relative;">
                                      <div style="position: absolute; top: 15px; right: 15px; background-color: rgba(28, 200, 138, 0.1); color: #1cc88a; padding: 5px 12px; border-radius: 30px; font-size: 0.75rem; font-weight: 600;">
                                          <i class="fas fa-question-circle me-1"></i> {{ quiz.question_count }} Questions
                                      </div>
                                      
                                      <h5 style="font-weight: 700; margin-top: 25px; margin-bottom: 15px; color: #333; font-size: 1.2rem;">{{ quiz.title }}</h5>
                                      
                                      <div style="display: flex; align-items: center; margin-bottom: 12px;">
                                          <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #36b9cc, #1a8a98); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">
                                              <i class="fas fa-book-open" style="color: white; font-size: 0.9rem;"></i>
                                          </div>
                                          <div>
                                              <span style="color: #495057; font-size: 0.9rem; display: block; font-weight: 500;">{{ quiz.subject }} - {{ quiz.chapter }}</span>
                                          </div>
                                      </div>
                                      
                                      <div style="display: flex; align-items: center; margin-bottom: 20px;">
                                          <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #f6c23e, #dda20a); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">
                                              <i class="fas fa-clock" style="color: white; font-size: 0.9rem;"></i>
                                          </div>
                                          <div>
                                              <span style="color: #495057; font-size: 0.9rem; display: block; font-weight: 500;">{{ quiz.time_limit }} minutes</span>
                                          </div>
                                      </div>
                                      
                                      <button @click="startQuiz(quiz.id)" 
                                              style="background: linear-gradient(135deg, #1cc88a 0%, #0f9e67 100%); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; width: 100%; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(28, 200, 138, 0.2);"
                                              onmouseover="this.style.boxShadow='0 8px 25px rgba(28, 200, 138, 0.3)';" 
                                              onmouseout="this.style.boxShadow='0 4px 15px rgba(28, 200, 138, 0.2)';">
                                          <i class="fas fa-play-circle me-2"></i> Start Quiz
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
              <div class="card mb-4" style="border: none; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); overflow: hidden;">
                  <div style="background: linear-gradient(135deg, #4e73df 0%, #224abe 100%); padding: 1.5rem; position: relative; overflow: hidden;">
                      <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                      <div style="position: absolute; bottom: -30px; left: 20px; width: 80px; height: 80px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
                      
                      <div class="d-flex justify-content-between align-items-center">
                          <div class="d-flex align-items-center">
                              <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 16px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                                  <i class="fas fa-chart-bar fa-lg" style="color: white;"></i>
                              </div>
                              <h5 style="color: white; font-weight: 600; margin: 0;">Recent Results</h5>
                          </div>
                          <span style="background-color: rgba(255,255,255,0.2); color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">
                              <i class="fas fa-history me-1"></i> HISTORY
                          </span>
                      </div>
                  </div>
                  
                  <div class="card-body" style="padding: 0;">
                      <div v-if="recentAttempts.length === 0" style="text-align: center; padding: 3rem 2rem; background: linear-gradient(to bottom, rgba(78, 115, 223, 0.05), rgba(255, 255, 255, 0));">
                          <div style="width: 120px; height: 120px; background: rgba(78, 115, 223, 0.03); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; box-shadow: 0 10px 30px rgba(78, 115, 223, 0.1);">
                              <i class="fas fa-chart-bar fa-3x" style="color: #4e73df; opacity: 0.4;"></i>
                          </div>
                          <h5 style="font-weight: 600; color: #333; margin-bottom: 0.75rem;">No quiz results yet</h5>
                          <p style="color: #6c757d; max-width: 300px; margin: 0 auto;">Complete a quiz to see your results here.</p>
                      </div>
                      
                      <div v-else>
                          <div v-for="attempt in recentAttempts" :key="attempt.id" class="animate__animated animate__fadeIn" style="padding: 1rem 1.25rem; border-bottom: 1px solid rgba(0,0,0,0.05); transition: all 0.3s ease;"
                               onmouseover="this.style.backgroundColor='rgba(78, 115, 223, 0.02)'" 
                               onmouseout="this.style.backgroundColor='transparent'">
                              <div class="d-flex justify-content-between align-items-center">
                                  <div>
                                      <h6 style="font-weight: 600; margin: 0; color: #333; font-size: 1rem;">{{ attempt.quiz_title }}</h6>
                                      <div class="d-flex align-items-center mt-1">
                                          <span style="color: #6c757d; font-size: 0.8rem; margin-right: 12px;">
                                              <i class="fas fa-book me-1" style="color: #4e73df;"></i> {{ attempt.subject_name }}
                                          </span>
                                          <span style="color: #6c757d; font-size: 0.8rem;">
                                              <i class="far fa-calendar-alt me-1" style="color: #4e73df;"></i> {{ formatDate(attempt.completed_at) }}
                                          </span>
                                      </div>
                                  </div>
                                  <div class="text-end">
                                      <h5 :class="getScoreClass(attempt.score)" style="font-weight: 700; margin-bottom: 5px;">{{ attempt.score }}%</h5>
                                      <button @click="viewResult(attempt.id)" 
                                              style="background: transparent; color: #4e73df; border: 1px solid #4e73df; padding: 4px 12px; border-radius: 50px; font-weight: 600; font-size: 0.75rem; transition: all 0.3s ease;"
                                              onmouseover="this.style.background='#4e73df'; this.style.color='white';" 
                                              onmouseout="this.style.background='transparent'; this.style.color='#4e73df';">
                                          <i class="fas fa-eye me-1"></i> View
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
    
              <!-- Browse Subjects -->
              <div class="card mb-4" style="border: none; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); overflow: hidden;">
                  <div style="background: linear-gradient(135deg, #f6c23e 0%, #dda20a 100%); padding: 1.5rem; position: relative; overflow: hidden;">
                      <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                      <div style="position: absolute; bottom: -30px; left: 20px; width: 80px; height: 80px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
                      
                      <div class="d-flex justify-content-between align-items-center">
                          <div class="d-flex align-items-center">
                              <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 16px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                                  <i class="fas fa-book fa-lg" style="color: white;"></i>
                              </div>
                              <h5 style="color: white; font-weight: 600; margin: 0;">Browse by Subject</h5>
                          </div>
                          <span style="background-color: rgba(255,255,255,0.2); color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">
                              <i class="fas fa-th-list me-1"></i> CATALOG
                          </span>
                      </div>
                  </div>
                  
                  <div class="card-body" style="padding: 0;">
                      <div v-if="subjects.length === 0" style="text-align: center; padding: 3rem 2rem; background: linear-gradient(to bottom, rgba(246, 194, 62, 0.05), rgba(255, 255, 255, 0));">
                          <div style="width: 120px; height: 120px; background: rgba(246, 194, 62, 0.03); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; box-shadow: 0 10px 30px rgba(246, 194, 62, 0.1);">
                              <i class="fas fa-book fa-3x" style="color: #f6c23e; opacity: 0.4;"></i>
                          </div>
                          <h5 style="font-weight: 600; color: #333; margin-bottom: 0.75rem;">No subjects available</h5>
                          <p style="color: #6c757d; max-width: 300px; margin: 0 auto;">Check back later for new content.</p>
                      </div>
                      
                      <div v-else>
                          <div v-for="subject in subjects" :key="subject.id" class="animate__animated animate__fadeIn" style="padding: 1rem 1.25rem; border-bottom: 1px solid rgba(0,0,0,0.05); transition: all 0.3s ease;"
                               onmouseover="this.style.backgroundColor='rgba(246, 194, 62, 0.02)'" 
                               onmouseout="this.style.backgroundColor='transparent'">
                              <div class="d-flex justify-content-between align-items-center">
                                  <div class="d-flex align-items-center">
                                      <div style="width: 42px; height: 42px; background: linear-gradient(135deg, #f6c23e, #dda20a); border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 12px; box-shadow: 0 4px 10px rgba(246, 194, 62, 0.2);">
                                          <span style="color: white; font-weight: 600; font-size: 1rem;">{{ subject.name.charAt(0) }}</span>
                                      </div>
                                      <div>
                                          <h6 style="font-weight: 600; margin: 0; color: #333; font-size: 1rem;">{{ subject.name }}</h6>
                                          <span style="color: #6c757d; font-size: 0.8rem;">
                                              <i class="fas fa-bookmark me-1" style="color: #f6c23e;"></i> {{ subject.chapters.length }} chapters
                                          </span>
                                      </div>
                                  </div>
                                  <button @click="browseSubject(subject.id)" 
                                          style="background: transparent; color: #f6c23e; border: 1px solid #f6c23e; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;"
                                          onmouseover="this.style.background='#f6c23e'; this.style.color='white';" 
                                          onmouseout="this.style.background='transparent'; this.style.color='#f6c23e';">
                                      <i class="fas fa-arrow-right"></i>
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>



             <!-- View Profile Modal -->
  <div v-if="showViewProfileModal" class="modal-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 1050; display: flex; justify-content: center; align-items: center;">
  <div class="modal-content" style="width: 500px; max-width: 95%; background: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); overflow: hidden;">
      <div class="modal-header" style="background: linear-gradient(135deg, #000DFF 0%, #6B73FF 100%); padding: 20px; color: white; position: relative;">
          <div style="position: absolute; top: 0; right: 0; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%; transform: translate(30%, -30%);"></div>
          <h5 style="margin: 0; font-weight: 600; position: relative;">User Profile</h5>
          <button @click="closeViewProfileModal" style="background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; position: relative;">&times;</button>
      </div>
      
      <div class="modal-body" style="padding: 25px;">
          <div class="user-avatar" style="width: 80px; height: 80px; background: linear-gradient(135deg, #000DFF 0%, #6B73FF 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: white; font-size: 2rem; font-weight: bold;">
              {{ userDetails.full_name.charAt(0).toUpperCase() }}
          </div>
          
          <div class="profile-details" style="background: #f9f9f9; border-radius: 12px; padding: 20px;">
              <div class="detail-item" style="margin-bottom: 15px; display: flex;">
                  <div style="width: 120px; font-weight: 500; color: #555;">Full Name:</div>
                  <div>{{ userDetails.full_name }}</div>
              </div>
              <div class="detail-item" style="margin-bottom: 15px; display: flex;">
                  <div style="width: 120px; font-weight: 500; color: #555;">Email:</div>
                  <div>{{ userDetails.email }}</div>
              </div>
              <div class="detail-item" style="margin-bottom: 15px; display: flex;">
                  <div style="width: 120px; font-weight: 500; color: #555;">Qualification:</div>
                  <div>{{ userDetails.qualification }}</div>
              </div>
              <div class="detail-item" style="margin-bottom: 15px; display: flex;">
                  <div style="width: 120px; font-weight: 500; color: #555;">Date of Birth:</div>
                  <div>{{ userDetails.date_of_birth }}</div>
              </div>
              <div class="detail-item" style="margin-bottom: 15px; display: flex;">
                  <div style="width: 120px; font-weight: 500; color: #555;">Member Since:</div>
                  <div>{{ userDetails.created_at }}</div>
              </div>
              <div class="detail-item" style="margin-bottom: 15px; display: flex;">
                  <div style="width: 120px; font-weight: 500; color: #555;">Status:</div>
                  <div>
                      <span :style="{color: userDetails.active === 'Active' ? '#1cc88a' : '#e74a3b', fontWeight: 500}">
                          {{ userDetails.active }}
                      </span>
                  </div>
              </div>
          </div>
      </div>
      
      <div class="modal-footer" style="padding: 15px 25px; border-top: 1px solid #eee; display: flex; justify-content: flex-end;">
          <button @click="closeViewProfileModal" style="padding: 8px 20px; background: #f5f5f5; border: none; border-radius: 8px; font-weight: 500; cursor: pointer; transition: all 0.3s;">
              Close
          </button>
      </div>
  </div>
</div>



              <!-- Profile Modal -->
      <div v-if="showProfileModal" class="modal-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 1050; display: flex; justify-content: center; align-items: center;">
      <div class="modal-content" style="width: 500px; max-width: 95%; background: white; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); overflow: hidden;">
        <div class="modal-header" style="background: linear-gradient(135deg, #000DFF 0%, #6B73FF 100%); padding: 20px; color: white;">
          <h5 style="margin: 0; font-weight: 600;">Complete Your Profile</h5>
          <button @click="closeProfileModal" style="background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer;">&times;</button>
        </div>
        
        <div class="modal-body" style="padding: 25px;">
          <form @submit.prevent="updateProfile">
            <div class="form-group" style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #555;">Full Name</label>
              <input v-model="profileForm.full_name" type="text" 
                     style="width: 100%; padding: 10px 15px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; transition: border-color 0.3s;"
                     :style="{'border-color': formErrors.full_name ? '#ff4444' : '#ddd'}">
              <small v-if="formErrors.full_name" style="color: #ff4444; font-size: 0.85rem;">{{ formErrors.full_name }}</small>
            </div>
            
            <div class="form-group" style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #555;">Qualification</label>
              <input v-model="profileForm.qualification" type="text" 
                     style="width: 100%; padding: 10px 15px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; transition: border-color 0.3s;"
                     :style="{'border-color': formErrors.qualification ? '#ff4444' : '#ddd'}">
              <small v-if="formErrors.qualification" style="color: #ff4444; font-size: 0.85rem;">{{ formErrors.qualification }}</small>
            </div>
            
            <div class="form-group" style="margin-bottom: 25px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #555;">Date of Birth</label>
              <input v-model="profileForm.date_of_birth" type="date" 
                     style="width: 100%; padding: 10px 15px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; transition: border-color 0.3s;"
                     :style="{'border-color': formErrors.date_of_birth ? '#ff4444' : '#ddd'}">
              <small v-if="formErrors.date_of_birth" style="color: #ff4444; font-size: 0.85rem;">{{ formErrors.date_of_birth }}</small>
            </div>
            
            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; padding-top: 20px; border-top: 1px solid #eee;">
              <button @click="closeProfileModal" type="button" 
                      style="padding: 10px 20px; background: #f5f5f5; border: none; border-radius: 8px; font-weight: 500; cursor: pointer; transition: background 0.3s;">
                Cancel
              </button>
              <button type="submit" 
                      style="padding: 10px 20px; background: linear-gradient(135deg, #000DFF 0%, #6B73FF 100%); color: white; border: none; border-radius: 8px; font-weight: 500; cursor: pointer; transition: opacity 0.3s;">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
          </div>
      </div>
    </div>
    </div>`
}