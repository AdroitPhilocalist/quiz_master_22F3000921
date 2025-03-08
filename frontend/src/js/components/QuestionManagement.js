export default {
    props: ['quizId'],
    data() {
        return {
            quiz: null,
            questions: [],
            loading: false,
            error: null,
            newQuestion: {
                text: '',
                options: [
                    { text: '', is_correct: true },
                    { text: '', is_correct: false }
                ],
                quiz_id: null
            },
            editingQuestion: null,
            showAddModal: false,
            showEditModal: false,
            showDeleteModal: false,
            questionToDelete: null,
            searchQuery: '',
            sortBy: 'id',
            sortDesc: false,
            animateItems: false
        }
    },
    created() {
        this.newQuestion.quiz_id = this.quizId;
        this.fetchQuiz();
        this.fetchQuestions();
        // Add animation delay
        setTimeout(() => {
            this.animateItems = true;
        }, 100);
    },
    computed: {
        filteredQuestions() {
            if (!this.searchQuery) return this.questions;
            const query = this.searchQuery.toLowerCase();
            return this.questions.filter(question => 
                question.text.toLowerCase().includes(query)
            );
        },
        sortedQuestions() {
            const questions = [...this.filteredQuestions];
            return questions.sort((a, b) => {
                let modifier = this.sortDesc ? -1 : 1;
                if (a[this.sortBy] < b[this.sortBy]) return -1 * modifier;
                if (a[this.sortBy] > b[this.sortBy]) return 1 * modifier;
                return 0;
            });
        }
    },
    methods: {
        async fetchQuiz() {
            try {
                const response = await axios.get(`/api/quizzes/${this.quizId}`, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                this.quiz = response.data;
            } catch (error) {
                this.error = 'Failed to load quiz details';
                console.error(error);
            }
        },
        async fetchQuestions() {
            this.loading = true;
            try {
                const response = await axios.get(`/api/quizzes/${this.quizId}/questions`, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                this.questions = response.data;
            } catch (error) {
                this.error = 'Failed to load questions';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        openAddModal() {
            this.newQuestion = {
                text: '',
                options: [
                    { text: '', is_correct: true },
                    { text: '', is_correct: false }
                ],
                quiz_id: this.quizId
            };
            this.showAddModal = true;
        },
        openEditModal(question) {
            this.editingQuestion = JSON.parse(JSON.stringify(question)); // Deep copy
            this.showEditModal = true;
        },
        openDeleteModal(question) {
            this.questionToDelete = question;
            this.showDeleteModal = true;
        },
        addOption(question) {
            if (!question) question = this.editingQuestion;
            question.options.push({ text: '', is_correct: false });
        },
        removeOption(question, index) {
            if (typeof question === 'number') {
                // If first argument is a number, it's the index from edit modal
                index = question;
                question = this.editingQuestion;
            }
            
            if (question.options.length > 2) {
                question.options.splice(index, 1);
                
                // Ensure at least one option is marked as correct
                if (!question.options.some(opt => opt.is_correct)) {
                    question.options[0].is_correct = true;
                }
            }
        },
        setCorrectOption(index, isMultipleChoice = false) {
            if (!this.editingQuestion) return;
            
            if (!isMultipleChoice) {
                // Single choice - unselect all other options
                this.editingQuestion.options.forEach((option, i) => {
                    option.is_correct = (i === index);
                });
            } else {
                // Multiple choice - toggle the selected option
                this.editingQuestion.options[index].is_correct = !this.editingQuestion.options[index].is_correct;
                
                // Ensure at least one option is marked as correct
                if (!this.editingQuestion.options.some(opt => opt.is_correct)) {
                    this.editingQuestion.options[index].is_correct = true;
                }
            }
        },
        validateQuestion(question) {
            // Check if question text is provided
            if (!question.text.trim()) {
                this.error = 'Question text is required';
                return false;
            }
            
            // Check if all options have text
            for (const option of question.options) {
                if (!option.text.trim()) {
                    this.error = 'All options must have text';
                    return false;
                }
            }
            
            // Check if at least one option is marked as correct
            if (!question.options.some(opt => opt.is_correct)) {
                this.error = 'At least one option must be marked as correct';
                return false;
            }
            
            return true;
        },
        async addQuestion() {
            if (!this.validateQuestion(this.newQuestion)) return;
            
            this.loading = true;
            try {
                await axios.post(`/api/quizzes/${this.quizId}/questions`, this.newQuestion, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token'),
                        'Content-Type': 'application/json'
                    }
                });
                this.showAddModal = false;
                this.fetchQuestions();
                this.$bvToast.toast('Question added successfully', {
                    title: 'Success',
                    variant: 'success',
                    solid: true
                });
            } catch (error) {
                this.error = 'Failed to add question';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        async updateQuestion() {
            if (!this.validateQuestion(this.editingQuestion)) return;
            
            this.loading = true;
            try {
                await axios.put(`/api/questions/${this.editingQuestion.id}`, this.editingQuestion, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token'),
                        'Content-Type': 'application/json'
                    }
                });
                this.showEditModal = false;
                this.fetchQuestions();
                this.$bvToast.toast('Question updated successfully', {
                    title: 'Success',
                    variant: 'success',
                    solid: true
                });
            } catch (error) {
                this.error = 'Failed to update question';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        async deleteQuestion() {
            this.loading = true;
            try {
                await axios.delete(`/api/questions/${this.questionToDelete.id}`, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                this.showDeleteModal = false;
                this.fetchQuestions();
                this.$bvToast.toast('Question deleted successfully', {
                    title: 'Success',
                    variant: 'success',
                    solid: true
                });
            } catch (error) {
                this.error = 'Failed to delete question';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        goBack() {
            this.$router.push(`/admin/chapters/${this.quiz?.chapter_id}/quizzes`);
        },
        sortTable(field) {
            if (this.sortBy === field) {
                this.sortDesc = !this.sortDesc;
            } else {
                this.sortBy = field;
                this.sortDesc = false;
            }
        },
        getSortIcon(field) {
            if (this.sortBy !== field) return 'fa-sort';
            return this.sortDesc ? 'fa-sort-down' : 'fa-sort-up';
        },
        formatDate(dateString) {
            return new Date(dateString).toLocaleString();
        }
    },
    template: `
        <div class="container-fluid py-4">
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary" @click="goBack">
                        <i class="fas fa-arrow-left me-1"></i> Back to Quizzes
                    </button>
                </div>
            </div>
            
            <div class="row">
                <div class="col-12">
                    <div class="card shadow-sm border-0 mb-4">
                        <div class="card-header bg-gradient-primary text-white py-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">
                                    {{ quiz ? quiz.title + ' - Questions' : 'Questions' }}
                                </h5>
                                <div>
                                    <div class="input-group">
                                        <input type="text" class="form-control" placeholder="Search questions..." v-model="searchQuery">
                                        <button class="btn btn-light" type="button">
                                            <i class="fas fa-search"></i>
                                        </button>
                                        <button class="btn btn-light ms-2" @click="openAddModal">
                                            <i class="fas fa-plus me-1"></i> Add Question
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div v-if="loading" class="text-center py-5">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                            </div>
                            <div v-else-if="error" class="alert alert-danger" role="alert">
                                {{ error }}
                            </div>
                            <div v-else-if="questions.length === 0" class="text-center py-5">
                                <i class="fas fa-question-circle fa-3x text-muted mb-3"></i>
                                <p class="lead">No questions found for this quiz</p>
                                <button class="btn btn-primary" @click="openAddModal">
                                    <i class="fas fa-plus me-1"></i> Add Question
                                </button>
                            </div>
                            <div v-else>
                                <div class="accordion" id="questionsAccordion">
                                    <div v-for="(question, index) in sortedQuestions" :key="question.id" 
                                         class="accordion-item mb-3 border shadow-sm"
                                         :class="{'animate__animated animate__fadeIn': animateItems}">
                                        <h2 class="accordion-header" :id="'heading' + question.id">
                                            <button class="accordion-button collapsed" type="button" 
                                                    data-bs-toggle="collapse" :data-bs-target="'#collapse' + question.id" 
                                                    aria-expanded="false" :aria-controls="'collapse' + question.id">
                                                <div class="d-flex justify-content-between w-100 align-items-center">
                                                    <div>
                                                        <span class="badge bg-primary me-2">Q{{ index + 1 }}</span>
                                                        {{ question.text }}
                                                    </div>
                                                    <div class="btn-group">
                                                        <button @click.stop.prevent="openEditModal(question)" class="btn btn-sm btn-outline-primary">
                                                            <i class="fas fa-edit"></i>
                                                        </button>
                                                        <button @click.stop.prevent="openDeleteModal(question)" class="btn btn-sm btn-outline-danger">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </button>
                                        </h2>
                                        <div :id="'collapse' + question.id" class="accordion-collapse collapse" 
                                             :aria-labelledby="'heading' + question.id" data-bs-parent="#questionsAccordion">
                                            <div class="accordion-body">
                                                <h6>Options:</h6>
                                                <ul class="list-group">
                                                    <li v-for="option in question.options" :key="option.id" 
                                                        class="list-group-item d-flex justify-content-between align-items-center">
                                                        {{ option.text }}
                                                        <span v-if="option.is_correct" class="badge bg-success">Correct</span>
                                                    </li>
                                                </ul>
                                                <div class="mt-3 text-muted small">
                                                    Created: {{ formatDate(question.created_at) }}
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

            <!-- Add Question Modal -->
            <div class="modal fade" :class="{ 'show d-block': showAddModal }" tabindex="-1" role="dialog">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">Add Question</h5>
                            <button type="button" class="btn-close btn-close-white" @click="showAddModal = false"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="questionText" class="form-label">Question Text</label>
                                <textarea class="form-control" id="questionText" v-model="newQuestion.text" rows="3" required></textarea>
                            </div>
                            
                            <h6>Options <small class="text-muted">(Select at least one correct answer)</small></h6>
                            <div class="card mb-2" v-for="(option, index) in newQuestion.options" :key="index">
                                <div class="card-body p-3">
                                    <div class="d-flex align-items-center">
                                        <div class="form-check me-3">
                                            <input class="form-check-input" type="checkbox" :id="'option' + index" v-model="option.is_correct">
                                            <label class="form-check-label" :for="'option' + index">
                                                Correct
                                            </label>
                                        </div>
                                        <div class="flex-grow-1">
                                            <input type="text" class="form-control" placeholder="Option text" v-model="option.text" required>
                                        </div>
                                        <button type="button" class="btn btn-outline-danger ms-2" @click="removeOption(newQuestion, index)" 
                                                :disabled="newQuestion.options.length <= 2">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <button type="button" class="btn btn-outline-secondary" @click="addOption(newQuestion)">
                                <i class="fas fa-plus me-1"></i> Add Option
                            </button>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showAddModal = false">Cancel</button>
                            <button type="button" class="btn btn-primary" @click="addQuestion" :disabled="loading">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Add Question
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-backdrop fade" :class="{ 'show': showAddModal }" v-if="showAddModal"></div>

            <!-- Edit Question Modal -->
            <div class="modal fade" :class="{ 'show d-block': showEditModal }" tabindex="-1" role="dialog">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">Edit Question</h5>
                            <button type="button" class="btn-close btn-close-white" @click="showEditModal = false"></button>
                        </div>
                        <div class="modal-body" v-if="editingQuestion">
                            <div v-if="error" class="alert alert-danger" role="alert">
                                {{ error }}
                            </div>
                            <div class="mb-3">
                                <label for="editQuestionText" class="form-label">Question Text</label>
                                <textarea class="form-control" id="editQuestionText" v-model="editingQuestion.text" rows="3" required></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label d-flex justify-content-between align-items-center">
                                    Options
                                    <button type="button" class="btn btn-sm btn-outline-primary" @click="addOption(editingQuestion)">
                                        <i class="fas fa-plus me-1"></i> Add Option
                                    </button>
                                </label>
                                <div class="card mb-2" v-for="(option, index) in editingQuestion.options" :key="index">
                                    <div class="card-body p-3">
                                        <div class="d-flex align-items-center">
                                            <div class="form-check me-3">
                                                <input class="form-check-input" type="checkbox" :id="'edit-option-' + index" 
                                                    :checked="option.is_correct" 
                                                    @change="setCorrectOption(index, true)">
                                                <label class="form-check-label" :for="'edit-option-' + index">
                                                    Correct
                                                </label>
                                            </div>
                                            <div class="flex-grow-1">
                                                <input type="text" class="form-control" v-model="option.text" 
                                                    placeholder="Option text" required>
                                            </div>
                                            <button type="button" class="btn btn-sm btn-outline-danger ms-2" 
                                                @click="removeOption(index)" 
                                                :disabled="editingQuestion.options.length <= 2">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showEditModal = false">Cancel</button>
                            <button type="button" class="btn btn-primary" @click="updateQuestion" 
                                :disabled="loading || !editingQuestion?.text">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Update Question
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-backdrop fade" :class="{ 'show': showEditModal }" v-if="showEditModal"></div>

            <!-- Delete Question Modal -->
            <div class="modal fade" :class="{ 'show d-block': showDeleteModal }" tabindex="-1" role="dialog">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title">Delete Question</h5>
                            <button type="button" class="btn-close btn-close-white" @click="showDeleteModal = false"></button>
                        </div>
                        <div class="modal-body" v-if="questionToDelete">
                            <p>Are you sure you want to delete this question?</p>
                            <div class="alert alert-warning">
                                <strong>Warning:</strong> This action cannot be undone. All student responses to this question will also be deleted.
                            </div>
                            <div class="card bg-light">
                                <div class="card-body">
                                    <p class="card-text">{{ questionToDelete.text }}</p>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">Cancel</button>
                            <button type="button" class="btn btn-danger" @click="deleteQuestion" :disabled="loading">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Delete Question
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-backdrop fade" :class="{ 'show': showDeleteModal }" v-if="showDeleteModal"></div>
        </div>
    `
}