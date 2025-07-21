export default {
    props: ['quizId'],
    data() {
        return {
            quiz: null,
            questions: [],
            currentQuestionIndex: 0,
            userAnswers: {},
            loading: false,
            error: null,
            attemptId: null,
            timeLeft: 0,
            timer: null,
            quizCompleted: false,
            quizResults: null
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
                // First get quiz details
                const quizResponse = await axios.get(`/api/quizzes/${this.quizId}`, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                this.quiz = quizResponse.data;
                
                // Start a new attempt
                const attemptResponse = await axios.post(`/api/quizzes/${this.quizId}/attempt`, {}, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token'),
                        'Content-Type': 'application/json'
                    }
                });
                
                this.attemptId = attemptResponse.data.attempt_id;
                this.timeLeft = attemptResponse.data.time_limit;
                
                // Get questions
                const questionsResponse = await axios.get(`/api/quizzes/${this.quizId}/questions`, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                this.questions = questionsResponse.data;
                
                // Start the timer
                this.startTimer();
            } catch (error) {
                this.error = 'Failed to start quiz';
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
            this.$set(this.userAnswers, questionId, optionId);
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
        async submitQuiz() {
            this.stopTimer();
            this.loading = true;
            
            try {
                // Format answers for submission
                const answers = Object.keys(this.userAnswers).map(questionId => ({
                    question_id: parseInt(questionId),
                    option_id: this.userAnswers[questionId]
                }));
                
                const response = await axios.put(`/api/attempts/${this.attemptId}`, {
                    answers: answers
                }, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token'),
                        'Content-Type': 'application/json'
                    }
                });
                
                this.quizCompleted = true;
                this.quizResults = response.data;
            } catch (error) {
                this.error = 'Failed to submit quiz';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        goToDashboard() {
            this.$router.push('/dashboard');
        },
        // Add this method to the methods section, after goToDashboard()
        formatTimeTaken() {
            if (!this.quiz || !this.quizResults) return '00:00';
            
            // Calculate time taken in seconds
            const startTime = new Date(this.quizResults.started_at);
            const endTime = new Date(this.quizResults.completed_at);
            const timeTakenSeconds = Math.floor((endTime - startTime) / 1000);
            
            // Format as minutes:seconds
            const minutes = Math.floor(timeTakenSeconds / 60);
            const seconds = timeTakenSeconds % 60;
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    },
    template: `
        <div class="container-fluid py-4">
            <div v-if="loading && !quiz" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3">Loading quiz...</p>
            </div>
            
            <div v-else-if="error" class="alert alert-danger" role="alert">
                {{ error }}
            </div>
            
            <div v-else-if="quizCompleted" class="card shadow-sm border-0">
                <div class="card-header bg-success text-white py-3">
                    <h5 class="mb-0">Quiz Completed</h5>
                </div>
                <div class="card-body p-4">
                    <div class="text-center mb-4">
                        <i class="fas fa-check-circle fa-4x text-success mb-3"></i>
                        <h4>Congratulations!</h4>
                        <p class="lead">You have completed the quiz.</p>
                    </div>
                    
                    <div class="row justify-content-center">
                        <div class="col-md-8">
                            <div class="card bg-light mb-4">
                                <div class="card-body">
                                    <h5 class="card-title">Your Results</h5>
                                    <div class="d-flex justify-content-between align-items-center mb-3">
                                        <span>Score:</span>
                                        <span class="badge bg-primary fs-5">{{ quizResults.score.toFixed(1) }}%</span>
                                    </div>
                                    <div class="d-flex justify-content-between align-items-center mb-3">
                                        <span>Correct Answers:</span>
                                        <span>{{ quizResults.correct_count }} / {{ quizResults.total_questions }}</span>
                                    </div>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span>Time Taken:</span>
                                        <span>{{ formatTimeTaken() }}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="text-center">
                                <button class="btn btn-primary" @click="goToDashboard">
                                    <i class="fas fa-home me-1"></i> Return to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div v-else-if="quiz" class="card shadow-sm border-0">
                <div class="card-header bg-primary text-white py-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">{{ quiz.title }}</h5>
                        <div class="d-flex align-items-center">
                            <div class="badge bg-light text-dark me-3">
                                <i class="fas fa-clock me-1"></i> {{ formattedTimeLeft }}
                            </div>
                            <div class="progress" style="width: 150px; height: 10px;">
                                <div class="progress-bar" role="progressbar" :style="{ width: progress + '%' }" 
                                    :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body p-4">
                    <div v-if="currentQuestion" class="mb-4">
                        <h5 class="mb-3">Question {{ currentQuestionIndex + 1 }} of {{ questions.length }}</h5>
                        <div class="card bg-light mb-4">
                            <div class="card-body">
                                <p class="lead">{{ currentQuestion.text }}</p>
                            </div>
                        </div>
                        
                        <div class="list-group mb-4">
                            <button v-for="option in currentQuestion.options" :key="option.id"
                                class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                                :class="{ 'active': userAnswers[currentQuestion.id] === option.id }"
                                @click="selectOption(currentQuestion.id, option.id)">
                                {{ option.text }}
                                <i v-if="userAnswers[currentQuestion.id] === option.id" class="fas fa-check ms-2"></i>
                            </button>
                        </div>
                        
                        <div class="d-flex justify-content-between">
                            <button class="btn btn-outline-secondary" @click="previousQuestion" :disabled="currentQuestionIndex === 0">
                                <i class="fas fa-arrow-left me-1"></i> Previous
                            </button>
                            
                            <div>
                                <button v-if="isLastQuestion" class="btn btn-success" @click="submitQuiz" 
                                    :disabled="loading || !allQuestionsAnswered">
                                    <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    <i v-else class="fas fa-check me-1"></i> Submit Quiz
                                </button>
                                <button v-else class="btn btn-primary" @click="nextQuestion">
                                    Next <i class="fas fa-arrow-right ms-1"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h6 class="mb-0">Question Navigator</h6>
                            <button class="btn btn-sm btn-success" @click="submitQuiz" 
                                :disabled="loading || !allQuestionsAnswered">
                                <i class="fas fa-check me-1"></i> Submit Quiz
                            </button>
                        </div>
                        <div class="d-flex flex-wrap gap-2">
                            <button v-for="(question, index) in questions" :key="question.id"
                                class="btn btn-sm"
                                :class="{
                                    'btn-primary': index === currentQuestionIndex,
                                    'btn-outline-success': userAnswers[question.id] && index !== currentQuestionIndex,
                                    'btn-outline-secondary': !userAnswers[question.id] && index !== currentQuestionIndex
                                }"
                                @click="currentQuestionIndex = index">
                                {{ index + 1 }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}