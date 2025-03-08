export default {
    props: ['attemptId'],
    data() {
        return {
            attempt: null,
            quiz: null,
            questions: [],
            userAnswers: [],
            loading: false,
            error: null
        }
    },
    computed: {
        scorePercentage() {
            return this.attempt ? this.attempt.score.toFixed(1) : 0;
        },
        scoreClass() {
            if (!this.attempt) return 'bg-secondary';
            const score = this.attempt.score;
            if (score >= 80) return 'bg-success';
            if (score >= 60) return 'bg-primary';
            if (score >= 40) return 'bg-warning';
            return 'bg-danger';
        },
        timeTaken() {
            if (!this.attempt) return '00:00';
            
            const startTime = new Date(this.attempt.started_at);
            const endTime = new Date(this.attempt.completed_at);
            const timeTakenSeconds = Math.floor((endTime - startTime) / 1000);
            
            const minutes = Math.floor(timeTakenSeconds / 60);
            const seconds = timeTakenSeconds % 60;
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    },
    created() {
        this.fetchAttemptDetails();
    },
    methods: {
        async fetchAttemptDetails() {
            this.loading = true;
            try {
                // Get attempt details
                const attemptResponse = await axios.get(`/api/attempts/${this.attemptId}`, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                this.attempt = attemptResponse.data;
                
                // Get quiz details
                const quizResponse = await axios.get(`/api/quizzes/${this.attempt.quiz_id}`, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                this.quiz = quizResponse.data;
                
                // Get questions with user answers
                const questionsResponse = await axios.get(`/api/attempts/${this.attemptId}/answers`, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                this.questions = questionsResponse.data.questions;
                this.userAnswers = questionsResponse.data.user_answers;
            } catch (error) {
                this.error = 'Failed to load quiz results';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        isAnswerCorrect(questionId) {
            const userAnswer = this.userAnswers.find(a => a.question_id === questionId);
            if (!userAnswer) return false;
            
            const question = this.questions.find(q => q.id === questionId);
            if (!question) return false;
            
            const selectedOption = question.options.find(o => o.id === userAnswer.option_id);
            return selectedOption && selectedOption.is_correct;
        },
        getUserSelectedOptionId(questionId) {
            const userAnswer = this.userAnswers.find(a => a.question_id === questionId);
            return userAnswer ? userAnswer.option_id : null;
        },
        getCorrectOptionId(question) {
            const correctOption = question.options.find(o => o.is_correct);
            return correctOption ? correctOption.id : null;
        },
        goToDashboard() {
            this.$router.push('/dashboard');
        }
    },
    template: `
        <div class="container-fluid py-4">
            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3">Loading quiz results...</p>
            </div>
            
            <div v-else-if="error" class="alert alert-danger" role="alert">
                {{ error }}
            </div>
            
            <div v-else-if="attempt && quiz" class="card shadow-sm border-0">
                <div class="card-header bg-gradient-primary text-white py-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Quiz Results: {{ quiz.title }}</h5>
                        <button class="btn btn-light btn-sm" @click="goToDashboard">
                            <i class="fas fa-home me-1"></i> Dashboard
                        </button>
                    </div>
                </div>
                <div class="card-body p-4">
                    <div class="row mb-4">
                        <div class="col-md-4">
                            <div class="card bg-light h-100">
                                <div class="card-body text-center">
                                    <h5 class="card-title">Score</h5>
                                    <div class="display-1 fw-bold mb-3">
                                        <span class="badge rounded-pill" :class="scoreClass">
                                            {{ scorePercentage }}%
                                        </span>
                                    </div>
                                    <p class="mb-0">
                                        <span class="badge bg-success me-2">
                                            {{ attempt.correct_count }} Correct
                                        </span>
                                        <span class="badge bg-danger">
                                            {{ questions.length - attempt.correct_count }} Incorrect
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-8">
                            <div class="card bg-light h-100">
                                <div class="card-body">
                                    <h5 class="card-title">Quiz Details</h5>
                                    <table class="table table-borderless">
                                        <tbody>
                                            <tr>
                                                <th scope="row">Chapter</th>
                                                <td>{{ quiz.chapter_name }}</td>
                                            </tr>
                                            <tr>
                                                <th scope="row">Time Taken</th>
                                                <td>{{ timeTaken }}</td>
                                            </tr>
                                            <tr>
                                                <th scope="row">Completed On</th>
                                                <td>{{ new Date(attempt.completed_at).toLocaleString() }}</td>
                                            </tr>
                                            <tr>
                                                <th scope="row">Questions</th>
                                                <td>{{ questions.length }}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <h5 class="mb-3">Question Review</h5>
                    <div class="accordion" id="questionReview">
                        <div class="accordion-item mb-3" v-for="(question, index) in questions" :key="question.id">
                            <h2 class="accordion-header">
                                <button class="accordion-button" :class="{ 'collapsed': index !== 0 }" type="button" 
                                    data-bs-toggle="collapse" :data-bs-target="'#question-' + question.id" 
                                    :aria-expanded="index === 0" :aria-controls="'question-' + question.id">
                                    <div class="d-flex align-items-center w-100">
                                        <span class="me-3">Question {{ index + 1 }}</span>
                                        <span class="badge me-auto" 
                                            :class="isAnswerCorrect(question.id) ? 'bg-success' : 'bg-danger'">
                                            {{ isAnswerCorrect(question.id) ? 'Correct' : 'Incorrect' }}
                                        </span>
                                    </div>
                                </button>
                            </h2>
                            <div :id="'question-' + question.id" class="accordion-collapse collapse" :class="{ 'show': index === 0 }" 
                                data-bs-parent="#questionReview">
                                <div class="accordion-body">
                                    <p class="lead">{{ question.text }}</p>
                                    <div class="list-group">
                                        <div v-for="option in question.options" :key="option.id"
                                            class="list-group-item list-group-item-action"
                                            :class="{
                                                'list-group-item-success': option.is_correct,
                                                'list-group-item-danger': getUserSelectedOptionId(question.id) === option.id && !option.is_correct
                                            }">
                                            <div class="d-flex justify-content-between align-items-center">
                                                {{ option.text }}
                                                <div>
                                                    <span v-if="option.is_correct" class="badge bg-success me-1">
                                                        <i class="fas fa-check"></i> Correct Answer
                                                    </span>
                                                    <span v-if="getUserSelectedOptionId(question.id) === option.id && !option.is_correct" class="badge bg-danger me-1">
                                                        <i class="fas fa-times"></i> Your Answer
                                                    </span>
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
            
            <div v-else class="text-center py-5">
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>No results found.</strong> Please select a valid quiz attempt.
                </div>
                <button class="btn btn-primary mt-3" @click="goToDashboard">
                    <i class="fas fa-home me-1"></i> Return to Dashboard
                </button>
            </div>
        </div>
    `
}