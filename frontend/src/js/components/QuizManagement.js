export default {
    props: ['chapterId'],
    data() {
        return {
            quizzes: [],
            loading: false,
            error: null,
            newQuiz: {
                title: '',
                description: '',
                time_limit: 30,
                is_published: false
            },
            editingQuiz: null,
            showAddModal: false,
            showEditModal: false,
            showDeleteModal: false,
            quizToDelete: null,
            chapterName: '',
            searchQuery: '',
            sortBy: 'title',
            sortDesc: false,
            animateItems: false
        }
    },
    created() {
        this.fetchQuizzes();
        this.fetchChapterName();
        // Add animation delay
        setTimeout(() => {
            this.animateItems = true;
        }, 100);
    },
    computed: {
        filteredQuizzes() {
            if (!this.searchQuery) return this.quizzes;
            const query = this.searchQuery.toLowerCase();
            return this.quizzes.filter(quiz => 
                quiz.title.toLowerCase().includes(query) || 
                (quiz.description && quiz.description.toLowerCase().includes(query))
            );
        },
        sortedQuizzes() {
            const quizzes = [...this.filteredQuizzes];
            return quizzes.sort((a, b) => {
                let modifier = this.sortDesc ? -1 : 1;
                if (a[this.sortBy] < b[this.sortBy]) return -1 * modifier;
                if (a[this.sortBy] > b[this.sortBy]) return 1 * modifier;
                return 0;
            });
        }
    },
    methods: {
        async fetchChapterName() {
            if (!this.chapterId) return;
            
            try {
                const response = await axios.get(`/api/chapters/${this.chapterId}`, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                this.chapterName = response.data.name;
            } catch (error) {
                console.error('Failed to fetch chapter name:', error);
            }
        },
        async fetchQuizzes() {
            this.loading = true;
            try {
                const url = this.chapterId 
                    ? `/api/chapters/${this.chapterId}/quizzes` 
                    : '/api/quizzes';
                
                const response = await axios.get(url, {
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
                time_limit: 30,
                is_published: false
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
        async addQuiz() {
            this.loading = true;
            try {
                const url = this.chapterId 
                    ? `/api/chapters/${this.chapterId}/quizzes` 
                    : '/api/quizzes';
                
                await axios.post(url, {
                    title: this.newQuiz.title,
                    description: this.newQuiz.description,
                    time_limit: this.newQuiz.time_limit,
                    is_published: this.newQuiz.is_published,
                    chapter_id: this.chapterId
                }, {
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
                    is_published: this.editingQuiz.is_published,
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
        viewQuestions(quizId) {
            this.$router.push(`/admin/quizzes/${quizId}/questions`);
        },
        togglePublishStatus(quiz) {
            this.editingQuiz = { ...quiz, is_published: !quiz.is_published };
            this.updateQuiz();
        },
        goBack() {
            this.$router.push(this.chapterId ? `/admin/chapters/${this.chapterId}` : '/admin/quizzes');
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
        },
        formatTimeLimit(minutes) {
            if (minutes < 60) {
                return `${minutes} minutes`;
            } else {
                const hours = Math.floor(minutes / 60);
                const remainingMinutes = minutes % 60;
                return `${hours} hour${hours > 1 ? 's' : ''}${remainingMinutes ? ` ${remainingMinutes} min` : ''}`;
            }
        }
    },
    template: `
        <div class="container-fluid px-4">
            <div class="d-sm-flex align-items-center justify-content-between mb-4">
                <div>
                    <button @click="goBack" class="btn btn-outline-primary me-2">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h1 class="h3 mb-0 text-gray-800 d-inline-block">
                        {{ chapterName ? chapterName + ' - Quizzes' : 'All Quizzes' }}
                    </h1>
                </div>
                <button @click="openAddModal" class="btn btn-primary shadow-sm">
                    <i class="fas fa-plus fa-sm text-white-50 me-1"></i> Add New Quiz
                </button>
            </div>
            
            <div class="card shadow mb-4 border-0">
                <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between bg-gradient-primary text-white">
                    <h6 class="m-0 font-weight-bold">Manage Quizzes</h6>
                    <div class="input-group w-50">
                        <input type="text" class="form-control" placeholder="Search quizzes..." v-model="searchQuery">
                        <button class="btn btn-light" type="button">
                            <i class="fas fa-search"></i>
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
                        <div class="empty-state">
                            <i class="fas fa-clipboard-list fa-4x text-gray-300 mb-3"></i>
                            <h5>No Quizzes Found</h5>
                            <p class="text-muted">Start by adding your first quiz</p>
                            <button @click="openAddModal" class="btn btn-primary mt-2">
                                <i class="fas fa-plus me-1"></i> Add Quiz
                            </button>
                        </div>
                    </div>
                    
                    <div v-else>
                        <div class="row">
                            <div v-for="quiz in sortedQuizzes" :key="quiz.id" class="col-xl-4 col-md-6 mb-4">
                                <div class="card border-left-primary shadow h-100 py-2" 
                                     :class="{'animate__animated animate__fadeIn': animateItems, 'border-left-success': quiz.is_published}">
                                    <div class="card-body">
                                        <div class="row no-gutters align-items-center">
                                            <div class="col mr-2">
                                                <div class="d-flex justify-content-between">
                                                    <div class="text-xs font-weight-bold text-uppercase mb-1" 
                                                         :class="quiz.is_published ? 'text-success' : 'text-primary'">
                                                        {{ quiz.is_published ? 'Published' : 'Draft' }}
                                                    </div>
                                                    <div class="text-xs text-muted">
                                                        {{ formatTimeLimit(quiz.time_limit) }}
                                                    </div>
                                                </div>
                                                <div class="h5 mb-0 font-weight-bold text-gray-800">{{ quiz.title }}</div>
                                                <p class="mt-2 mb-1 text-gray-600">{{ quiz.description || 'No description' }}</p>
                                                <small class="text-muted">Created: {{ formatDate(quiz.created_at) }}</small>
                                            </div>
                                        </div>
                                        <div class="mt-3 d-flex justify-content-between">
                                            <button @click="viewQuestions(quiz.id)" class="btn btn-sm btn-info">
                                                <i class="fas fa-question-circle me-1"></i> Questions
                                            </button>
                                            <div>
                                                <button @click="togglePublishStatus(quiz)" class="btn btn-sm" 
                                                        :class="quiz.is_published ? 'btn-warning' : 'btn-success'">
                                                    <i class="fas" :class="quiz.is_published ? 'fa-eye-slash' : 'fa-eye'"></i>
                                                    {{ quiz.is_published ? 'Unpublish' : 'Publish' }}
                                                </button>
                                                <button @click="openEditModal(quiz)" class="btn btn-sm btn-primary ms-1">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button @click="openDeleteModal(quiz)" class="btn btn-sm btn-danger ms-1">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Add Quiz Modal -->
            <div class="modal fade" :class="{ show: showAddModal }" tabindex="-1" role="dialog" 
                 :style="{ display: showAddModal ? 'block' : 'none' }">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">Add New Quiz</h5>
                            <button type="button" class="btn-close btn-close-white" @click="showAddModal = false"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="quizTitle" class="form-label">Quiz Title</label>
                                <input type="text" class="form-control" id="quizTitle" v-model="newQuiz.title" required>
                            </div>
                            <div class="mb-3">
                                <label for="quizDescription" class="form-label">Description</label>
                                <textarea class="form-control" id="quizDescription" v-model="newQuiz.description" rows="3"></textarea>
                            </div>
                            <div class="mb-3">
                                <label for="quizTimeLimit" class="form-label">Time Limit (minutes)</label>
                                <input type="number" class="form-control" id="quizTimeLimit" v-model="newQuiz.time_limit" min="1" required>
                            </div>
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" id="quizPublished" v-model="newQuiz.is_published">
                                <label class="form-check-label" for="quizPublished">
                                    Publish immediately
                                </label>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showAddModal = false">Cancel</button>
                            <button type="button" class="btn btn-primary" @click="addQuiz" :disabled="loading">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Add Quiz
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="showAddModal" class="modal-backdrop fade show"></div>
            
            <!-- Edit Quiz Modal -->
            <div class="modal fade" :class="{ show: showEditModal }" tabindex="-1" role="dialog" 
                 :style="{ display: showEditModal ? 'block' : 'none' }">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">Edit Quiz</h5>
                            <button type="button" class="btn-close btn-close-white" @click="showEditModal = false"></button>
                        </div>
                        <div class="modal-body" v-if="editingQuiz">
                            <div class="mb-3">
                                <label for="editQuizTitle" class="form-label">Quiz Title</label>
                                <input type="text" class="form-control" id="editQuizTitle" v-model="editingQuiz.title" required>
                            </div>
                            <div class="mb-3">
                                <label for="editQuizDescription" class="form-label">Description</label>
                                <textarea class="form-control" id="editQuizDescription" v-model="editingQuiz.description" rows="3"></textarea>
                            </div>
                            <div class="mb-3">
                                <label for="editQuizTimeLimit" class="form-label">Time Limit (minutes)</label>
                                <input type="number" class="form-control" id="editQuizTimeLimit" v-model="editingQuiz.time_limit" min="1" required>
                            </div>
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" id="editQuizPublished" v-model="editingQuiz.is_published">
                                <label class="form-check-label" for="editQuizPublished">
                                    Published
                                </label>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showEditModal = false">Cancel</button>
                            <button type="button" class="btn btn-primary" @click="updateQuiz" :disabled="loading">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="showEditModal" class="modal-backdrop fade show"></div>
            
            <!-- Delete Quiz Modal -->
            <div class="modal fade" :class="{ show: showDeleteModal }" tabindex="-1" role="dialog" 
                 :style="{ display: showDeleteModal ? 'block' : 'none' }">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title">Delete Quiz</h5>
                            <button type="button" class="btn-close btn-close-white" @click="showDeleteModal = false"></button>
                        </div>
                        <div class="modal-body" v-if="quizToDelete">
                            <p>Are you sure you want to delete the quiz <strong>{{ quizToDelete.title }}</strong>?</p>
                            <p class="text-danger"><i class="fas fa-exclamation-triangle me-1"></i> This action cannot be undone and will delete all associated questions and student attempts.</p>
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
            <div v-if="showDeleteModal" class="modal-backdrop fade show"></div>
        </div>
    `
}