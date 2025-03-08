export default {
    data() {
        return {
            subjects: [],
            loading: false,
            error: null,
            newSubject: {
                name: '',
                description: ''
            },
            editingSubject: null,
            showAddModal: false,
            showEditModal: false,
            showDeleteModal: false,
            subjectToDelete: null
        }
    },
    created() {
        this.fetchSubjects();
    },
    methods: {
        async fetchSubjects() {
            this.loading = true;
            try {
                const response = await axios.get('/api/subjects', {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                this.subjects = response.data;
            } catch (error) {
                this.error = 'Failed to load subjects';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        openAddModal() {
            this.newSubject = { name: '', description: '' };
            this.showAddModal = true;
        },
        openEditModal(subject) {
            this.editingSubject = { ...subject };
            this.showEditModal = true;
        },
        openDeleteModal(subject) {
            this.subjectToDelete = subject;
            this.showDeleteModal = true;
        },
        async addSubject() {
            this.loading = true;
            try {
                await axios.post('/api/subjects', this.newSubject, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token'),
                        'Content-Type': 'application/json'
                    }
                });
                this.showAddModal = false;
                this.fetchSubjects();
                this.$bvToast.toast('Subject added successfully', {
                    title: 'Success',
                    variant: 'success',
                    solid: true
                });
            } catch (error) {
                this.error = 'Failed to add subject';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        async updateSubject() {
            this.loading = true;
            try {
                await axios.put(`/api/subjects/${this.editingSubject.id}`, {
                    name: this.editingSubject.name,
                    description: this.editingSubject.description
                }, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token'),
                        'Content-Type': 'application/json'
                    }
                });
                this.showEditModal = false;
                this.fetchSubjects();
                this.$bvToast.toast('Subject updated successfully', {
                    title: 'Success',
                    variant: 'success',
                    solid: true
                });
            } catch (error) {
                this.error = 'Failed to update subject';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        async deleteSubject() {
            this.loading = true;
            try {
                await axios.delete(`/api/subjects/${this.subjectToDelete.id}`, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                this.showDeleteModal = false;
                this.fetchSubjects();
                this.$bvToast.toast('Subject deleted successfully', {
                    title: 'Success',
                    variant: 'success',
                    solid: true
                });
            } catch (error) {
                this.error = 'Failed to delete subject';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        viewChapters(subjectId) {
            this.$router.push(`/admin/subjects/${subjectId}/chapters`);
        }
    },
    template: `
        <div class="container-fluid py-4">
            <div class="row">
                <div class="col-12">
                    <div class="card shadow-sm border-0 mb-4">
                        <div class="card-header bg-gradient-primary text-white py-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Subject Management</h5>
                                <button class="btn btn-light btn-sm" @click="openAddModal">
                                    <i class="fas fa-plus me-1"></i> Add Subject
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
                            <div v-else-if="subjects.length === 0" class="text-center py-5">
                                <i class="fas fa-book fa-3x text-muted mb-3"></i>
                                <p class="lead">No subjects found</p>
                                <button class="btn btn-primary" @click="openAddModal">
                                    <i class="fas fa-plus me-1"></i> Add Subject
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
                                        <tr v-for="subject in subjects" :key="subject.id">
                                            <td>{{ subject.name }}</td>
                                            <td>{{ subject.description || 'No description' }}</td>
                                            <td>{{ new Date(subject.created_at).toLocaleString() }}</td>
                                            <td>
                                                <div class="btn-group">
                                                    <button class="btn btn-sm btn-outline-primary" @click="viewChapters(subject.id)">
                                                        <i class="fas fa-list me-1"></i> Chapters
                                                    </button>
                                                    <button class="btn btn-sm btn-outline-secondary" @click="openEditModal(subject)">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn btn-sm btn-outline-danger" @click="openDeleteModal(subject)">
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

            <!-- Add Subject Modal -->
            <div class="modal fade" :class="{ 'show d-block': showAddModal }" tabindex="-1" role="dialog">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">Add Subject</h5>
                            <button type="button" class="btn-close btn-close-white" @click="showAddModal = false"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="subjectName" class="form-label">Name</label>
                                <input type="text" class="form-control" id="subjectName" v-model="newSubject.name" required>
                            </div>
                            <div class="mb-3">
                                <label for="subjectDescription" class="form-label">Description</label>
                                <textarea class="form-control" id="subjectDescription" v-model="newSubject.description" rows="3"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showAddModal = false">Cancel</button>
                            <button type="button" class="btn btn-primary" @click="addSubject" :disabled="loading || !newSubject.name">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Add Subject
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-backdrop fade" :class="{ 'show': showAddModal }" v-if="showAddModal"></div>

            <!-- Edit Subject Modal -->
            <div class="modal fade" :class="{ 'show d-block': showEditModal }" tabindex="-1" role="dialog">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">Edit Subject</h5>
                            <button type="button" class="btn-close btn-close-white" @click="showEditModal = false"></button>
                        </div>
                        <div class="modal-body" v-if="editingSubject">
                            <div class="mb-3">
                                <label for="editSubjectName" class="form-label">Name</label>
                                <input type="text" class="form-control" id="editSubjectName" v-model="editingSubject.name" required>
                            </div>
                            <div class="mb-3">
                                <label for="editSubjectDescription" class="form-label">Description</label>
                                <textarea class="form-control" id="editSubjectDescription" v-model="editingSubject.description" rows="3"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showEditModal = false">Cancel</button>
                            <button type="button" class="btn btn-primary" @click="updateSubject" :disabled="loading || !editingSubject?.name">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Update Subject
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-backdrop fade" :class="{ 'show': showEditModal }" v-if="showEditModal"></div>

            <!-- Delete Subject Modal -->
            <div class="modal fade" :class="{ 'show d-block': showDeleteModal }" tabindex="-1" role="dialog">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title">Delete Subject</h5>
                            <button type="button" class="btn-close btn-close-white" @click="showDeleteModal = false"></button>
                        </div>
                        <div class="modal-body" v-if="subjectToDelete">
                            <p>Are you sure you want to delete the subject <strong>{{ subjectToDelete.name }}</strong>?</p>
                            <p class="text-danger"><strong>Warning:</strong> This will also delete all chapters, quizzes, and questions associated with this subject.</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">Cancel</button>
                            <button type="button" class="btn btn-danger" @click="deleteSubject" :disabled="loading">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Delete Subject
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-backdrop fade" :class="{ 'show': showDeleteModal }" v-if="showDeleteModal"></div>
        </div>
    `
}