export default {
    props: ['subjectId'],
    data() {
        return {
            subject: null,
            chapters: [],
            loading: false,
            error: null,
            newChapter: {
                name: '',
                description: '',
                subject_id: null
            },
            editingChapter: null,
            showAddModal: false,
            showEditModal: false,
            showDeleteModal: false,
            chapterToDelete: null
        }
    },
    created() {
        this.newChapter.subject_id = this.subjectId;
        this.fetchSubject();
        this.fetchChapters();
    },
    methods: {
        async fetchSubject() {
            try {
                const response = await axios.get(`/api/subjects/${this.subjectId}`, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                this.subject = response.data;
            } catch (error) {
                this.error = 'Failed to load subject details';
                console.error(error);
            }
        },
        async fetchChapters() {
            this.loading = true;
            try {
                const response = await axios.get(`/api/subjects/${this.subjectId}/chapters`, {
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
            this.newChapter = { 
                name: '', 
                description: '',
                subject_id: this.subjectId
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
                await axios.post(`/api/subjects/${this.subjectId}/chapters`, this.newChapter, {
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
        }
    },
    template: `
        <div class="container-fluid py-4">
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary" @click="goBack">
                        <i class="fas fa-arrow-left me-1"></i> Back to Subjects
                    </button>
                </div>
            </div>
            
            <div class="row">
                <div class="col-12">
                    <div class="card shadow-sm border-0 mb-4">
                        <div class="card-header bg-gradient-primary text-white py-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">
                                    {{ subject ? subject.name + ' - Chapters' : 'Chapters' }}
                                </h5>
                                <button class="btn btn-light btn-sm" @click="openAddModal">
                                    <i class="fas fa-plus me-1"></i> Add Chapter
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
                                <i class="fas fa-book-open fa-3x text-muted mb-3"></i>
                                <p class="lead">No chapters found for this subject</p>
                                <button class="btn btn-primary" @click="openAddModal">
                                    <i class="fas fa-plus me-1"></i> Add Chapter
                                </button>
                            </div>
                            <div v-else class="table-responsive">
                                <table class="table table-hover align-middle">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Name</th>
                                            <th>Description</th>
                                            <th>Created At</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="chapter in chapters" :key="chapter.id">
                                            <td>{{ chapter.name }}</td>
                                            <td>{{ chapter.description || 'No description' }}</td>
                                            <td>{{ new Date(chapter.created_at).toLocaleString() }}</td>
                                            <td>
                                                <div class="btn-group">
                                                    <button class="btn btn-sm btn-outline-primary" @click="viewQuizzes(chapter.id)">
                                                        <i class="fas fa-list me-1"></i> Quizzes
                                                    </button>
                                                    <button class="btn btn-sm btn-outline-secondary" @click="openEditModal(chapter)">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn btn-sm btn-outline-danger" @click="openDeleteModal(chapter)">
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
            <div class="modal fade" :class="{ 'show d-block': showAddModal }" tabindex="-1" role="dialog">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">Add Chapter</h5>
                            <button type="button" class="btn-close btn-close-white" @click="showAddModal = false"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="chapterName" class="form-label">Name</label>
                                <input type="text" class="form-control" id="chapterName" v-model="newChapter.name" required>
                            </div>
                            <div class="mb-3">
                                <label for="chapterDescription" class="form-label">Description</label>
                                <textarea class="form-control" id="chapterDescription" v-model="newChapter.description" rows="3"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showAddModal = false">Cancel</button>
                            <button type="button" class="btn btn-primary" @click="addChapter" :disabled="loading || !newChapter.name">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Add Chapter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-backdrop fade" :class="{ 'show': showAddModal }" v-if="showAddModal"></div>

            <!-- Edit Chapter Modal -->
            <div class="modal fade" :class="{ 'show d-block': showEditModal }" tabindex="-1" role="dialog">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">Edit Chapter</h5>
                            <button type="button" class="btn-close btn-close-white" @click="showEditModal = false"></button>
                        </div>
                        <div class="modal-body" v-if="editingChapter">
                            <div class="mb-3">
                                <label for="editChapterName" class="form-label">Name</label>
                                <input type="text" class="form-control" id="editChapterName" v-model="editingChapter.name" required>
                            </div>
                            <div class="mb-3">
                                <label for="editChapterDescription" class="form-label">Description</label>
                                <textarea class="form-control" id="editChapterDescription" v-model="editingChapter.description" rows="3"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showEditModal = false">Cancel</button>
                            <button type="button" class="btn btn-primary" @click="updateChapter" :disabled="loading || !editingChapter?.name">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Update Chapter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-backdrop fade" :class="{ 'show': showEditModal }" v-if="showEditModal"></div>

            <!-- Delete Chapter Modal -->
            <div class="modal fade" :class="{ 'show d-block': showDeleteModal }" tabindex="-1" role="dialog">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title">Delete Chapter</h5>
                            <button type="button" class="btn-close btn-close-white" @click="showDeleteModal = false"></button>
                        </div>
                        <div class="modal-body" v-if="chapterToDelete">
                            <p>Are you sure you want to delete the chapter <strong>{{ chapterToDelete.name }}</strong>?</p>
                            <p class="text-danger"><strong>Warning:</strong> This will also delete all quizzes and questions associated with this chapter.</p>
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
            <div class="modal-backdrop fade" :class="{ 'show': showDeleteModal }" v-if="showDeleteModal"></div>
        </div>
    `
}