export default {
    data() {
        return {
            loading: true,
            error: null,
            userId: null,
            userName: '',
            stats: {
                quizzes: {
                    attempted: 0,
                    completed: 0,
                    inProgress: 0,
                    averageScore: 0,
                    bestScore: 0,
                    totalTime: 0,
                    scoreHistory: [],
                    subjectPerformance: [],
                    recentAttempts: []
                },
                progress: {
                    totalQuestions: 0,
                    correctAnswers: 0,
                    accuracy: 0,
                    monthlyActivity: [],
                    weekdayActivity: []
                },
                achievements: {
                    totalEarned: 0,
                    recent: [],
                    list: []
                }
            },
            charts: {
                scoreHistory: null,
                subjectPerformance: null,
                accuracyBySubject: null
            }
        }
    },
    mounted() {
        this.fetchUserStatistics();
        // Load Chart.js from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => {
            this.initializeCharts();
        };
        document.head.appendChild(script);
    },
    methods: {
        async fetchUserStatistics() {
            this.loading = true;
            try {
                const response = await axios.get('/api/user/statistics', {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                
                // Process and store the statistics
                const data = response.data;
                this.userId = data.user_id;
                this.userName = data.user_name;
                this.stats = data.stats;
                
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
            
            // Score History Chart (Line chart)
            this.createScoreHistoryChart();
            
            // Subject Performance Chart (Radar chart)
            this.createSubjectPerformanceChart();
            
            // Accuracy by Subject Chart (Horizontal Bar chart)
            this.createAccuracyBySubjectChart();
        },
        
        createScoreHistoryChart() {
            const ctx = document.getElementById('scoreHistoryChart').getContext('2d');
            if (this.charts.scoreHistory) this.charts.scoreHistory.destroy();
            
            const quizLabels = this.stats.quizzes.scoreHistory?.map(item => item.quiz_title) || [];
            const scoreData = this.stats.quizzes.scoreHistory?.map(item => item.score) || [];
            
            this.charts.scoreHistory = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: quizLabels,
                    datasets: [{
                        label: 'Quiz Scores',
                        data: scoreData,
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
                            text: 'Your Quiz Score History'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            grid: {
                                drawBorder: false
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                maxRotation: 45,
                                minRotation: 45
                            }
                        }
                    }
                }
            });
        },
        
        createSubjectPerformanceChart() {
            const ctx = document.getElementById('subjectPerformanceChart').getContext('2d');
            if (this.charts.subjectPerformance) this.charts.subjectPerformance.destroy();
            
            const subjects = this.stats.quizzes.subjectPerformance?.map(item => item.subject) || [];
            const scores = this.stats.quizzes.subjectPerformance?.map(item => item.average_score) || [];
            
            this.charts.subjectPerformance = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: subjects,
                    datasets: [{
                        label: 'Average Score',
                        data: scores,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgb(54, 162, 235)',
                        pointBackgroundColor: 'rgb(54, 162, 235)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgb(54, 162, 235)'
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
                            text: 'Performance by Subject'
                        }
                    },
                    scales: {
                        r: {
                            angleLines: {
                                display: true
                            },
                            suggestedMin: 0,
                            suggestedMax: 100
                        }
                    }
                }
            });
        },
        
        // createMonthlyActivityChart() {
        //     const ctx = document.getElementById('monthlyActivityChart').getContext('2d');
        //     if (this.charts.monthlyActivity) this.charts.monthlyActivity.destroy();
            
        //     const months = this.stats.progress.monthlyActivity?.map(item => item.month) || 
        //         ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        //     const quizCounts = this.stats.progress.monthlyActivity?.map(item => item.count) || 
        //         [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            
        //     this.charts.monthlyActivity = new Chart(ctx, {
        //         type: 'bar',
        //         data: {
        //             labels: months,
        //             datasets: [{
        //                 label: 'Quizzes Taken',
        //                 data: quizCounts,
        //                 backgroundColor: 'rgba(255, 159, 67, 0.7)',
        //                 borderColor: 'rgba(255, 159, 67, 1)',
        //                 borderWidth: 1
        //             }]
        //         },
        //         options: {
        //             responsive: true,
        //             plugins: {
        //                 legend: {
        //                     display: false
        //                 },
        //                 title: {
        //                     display: true,
        //                     text: 'Monthly Quiz Activity'
        //                 }
        //             },
        //             scales: {
        //                 y: {
        //                     beginAtZero: true,
        //                     grid: {
        //                         drawBorder: false
        //                     }
        //                 },
        //                 x: {
        //                     grid: {
        //                         display: false
        //                     }
        //                 }
        //             }
        //         }
        //     });
        // },
        
        // createWeekdayActivityChart() {
        //     const ctx = document.getElementById('weekdayActivityChart').getContext('2d');
        //     if (this.charts.weekdayActivity) this.charts.weekdayActivity.destroy();
            
        //     const weekdays = this.stats.progress.weekdayActivity?.map(item => item.day) || 
        //         ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        //     const activityData = this.stats.progress.weekdayActivity?.map(item => item.count) || 
        //         [0, 0, 0, 0, 0, 0, 0];
            
        //     this.charts.weekdayActivity = new Chart(ctx, {
        //         type: 'polarArea',
        //         data: {
        //             labels: weekdays,
        //             datasets: [{
        //                 data: activityData,
        //                 backgroundColor: [
        //                     'rgba(255, 99, 132, 0.7)',
        //                     'rgba(255, 159, 64, 0.7)',
        //                     'rgba(255, 205, 86, 0.7)',
        //                     'rgba(75, 192, 192, 0.7)',
        //                     'rgba(54, 162, 235, 0.7)',
        //                     'rgba(153, 102, 255, 0.7)',
        //                     'rgba(201, 203, 207, 0.7)'
        //                 ],
        //                 borderColor: [
        //                     'rgb(255, 99, 132)',
        //                     'rgb(255, 159, 64)',
        //                     'rgb(255, 205, 86)',
        //                     'rgb(75, 192, 192)',
        //                     'rgb(54, 162, 235)',
        //                     'rgb(153, 102, 255)',
        //                     'rgb(201, 203, 207)'
        //                 ],
        //                 borderWidth: 1
        //             }]
        //         },
        //         options: {
        //             responsive: true,
        //             plugins: {
        //                 legend: {
        //                     position: 'right',
        //                 },
        //                 title: {
        //                     display: true,
        //                     text: 'Quiz Activity by Day of Week'
        //                 }
        //             }
        //         }
        //     });
        // },
        
        createAccuracyBySubjectChart() {
            const ctx = document.getElementById('accuracyBySubjectChart').getContext('2d');
            if (this.charts.accuracyBySubject) this.charts.accuracyBySubject.destroy();
            
            const subjects = this.stats.quizzes.subjectPerformance?.map(item => item.subject) || [];
            const accuracy = this.stats.quizzes.subjectPerformance?.map(item => item.accuracy) || [];
            
            this.charts.accuracyBySubject = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: subjects,
                    datasets: [{
                        axis: 'y',
                        label: 'Accuracy (%)',
                        data: accuracy,
                        backgroundColor: 'rgba(40, 199, 111, 0.7)',
                        borderColor: 'rgba(40, 199, 111, 1)',
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
                            text: 'Accuracy by Subject'
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            max: 100,
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
        },
        
        formatTime(minutes) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            
            if (hours > 0) {
                return `${hours}m ${mins}s`;
            }
            return `${mins} minutes`;
        }
    },
    template: `
    <div style="min-height: 100vh; background: linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%); padding: 30px 20px;">
        <div class="container-fluid" style="max-width: 1200px; margin: 0 auto;">
            <!-- Header -->
            <div class="row mb-4">
                <div class="col-12">
                    <div style="background: linear-gradient(135deg, #36b9cc 0%, #1cc7d0 100%); border-radius: 20px; box-shadow: 0 15px 35px rgba(50, 50, 93, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07); overflow: hidden; position: relative;">
                        <!-- Decorative elements -->
                        <div style="position: absolute; top: -20px; right: -20px; width: 150px; height: 150px; border-radius: 50%; background: rgba(255, 255, 255, 0.1);"></div>
                        <div style="position: absolute; bottom: -40px; left: 20%; width: 100px; height: 100px; border-radius: 50%; background: rgba(255, 255, 255, 0.05);"></div>
                        
                        <div style="padding: 30px; position: relative; z-index: 1;">
                            <h2 style="color: white; font-weight: 700; margin-bottom: 10px; font-size: 28px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <i class="fas fa-chart-pie me-3"></i>Your Quiz Statistics
                            </h2>
                            <p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 0; font-size: 16px;">
                                Track your progress and performance across all quizzes
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
                    <p class="mt-3" style="color: #36b9cc; font-weight: 500;">Loading your statistics...</p>
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
                    <!-- Quizzes Attempted Card -->
                    <div class="col-md-6 col-lg-3 mb-4">
                        <div style="background: white; border-radius: 15px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); padding: 20px; height: 100%;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                                <div>
                                    <h5 style="color: #333; font-weight: 600; margin-bottom: 5px;">Quizzes Attempted</h5>
                                    <p style="color: #666; font-size: 14px; margin-bottom: 0;">Total attempts</p>
                                </div>
                                <div style="width: 50px; height: 50px; background: rgba(54, 185, 204, 0.1); border-radius: 12px; display: flex; justify-content: center; align-items: center;">
                                    <i class="fas fa-clipboard-check" style="color: #36b9cc; font-size: 20px;"></i>
                                </div>
                            </div>
                            <h3 style="color: #333; font-weight: 700; margin-bottom: 5px;">{{ stats.quizzes.attempted }}</h3>
                            <p style="color: #28c76f; font-size: 14px; margin-bottom: 0;">
                                <i class="fas fa-check-circle me-1"></i> {{ stats.quizzes.completed }} completed
                            </p>
                        </div>
                    </div>
                    
                    <!-- Average Score Card -->
                    <div class="col-md-6 col-lg-3 mb-4">
                        <div style="background: white; border-radius: 15px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); padding: 20px; height: 100%;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                                <div>
                                    <h5 style="color: #333; font-weight: 600; margin-bottom: 5px;">Average Score</h5>
                                    <p style="color: #666; font-size: 14px; margin-bottom: 0;">Across all quizzes</p>
                                </div>
                                <div style="width: 50px; height: 50px; background: rgba(40, 199, 111, 0.1); border-radius: 12px; display: flex; justify-content: center; align-items: center;">
                                    <i class="fas fa-chart-line" style="color: #28c76f; font-size: 20px;"></i>
                                </div>
                            </div>
                            <h3 style="color: #333; font-weight: 700; margin-bottom: 5px;">{{ stats.quizzes.averageScore }}%</h3>
                            <p style="color: #28c76f; font-size: 14px; margin-bottom: 0;">
                                <i class="fas fa-trophy me-1"></i> Best: {{ stats.quizzes.bestScore }}%
                            </p>
                        </div>
                    </div>
                    
                    <!-- Accuracy Card -->
                    <div class="col-md-6 col-lg-3 mb-4">
                        <div style="background: white; border-radius: 15px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); padding: 20px; height: 100%;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                                <div>
                                    <h5 style="color: #333; font-weight: 600; margin-bottom: 5px;">Accuracy</h5>
                                    <p style="color: #666; font-size: 14px; margin-bottom: 0;">Correct answers</p>
                                </div>
                                <div style="width: 50px; height: 50px; background: rgba(255, 159, 67, 0.1); border-radius: 12px; display: flex; justify-content: center; align-items: center;">
                                    <i class="fas fa-bullseye" style="color: #ff9f43; font-size: 20px;"></i>
                                </div>
                            </div>
                            <h3 style="color: #333; font-weight: 700; margin-bottom: 5px;">{{ stats.progress.accuracy }}%</h3>
                            <p style="color: #28c76f; font-size: 14px; margin-bottom: 0;">
                                <i class="fas fa-check me-1"></i> {{ stats.progress.correctAnswers }}/{{ stats.progress.totalQuestions }}
                            </p>
                        </div>
                    </div>
                    
                    <!-- Time Spent Card -->
                    <div class="col-md-6 col-lg-3 mb-4">
                        <div style="background: white; border-radius: 15px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); padding: 20px; height: 100%;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                                <div>
                                    <h5 style="color: #333; font-weight: 600; margin-bottom: 5px;">Time Spent</h5>
                                    <p style="color: #666; font-size: 14px; margin-bottom: 0;">Total quiz time</p>
                                </div>
                                <div style="width: 50px; height: 50px; background: rgba(234, 84, 85, 0.1); border-radius: 12px; display: flex; justify-content: center; align-items: center;">
                                    <i class="fas fa-clock" style="color: #ea5455; font-size: 20px;"></i>
                                </div>
                            </div>
                            <h3 style="color: #333; font-weight: 700; margin-bottom: 5px;">{{ formatTime(stats.quizzes.totalTime) }}</h3>
                            <p style="color: #28c76f; font-size: 14px; margin-bottom: 0;">
                                <i class="fas fa-brain me-1"></i> Learning in progress
                            </p>
                        </div>
                    </div>
                </div>
                
                <!-- Charts Row 1 -->
                <div class="row mb-4">
                    <!-- Score History Chart -->
                    <div class="col-lg-8 mb-4">
                        <div style="background: white; border-radius: 15px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); padding: 20px; height: 100%;">
                            <h5 style="color: #333; font-weight: 600; margin-bottom: 20px;">Score History</h5>
                            <div style="height: 300px;">
                                <canvas id="scoreHistoryChart"></canvas>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Subject Performance Chart -->
                    <div class="col-lg-4 mb-4">
                        <div style="background: white; border-radius: 15px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); padding: 20px; height: 100%;">
                            <h5 style="color: #333; font-weight: 600; margin-bottom: 20px;">Subject Performance</h5>
                            <div style="height: 300px;">
                                <canvas id="subjectPerformanceChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                
                
                
                <!-- Accuracy by Subject Chart -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div style="background: white; border-radius: 15px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); padding: 20px;">
                            <h5 style="color: #333; font-weight: 600; margin-bottom: 20px;">Accuracy by Subject</h5>
                            <div style="height: 300px;">
                                <canvas id="accuracyBySubjectChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Recent Attempts -->
                <div class="row">
                    <div class="col-12 mb-4">
                        <div style="background: white; border-radius: 15px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); padding: 20px;">
                            <h5 style="color: #333; font-weight: 600; margin-bottom: 20px;">Recent Quiz Attempts</h5>
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th scope="col">Quiz</th>
                                            <th scope="col">Date</th>
                                            <th scope="col">Score</th>
                                            <th scope="col">Time Spent</th>
                                            <th scope="col">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="attempt in stats.quizzes.recentAttempts" :key="attempt.id">
                                            <td>{{ attempt.quiz_title }}</td>
                                            <td>{{ new Date(attempt.date).toLocaleDateString() }}</td>
                                            <td>
                                                <span :class="attempt.score >= 70 ? 'text-success' : attempt.score >= 40 ? 'text-warning' : 'text-danger'">
                                                    {{ attempt.score }}%
                                                </span>
                                            </td>
                                            <td>{{ formatTime(attempt.time_spent) }}</td>
                                            <td>
                                                <span class="badge" :class="attempt.status === 'completed' ? 'bg-success' : 'bg-warning'">
                                                    {{ attempt.status === 'completed' ? 'Completed' : 'In Progress' }}
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