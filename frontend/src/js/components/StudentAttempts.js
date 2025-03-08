export default {
    data() {
        return {
            attempts: [],
            loading: false,
            error: null
        }
    },
    created() {
        this.fetchAttempts();
    },
    methods: {
        async fetchAttempts() {
            this.loading = true;
            try {
                const response = await axios.get('/api/user/attempts', {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                this.attempts = response.data;
            } catch (error) {
                this.error = 'Failed to load your quiz attempts';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        formatDate(dateString) {
            if (!dateString) return 'Not completed';
            return new Date(dateString).toLocaleString();
        },
        getScoreClass(score) {
            if (score >= 80) return 'bg-success';
            if (score >= 60) return 'bg-primary';
            if (score >= 40) return 'bg-warning';
            return 'bg-danger';
        },
        viewResults(attemptId) {
            this.$router.push(`/results/${attemptId}`);
        }
    },
    template: `
        <div class="container-fluid py-4">
            <div class="card shadow-sm border-0">
                <div class="card-header bg-gradient-primary text-white py-3">
                    <h5 class="mb-0">My Quiz Attempts</h5>
                </div>
                <div class="card-body">
                    <div v-if="loading" class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-3">Loading your quiz attempts...</p>
                    </div>
                    
                    <div v-else-if="error" class="alert alert-danger" role="alert">
                        {{ error }}
                    </div>
                    
                    <div v-else-if="attempts.length === 0" class="text-center py-5">
                        <i class="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                        <p class="lead">You haven't attempted any quizzes yet</p>
                        <router-link to="/dashboard" class="btn btn-primary">
                            <i class="fas fa-book me-1"></i> Browse Quizzes
                        </router-link>
                    </div>
                    
                    <div v-else>
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Quiz</th>
                                        <th>Chapter</th>
                                        <th>Started</th>
                                        <th>Completed</th>
                                        <th>Score</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="attempt in attempts" :key="attempt.id">
                                        <td>{{ attempt.quiz_title }}</td>
                                        <td>{{ attempt.chapter_name }}</td>
                                        <td>{{ formatDate(attempt.started_at) }}</td>
                                        <td>{{ formatDate(attempt.completed_at) }}</td>
                                        <td>
                                            <span v-if="attempt.completed_at" class="badge" :class="getScoreClass(attempt.score)">
                                                {{ attempt.score.toFixed(1) }}%
                                            </span>
                                            <span v-else class="badge bg-secondary">In Progress</span>
                                        </td>
                                        <td>
                                            <button v-if="attempt.completed_at" class="btn btn-sm btn-primary" @click="viewResults(attempt.id)">
                                                <i class="fas fa-eye me-1"></i> View Results
                                            </button>
                                            <router-link v-else :to="'/quiz/' + attempt.quiz_id" class="btn btn-sm btn-warning">
                                                <i class="fas fa-play me-1"></i> Continue
                                            </router-link>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}