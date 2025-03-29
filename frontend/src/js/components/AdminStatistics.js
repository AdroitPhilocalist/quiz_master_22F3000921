export default {
    data() {
        return {
            loading: true,
            error: null,
            stats: {
                users: {
                    total: 0,
                    newThisMonth: 0,
                    activeUsers: 0,
                    roleDistribution: []
                },
                quizzes: {
                    total: 0,
                    published: 0,
                    unpublished: 0,
                    averageTimeLimit: 0,
                    averageQuestions: 0,
                    mostPopular: []
                },
                attempts: {
                    total: 0,
                    completed: 0,
                    averageScore: 0,
                    scoreDistribution: [],
                    monthlyAttempts: []
                },
                subjects: {
                    total: 0,
                    distribution: []
                },
                chapters: {
                    total: 0,
                    distribution: []
                }
            },
            charts: {
                userGrowth: null,
                quizDistribution: null,
                scoreDistribution: null,
                attemptsByMonth: null,
                subjectPopularity: null
            }
        }
    },
    mounted() {
        this.fetchStatistics();
        // Load Chart.js from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => {
            this.initializeCharts();
        };
        document.head.appendChild(script);
    },
    methods: {
        async fetchStatistics() {
            this.loading = true;
            try {
                const response = await axios.get('/api/admin/statistics', {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                
                // Process and store the statistics
                const data = response.data;
                this.stats = data;
                
                // Initialize charts once data is loaded
                if (window.Chart) {
                    this.initializeCharts();
                }
            } catch (error) {
                this.error = 'Failed to load statistics';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        
        initializeCharts() {
            if (!window.Chart || this.loading) return;
            
            // User Growth Chart (Line chart)
            this.createUserGrowthChart();
            
            // Quiz Distribution Chart (Pie chart)
            this.createQuizDistributionChart();
            
            // Score Distribution Chart (Bar chart)
            this.createScoreDistributionChart();
            
            // Monthly Attempts Chart (Line chart)
            this.createMonthlyAttemptsChart();
            
            // Subject Popularity Chart (Horizontal Bar chart)
            this.createSubjectPopularityChart();
        },
        
        createUserGrowthChart() {
            const ctx = document.getElementById('userGrowthChart').getContext('2d');
            if (this.charts.userGrowth) this.charts.userGrowth.destroy();
            
            const months = this.stats.users.growthData?.map(item => item.month) || 
                ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const userData = this.stats.users.growthData?.map(item => item.count) || 
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            
            this.charts.userGrowth = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: 'New Users',
                        data: userData,
                        borderColor: '#5a67e3',
                        backgroundColor: 'rgba(90, 103, 227, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#5a67e3',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'User Growth Over Time'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                drawBorder: false
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        },
        
        createQuizDistributionChart() {
            const ctx = document.getElementById('quizDistributionChart').getContext('2d');
            if (this.charts.quizDistribution) this.charts.quizDistribution.destroy();
            
            this.charts.quizDistribution = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Published', 'Unpublished'],
                    datasets: [{
                        data: [this.stats.quizzes.published, this.stats.quizzes.unpublished],
                        backgroundColor: [
                            'rgba(40, 199, 111, 0.7)',
                            'rgba(234, 84, 85, 0.7)'
                        ],
                        borderColor: [
                            'rgba(40, 199, 111, 1)',
                            'rgba(234, 84, 85, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Quiz Publication Status'
                        }
                    }
                }
            });
        },
        
        createScoreDistributionChart() {
            const ctx = document.getElementById('scoreDistributionChart').getContext('2d');
            if (this.charts.scoreDistribution) this.charts.scoreDistribution.destroy();
            
            const scoreRanges = this.stats.attempts.scoreDistribution?.map(item => item.range) || 
                ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'];
            const scoreCounts = this.stats.attempts.scoreDistribution?.map(item => item.count) || 
                [0, 0, 0, 0, 0];
            
            this.charts.scoreDistribution = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: scoreRanges,
                    datasets: [{
                        label: 'Number of Attempts',
                        data: scoreCounts,
                        backgroundColor: [
                            'rgba(234, 84, 85, 0.7)',
                            'rgba(255, 159, 67, 0.7)',
                            'rgba(255, 206, 86, 0.7)',
                            'rgba(54, 162, 235, 0.7)',
                            'rgba(40, 199, 111, 0.7)'
                        ],
                        borderColor: [
                            'rgba(234, 84, 85, 1)',
                            'rgba(255, 159, 67, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(40, 199, 111, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'Score Distribution'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                drawBorder: false
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        },
        
        createMonthlyAttemptsChart() {
            const ctx = document.getElementById('monthlyAttemptsChart').getContext('2d');
            if (this.charts.attemptsByMonth) this.charts.attemptsByMonth.destroy();
            
            const months = this.stats.attempts.monthlyAttempts?.map(item => item.month) || 
                ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const attemptData = this.stats.attempts.monthlyAttempts?.map(item => item.count) || 
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            
            this.charts.attemptsByMonth = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: 'Quiz Attempts',
                        data: attemptData,
                        borderColor: '#ff9f43',
                        backgroundColor: 'rgba(255, 159, 67, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#ff9f43',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Monthly Quiz Attempts'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                drawBorder: false
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        },
        
        createSubjectPopularityChart() {
            const ctx = document.getElementById('subjectPopularityChart').getContext('2d');
            if (this.charts.subjectPopularity) this.charts.subjectPopularity.destroy();
            
            const subjects = this.stats.subjects.distribution?.map(item => item.name) || [];
            const quizCounts = this.stats.subjects.distribution?.map(item => item.quizCount) || [];
            
            this.charts.subjectPopularity = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: subjects,
                    datasets: [{
                        axis: 'y',
                        label: 'Number of Quizzes',
                        data: quizCounts,
                        backgroundColor: 'rgba(90, 103, 227, 0.7)',
                        borderColor: 'rgba(90, 103, 227, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'Quizzes by Subject'
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            grid: {
                                drawBorder: false
                            }
                        },
                        y: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }
    },
    template: `
    <div style="min-height: 100vh; background: linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%); padding: 30px 20px;">
        <div class="container-fluid" style="max-width: 1400px; margin: 0 auto;">
            <!-- Header -->
            <div class="row mb-4">
                <div class="col-12">
                    <div style="background: linear-gradient(135deg, #5a67e3 0%, #6e77f0 100%); border-radius: 20px; box-shadow: 0 15px 35px rgba(50, 50, 93, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07); overflow: hidden; position: relative;">
                        <!-- Decorative elements -->
                        <div style="position: absolute; top: -20px; right: -20px; width: 150px; height: 150px; border-radius: 50%; background: rgba(255, 255, 255, 0.1);"></div>
                        <div style="position: absolute; bottom: -40px; left: 20%; width: 100px; height: 100px; border-radius: 50%; background: rgba(255, 255, 255, 0.05);"></div>
                        
                        <div style="padding: 30px; position: relative; z-index: 1;">
                            <h2 style="color: white; font-weight: 700; margin-bottom: 10px; font-size: 28px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <i class="fas fa-chart-line me-3"></i>Admin Statistics Dashboard
                            </h2>
                            <p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 0; font-size: 16px;">
                                Comprehensive analytics and insights for the entire platform
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Loading State -->
            <div v-if="loading" style="height: 400px; display: flex; justify-content: center; align-items: center;">
                <div style="text-align: center;">
                    <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-3" style="color: #5a67e3; font-weight: 500;">Loading statistics...</p>
                </div>
            </div>
            
            <!-- Error State -->
            <div v-else-if="error" style="height: 400px; display: flex; justify-content: center; align-items: center;">
                <div style="text-align: center;">
                    <div style="width: 80px; height: 80px; background: rgba(234, 84, 85, 0.1); border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 20px;">
                        <i class="fas fa-exclamation-triangle" style="color: #ea5455; font-size: 32px;"></i>
                    </div>
                    <h3 style="color: #333; margin-bottom: 10px;">Error Loading Statistics</h3>
                    <p style="color: #666;">{{ error }}</p>
                </div>
            </div>
            
            <!-- Statistics Content -->
            <div v-else>
                <!-- Summary Cards -->
                <div class="row mb-4">
                    <!-- Users Card -->
                    <div class="col-md-6 col-lg-3 mb-4">
                        <div style="background: white; border-radius: 15px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); padding: 20px; height: 100%;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                                <div>
                                    <h5 style="color: #333; font-weight: 600; margin-bottom: 5px;">Total Users</h5>
                                    <p style="color: #666; font-size: 14px; margin-bottom: 0;">Platform users</p>
                                </div>
                                <div style="width: 50px; height: 50px; background: rgba(90, 103, 227, 0.1); border-radius: 12px; display: flex; justify-content: center; align-items: center;">
                                    <i class="fas fa-users" style="color: #5a67e3; font-size: 20px;"></i>
                                </div>
                            </div>
                            <h3 style="color: #333; font-weight: 700; margin-bottom: 5px;">{{ stats.users.total }}</h3>
                            <p style="color: #28c76f; font-size: 14px; margin-bottom: 0;">
                                <i class="fas fa-arrow-up me-1"></i> {{ stats.users.newThisMonth }} new this month
                            </p>
                        </div>
                    </div>
                    
                    <!-- Quizzes Card -->
                    <div class="col-md-6 col-lg-3 mb-4">
                        <div style="background: white; border-radius: 15px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); padding: 20px; height: 100%;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                                <div>
                                    <h5 style="color: #333; font-weight: 600; margin-bottom: 5px;">Total Quizzes</h5>
                                    <p style="color: #666; font-size: 14px; margin-bottom: 0;">Available quizzes</p>
                                </div>
                                <div style="width: 50px; height: 50px; background: rgba(40, 199, 111, 0.1); border-radius: 12px; display: flex; justify-content: center; align-items: center;">
                                    <i class="fas fa-question-circle" style="color: #28c76f; font-size: 20px;"></i>
                                </div>
                            </div>
                            <h3 style="color: #333; font-weight: 700; margin-bottom: 5px;">{{ stats.quizzes.total }}</h3>
                            <p style="color: #28c76f; font-size: 14px; margin-bottom: 0;">
                                <i class="fas fa-check-circle me-1"></i> {{ stats.quizzes.published }} published
                            </p>
                        </div>
                    </div>
                    
                    <!-- Attempts Card -->
                    <div class="col-md-6 col-lg-3 mb-4">
                        <div style="background: white; border-radius: 15px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); padding: 20px; height: 100%;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                                <div>
                                    <h5 style="color: #333; font-weight: 600; margin-bottom: 5px;">Quiz Attempts</h5>
                                    <p style="color: #666; font-size: 14px; margin-bottom: 0;">Total attempts</p>
                                </div>
                                <div style="width: 50px; height: 50px; background: rgba(255, 159, 67, 0.1); border-radius: 12px; display: flex; justify-content: center; align-items: center;">
                                    <i class="fas fa-clipboard-check" style="color: #ff9f43; font-size: 20px;"></i>
                                </div>
                            </div>
                            <h3 style="color: #333; font-weight: 700; margin-bottom: 5px;">{{ stats.attempts.total }}</h3>
                            <p style="color: #28c76f; font-size: 14px; margin-bottom: 0;">
                                <i class="fas fa-chart-line me-1"></i> {{ stats.attempts.averageScore }}% avg. score
                            </p>
                        </div>
                    </div>
                    
                    <!-- Subjects Card -->
                    <div class="col-md-6 col-lg-3 mb-4">
                        <div style="background: white; border-radius: 15px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); padding: 20px; height: 100%;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                                <div>
                                    <h5 style="color: #333; font-weight: 600; margin-bottom: 5px;">Subjects</h5>
                                    <p style="color: #666; font-size: 14px; margin-bottom: 0;">Available subjects</p>
                                </div>
                                <div style="width: 50px; height: 50px; background: rgba(234, 84, 85, 0.1); border-radius: 12px; display: flex; justify-content: center; align-items: center;">
                                    <i class="fas fa-book" style="color: #ea5455; font-size: 20px;"></i>
                                </div>
                            </div>
                            <h3 style="color: #333; font-weight: 700; margin-bottom: 5px;">{{ stats.subjects.total }}</h3>
                            <p style="color: #28c76f; font-size: 14px; margin-bottom: 0;">
                                <i class="fas fa-folder me-1"></i> {{ stats.chapters.total }} chapters
                            </p>
                        </div>
                    </div>
                </div>
                
                <!-- Charts Row 1 -->
                <div class="row mb-4">
                    <!-- User Growth Chart -->
                    <div class="col-lg-8 mb-4">
                        <div style="background: white; border-radius: 15px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); padding: 20px; height: 100%;">
                            <h5 style="color: #333; font-weight: 600; margin-bottom: 20px;">User Growth</h5>
                            <div style="height: 300px;">
                                <canvas id="userGrowthChart"></canvas>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Quiz Distribution Chart -->
                    <div class="col-lg-4 mb-4">
                        <div style="background: white; border-radius: 15px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); padding: 20px; height: 100%;">
                            <h5 style="color: #333; font-weight: 600; margin-bottom: 20px;">Quiz Status</h5>
                            <div style="height: 300px;">
                                <canvas id="quizDistributionChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Charts Row 2 -->
                <div class="row mb-4">
                    <!-- Score Distribution Chart -->
                    <div class="col-lg-6 mb-4">
                        <div style="background: white; border-radius: 15px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); padding: 20px; height: 100%;">
                            <h5 style="color: #333; font-weight: 600; margin-bottom: 20px;">Score Distribution</h5>
                            <div style="height: 300px;">
                                <canvas id="scoreDistributionChart"></canvas>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Monthly Attempts Chart -->
                    <div class="col-lg-6 mb-4">
                        <div style="background: white; border-radius: 15px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); padding: 20px; height: 100%;">
                            <h5 style="color: #333; font-weight: 600; margin-bottom: 20px;">Monthly Quiz Attempts</h5>
                            <div style="height: 300px;">
                                <canvas id="monthlyAttemptsChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Subject Popularity Chart -->
                <div class="row">
                    <div class="col-12 mb-4">
                        <div style="background: white; border-radius: 15px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); padding: 20px;">
                            <h5 style="color: #333; font-weight: 600; margin-bottom: 20px;">Subject Popularity</h5>
                            <div style="height: 300px;">
                                <canvas id="subjectPopularityChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Most Popular Quizzes -->
                <div class="row">
                    <div class="col-12 mb-4">
                        <div style="background: white; border-radius: 15px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); padding: 20px;">
                            <h5 style="color: #333; font-weight: 600; margin-bottom: 20px;">Most Popular Quizzes</h5>
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th scope="col">#</th>
                                            <th scope="col">Quiz Title</th>
                                            <th scope="col">Subject</th>
                                            <th scope="col">Attempts</th>
                                            <th scope="col">Avg. Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(quiz, index) in stats.quizzes.mostPopular" :key="quiz.id">
                                            <th scope="row">{{ index + 1 }}</th>
                                            <td>{{ quiz.title }}</td>
                                            <td>{{ quiz.subject }}</td>
                                            <td>{{ quiz.attempts }}</td>
                                            <td>
                                                <span :class="quiz.averageScore >= 70 ? 'text-success' : quiz.averageScore >= 40 ? 'text-warning' : 'text-danger'">
                                                    {{ quiz.averageScore }}%
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
        </div>
    </div>
    `
}