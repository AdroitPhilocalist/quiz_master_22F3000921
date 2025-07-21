export default {
    data() {
        return {
            quizzes: [],
            chapters: [],
            subjects: [],
            loading: false,
            error: null,
            searchQuery: '',
            sortBy: 'title',
            sortDesc: false,
            selectedChapter: null,
            selectedSubject: null,
            showDeleteModal: false,
            quizToDelete: null,
            showEditModal: false,
            editingQuiz: null,
            showAddModal: false,
            newQuiz: {
                title: '',
                description: '',
                time_limit: 600,
                chapter_id: null,
                is_published: false
            },
            animateItems: false,
            stats: {
                totalQuizzes: 0,
                publishedQuizzes: 0,
                avgTimeLimit: 0,
                quizzesPerChapter: {}
            },
            filters: {
                publishStatus: 'all' // 'all', 'published', 'draft'
            }
        }
    },
    created() {
        this.fetchSubjects();
        this.fetchChapters();
        this.fetchQuizzes();
        
        // Add animation delay
        setTimeout(() => {
            this.animateItems = true;
        }, 100);
    },
    computed: {
        filteredQuizzes() {
            let filtered = this.quizzes;
            
            // Filter by search query
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                filtered = filtered.filter(quiz => 
                    quiz.title.toLowerCase().includes(query) || 
                    quiz.description?.toLowerCase().includes(query)
                );
            }
            
            // Filter by selected chapter
            if (this.selectedChapter) {
                filtered = filtered.filter(quiz => quiz.chapter_id === this.selectedChapter);
            }
            
            // Filter by selected subject
            if (this.selectedSubject) {
                const chaptersInSubject = this.chapters
                    .filter(chapter => chapter.subject_id === this.selectedSubject)
                    .map(chapter => chapter.id);
                filtered = filtered.filter(quiz => chaptersInSubject.includes(quiz.chapter_id));
            }
            
            // Filter by publish status
            if (this.filters.publishStatus === 'published') {
                filtered = filtered.filter(quiz => quiz.is_published);
            } else if (this.filters.publishStatus === 'draft') {
                filtered = filtered.filter(quiz => !quiz.is_published);
            }
            
            return filtered;
        },
        sortedQuizzes() {
            const quizzes = [...this.filteredQuizzes];
            return quizzes.sort((a, b) => {
                let modifier = this.sortDesc ? -1 : 1;
                if (a[this.sortBy] < b[this.sortBy]) return -1 * modifier;
                if (a[this.sortBy] > b[this.sortBy]) return 1 * modifier;
                return 0;
            });
        },
        groupedQuizzes() {
            const grouped = {};
            this.chapters.forEach(chapter => {
                grouped[chapter.id] = this.sortedQuizzes.filter(
                    quiz => quiz.chapter_id === chapter.id
                );
            });
            return grouped;
        },
        chapterOptions() {
            if (!this.selectedSubject) {
                return this.chapters;
            }
            return this.chapters.filter(chapter => chapter.subject_id === this.selectedSubject);
        }
    },
    methods: {
        showToast(message, title = "Notification", variant = "success") {
            const toastEl = document.createElement("div");
            toastEl.className = `toast align-items-center text-white bg-${variant} border-0`;
            toastEl.setAttribute("role", "alert");
            toastEl.setAttribute("aria-live", "assertive");
            toastEl.setAttribute("aria-atomic", "true");
            toastEl.innerHTML = `
              <div class="d-flex">
                  <div class="toast-body">
                      <strong>${title}:</strong> ${message}
                  </div>
                  <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
              </div>
          `;
            let toastContainer = document.querySelector(".toast-container");
            if (!toastContainer) {
              toastContainer = document.createElement("div");
              toastContainer.className =
                "toast-container position-fixed top-0 end-0 p-3";
              toastContainer.style.zIndex = "1100";
              document.body.appendChild(toastContainer);
            }
      
            // Add toast to container
            toastContainer.appendChild(toastEl);
      
            // Initialize Bootstrap toast
            const toast = new bootstrap.Toast(toastEl, {
              autohide: true,
              delay: 3000,
            });
      
            // Show toast
            toast.show();
      
            // Remove toast element after it's hidden
            toastEl.addEventListener("hidden.bs.toast", () => {
              toastEl.remove();
            });
        },
        async fetchSubjects() {
            try {
                const response = await axios.get('/api/subjects', {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                this.subjects = response.data;
            } catch (error) {
                console.error('Failed to load subjects:', error);
            }
        },
        async fetchChapters() {
            try {
                const response = await axios.get('/api/chapters', {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                this.chapters = response.data;
            } catch (error) {
                console.error('Failed to load chapters:', error);
            }
        },
        async fetchQuizzes() {
            this.loading = true;
            try {
                const response = await axios.get('/api/quizzes', {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                this.quizzes = response.data;
                
                // Calculate stats
                this.stats.totalQuizzes = this.quizzes.length;
                this.stats.publishedQuizzes = this.quizzes.filter(quiz => quiz.is_published).length;
                
                let totalTimeLimit = 0;
                this.quizzes.forEach(quiz => {
                    totalTimeLimit += quiz.time_limit;
                    
                    if (!this.stats.quizzesPerChapter[quiz.chapter_id]) {
                        this.stats.quizzesPerChapter[quiz.chapter_id] = 0;
                    }
                    this.stats.quizzesPerChapter[quiz.chapter_id]++;
                });
                
                this.stats.avgTimeLimit = this.quizzes.length ? Math.round(totalTimeLimit / this.quizzes.length / 60) : 0;
                
            } catch (error) {
                this.error = 'Failed to load quizzes';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        getChapterName(chapterId) {
            const chapter = this.chapters.find(c => c.id === chapterId);
            return chapter ? chapter.name : 'Unknown Chapter';
        },
        getSubjectForChapter(chapterId) {
            const chapter = this.chapters.find(c => c.id === chapterId);
            if (!chapter) return null;
            
            const subject = this.subjects.find(s => s.id === chapter.subject_id);
            return subject ? subject.name : 'Unknown Subject';
        },
        getChapterColor(chapterId) {
            // Generate a consistent color based on chapter ID
            const colors = [
                'primary', 'success', 'danger', 'warning', 'info', 
                'secondary', 'dark', 'primary-subtle', 'success-subtle', 'danger-subtle'
            ];
            return colors[chapterId % colors.length];
        },
        formatTimeLimit(seconds) {
            const minutes = Math.floor(seconds / 60);
            return `${minutes} min`;
        },
        openAddModal() {
            this.newQuiz = {
                title: '',
                description: '',
                time_limit: 600,
                chapter_id: this.selectedChapter || (this.chapterOptions.length > 0 ? this.chapterOptions[0].id : null),
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
                await axios.post('/api/quizzes', this.newQuiz, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token'),
                        'Content-Type': 'application/json'
                    }
                });
                this.showAddModal = false;
                this.fetchQuizzes();
                this.showToast('Quiz added successfully', 'Success', 'success');
            } catch (error) {
                this.error = 'Failed to add quiz';
                console.error(error);
                this.showToast('Failed to add quiz', 'Error', 'danger');
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
                    chapter_id: this.editingQuiz.chapter_id,
                    is_published: this.editingQuiz.is_published
                }, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token'),
                        'Content-Type': 'application/json'
                    }
                });
                this.showEditModal = false;
                this.fetchQuizzes();
                this.showToast('Quiz updated successfully', 'Success', 'success');
            } catch (error) {
                this.error = 'Failed to update quiz';
                console.error(error);
                this.showToast('Failed to update quiz', 'Error', 'danger');
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
                this.showToast('Quiz deleted successfully', 'Success', 'success');
            } catch (error) {
                this.error = 'Failed to delete quiz';
                console.error(error);
                this.showToast('Failed to delete quiz', 'Error', 'danger');
            } finally {
                this.loading = false;
            }
        },
        async togglePublishStatus(quiz) {
            this.loading = true;
            try {
                await axios.put(`/api/quizzes/${quiz.id}`, {
                    is_published: !quiz.is_published
                }, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token'),
                        'Content-Type': 'application/json'
                    }
                });
                this.fetchQuizzes();
                this.showToast(
                    `Quiz ${!quiz.is_published ? 'published' : 'unpublished'} successfully`, 
                    'Success', 
                    'success'
                );
            } catch (error) {
                this.error = 'Failed to update quiz';
                console.error(error);
                this.showToast('Failed to update quiz', 'Error', 'danger');
            } finally {
                this.loading = false;
            }
        },
        viewQuestions(quizId) {
            this.$router.push(`/admin/quizzes/${quizId}/questions`);
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
        onSubjectChange() {
            // Reset chapter selection when subject changes
            this.selectedChapter = null;
        }
    },
    template: `
        <div class="container-fluid py-4">
            <!-- Stats Cards -->
            <div class="row mb-4">
                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card border-left-primary shadow h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                        Total Quizzes</div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.totalQuizzes }}</div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-clipboard-list fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card border-left-success shadow h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                                        Published Quizzes</div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.publishedQuizzes }}</div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-check-circle fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card border-left-info shadow h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                                        Avg Time Limit
                                    </div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800">
                                        {{ stats.avgTimeLimit }} min
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-clock fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card border-left-warning shadow h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                        Draft Quizzes</div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800">
                                        {{ stats.totalQuizzes - stats.publishedQuizzes }}
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-edit fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-12">
                    <div class="card shadow-sm border-0 mb-4">
                        <div class="card-header bg-gradient-primary text-white py-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Quiz Management</h5>
                                <div class="d-flex">
                                    <div class="input-group me-2" style="width: 250px;">
                                        <input type="text" class="form-control" placeholder="Search quizzes..." v-model="searchQuery">
                                        <button class="btn btn-light" type="button">
                                            <i class="fas fa-search"></i>
                                        </button>
                                    </div>
                                    <select class="form-select me-2" v-model="selectedSubject" @change="onSubjectChange" style="width: 180px;">
                                        <option :value="null">All Subjects</option>
                                        <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                                            {{ subject.name }}
                                        </option>
                                    </select>
                                    <select class="form-select me-2" v-model="selectedChapter" style="width: 180px;">
                                        <option :value="null">All Chapters</option>
                                        <option v-for="chapter in chapterOptions" :key="chapter.id" :value="chapter.id">
                                            {{ chapter.name }}
                                        </option>
                                    </select>
                                    <select class="form-select me-2" v-model="filters.publishStatus" style="width: 150px;">
                                        <option value="all">All Status</option>
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                    </select>
                                    <button class="btn btn-light" @click="openAddModal">
                                        <i class="fas fa-plus me-1"></i> Add Quiz
                                    </button>
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
                            <div v-else-if="quizzes.length === 0" class="text-center py-5">
                                <i class="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                                <h4>No Quizzes Found</h4>
                                <p class="text-muted">Start by adding your first quiz</p>
                                <button @click="openAddModal" class="btn btn-primary mt-2">
                                    <i class="fas fa-plus me-1"></i> Add Quiz
                                </button>
                            </div>
                            <div v-else>
                                <!-- Grouped by Chapter View -->
                                <div v-if="selectedChapter === null && selectedSubject === null">
                                    <div v-for="chapter in chapters" :key="chapter.id" class="mb-4">
                                        <div v-if="groupedQuizzes[chapter.id] && groupedQuizzes[chapter.id].length > 0">
                                            <div class="d-flex align-items-center mb-2">
                                                <h5 class="mb-0">
                                                    <span class="badge bg-gradient-{{ getChapterColor(chapter.id) }} me-2">
                                                        {{ chapter.name }}
                                                    </span>
                                                    <small class="text-muted">{{ getSubjectForChapter(chapter.id) }}</small>
                                                </h5>
                                                <div class="ms-auto">
                                                    <span class="badge bg-light text-dark">
                                                        {{ groupedQuizzes[chapter.id]?.length || 0 }} Quizzes
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div class="table-responsive">
                                                <table class="table table-hover align-middle">
                                                    <thead class="table-light">
                                                        <tr>
                                                            <th @click="sortTable('title')" style="cursor: pointer; width: 25%">
                                                                Title <i :class="'fas ' + getSortIcon('title')"></i>
                                                            </th>
                                                            <th @click="sortTable('description')" style="cursor: pointer; width: 30%">
                                                                Description <i :class="'fas ' + getSortIcon('description')"></i>
                                                            </th>
                                                            <th @click="sortTable('time_limit')" style="cursor: pointer; width: 10%">
                                                                Time <i :class="'fas ' + getSortIcon('time_limit')"></i>
                                                            </th>
                                                            <th @click="sortTable('is_published')" style="cursor: pointer; width: 10%">
                                                                Status <i :class="'fas ' + getSortIcon('is_published')"></i>
                                                            </th>
                                                            <th style="width: 25%">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr v-for="quiz in groupedQuizzes[chapter.id]" :key="quiz.id" 
                                                            :class="{'animate__animated animate__fadeIn': animateItems}"
                                                            style="transition: all 0.3s ease;">
                                                            <td>
                                                                <div class="d-flex align-items-center">
                                                                    <div class="avatar avatar-sm bg-gradient-{{ getChapterColor(chapter.id) }} rounded-circle me-2">
                                                                        <span class="avatar-text">{{ quiz.title.charAt(0) }}</span>
                                                                    </div>
                                                                    <div>{{ quiz.title }}</div>
                                                                </div>
                                                            </td>
                                                            <td>{{ quiz.description || 'No description' }}</td>
                                                            <td>{{ formatTimeLimit(quiz.time_limit) }}</td>
                                                            <td>
                                                                <span class="badge" :class="quiz.is_published ? 'bg-success' : 'bg-secondary'">
                                                                    {{ quiz.is_published ? 'Published' : 'Draft' }}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div class="btn-group">
                                                                    <button class="btn btn-sm btn-primary" @click="viewQuestions(quiz.id)">
                                                                        <i class="fas fa-list me-1"></i> Questions
                                                                    </button>
                                                                    <button class="btn btn-sm" 
                                                                        :class="quiz.is_published ? 'btn-warning' : 'btn-success'"
                                                                        @click="togglePublishStatus(quiz)">
                                                                        <i class="fas" :class="quiz.is_published ? 'fa-eye-slash' : 'fa-eye'"></i>
                                                                    </button>
                                                                    <button class="btn btn-sm btn-info" @click="openEditModal(quiz)">
                                                                        <i class="fas fa-edit"></i>
                                                                    </button>
                                                                    <button class="btn btn-sm btn-danger" @click="openDeleteModal(quiz)">
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
                            
                            <!-- Regular Table View (when chapter or subject is selected) -->
                            <div v-else class="table-responsive">
                                <table class="table table-hover align-middle">
                                    <thead class="table-light">
                                        <tr>
                                            <th @click="sortTable('title')" style="cursor: pointer; width: 20%">
                                                Title <i :class="'fas ' + getSortIcon('title')"></i>
                                            </th>
                                            <th v-if="!selectedChapter" @click="sortTable('chapter_id')" style="cursor: pointer; width: 15%">
                                                Chapter <i :class="'fas ' + getSortIcon('chapter_id')"></i>
                                            </th>
                                            <th @click="sortTable('description')" style="cursor: pointer; width: 25%">
                                                Description <i :class="'fas ' + getSortIcon('description')"></i>
                                            </th>
                                            <th @click="sortTable('time_limit')" style="cursor: pointer; width: 10%">
                                                Time <i :class="'fas ' + getSortIcon('time_limit')"></i>
                                            </th>
                                            <th @click="sortTable('is_published')" style="cursor: pointer; width: 10%">
                                                Status <i :class="'fas ' + getSortIcon('is_published')"></i>
                                            </th>
                                            <th style="width: 20%">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="quiz in sortedQuizzes" :key="quiz.id" 
                                            :class="{'animate__animated animate__fadeIn': animateItems}"
                                            style="transition: all 0.3s ease;">
                                            <td>
                                                <div class="d-flex align-items-center">
                                                    <div class="avatar avatar-sm bg-gradient-{{ getChapterColor(quiz.chapter_id) }} rounded-circle me-2">
                                                        <span class="avatar-text">{{ quiz.title.charAt(0) }}</span>
                                                    </div>
                                                    <div>{{ quiz.title }}</div>
                                                </div>
                                            </td>
                                            <td v-if="!selectedChapter">{{ getChapterName(quiz.chapter_id) }}</td>
                                            <td>{{ quiz.description || 'No description' }}</td>
                                            <td>{{ formatTimeLimit(quiz.time_limit) }}</td>
                                            <td>
                                                <span class="badge" :class="quiz.is_published ? 'bg-success' : 'bg-secondary'">
                                                    {{ quiz.is_published ? 'Published' : 'Draft' }}
                                                </span>
                                            </td>
                                            <td>
                                                <div class="btn-group">
                                                    <button class="btn btn-sm btn-primary" @click="viewQuestions(quiz.id)">
                                                        <i class="fas fa-list me-1"></i> Questions
                                                    </button>
                                                    <button class="btn btn-sm" 
                                                        :class="quiz.is_published ? 'btn-warning' : 'btn-success'"
                                                        @click="togglePublishStatus(quiz)">
                                                        <i class="fas" :class="quiz.is_published ? 'fa-eye-slash' : 'fa-eye'"></i>
                                                    </button>
                                                    <button class="btn btn-sm btn-info" @click="openEditModal(quiz)">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn btn-sm btn-danger" @click="openDeleteModal(quiz)">
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
            <div class="modal fade" :class="{ show: showAddModal }" tabindex="-1" 
                 :style="{ display: showAddModal ? 'block' : 'none' }">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-gradient-primary text-white">
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
                                <label for="quizChapter" class="form-label">Chapter</label>
                                <select class="form-select" id="quizChapter" v-model="newQuiz.chapter_id" required>
                                    <option v-for="chapter in chapterOptions" :key="chapter.id" :value="chapter.id">
                                        {{ chapter.name }}
                                    </option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="quizTimeLimit" class="form-label">Time Limit (minutes)</label>
                                <input type="number" class="form-control" id="quizTimeLimit" v-model.number="newQuiz.time_limit" min="1" max="180" step="1">
                                <div class="form-text">Time in minutes (1-180)</div>
                            </div>
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" id="quizPublished" v-model="newQuiz.is_published">
                                <label class="form-check-label" for="quizPublished">
                                    Publish quiz immediately
                                </label>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showAddModal = false">Cancel</button>
                            <button type="button" class="btn btn-primary" @click="addQuiz" :disabled="!newQuiz.title || !newQuiz.chapter_id">
                                <i class="fas fa-plus me-1"></i> Add Quiz
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Edit Quiz Modal -->
            <div class="modal fade" :class="{ show: showEditModal }" tabindex="-1" 
                 :style="{ display: showEditModal ? 'block' : 'none' }">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-gradient-info text-white">
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
                                <label for="editQuizChapter" class="form-label">Chapter</label>
                                <select class="form-select" id="editQuizChapter" v-model="editingQuiz.chapter_id" required>
                                    <option v-for="chapter in chapters" :key="chapter.id" :value="chapter.id">
                                        {{ chapter.name }}
                                    </option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="editQuizTimeLimit" class="form-label">Time Limit (minutes)</label>
                                <input type="number" class="form-control" id="editQuizTimeLimit" 
                                       v-model.number="editingQuiz.time_limit" min="1" max="180" step="1">
                                <div class="form-text">Time in minutes (1-180)</div>
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
                            <button type="button" class="btn btn-info" @click="updateQuiz" 
                                    :disabled="!editingQuiz || !editingQuiz.title || !editingQuiz.chapter_id">
                                <i class="fas fa-save me-1"></i> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Delete Quiz Modal -->
            <div class="modal fade" :class="{ show: showDeleteModal }" tabindex="-1" 
                 :style="{ display: showDeleteModal ? 'block' : 'none' }">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-gradient-danger text-white">
                            <h5 class="modal-title">Delete Quiz</h5>
                            <button type="button" class="btn-close btn-close-white" @click="showDeleteModal = false"></button>
                        </div>
                        <div class="modal-body" v-if="quizToDelete">
                            <p>Are you sure you want to delete the quiz <strong>{{ quizToDelete.title }}</strong>?</p>
                            <p class="text-danger">
                                <i class="fas fa-exclamation-triangle me-1"></i> 
                                This action cannot be undone. All associated questions and student attempts will also be deleted.
                            </p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">Cancel</button>
                            <button type="button" class="btn btn-danger" @click="deleteQuiz">
                                <i class="fas fa-trash me-1"></i> Delete Quiz
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Modal Backdrop -->
            <div class="modal-backdrop fade show" 
                 v-if="showAddModal || showEditModal || showDeleteModal"
                 @click="showAddModal = showEditModal = showDeleteModal = false"></div>
        </div>
    `
}