export default {
    props: ['quizId'],
    data() {
        return {
            quiz: null,
            currentQuestionIndex: 0,
            answers: {},
            timeLeft: 0,
            timer: null,
            loading: true,
            error: null,
            quizCompleted: false,
            result: null
        }
    },
    computed: {
        currentQuestion() {
            return this.quiz?.questions[this.currentQuestionIndex] || null;
        },
        progress() {
            if (!this.quiz) return 0;
            return Math.round(((this.currentQuestionIndex + 1) / this.quiz.questions.length) * 100);
        },
        formattedTimeLeft() {
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }
    },
    created() {
        this.fetchQuiz();
    },
    beforeDestroy() {
        this.clearTimer();
    },
    methods: {
        async fetchQuiz() {
            this.loading = true;
            try {
                // In a real app, this would fetch from your API
                const response = await axios.get(`/api/quizzes/${this.quizId}`, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                this.quiz = response.data;
                
                // For demo purposes, create a sample quiz
                this.quiz = {
                    id: this.quizId,
                    title: 'Sample Quiz',
                    description: 'This is a sample quiz for demonstration purposes',
                    timeLimit: 600, // 10 minutes in seconds
                    questions: [
                        {
                            id: 1,
                            text: 'What is the capital of France?',
                            options: [
                                { id: 1, text: 'London' },
                                { id: 2, text: 'Paris' },
                                { id: 3, text: 'Berlin' },
                                { id: 4, text: 'Madrid' }
                            ],
                            correctAnswer: 2
                        },
                        {
                            id: 2,
                            text: 'Which planet is known as the Red Planet?',
                            options: [
                                { id: 1, text: 'Venus' },
                                { id: 2, text: 'Jupiter' },
                                { id: 3, text: 'Mars' },
                                { id: 4, text: 'Saturn' }
                            ],
                            correctAnswer: 3
                        },
                        {
                            id: 3,
                            text: 'What is the largest mammal?',
                            options: [
                                { id: 1, text: 'Elephant' },
                                { id: 2, text: 'Blue Whale' },
                                { id: 3, text: 'Giraffe' },
                                { id: 4, text: 'Polar Bear' }
                            ],
                            correctAnswer: 2
                        }
                    ]
                };
                
                // Initialize timer
                this.timeLeft = this.quiz.timeLimit;
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
        clearTimer() {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
        },
        selectAnswer(questionId, optionId) {
            this.answers[questionId] = optionId;
        },
        nextQuestion() {
            if (this.currentQuestionIndex < this.quiz.questions.length - 1) {
                this.currentQuestionIndex++;
            }
        },
        prevQuestion() {
            if (this.currentQuestionIndex > 0) {
                this.currentQuestionIndex--;
            }
        },
        async submitQuiz() {
            this.clearTimer();
            this.loading = true;
            
            try {
                // In a real app, this would submit to your API
                // const response = await axios.post(`/api/quizzes/${this.quizId}/submit`, {
                //     answers: this.answers
                // }, {
                //     headers: {
                //         'Authentication-Token': localStorage.getItem('token')
                //     }
                // });
                
                // For demo purposes, calculate result
                let correctCount = 0;
                this.quiz.questions.forEach(question => {
                    if (this.answers[question.id] === question.correctAnswer) {
                        correctCount++;
                    }
                });
                
                const score = Math.round((correctCount / this.quiz.questions.length) * 100);
                
                this.result = {
                    score,
                    correctCount,
                    totalQuestions: this.quiz.questions.length
                };
                
                this.quizCompleted = true;
            } catch (error) {
                this.error = 'Failed to submit quiz';
                console.error(error);
            } finally {
                this.loading = false;
            }
        }
    },
    template: `
        <div class="container py-5">
            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
            
            <div v-else-if="error" class="alert alert-danger" role="alert">
                {{ error }}
            </div>
            
            <div v-else-if="quizCompleted" class="card shadow">
                <div class="card-header bg-primary text-white">
                    <h3 class="mb-0">Quiz Results</h3>
                </div>
                <div class="card-body text-center py-5">
                    <div class="display-1 mb-4">{{ result.score }}%</div>
                    <p class="lead">You answered {{ result.correctCount }} out of {{ result.totalQuestions }} questions correctly.</p>
                    
                    <div class="mt-4">
                        <router-link to="/user" class="btn btn-primary me-2">
                            <i class="fas fa-home me-1"></i> Back to Dashboard
                        </router-link>
                        <button class="btn btn-outline-primary" @click="fetchQuiz">
                            <i class="fas fa-redo me-1"></i> Retake Quiz
                        </button>
                    </div>
                </div>
            </div>
            
            <div v-else>
                <div class="card shadow mb-4">
                    <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                        <h3 class="mb-0">{{ quiz.title }}</h3>
                        <div class="badge bg-light text-dark p-2">
                            <i class="fas fa-clock me-1"></i> {{ formattedTimeLeft }}
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="progress mb-4" style="height: 10px;">
                            <div class="progress-bar" role="progressbar" :style="{ width: progress + '%' }" 
                                :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                        
                        <div v-if="currentQuestion" class="question-container">
                            <h4 class="mb-4">Question {{ currentQuestionIndex + 1 }}: {{ currentQuestion.text }}</h4>
                            
                            <div class="options-list">
                                <div v-for="option in currentQuestion.options" :key="option.id" class="form-check mb-3">
                                    <input 
                                        class="form-check-input" 
                                        type="radio" 
                                        :name="'question-' + currentQuestion.id" 
                                        :id="'option-' + option.id"
                                        :checked="answers[currentQuestion.id] === option.id"
                                        @change="selectAnswer(currentQuestion.id, option.id)"
                                    >
                                    <label class="form-check-label" :for="'option-' + option.id">
                                        {{ option.text }}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer d-flex justify-content-between">
                        <button 
                            class="btn btn-outline-primary" 
                            @click="prevQuestion" 
                            :disabled="currentQuestionIndex === 0"
                        >
                            <i class="fas fa-arrow-left me-1"></i> Previous
                        </button>
                        
                        <div>
                            <button 
                                v-if="currentQuestionIndex < quiz.questions.length - 1" 
                                class="btn btn-primary" 
                                @click="nextQuestion"
                            >
                                Next <i class="fas fa-arrow-right ms-1"></i>
                            </button>
                            <button 
                                v-else 
                                class="btn btn-success" 
                                @click="submitQuiz"
                            >
                                Submit Quiz <i class="fas fa-check ms-1"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        Question {{ currentQuestionIndex + 1 }} of {{ quiz.questions.length }}
                    </div>
                    <button class="btn btn-danger" @click="submitQuiz">
                        <i class="fas fa-stop-circle me-1"></i> End Quiz
                    </button>
                </div>
            </div>
        </div>
    `
}