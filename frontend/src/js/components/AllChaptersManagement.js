export default {
    data() {
        return {
            chapters: [],
            subjects: [],
            loading: false,
            error: null,
            searchQuery: '',
            sortBy: 'name',
            sortDesc: false,
            selectedSubject: null,
            showDeleteModal: false,
            chapterToDelete: null,
            showEditModal: false,
            editingChapter: null,
            showAddModal: false,
            newChapter: {
                name: '',
                description: '',
                subject_id: null
            },
            animateItems: false,
            stats: {
                totalChapters: 0,
                chaptersPerSubject: {}
            }
        }
    },
    created() {
        this.fetchSubjects();
        this.fetchChapters();
        // Add animation delay
        setTimeout(() => {
            this.animateItems = true;
        }, 100);
    },
    computed: {
        filteredChapters() {
            let filtered = this.chapters;
            
            // Filter by search query
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                filtered = filtered.filter(chapter => 
                    chapter.name.toLowerCase().includes(query) || 
                    chapter.description?.toLowerCase().includes(query)
                );
            }
            
            // Filter by selected subject
            if (this.selectedSubject) {
                filtered = filtered.filter(chapter => chapter.subject_id === this.selectedSubject);
            }
            
            return filtered;
        },
        sortedChapters() {
            const chapters = [...this.filteredChapters];
            return chapters.sort((a, b) => {
                let modifier = this.sortDesc ? -1 : 1;
                if (a[this.sortBy] < b[this.sortBy]) return -1 * modifier;
                if (a[this.sortBy] > b[this.sortBy]) return 1 * modifier;
                return 0;
            });
        },
        groupedChapters() {
            const grouped = {};
            this.subjects.forEach(subject => {
                grouped[subject.id] = this.sortedChapters.filter(
                    chapter => chapter.subject_id === subject.id
                );
            });
            return grouped;
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
            this.loading = true;
            try {
                const response = await axios.get('/api/chapters', {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                this.chapters = response.data;
                
                // Calculate stats
                this.stats.totalChapters = this.chapters.length;
                this.stats.chaptersPerSubject = {};
                
                this.chapters.forEach(chapter => {
                    if (!this.stats.chaptersPerSubject[chapter.subject_id]) {
                        this.stats.chaptersPerSubject[chapter.subject_id] = 0;
                    }
                    this.stats.chaptersPerSubject[chapter.subject_id]++;
                });
                
            } catch (error) {
                this.error = 'Failed to load chapters';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        getSubjectName(subjectId) {
            const subject = this.subjects.find(s => s.id === subjectId);
            return subject ? subject.name : 'Unknown Subject';
        },
        getSubjectColor(subjectId) {
            // Generate a consistent color based on subject ID
            const colors = [
                'primary', 'success', 'danger', 'warning', 'info', 
                'secondary', 'dark', 'primary-subtle', 'success-subtle', 'danger-subtle'
            ];
            return colors[subjectId % colors.length];
        },
        openAddModal() {
            this.newChapter = {
                name: '',
                description: '',
                subject_id: this.selectedSubject || (this.subjects.length > 0 ? this.subjects[0].id : null)
            };
            this.showAddModal = true;
        },
        openEditModal(chapter) {
            this.editingChapter = { ...chapter };
            this.showEditModal = true;
        },
        openDeleteModal(chapter) {
            this.chapterToDelete = chapter;
            this.showDeleteModal = true;
        },
        async addChapter() {
            this.loading = true;
            try {
                await axios.post('/api/chapters', this.newChapter, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token'),
                        'Content-Type': 'application/json'
                    }
                });
                this.showAddModal = false;
                this.fetchChapters();
                this.showToast('Chapter added successfully', 'Success', 'success');
            } catch (error) {
                this.error = 'Failed to add chapter';
                console.error(error);
                this.showToast('Failed to add chapter', 'Error', 'danger');
            } finally {
                this.loading = false;
            }
        },
        async updateChapter() {
            this.loading = true;
            try {
                await axios.put(`/api/chapters/${this.editingChapter.id}`, {
                    name: this.editingChapter.name,
                    description: this.editingChapter.description,
                    subject_id: this.editingChapter.subject_id
                }, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token'),
                        'Content-Type': 'application/json'
                    }
                });
                this.showEditModal = false;
                this.fetchChapters();
                this.showToast('Chapter updated successfully', 'Success', 'success');
            } catch (error) {
                this.error = 'Failed to update chapter';
                console.error(error);
                this.showToast('Failed to update chapter', 'Error', 'danger');
            } finally {
                this.loading = false;
            }
        },
        async deleteChapter() {
            this.loading = true;
            try {
                await axios.delete(`/api/chapters/${this.chapterToDelete.id}`, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                this.showDeleteModal = false;
                this.fetchChapters();
                this.showToast('Chapter deleted successfully', 'Success', 'success');
            } catch (error) {
                this.error = 'Failed to delete chapter';
                console.error(error);
                this.showToast('Failed to delete chapter', 'Error', 'danger');
            } finally {
                this.loading = false;
            }
        },
        viewQuizzes(chapterId) {
            this.$router.push(`/admin/chapters/${chapterId}/quizzes`);
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
            <!-- Stats Cards -->
            <div class="row mb-4">
                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card border-left-primary shadow h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                        Total Chapters</div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800">{{ stats.totalChapters }}</div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-book fa-2x text-gray-300"></i>
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
                                        Total Subjects</div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800">{{ subjects.length }}</div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-graduation-cap fa-2x text-gray-300"></i>
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
                                        Avg Chapters per Subject
                                    </div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800">
                                        {{ subjects.length ? (stats.totalChapters / subjects.length).toFixed(1) : 0 }}
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-clipboard-list fa-2x text-gray-300"></i>
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
                                        Most Chapters in Subject</div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800">
                                        {{ Object.values(stats.chaptersPerSubject).length ? Math.max(...Object.values(stats.chaptersPerSubject)) : 0 }}
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-trophy fa-2x text-gray-300"></i>
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
                                <h5 class="mb-0">Chapter Management</h5>
                                <div class="d-flex">
                                    <div class="input-group me-2" style="width: 250px;">
                                        <input type="text" class="form-control" placeholder="Search chapters..." v-model="searchQuery">
                                        <button class="btn btn-light" type="button">
                                            <i class="fas fa-search"></i>
                                        </button>
                                    </div>
                                    <select class="form-select me-2" v-model="selectedSubject" style="width: 200px;">
                                        <option :value="null">All Subjects</option>
                                        <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                                            {{ subject.name }}
                                        </option>
                                    </select>
                                    <button class="btn btn-light" @click="openAddModal">
                                        <i class="fas fa-plus me-1"></i> Add Chapter
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
                            <div v-else-if="chapters.length === 0" class="text-center py-5">
                                <i class="fas fa-book fa-3x text-muted mb-3"></i>
                                <h4>No Chapters Found</h4>
                                <p class="text-muted">Start by adding your first chapter</p>
                                <button @click="openAddModal" class="btn btn-primary mt-2">
                                    <i class="fas fa-plus me-1"></i> Add Chapter
                                </button>
                            </div>
                            <div v-else>
                                <!-- Grouped by Subject View -->
                                <div v-if="selectedSubject === null">
                                    <div v-for="subject in subjects" :key="subject.id" class="mb-4">
                                        <div class="d-flex align-items-center mb-2">
                                            <h5 class="mb-0">
                                                <span class="badge bg-gradient-{{ getSubjectColor(subject.id) }} me-2">
                                                    {{ subject.name }}
                                                </span>
                                            </h5>
                                            <div class="ms-auto">
                                                <span class="badge bg-light text-dark">
                                                    {{ groupedChapters[subject.id]?.length || 0 }} Chapters
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div class="table-responsive">
                                            <table class="table table-hover align-middle">
                                                <thead class="table-light">
                                                    <tr>
                                                        <th @click="sortTable('name')" style="cursor: pointer;">
                                                            Name <i :class="'fas ' + getSortIcon('name')"></i>
                                                        </th>
                                                        <th @click="sortTable('description')" style="cursor: pointer;">
                                                            Description <i :class="'fas ' + getSortIcon('description')"></i>
                                                        </th>
                                                        <th @click="sortTable('created_at')" style="cursor: pointer;">
                                                            Created <i :class="'fas ' + getSortIcon('created_at')"></i>
                                                        </th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr v-for="chapter in groupedChapters[subject.id]" :key="chapter.id" 
                                                        :class="{'animate__animated animate__fadeIn': animateItems}"
                                                        style="transition: all 0.3s ease;">
                                                        <td>
                                                            <div class="d-flex align-items-center">
                                                                <div class="avatar avatar-sm bg-gradient-{{ getSubjectColor(subject.id) }} rounded-circle me-2">
                                                                    <span class="avatar-text">{{ chapter.name.charAt(0) }}</span>
                                                                </div>
                                                                <div>{{ chapter.name }}</div>
                                                            </div>
                                                        </td>
                                                        <td>{{ chapter.description || 'No description' }}</td>
                                                        <td>{{ formatDate(chapter.created_at) }}</td>
                                                        <td>
                                                            <div class="btn-group">
                                                                <button class="btn btn-sm btn-primary" @click="viewQuizzes(chapter.id)">
                                                                    <i class="fas fa-list me-1"></i> Quizzes
                                                                </button>
                                                                <button class="btn btn-sm btn-info" @click="openEditModal(chapter)">
                                                                    <i class="fas fa-edit"></i>
                                                                </button>
                                                                <button class="btn btn-sm btn-danger" @click="openDeleteModal(chapter)">
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
                                
                                <!-- Regular Table View (when subject is selected) -->
                                <div v-else class="table-responsive">
                                    <table class="table table-hover align-middle">
                                        <thead class="table-light">
                                            <tr>
                                                <th @click="sortTable('name')" style="cursor: pointer;">
                                                    Name <i :class="'fas ' + getSortIcon('name')"></i>
                                                </th>
                                                <th @click="sortTable('description')" style="cursor: pointer;">
                                                    Description <i :class="'fas ' + getSortIcon('description')"></i>
                                                </th>
                                                <th @click="sortTable('created_at')" style="cursor: pointer;">
                                                    Created <i :class="'fas ' + getSortIcon('created_at')"></i>
                                                </th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="chapter in sortedChapters" :key="chapter.id" 
                                                :class="{'animate__animated animate__fadeIn': animateItems}"
                                                style="transition: all 0.3s ease;">
                                                <td>
                                                    <div class="d-flex align-items-center">
                                                        <div class="avatar avatar-sm bg-gradient-{{ getSubjectColor(chapter.subject_id) }} rounded-circle me-2">
                                                            <span class="avatar-text">{{ chapter.name.charAt(0) }}</span>
                                                        </div>
                                                        <div>{{ chapter.name }}</div>
                                                    </div>
                                                </td>
                                                <td>{{ chapter.description || 'No description' }}</td>
                                                <td>{{ formatDate(chapter.created_at) }}</td>
                                                <td>
                                                    <div class="btn-group">
                                                        <button class="btn btn-sm btn-primary" @click="viewQuizzes(chapter.id)">
                                                            <i class="fas fa-list me-1"></i> Quizzes
                                                        </button>
                                                        <button class="btn btn-sm btn-info" @click="openEditModal(chapter)">
                                                            <i class="fas fa-edit"></i>
                                                        </button>
                                                        <button class="btn btn-sm btn-danger" @click="openDeleteModal(chapter)">
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
                
                <!-- Add Chapter Modal -->
                <div class="modal fade" :class="{ show: showAddModal }" tabindex="-1" 
                     :style="{ display: showAddModal ? 'block' : 'none' }">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header bg-gradient-primary text-white">
                                <h5 class="modal-title">Add New Chapter</h5>
                                <button type="button" class="btn-close btn-close-white" @click="showAddModal = false"></button>
                            </div>
                            <div class="modal-body">
                                <div class="mb-3">
                                    <label for="chapterName" class="form-label">Chapter Name</label>
                                    <input type="text" class="form-control" id="chapterName" v-model="newChapter.name" required>
                                </div>
                                <div class="mb-3">
                                    <label for="chapterDescription" class="form-label">Description</label>
                                    <textarea class="form-control" id="chapterDescription" v-model="newChapter.description" rows="3"></textarea>
                                </div>
                                <div class="mb-3">
                                    <label for="subjectSelect" class="form-label">Subject</label>
                                    <select class="form-select" id="subjectSelect" v-model="newChapter.subject_id" required>
                                        <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                                            {{ subject.name }}
                                        </option>
                                    </select>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" @click="showAddModal = false">Cancel</button>
                                <button type="button" class="btn btn-primary" @click="addChapter" :disabled="loading">
                                    <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    Add Chapter
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Edit Chapter Modal -->
                <div class="modal fade" :class="{ show: showEditModal }" tabindex="-1" 
                     :style="{ display: showEditModal ? 'block' : 'none' }">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header bg-gradient-info text-white">
                                <h5 class="modal-title">Edit Chapter</h5>
                                <button type="button" class="btn-close btn-close-white" @click="showEditModal = false"></button>
                            </div>
                            <div class="modal-body" v-if="editingChapter">
                                <div class="mb-3">
                                    <label for="editChapterName" class="form-label">Chapter Name</label>
                                    <input type="text" class="form-control" id="editChapterName" v-model="editingChapter.name" required>
                                </div>
                                <div class="mb-3">
                                    <label for="editChapterDescription" class="form-label">Description</label>
                                    <textarea class="form-control" id="editChapterDescription" v-model="editingChapter.description" rows="3"></textarea>
                                </div>
                                <div class="mb-3">
                                    <label for="editSubjectSelect" class="form-label">Subject</label>
                                    <select class="form-select" id="editSubjectSelect" v-model="editingChapter.subject_id" required>
                                        <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                                            {{ subject.name }}
                                        </option>
                                    </select>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" @click="showEditModal = false">Cancel</button>
                                <button type="button" class="btn btn-info" @click="updateChapter" :disabled="loading">
                                    <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    Update Chapter
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Delete Confirmation Modal -->
                <div class="modal fade" :class="{ show: showDeleteModal }" tabindex="-1" 
                     :style="{ display: showDeleteModal ? 'block' : 'none' }">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header bg-gradient-danger text-white">
                                <h5 class="modal-title">Confirm Delete</h5>
                                <button type="button" class="btn-close btn-close-white" @click="showDeleteModal = false"></button>
                            </div>
                            <div class="modal-body" v-if="chapterToDelete">
                                <p>Are you sure you want to delete the chapter <strong>{{ chapterToDelete.name }}</strong>?</p>
                                <p class="text-danger"><small>This action cannot be undone. All quizzes and questions associated with this chapter will also be deleted.</small></p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">Cancel</button>
                                <button type="button" class="btn btn-danger" @click="deleteChapter" :disabled="loading">
                                    <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    Delete Chapter
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Modal Backdrop -->
                <div class="modal-backdrop fade show" v-if="showAddModal || showEditModal || showDeleteModal"></div>
            </div>
        </div>
    `
}
                