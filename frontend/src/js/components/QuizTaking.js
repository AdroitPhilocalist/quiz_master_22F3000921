export default {
    props: ['quizId'],
    data() {
        return {
            quiz: null,
            questions: [],
            currentQuestionIndex: 0,
            userAnswers: {},
            loading: true,
            error: null,
            attemptId: null,
            timeLeft: 0,
            timer: null,
            quizCompleted: false,
            quizResults: null,
            showConfirmSubmit: false,
            animating: false
        }
    },
    computed: {
        currentQuestion() {
            return this.questions[this.currentQuestionIndex] || null;
        },
        progress() {
            if (!this.questions.length) return 0;
            return Math.round(((this.currentQuestionIndex + 1) / this.questions.length) * 100);
        },
        formattedTimeLeft() {
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        },
        isLastQuestion() {
            return this.currentQuestionIndex === this.questions.length - 1;
        },
        allQuestionsAnswered() {
            return Object.keys(this.userAnswers).length === this.questions.length;
        },
        answeredQuestions() {
            return Object.keys(this.userAnswers).length;
        },
        unansweredQuestions() {
            return this.questions.length - this.answeredQuestions;
        },
        timeLeftPercentage() {
            if (!this.quiz || !this.quiz.time_limit) return 100;
            const totalSeconds = this.quiz.time_limit * 60;
            return (this.timeLeft / totalSeconds) * 100;
        },
        timeLeftClass() {
            if (this.timeLeftPercentage > 50) return 'bg-success';
            if (this.timeLeftPercentage > 25) return 'bg-warning';
            return 'bg-danger';
        }
    },
    created() {
        this.startQuiz();
    },
    beforeUnmount() {
        this.stopTimer();
    },
    methods: {
        async startQuiz() {
            this.loading = true;
            try {
                // Start the quiz attempt
                const startResponse = await axios.post(`/api/quizzes/${this.quizId}/start`, {}, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token'),
                        'Content-Type': 'application/json'
                    }
                });
                
                this.attemptId = startResponse.data.attempt_id;
                
                // Get quiz details
                const quizResponse = await axios.get(`/api/quizzes/${this.quizId}`, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                
                this.quiz = quizResponse.data;
                this.questions = quizResponse.data.questions;
                this.timeLeft = quizResponse.data.time_limit * 60; // Convert minutes to seconds
                
                // Start the timer
                this.startTimer();
            } catch (error) {
                this.error = 'Failed to load quiz';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        
        startTimer() {
            this.timer = setInterval(() => {
                if (this.timeLeft > 0) {
                    this.timeLeft--;
                } else {
                    this.submitQuiz();
                }
            }, 1000);
        },
        
        stopTimer() {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
        },
        
        selectOption(questionId, optionId) {
            this.userAnswers[questionId] = optionId;
            
            // Auto-advance to next question if not the last one
            if (!this.isLastQuestion && !this.animating) {
                this.animating = true;
                setTimeout(() => {
                    this.nextQuestion();
                    this.animating = false;
                }, 500);
            }
        },
        
        previousQuestion() {
            if (this.currentQuestionIndex > 0) {
                this.currentQuestionIndex--;
            }
        },
        
        nextQuestion() {
            if (this.currentQuestionIndex < this.questions.length - 1) {
                this.currentQuestionIndex++;
            }
        },
        
        goToQuestion(index) {
            if (index >= 0 && index < this.questions.length) {
                this.currentQuestionIndex = index;
            }
        },
        
        openSubmitConfirmation() {
            this.showConfirmSubmit = true;
        },
        
        cancelSubmit() {
            this.showConfirmSubmit = false;
        },
        
        async submitQuiz() {
            this.loading = true;
            this.stopTimer();
            
            try {
                const response = await axios.post(`/api/attempts/${this.attemptId}/submit`, {
                    answers: this.userAnswers
                }, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token'),
                        'Content-Type': 'application/json'
                    }
                });
                
                this.quizCompleted = true;
                this.quizResults = response.data;
                
                // Redirect to results page
                this.$router.push(`/quiz-result/${this.attemptId}`);
            } catch (error) {
                this.error = 'Failed to submit quiz';
                console.error(error);
            } finally {
                this.loading = false;
                this.showConfirmSubmit = false;
            }
        },
        
        isOptionSelected(questionId, optionId) {
            return this.userAnswers[questionId] === optionId;
        },
        
        isQuestionAnswered(questionId) {
            return questionId in this.userAnswers;
        }
    },
    template: `
        <div class="quiz-taking-container">
            <!-- Loading State -->
            <div v-if="loading && !quiz" class="text-center my-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading quiz...</p>
            </div>
            
            <!-- Error State -->
            <div v-else-if="error" class="alert alert-danger" role="alert">
                {{ error }}
            </div>
            
            <!-- Quiz Content -->
            <div v-else-if="quiz" class="container-fluid py-4">
                <!-- Quiz Header -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card border-0 shadow-lg">
                            <div class="card-body p-4">
                                <div class="row align-items-center">
                                    <div class="col-md-8">
                                        <h2 class="mb-1">{{ quiz.title }}</h2>
                                        <p class="text-muted mb-0">{{ quiz.subject }} - {{ quiz.chapter }}</p>
                                    </div>
                                    <div class="col-md-4 text-md-end">
                                        <div class="d-flex align-items-center justify-content-md-end">
                                            <div class="me-3">
                                                <div class="d-flex align-items-center">
                                                    <i class="fas fa-clock text-warning me-2"></i>
                                                    <h4 class="mb-0" :class="{'text-danger': timeLeft < 60}">{{ formattedTimeLeft }}</h4>
                                                </div>
                                                <div class="progress mt-1" style="height: 5px;">
                                                    <div class="progress-bar" :class="timeLeftClass" role="progressbar" 
                                                         :style="{ width: timeLeftPercentage + '%' }" 
                                                         :aria-valuenow="timeLeftPercentage" aria-valuemin="0" aria-valuemax="100"></div>
                                                </div>
                                            </div>
                                            <button class="btn btn-danger" @click="openSubmitConfirmation">
                                                <i class="fas fa-paper-plane me-1"></i> Submit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <!-- Question Panel -->
                    <div class="col-lg-9 mb-4">
                        <div class="card border-0 shadow-lg h-100">
                            <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Question {{ currentQuestionIndex + 1 }} of {{ questions.length }}</h5>
                                <div class="progress flex-grow-1 mx-3" style="height: 8px;">
                                    <div class="progress-bar bg-primary" role="progressbar" 
                                         :style="{ width: progress + '%' }" 
                                         :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                                <span class="badge bg-primary">{{ progress }}%</span>
                            </div>
                            <div class="card-body p-4">
                                <div v-if="currentQuestion" class="animate__animated animate__fadeIn">
                                    <h4 class="mb-4">{{ currentQuestion.text }}</h4>
                                    
                                    <div class="options-list">
                                        <div v-for="option in currentQuestion.options" :key="option.id" 
                                             class="option-item mb-3 animate__animated animate__fadeInUp"
                                             :class="{ 'selected': isOptionSelected(currentQuestion.id, option.id) }"
                                             @click="selectOption(currentQuestion.id, option.id)">
                                            <div class="card border-0 shadow-sm hover-card option-card">
                                                <div class="card-body p-3">
                                                    <div class="d-flex align-items-center">
                                                        <div class="option-indicator me-3" 
                                                             :class="{ 'selected': isOptionSelected(currentQuestion.id, option.id) }">
                                                            <i v-if="isOptionSelected(currentQuestion.id, option.id)" class="fas fa-check"></i>
                                                        </div>
                                                        <div>{{ option.text }}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="card-footer bg-white py-3">
                                <div class="d-flex justify-content-between">
                                    <button class="btn btn-outline-primary" @click="previousQuestion" :disabled="currentQuestionIndex === 0">
                                        <i class="fas fa-arrow-left me-1"></i> Previous
                                    </button>
                                    <button v-if="!isLastQuestion" class="btn btn-primary" @click="nextQuestion">
                                        Next <i class="fas fa-arrow-right ms-1"></i>
                                    </button>
                                    <button v-else class="btn btn-success" @click="openSubmitConfirmation">
                                        <i class="fas fa-check me-1"></i> Finish Quiz
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Question Navigator -->
                    <div class="col-lg-3 mb-4">
                        <div class="card border-0 shadow-lg h-100">
                            <div class="card-header bg-white py-3">
                                <h5 class="mb-0">Question Navigator</h5>
                            </div>
                            <div class="card-body">
                                <div class="d-flex justify-content-between mb-3">
                                    <div>
                                        <span class="badge bg-success">{{ answeredQuestions }} Answered</span>
                                    </div>
                                    <div>
                                        <span class="badge bg-secondary">{{ unansweredQuestions }} Remaining</span>
                                    </div>
                                </div>
                                
                                <div class="question-grid">
                                    <button v-for="(question, index) in questions" :key="question.id"
                                            class="btn question-btn"
                                            :class="{
                                                'btn-success': isQuestionAnswered(question.id),
                                                'btn-outline-secondary': !isQuestionAnswered(question.id),
                                                'active': index === currentQuestionIndex
                                                }"
                                                @click="goToQuestion(index)">
                                            {{ index + 1 }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Confirmation Modal -->
            <div v-if="showConfirmSubmit" class="modal fade show" style="display: block; background-color: rgba(0,0,0,0.5);" tabindex="-1" role="dialog">
                <div class="modal-dialog modal-dialog-centered" role="document">
                    <div class="modal-content border-0 shadow">
                        <div class="modal-header bg-warning text-white">
                            <h5 class="modal-title">Submit Quiz</h5>
                            <button type="button" class="btn-close" @click="cancelSubmit" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-4">
                            <div class="text-center mb-4">
                                <i class="fas fa-exclamation-triangle text-warning fa-3x mb-3"></i>
                                <h4>Are you sure you want to submit?</h4>
                            </div>
                            
                            <div class="alert alert-info">
                                <div class="d-flex align-items-center mb-2">
                                    <i class="fas fa-info-circle me-2"></i>
                                    <strong>Quiz Summary</strong>
                                </div>
                                <ul class="mb-0">
                                    <li>Total Questions: {{ questions.length }}</li>
                                    <li>Answered: {{ answeredQuestions }}</li>
                                    <li>Unanswered: {{ unansweredQuestions }}</li>
                                </ul>
                            </div>
                            
                            <p v-if="unansweredQuestions > 0" class="text-danger">
                                <i class="fas fa-exclamation-circle me-1"></i>
                                You have {{ unansweredQuestions }} unanswered questions. Unanswered questions will be marked as incorrect.
                            </p>
                            
                            <p class="mb-0">
                                Once submitted, you cannot change your answers.
                            </p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="cancelSubmit">
                                <i class="fas fa-arrow-left me-1"></i> Return to Quiz
                            </button>
                            <button type="button" class="btn btn-primary" @click="submitQuiz" :disabled="loading">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                <i v-else class="fas fa-paper-plane me-1"></i> Submit Quiz
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}
                                