export default {
    props: ['attemptId'],
    data() {
        return {
            loading: true,
            error: null,
            attempt: null,
            questions: [],
            showExplanations: false,
            showAllExplanations: false
        }
    },
    computed: {
        scoreClass() {
            if (!this.attempt) return '';
            if (this.attempt.score >= 90) return 'text-success';
            if (this.attempt.score >= 70) return 'text-primary';
            if (this.attempt.score >= 50) return 'text-warning';
            return 'text-danger';
        },
        correctAnswers() {
            return this.questions.filter(q => q.is_correct).length;
        },
        incorrectAnswers() {
            return this.questions.filter(q => !q.is_correct).length;
        },
        formattedTimeTaken() {
            if (!this.attempt || !this.attempt.time_taken) return 'N/A';
            
            const minutes = Math.floor(this.attempt.time_taken / 60);
            const seconds = Math.round(this.attempt.time_taken % 60);
            
            if (minutes === 0) {
                return `${seconds} seconds`;
            } else if (minutes === 1) {
                return `1 minute ${seconds} seconds`;
            } else {
                return `${minutes} minutes ${seconds} seconds`;
            }
        },
        passStatus() {
            if (!this.attempt) return false;
            return this.attempt.score >= 70; // Assuming 70% is passing
        }
    },
    created() {
        this.fetchResults();
    },
    methods: {
        async fetchResults() {
            this.loading = true;
            try {
                // Get attempt details
                const attemptResponse = await axios.get(`/api/attempts/${this.attemptId}`, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                
                this.attempt = attemptResponse.data;
                
                // Get question answers
                const answersResponse = await axios.get(`/api/attempts/${this.attemptId}/answers`, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                
                this.questions = answersResponse.data;
            } catch (error) {
                this.error = 'Failed to load quiz results';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        
        toggleExplanation(questionId) {
            const question = this.questions.find(q => q.id === questionId);
            if (question) {
                this.$set(question, 'showExplanation', !question.showExplanation);
            }
        },
        
        toggleAllExplanations() {
            this.showAllExplanations = !this.showAllExplanations;
            this.questions.forEach(question => {
                this.$set(question, 'showExplanation', this.showAllExplanations);
            });
        },
        
        getOptionClass(option, question) {
            if (option.id === question.selected_option_id && option.is_correct) {
                return 'bg-success text-white';
            } else if (option.id === question.selected_option_id && !option.is_correct) {
                return 'bg-danger text-white';
            } else if (option.is_correct) {
                return 'bg-success-subtle border-success';
            }
            return '';
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
        
        goToDashboard() {
            this.$router.push('/dashboard');
        },
        
        retakeQuiz() {
            this.$router.push(`/quiz/${this.attempt.quiz_id}`);
        }
    },
    template: `
        <div class="quiz-result-container">
            <!-- Loading State -->
            <div v-if="loading" class="text-center my-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading quiz results...</p>
            </div>
            
            <!-- Error State -->
            <div v-else-if="error" class="alert alert-danger" role="alert">
                {{ error }}
            </div>
            
            <!-- Results Content -->
            <div v-else-if="attempt" class="container-fluid py-4">
                <!-- Results Header -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card border-0 shadow-lg">
                            <div class="card-body p-4">
                                <div class="row align-items-center">
                                    <div class="col-md-8">
                                        <h2 class="mb-1">{{ attempt.quiz_title }}</h2>
                                        <p class="text-muted mb-0">{{ attempt.subject }} - {{ attempt.chapter }}</p>
                                    </div>
                                    <div class="col-md-4 text-md-end">
                                        <div class="d-flex justify-content-md-end">
                                            <button class="btn btn-outline-primary me-2" @click="goToDashboard">
                                                <i class="fas fa-home me-1"></i> Dashboard
                                            </button>
                                            <button class="btn btn-primary" @click="retakeQuiz">
                                                <i class="fas fa-redo me-1"></i> Retake Quiz
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Results Summary -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card border-0 shadow-lg">
                            <div class="card-body p-4">
                                <div class="row">
                                    <div class="col-lg-4 text-center mb-4 mb-lg-0">
                                        <div class="score-circle mx-auto" :class="scoreClass">
                                            <div class="score-inner">
                                                <h1 class="mb-0">{{ attempt.score }}%</h1>
                                                <p class="mb-0">Your Score</p>
                                            </div>
                                        </div>
                                        <div class="mt-3">
                                            <h4 v-if="passStatus" class="text-success">
                                                <i class="fas fa-check-circle me-1"></i> Passed
                                            </h4>
                                            <h4 v-else class="text-danger">
                                                <i class="fas fa-times-circle me-1"></i> Failed
                                            </h4>
                                        </div>
                                    </div>
                                    
                                    <div class="col-lg-8">
                                        <div class="row">
                                            <div class="col-md-6 mb-3">
                                                <div class="card border-0 shadow-sm h-100">
                                                    <div class="card-body">
                                                        <div class="d-flex align-items-center">
                                                            <div class="icon-shape bg-success text-white rounded-circle shadow-sm me-3">
                                                                <i class="fas fa-check"></i>
                                                            </div>
                                                            <div>
                                                                <h6 class="mb-0">Correct Answers</h6>
                                                                <h3 class="mb-0">{{ correctAnswers }} / {{ questions.length }}</h3>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div class="col-md-6 mb-3">
                                                <div class="card border-0 shadow-sm h-100">
                                                    <div class="card-body">
                                                        <div class="d-flex align-items-center">
                                                            <div class="icon-shape bg-danger text-white rounded-circle shadow-sm me-3">
                                                                <i class="fas fa-times"></i>
                                                            </div>
                                                            <div>
                                                                <h6 class="mb-0">Incorrect Answers</h6>
                                                                <h3 class="mb-0">{{ incorrectAnswers }} / {{ questions.length }}</h3>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div class="col-md-6 mb-3">
                                                <div class="card border-0 shadow-sm h-100">
                                                    <div class="card-body">
                                                        <div class="d-flex align-items-center">
                                                            <div class="icon-shape bg-info text-white rounded-circle shadow-sm me-3">
                                                                <i class="fas fa-clock"></i>
                                                            </div>
                                                            <div>
                                                                <h6 class="mb-0">Time Taken</h6>
                                                                <h3 class="mb-0">{{ formattedTimeTaken }}</h3>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div class="col-md-6 mb-3">
                                                <div class="card border-0 shadow-sm h-100">
                                                    <div class="card-body">
                                                        <div class="d-flex align-items-center">
                                                            <div class="icon-shape bg-warning text-white rounded-circle shadow-sm me-3">
                                                                <i class="fas fa-calendar-alt"></i>
                                                            </div>
                                                            <div>
                                                                <h6 class="mb-0">Completed On</h6>
                                                                <h3 class="mb-0">{{ formatDate(attempt.completed_at) }}</h3>
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
                
                <!-- Question Review -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card border-0 shadow-lg">
                            <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Question Review</h5>
                                <button class="btn btn-sm btn-outline-primary" @click="toggleAllExplanations">
                                    <i class="fas" :class="showAllExplanations ? 'fa-eye-slash' : 'fa-eye'"></i>
                                    {{ showAllExplanations ? 'Hide All Explanations' : 'Show All Explanations' }}
                                </button>
                            </div>
                            <div class="card-body p-0">
                                <div class="accordion" id="questionAccordion">
                                    <div v-for="(question, index) in questions" :key="question.id" class="accordion-item border-0">
                                        <div class="accordion-header" :id="'heading' + question.id">
                                            <button class="accordion-button collapsed" type="button" 
                                                data-bs-toggle="collapse" :data-bs-target="'#collapse' + question.id"
                                                :aria-expanded="false" :aria-controls="'collapse' + question.id">
                                                <div class="d-flex align-items-center w-100">
                                                    <div class="me-3">
                                                        <span class="badge rounded-circle p-2" 
                                                              :class="question.is_correct ? 'bg-success' : 'bg-danger'">
                                                            <i class="fas" :class="question.is_correct ? 'fa-check' : 'fa-times'"></i>
                                                        </span>
                                                    </div>
                                                    <div class="flex-grow-1">
                                                        <h6 class="mb-0">Question {{ index + 1 }}</h6>
                                                        <p class="mb-0 text-muted small">{{ question.text }}</p>
                                                    </div>
                                                    <div>
                                                        <button class="btn btn-sm btn-link text-primary" 
                                                                @click.stop="toggleExplanation(question.id)">
                                                            <i class="fas" :class="question.showExplanation ? 'fa-eye-slash' : 'fa-eye'"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                        <div :id="'collapse' + question.id" class="accordion-collapse collapse" 
                                             :aria-labelledby="'heading' + question.id" data-bs-parent="#questionAccordion">
                                            <div class="accordion-body p-4">
                                                <h5 class="mb-3">{{ question.text }}</h5>
                                                
                                                <div class="options-list mb-4">
                                                    <div v-for="option in question.options" :key="option.id" 
                                                         class="option-item mb-2">
                                                        <div class="card" :class="getOptionClass(option, question)">
                                                            <div class="card-body py-2 px-3">
                                                                <div class="d-flex align-items-center">
                                                                    <div class="me-2">
                                                                        <i v-if="option.id === question.selected_option_id && option.is_correct" 
                                                                           class="fas fa-check-circle text-white"></i>
                                                                        <i v-else-if="option.id === question.selected_option_id && !option.is_correct" 
                                                                           class="fas fa-times-circle text-white"></i>
                                                                        <i v-else-if="option.is_correct" 
                                                                           class="fas fa-check-circle text-success"></i>
                                                                        <i v-else class="far fa-circle"></i>
                                                                    </div>
                                                                    <div>{{ option.text }}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div v-if="question.showExplanation" class="explanation-section mt-3 animate__animated animate__fadeIn">
                                                    <div class="card bg-light">
                                                        <div class="card-body">
                                                            <h6 class="mb-2"><i class="fas fa-info-circle me-2 text-primary"></i>Explanation</h6>
                                                            <p class="mb-0" v-if="question.explanation">{{ question.explanation }}</p>
                                                            <p class="mb-0" v-else>No explanation available for this question.</p>
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
                
                <!-- Recommendations -->
                <div class="row mb-4" v-if="incorrectAnswers > 0">
                    <div class="col-12">
                        <div class="card border-0 shadow-lg">
                            <div class="card-header bg-white py-3">
                                <h5 class="mb-0">Recommendations</h5>
                            </div>
                            <div class="card-body p-4">
                                <div class="alert alert-info">
                                    <h6><i class="fas fa-lightbulb me-2"></i>Study Tips</h6>
                                    <p>Based on your performance, we recommend focusing on the following areas:</p>
                                    <ul>
                                        <li>Review the questions you answered incorrectly</li>
                                        <li>Study the explanations provided for each question</li>
                                        <li>Consider retaking this quiz after reviewing the material</li>
                                    </ul>
                                </div>
                                
                                <div class="d-flex justify-content-center mt-3">
                                    <button class="btn btn-primary me-2" @click="retakeQuiz">
                                        <i class="fas fa-redo me-1"></i> Retake Quiz
                                    </button>
                                    <button class="btn btn-outline-primary" @click="goToDashboard">
                                        <i class="fas fa-home me-1"></i> Back to Dashboard
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Perfect Score -->
                <div class="row mb-4" v-if="incorrectAnswers === 0 && questions.length > 0">
                    <div class="col-12">
                        <div class="card border-0 shadow-lg">
                            <div class="card-body p-4 text-center">
                                <div class="perfect-score-animation mb-3">
                                    <i class="fas fa-trophy fa-4x text-warning"></i>
                                </div>
                                <h3 class="mb-3">Perfect Score!</h3>
                                <p class="mb-4">Congratulations! You've answered all questions correctly.</p>
                                
                                <div class="d-flex justify-content-center">
                                    <button class="btn btn-outline-primary me-2" @click="goToDashboard">
                                        <i class="fas fa-home me-1"></i> Back to Dashboard
                                    </button>
                                    <button class="btn btn-primary" @click="retakeQuiz">
                                        <i class="fas fa-redo me-1"></i> Take Again
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    mounted() {
        // Add CSS for the score circle
        const style = document.createElement('style');
        style.textContent = `
            .score-circle {
                width: 180px;
                height: 180px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 10px solid #e9ecef;
                position: relative;
            }
            .score-circle.text-success { border-color: #28a745; }
            .score-circle.text-primary { border-color: #007bff; }
            .score-circle.text-warning { border-color: #ffc107; }
            .score-circle.text-danger { border-color: #dc3545; }
            
            .score-inner {
                text-align: center;
            }
            
            .icon-shape {
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
            }
            
            .perfect-score-animation {
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
            
            .question-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
                gap: 8px;
            }
            
            .question-btn {
                width: 40px;
                height: 40px;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }
}
                                                