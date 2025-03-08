export default {
    props: ['subjectId'],
    data() {
        return {
            chapters: [],
            loading: false,
            error: null,
            newChapter: {
                name: '',
                description: ''
            },
            editingChapter: null,
            showAddModal: false,
            showEditModal: false,
            showDeleteModal: false,
            chapterToDelete: null,
            subjectName: '',
            searchQuery: '',
            sortBy: 'name',
            sortDesc: false,
            animateItems: false
        }
    },
    created() {
        this.fetchChapters();
        this.fetchSubjectName();
        // Add animation delay
        setTimeout(() => {
            this.animateItems = true;
        }, 100);
    },
    computed: {
        filteredChapters() {
            if (!this.searchQuery) return this.chapters;
            const query = this.searchQuery.toLowerCase();
            return this.chapters.filter(chapter => 
                chapter.name.toLowerCase().includes(query) || 
                (chapter.description && chapter.description.toLowerCase().includes(query))
            );
        },
        sortedChapters() {
            const chapters = [...this.filteredChapters];
            return chapters.sort((a, b) => {
                let modifier = this.sortDesc ? -1 : 1;
                if (a[this.sortBy] < b[this.sortBy]) return -1 * modifier;
                if (a[this.sortBy] > b[this.sortBy]) return 1 * modifier;
                return 0;
            });
        }
    },
    methods: {
        async fetchSubjectName() {
            if (!this.subjectId) return;
            
            try {
                const response = await axios.get(`/api/subjects/${this.subjectId}`, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                this.subjectName = response.data.name;
            } catch (error) {
                console.error('Failed to fetch subject name:', error);
            }
        },
        async fetchChapters() {
            this.loading = true;
            try {
                const url = this.subjectId 
                    ? `/api/subjects/${this.subjectId}/chapters` 
                    : '/api/chapters';
                
                const response = await axios.get(url, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                this.chapters = response.data;
            } catch (error) {
                this.error = 'Failed to load chapters';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        openAddModal() {
            this.newChapter = { name: '', description: '' };
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
                const url = this.subjectId 
                    ? `/api/subjects/${this.subjectId}/chapters` 
                    : '/api/chapters';
                
                await axios.post(url, {
                    name: this.newChapter.name,
                    description: this.newChapter.description,
                    subject_id: this.subjectId
                }, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token'),
                        'Content-Type': 'application/json'
                    }
                });
                this.showAddModal = false;
                this.fetchChapters();
                this.$bvToast.toast('Chapter added successfully', {
                    title: 'Success',
                    variant: 'success',
                    solid: true
                });
            } catch (error) {
                this.error = 'Failed to add chapter';
                console.error(error);
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
                    subject_id: this.subjectId
                }, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token'),
                        'Content-Type': 'application/json'
                    }
                });
                this.showEditModal = false;
                this.fetchChapters();
                this.$bvToast.toast('Chapter updated successfully', {
                    title: 'Success',
                    variant: 'success',
                    solid: true
                });
            } catch (error) {
                this.error = 'Failed to update chapter';
                console.error(error);
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
                this.$bvToast.toast('Chapter deleted successfully', {
                    title: 'Success',
                    variant: 'success',
                    solid: true
                });
            } catch (error) {
                this.error = 'Failed to delete chapter';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        viewQuizzes(chapterId) {
            this.$router.push(`/admin/chapters/${chapterId}/quizzes`);
        },
        goBack() {
            this.$router.push('/admin/subjects');
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
        <div class="container-fluid px-4">
            <div class="d-sm-flex align-items-center justify-content-between mb-4">
                <div>
                    <button @click="goBack" class="btn btn-outline-primary me-2">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h1 class="h3 mb-0 text-gray-800 d-inline-block">
                        {{ subjectName ? subjectName + ' - Chapters' : 'All Chapters' }}
                    </h1>
                </div>
                <button @click="openAddModal" class="btn btn-primary shadow-sm">
                    <i class="fas fa-plus fa-sm text-white-50 me-1"></i> Add New Chapter
                </button>
            </div>
            
            <div class="card shadow mb-4 border-0">
                <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between bg-gradient-primary text-white">
                    <h6 class="m-0 font-weight-bold">Manage Chapters</h6>
                    <div class="input-group w-50">
                        <input type="text" class="form-control" placeholder="Search chapters..." v-model="searchQuery">
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
                    
                    <div v-else-if="chapters.length === 0" class="text-center py-5">
                        <div class="empty-state">
                            <i class="fas fa-book-open fa-4x text-gray-300 mb-3"></i>
                            <h5>No Chapters Found</h5>
                            <p class="text-muted">Start by adding your first chapter</p>
                            <button @click="openAddModal" class="btn btn-primary mt-2">
                                <i class="fas fa-plus me-1"></i> Add Chapter
                            </button>
                        </div>
                    </div>
                    
                    <div v-else class="table-responsive">
                        <table class="table table-bordered table-hover" width="100%" cellspacing="0">
                            <thead class="table-light">
                                <tr>
                                    <th @click="sortTable('name')" class="sortable">
                                        Name <i :class="['fas', getSortIcon('name')]"></i>
                                    </th>
                                    <th @click="sortTable('description')" class="sortable">
                                        Description <i :class="['fas', getSortIcon('description')]"></i>
                                    </th>
                                    <th @click="sortTable('created_at')" class="sortable">
                                        Created At <i :class="['fas', getSortIcon('created_at')]"></i>
                                    </th>
                                    <th class="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="chapter in sortedChapters" :key="chapter.id" 
                                    :class="{'animate__animated animate__fadeIn': animateItems}">
                                    <td>{{ chapter.name }}</td>
                                    <td>{{ chapter.description || 'No description' }}</td>
                                    <td>{{ formatDate(chapter.created_at) }}</td>
                                    <td class="text-center">
                                        <div class="btn-group">
                                            <button @click="viewQuizzes(chapter.id)" class="btn btn-sm btn-info">
                                                <i class="fas fa-list me-1"></i> Quizzes
                                            </button>
                                            <button @click="openEditModal(chapter)" class="btn btn-sm btn-primary ms-1">
                                                <i class="fas fa-edit me-1"></i> Edit
                                            </button>
                                            <button @click="openDeleteModal(chapter)" class="btn btn-sm btn-danger ms-1">
                                                <i class="fas fa-trash me-1"></i> Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Add Chapter Modal -->
            <div class="modal fade" :class="{ show: showAddModal }" tabindex="-1" role="dialog" 
                 :style="{ display: showAddModal ? 'block' : 'none' }">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
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
                                <textarea class="form-control" id="chapterDescription" rows="3" v-model="newChapter.description"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showAddModal = false">Cancel</button>
                            <button type="button" class="btn btn-primary" @click="addChapter" :disabled="!newChapter.name || loading">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Create Chapter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="showAddModal" class="modal-backdrop fade show"></div>
            
            <!-- Edit Chapter Modal -->
            <div class="modal fade" :class="{ show: showEditModal }" tabindex="-1" role="dialog" 
                 :style="{ display: showEditModal ? 'block' : 'none' }">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
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
                                <textarea class="form-control" id="editChapterDescription" rows="3" v-model="editingChapter.description"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showEditModal = false">Cancel</button>
                            <button type="button" class="btn btn-primary" @click="updateChapter" :disabled="!editingChapter || !editingChapter.name || loading">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Update Chapter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="showEditModal" class="modal-backdrop fade show"></div>
            
            <!-- Delete Chapter Modal -->
            <div class="modal fade" :class="{ show: showDeleteModal }" tabindex="-1" role="dialog" 
                 :style="{ display: showDeleteModal ? 'block' : 'none' }">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title">Delete Chapter</h5>
                            <button type="button" class="btn-close btn-close-white" @click="showDeleteModal = false"></button>
                        </div>
                        <div class="modal-body" v-if="chapterToDelete">
                            <p>Are you sure you want to delete the chapter <strong>{{ chapterToDelete.name }}</strong>?</p>
                            <p class="text-danger"><i class="fas fa-exclamation-triangle me-1"></i> This action cannot be undone and will delete all associated quizzes and questions.</p>
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
            <div v-if="showDeleteModal" class="modal-backdrop fade show"></div>
        </div>
    `
}