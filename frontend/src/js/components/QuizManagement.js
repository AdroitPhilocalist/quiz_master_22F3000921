export default {
    props: ['chapterId'],
    data() {
        return {
            chapter: null,
            quizzes: [],
            loading: false,
            error: null,
            newQuiz: {
                title: '',
                description: '',
                time_limit: 600, // Default 10 minutes
                chapter_id: null
            },
            editingQuiz: null,
            showAddModal: false,
            showEditModal: false,
            showDeleteModal: false,
            showPublishModal: false,
            quizToDelete: null,
            quizToPublish: null
        }
    },
    created() {
        this.newQuiz.chapter_id = this.chapterId;
        this.fetchChapter();
        this.fetchQuizzes();
    },
    methods: {
        async fetchChapter() {
            try {
                const response = await axios.get(`/api/chapters/${this.chapterId}`, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                this.chapter = response.data;
            } catch (error) {
                this.error = 'Failed to load chapter details';
                console.error(error);
            }
        },
        async fetchQuizzes() {
            this.loading = true;
            try {
                const response = await axios.get(`/api/chapters/${this.chapterId}/quizzes`, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                this.quizzes = response.data;
            } catch (error) {
                this.error = 'Failed to load quizzes';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        openAddModal() {
            this.newQuiz = { 
                title: '', 
                description: '',
                time_limit: 600,
                chapter_id: this.chapterId
            };
            this.showAddModal = true;
        },
        openEditModal(quiz) {
            this.editingQuiz = { ...quiz };
            this.showEditModal = true;
        },
        openDeleteModal(quiz) {
            this.quizToDelete = quiz;
            this.showDeleteModal = true;
        },
        openPublishModal(quiz) {
            this.quizToPublish = quiz;
            this.showPublishModal = true;
        },
        async addQuiz() {
            this.loading = true;
            try {
                await axios.post(`/api/chapters/${this.chapterId}/quizzes`, this.newQuiz, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token'),
                        'Content-Type': 'application/json'
                    }
                });
                this.showAddModal = false;
                this.fetchQuizzes();
                this.$bvToast.toast('Quiz added successfully', {
                    title: 'Success',
                    variant: 'success',
                    solid: true
                });
            } catch (error) {
                this.error = 'Failed to add quiz';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        async updateQuiz() {
            this.loading = true;
            try {
                await axios.put(`/api/quizzes/${this.editingQuiz.id}`, {
                    title: this.editingQuiz.title,
                    description: this.editingQuiz.description,
                    time_limit: this.editingQuiz.time_limit,
                    chapter_id: this.chapterId
                }, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token'),
                        'Content-Type': 'application/json'
                    }
                });
                this.showEditModal = false;
                this.fetchQuizzes();
                this.$bvToast.toast('Quiz updated successfully', {
                    title: 'Success',
                    variant: 'success',
                    solid: true
                });
            } catch (error) {
                this.error = 'Failed to update quiz';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        async deleteQuiz() {
            this.loading = true;
            try {
                await axios.delete(`/api/quizzes/${this.quizToDelete.id}`, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                this.showDeleteModal = false;
                this.fetchQuizzes();
                this.$bvToast.toast('Quiz deleted successfully', {
                    title: 'Success',
                    variant: 'success',
                    solid: true
                });
            } catch (error) {
                this.error = 'Failed to delete quiz';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        async publishQuiz() {
            this.loading = true;
            try {
                await axios.put(`/api/quizzes/${this.quizToPublish.id}`, {
                    is_published: true
                }, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token'),
                        'Content-Type': 'application/json'
                    }
                });
                this.showPublishModal = false;
                this.fetchQuizzes();
                this.$bvToast.toast('Quiz published successfully', {
                    title: 'Success',
                    variant: 'success',
                    solid: true
                });
            } catch (error) {
                this.error = 'Failed to publish quiz';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        async unpublishQuiz(quiz) {
            this.loading = true;
            try {
                await axios.put(`/api/quizzes/${quiz.id}`, {
                    is_published: false
                }, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token'),
                        'Content-Type': 'application/json'
                    }
                });
                this.fetchQuizzes();
                this.$bvToast.toast('Quiz unpublished successfully', {
                    title: 'Success',
                    variant: 'success',
                    solid: true
                });
            } catch (error) {
                this.error = 'Failed to unpublish quiz';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        viewQuestions(quizId) {
            this.$router.push(`/admin/quizzes/${quizId}/questions`);
        },
        goBack() {
            this.$router.push(`/admin/subjects/${this.chapter?.subject_id}/chapters`);
        },
        formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        },
        // Add this method to the methods section, after formatTime()
        hasQuestions(quiz) {
        // This is a placeholder. In a real implementation, you would either:
        // 1. Check a questions_count property if it exists on the quiz object
        // 2. Make a separate API call to check if the quiz has questions
        // For now, we'll assume no questions until we implement the full feature
        return quiz.questions_count > 0;
        }
    },
    template: `
        <div class="container-fluid py-4">
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary" @click="goBack">
                        <i class="fas fa-arrow-left me-1"></i> Back to Chapters
                    </button>
                </div>
            </div>
            
            <div class="row">
                <div class="col-12">
                    <div class="card shadow-sm border-0 mb-4">
                        <div class="card-header bg-gradient-primary text-white py-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">
                                    {{ chapter ? chapter.name + ' - Quizzes' : 'Quizzes' }}
                                </h5>
                                <button class="btn btn-light btn-sm" @click="openAddModal">
                                    <i class="fas fa-plus me-1"></i> Add Quiz
                                </button>
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
                            <div v-else-if="quizzes.length === 0" class="text-center py-5">
                                <i class="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                                <p class="lead">No quizzes found for this chapter</p>
                                <button class="btn btn-primary" @click="openAddModal">
                                    <i class="fas fa-plus me-1"></i> Add Quiz
                                </button>
                            </div>
                            <div v-else class="table-responsive">
                                <table class="table table-hover align-middle">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Title</th>
                                            <th>Description</th>
                                            <th>Time Limit</th>
                                            <th>Status</th>
                                            <th>Created At</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="quiz in quizzes" :key="quiz.id">
                                            <td>{{ quiz.title }}</td>
                                            <td>{{ quiz.description || 'No description' }}</td>
                                            <td>{{ formatTime(quiz.time_limit) }}</td>
                                            <td>
                                                <span v-if="quiz.is_published" class="badge bg-success">Published</span>
                                                <span v-else class="badge bg-secondary">Draft</span>
                                            </td>
                                            <td>{{ new Date(quiz.created_at).toLocaleString() }}</td>
                                            <td>
                                                <div class="btn-group">
                                                    <button class="btn btn-sm btn-outline-primary" @click="viewQuestions(quiz.id)">
                                                        <i class="fas fa-list me-1"></i> Questions
                                                    </button>
                                                    <button class="btn btn-sm btn-outline-secondary" @click="openEditModal(quiz)">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button v-if="!quiz.is_published" class="btn btn-sm btn-outline-success" @click="openPublishModal(quiz)">
                                                        <i class="fas fa-check-circle"></i>
                                                    </button>
                                                    <button v-else class="btn btn-sm btn-outline-warning" @click="unpublishQuiz(quiz)">
                                                        <i class="fas fa-times-circle"></i>
                                                    </button>
                                                    <button class="btn btn-sm btn-outline-danger" @click="openDeleteModal(quiz)">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Add Quiz Modal -->
            <div class="modal fade" :class="{ 'show d-block': showAddModal }" tabindex="-1" role="dialog">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">Add Quiz</h5>
                            <button type="button" class="btn-close btn-close-white" @click="showAddModal = false"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="quizTitle" class="form-label">Title</label>
                                <input type="text" class="form-control" id="quizTitle" v-model="newQuiz.title" required>
                            </div>
                            <div class="mb-3">
                                <label for="quizDescription" class="form-label">Description</label>
                                <textarea class="form-control" id="quizDescription" v-model="newQuiz.description" rows="3"></textarea>
                            </div>
                            <div class="mb-3">
                                <label for="quizTimeLimit" class="form-label">Time Limit (seconds)</label>
                                <input type="number" class="form-control" id="quizTimeLimit" v-model="newQuiz.time_limit" min="60" step="60">
                                <small class="form-text text-muted">Time in seconds (e.g., 600 = 10 minutes)</small>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showAddModal = false">Cancel</button>
                            <button type="button" class="btn btn-primary" @click="addQuiz" :disabled="loading || !newQuiz.title">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Add Quiz
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-backdrop fade" :class="{ 'show': showAddModal }" v-if="showAddModal"></div>

            <!-- Edit Quiz Modal -->
            <div class="modal fade" :class="{ 'show d-block': showEditModal }" tabindex="-1" role="dialog">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">Edit Quiz</h5>
                            <button type="button" class="btn-close btn-close-white" @click="showEditModal = false"></button>
                        </div>
                        <div class="modal-body" v-if="editingQuiz">
                            <div class="mb-3">
                                <label for="editQuizTitle" class="form-label">Title</label>
                                <input type="text" class="form-control" id="editQuizTitle" v-model="editingQuiz.title" required>
                            </div>
                            <div class="mb-3">
                                <label for="editQuizDescription" class="form-label">Description</label>
                                <textarea class="form-control" id="editQuizDescription" v-model="editingQuiz.description" rows="3"></textarea>
                            </div>
                            <div class="mb-3">
                                <label for="editQuizTimeLimit" class="form-label">Time Limit (seconds)</label>
                                <input type="number" class="form-control" id="editQuizTimeLimit" v-model="editingQuiz.time_limit" min="60" step="60">
                                <small class="form-text text-muted">Time in seconds (e.g., 600 = 10 minutes)</small>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showEditModal = false">Cancel</button>
                            <button type="button" class="btn btn-primary" @click="updateQuiz" :disabled="loading || !editingQuiz?.title">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Update Quiz
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-backdrop fade" :class="{ 'show': showEditModal }" v-if="showEditModal"></div>

            <!-- Publish Quiz Modal -->
            <div class="modal fade" :class="{ 'show d-block': showPublishModal }" tabindex="-1" role="dialog">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title">Publish Quiz</h5>
                            <button type="button" class="btn-close btn-close-white" @click="showPublishModal = false"></button>
                        </div>
                        <div class="modal-body" v-if="quizToPublish">
                            <p>Are you sure you want to publish the quiz <strong>{{ quizToPublish.title }}</strong>?</p>
                            <p>Once published, students will be able to take this quiz.</p>
                            
                            <div class="alert alert-warning" v-if="!hasQuestions(quizToPublish)">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                <strong>Warning:</strong> This quiz doesn't have any questions yet. Students won't be able to submit meaningful attempts.
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showPublishModal = false">Cancel</button>
                            <button type="button" class="btn btn-success" @click="publishQuiz" :disabled="loading">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Publish Quiz
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-backdrop fade" :class="{ 'show': showPublishModal }" v-if="showPublishModal"></div>

            <!-- Delete Quiz Modal -->
            <div class="modal fade" :class="{ 'show d-block': showDeleteModal }" tabindex="-1" role="dialog">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title">Delete Quiz</h5>
                            <button type="button" class="btn-close btn-close-white" @click="showDeleteModal = false"></button>
                        </div>
                        <div class="modal-body" v-if="quizToDelete">
                            <p>Are you sure you want to delete the quiz <strong>{{ quizToDelete.title }}</strong>?</p>
                            <p class="text-danger"><strong>Warning:</strong> This will also delete all questions and student attempts associated with this quiz. This action cannot be undone.</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">Cancel</button>
                            <button type="button" class="btn btn-danger" @click="deleteQuiz" :disabled="loading">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Delete Quiz
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-backdrop fade" :class="{ 'show': showDeleteModal }" v-if="showDeleteModal"></div>
        </div>
    `
}