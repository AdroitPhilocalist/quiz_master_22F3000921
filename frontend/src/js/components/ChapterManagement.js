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
    mounted() {
        // Create and inject animations dynamically
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            @keyframes fadeInOut {
                0% { opacity: 0.5; }
                50% { opacity: 1; }
                100% { opacity: 0.5; }
            }
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            .chapter-row {
                transition: all 0.2s ease;
            }
            .chapter-row:hover {
                background-color: rgba(78, 115, 223, 0.05) !important;
                transform: translateY(-2px);
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
            }
            .sortable {
                cursor: pointer;
            }
            .sortable:hover {
                background-color: rgba(78, 115, 223, 0.05);
            }
            .fade-in-up {
                animation: fadeInUp 0.5s ease forwards;
            }
            .chapter-action-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
            }
        `;
        document.head.appendChild(styleEl);
        
        // Remove the style element when component is destroyed
        this.$once('hook:beforeDestroy', () => {
            document.head.removeChild(styleEl);
        });
        
        // Handle clicking outside of modals to close them
        document.addEventListener('click', this.handleOutsideClick);
    },
    beforeDestroy() {
        document.removeEventListener('click', this.handleOutsideClick);
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
        // Handle outside clicks for modal dismissal
        handleOutsideClick(event) {
            if (this.showAddModal && event.target.classList.contains('modal')) {
                this.closeAddModal();
            }
            if (this.showEditModal && event.target.classList.contains('modal')) {
                this.closeEditModal();
            }
            if (this.showDeleteModal && event.target.classList.contains('modal')) {
                this.closeDeleteModal();
            }
        },

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
            // Focus the input field after the modal is shown
            setTimeout(() => {
                const nameInput = document.getElementById('chapterName');
                if (nameInput) nameInput.focus();
            }, 100);
        },
        closeAddModal() {
            this.showAddModal = false;
        },
        openEditModal(chapter) {
            this.editingChapter = { ...chapter };
            this.showEditModal = true;
            // Focus the input field after the modal is shown
            setTimeout(() => {
                const nameInput = document.getElementById('editChapterName');
                if (nameInput) nameInput.focus();
            }, 100);
        },
        closeEditModal() {
            this.showEditModal = false;
        },
        openDeleteModal(chapter) {
            this.chapterToDelete = chapter;
            this.showDeleteModal = true;
        },
        closeDeleteModal() {
            this.showDeleteModal = false;
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
                this.closeAddModal();
                this.fetchChapters();
                this.showToast("Chapter added successfully", "Success", "success");
            } catch (error) {
                this.error = 'Failed to add chapter';
                console.error(error);
                this.showToast("Failed to add chapter", "Error", "danger");
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
                this.closeEditModal();
                this.fetchChapters();
                this.showToast("Chapter updated successfully", "Success", "success");
            } catch (error) {
                this.error = 'Failed to update chapter';
                console.error(error);
                this.showToast("Failed to update chapter", "Error", "danger");
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
                this.closeDeleteModal();
                this.fetchChapters();
                this.showToast("Chapter deleted successfully", "Success", "success");
            } catch (error) {
                this.error = 'Failed to delete chapter';
                console.error(error);
                this.showToast("Failed to delete chapter", "Error", "danger");
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
        <div class="container-fluid py-5" style="font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
            <!-- Header Section -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <div style="display: flex; align-items: center;">
                    <button @click="goBack" class="btn btn-outline-primary me-3" 
                            style="border-radius: 50px; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(78, 115, 223, 0.15); transition: all 0.3s ease;">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2 style="font-weight: 700; color: #4e73df; margin: 0;">
                        <i class="fas fa-book-open me-2"></i>{{ subjectName ? subjectName + ' - Chapters' : 'All Chapters' }}
                    </h2>
                </div>
                <button @click="openAddModal" class="btn btn-primary btn-lg" 
                        style="border-radius: 50px; padding: 0.5rem 1.5rem; box-shadow: 0 2px 10px rgba(78, 115, 223, 0.2); transition: all 0.3s ease;">
                    <i class="fas fa-plus me-2"></i> Add New Chapter
                </button>
            </div>
            
            <!-- Main Content Card -->
            <div style="border: none; border-radius: 10px; box-shadow: 0 5px 25px rgba(0, 0, 0, 0.08); overflow: hidden; margin-bottom: 2rem; transition: all 0.3s ease;">
                <div style="background: linear-gradient(135deg, #4e73df 0%, #224abe 100%); padding: 0;">
                    <div style="padding: 1.5rem; background-color: rgba(0, 0, 0, 0.1);">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center;">
                                <i class="fas fa-layer-group" style="color: white; font-size: 1.75rem; margin-right: 1rem;"></i>
                                <h4 style="color: white; margin: 0; font-weight: 300;">Your Chapters Collection</h4>
                            </div>
                            <div class="input-group" style="max-width: 400px;">
                                <input type="text" class="form-control" style="border-radius: 50px 0 0 50px; padding-left: 1.5rem; border: none;" 
                                       placeholder="Search chapters..." v-model="searchQuery">
                                <span class="input-group-text" style="background: white; border: none; border-radius: 0 50px 50px 0;">
                                    <i class="fas fa-search" style="color: #4e73df;"></i>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="padding: 0;">
                    <!-- Loading State -->
                    <div v-if="loading" style="text-align: center; padding: 5rem;">
                        <div class="spinner-grow text-primary mb-3" style="width: 3rem; height: 3rem;" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p style="color: #6c757d; animation: fadeInOut 1.5s infinite;">Loading chapters...</p>
                    </div>
                    
                    <!-- Error State -->
                    <div v-else-if="error" 
                         style="margin: 1.5rem; background-color: #f8d7da; color: #842029; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);">
                        <div style="display: flex;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 1.5rem; margin-right: 1rem;"></i>
                            <div>
                                <h5 style="margin-top: 0; font-weight: 600;">Something went wrong!</h5>
                                <p style="margin-bottom: 0;">{{ error }}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Empty State -->
                    <div v-else-if="chapters.length === 0" style="text-align: center; padding: 5rem;">
                        <div style="margin-bottom: 1.5rem; position: relative;">
                            <i class="fas fa-book-open" style="font-size: 4rem; color: #adb5bd; opacity: 0.5; margin-bottom: 1rem;"></i>
                            <div style="position: relative;">
                                <i class="fas fa-plus-circle" 
                                   style="color: #4e73df; position: absolute; font-size: 1.5rem; top: -30px; right: calc(50% - 45px); animation: pulse 2s infinite;"></i>
                            </div>
                        </div>
                        <h3 style="color: #6c757d; font-weight: 300;">No chapters found</h3>
                        <p style="color: #6c757d; margin-bottom: 1.5rem;">Get started by creating your first chapter</p>
                        <button class="btn btn-primary btn-lg" 
                                style="border-radius: 50px; padding: 0.75rem 1.75rem; box-shadow: 0 2px 15px rgba(78, 115, 223, 0.2);" 
                                @click="openAddModal">
                            <i class="fas fa-plus me-2"></i> Add Your First Chapter
                        </button>
                    </div>
                    
                    <!-- Chapters Table -->
                    <div v-else class="table-responsive">
                        <table class="table mb-0" style="border-collapse: separate; border-spacing: 0;">
                            <thead>
                                <tr style="background-color: #f8f9fa;">
                                    <th @click="sortTable('name')" class="sortable"
                                        style="padding: 1rem 1.5rem; font-size: 0.75rem; letter-spacing: 0.05rem; text-transform: uppercase; font-weight: 600; color: #4e73df; border-bottom: 1px solid #e3e6f0;">
                                        Name <i :class="['fas', getSortIcon('name')]"></i>
                                    </th>
                                    <th @click="sortTable('description')" class="sortable"
                                        style="padding: 1rem 1.5rem; font-size: 0.75rem; letter-spacing: 0.05rem; text-transform: uppercase; font-weight: 600; color: #4e73df; border-bottom: 1px solid #e3e6f0;">
                                        Description <i :class="['fas', getSortIcon('description')]"></i>
                                    </th>
                                    <th @click="sortTable('created_at')" class="sortable"
                                        style="padding: 1rem 1.5rem; font-size: 0.75rem; letter-spacing: 0.05rem; text-transform: uppercase; font-weight: 600; color: #4e73df; border-bottom: 1px solid #e3e6f0;">
                                        Created At <i :class="['fas', getSortIcon('created_at')]"></i>
                                    </th>
                                    <th style="padding: 1rem 1.5rem; font-size: 0.75rem; letter-spacing: 0.05rem; text-transform: uppercase; font-weight: 600; color: #4e73df; border-bottom: 1px solid #e3e6f0; text-align: right;">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(chapter, index) in sortedChapters" :key="chapter.id" 
                                    class="chapter-row"
                                    :style="{
                                        transition: 'all 0.3s ease',
                                        animationDelay: index * 0.05 + 's',
                                        borderBottom: '1px solid #e3e6f0',
                                        backgroundColor: chapter === chapterToDelete ? 'rgba(253, 237, 237, 0.5)' : 'transparent'
                                    }"
                                    :class="{'fade-in-up': animateItems}">
                                    <td style="padding: 1rem 1.5rem; vertical-align: middle;">
                                        <div style="display: flex; align-items: center;">
                                            <div style="width: 40px; height: 40px; background-color: rgba(78, 115, 223, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 1rem;">
                                                <i class="fas fa-book" style="color: #4e73df;"></i>
                                            </div>
                                            <div>
                                                <h6 style="font-weight: 600; margin-bottom: 0;">{{ chapter.name }}</h6>
                                            </div>
                                        </div>
                                    </td>
                                    <td style="padding: 1rem 1.5rem; vertical-align: middle;">
                                        <p style="color: #6c757d; margin-bottom: 0; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                            {{ chapter.description || 'No description' }}
                                        </p>
                                    </td>
                                    <td style="padding: 1rem 1.5rem; vertical-align: middle;">
                                        <div style="display: flex; align-items: center;">
                                            <i class="far fa-calendar-alt" style="color: #6c757d; margin-right: 0.5rem;"></i>
                                            <span style="color: #495057;">{{ formatDate(chapter.created_at) }}</span>
                                        </div>
                                    </td>
                                    <td style="padding: 1rem 1.5rem; vertical-align: middle; text-align: right;">
                                        <div style="display: flex; justify-content: flex-end;">
                                            <button class="btn btn-light btn-sm chapter-action-btn" 
                                                    style="margin-right: 0.5rem; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: none; transition: all 0.2s ease;" 
                                                    data-bs-toggle="tooltip" 
                                                    title="View Quizzes"
                                                    @click="viewQuizzes(chapter.id)">
                                                <i class="fas fa-list" style="color: #36b9cc;"></i>
                                            </button>
                                            <button class="btn btn-light btn-sm chapter-action-btn" 
                                                    style="margin-right: 0.5rem; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: none; transition: all 0.2s ease;" 
                                                    data-bs-toggle="tooltip" 
                                                    title="Edit Chapter"
                                                    @click="openEditModal(chapter)">
                                                <i class="fas fa-edit" style="color: #4e73df;"></i>
                                            </button>
                                            <button class="btn btn-light btn-sm chapter-action-btn" 
                                                    style="border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: none; transition: all 0.2s ease;" 
                                                    data-bs-toggle="tooltip" 
                                                    title="Delete Chapter"
                                                    @click="openDeleteModal(chapter)">
                                                <i class="fas fa-trash" style="color: #e74a3b;"></i>
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
            <div v-if="showAddModal" class="modal" style="display: block; background-color: rgba(0, 0, 0, 0.5); position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1050; overflow-x: hidden; overflow-y: auto; outline: 0;">
                <div class="modal-dialog modal-dialog-centered" style="position: relative; width: auto; margin: 1.75rem auto; max-width: 500px; pointer-events: none; z-index: 1051;">
                    <div style="position: relative; display: flex; flex-direction: column; width: 100%; pointer-events: auto; background-color: white; border: none; border-radius: 15px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15); overflow: hidden;">
                        <div style="background: #4e73df; padding: 1.5rem; position: relative;">
                            <div style="display: flex; align-items: center;">
                                <i class="fas fa-plus-circle" style="color: white; font-size: 1.5rem; margin-right: 1rem;"></i>
                                <h5 style="color: white; font-weight: 300; margin: 0;">Add New Chapter</h5>
                            </div>
                            <button type="button" class="btn-close btn-close-white" style="position: absolute; top: 1.25rem; right: 1.25rem;" @click="closeAddModal"></button>
                        </div>
                        <div style="padding: 1.5rem; background: white;">
                            <div style="margin-bottom: 1.5rem;">
                                <label for="chapterName" style="font-weight: 600; color: #4e73df; margin-bottom: 0.5rem;">Chapter Name</label>
                                <div style="display: flex; background-color: #f8f9fa; border-radius: 6px; overflow: hidden;">
                                    <span style="display: flex; align-items: center; justify-content: center; padding: 0 1rem; background-color: #f8f9fa;">
                                        <i class="fas fa-book" style="color: #4e73df;"></i>
                                    </span>
                                    <input 
                                        type="text" 
                                        class="form-control form-control-lg" 
                                        style="border: none; box-shadow: none; background-color: #f8f9fa; padding: 0.75rem;" 
                                        id="chapterName" 
                                        placeholder="Enter chapter name"
                                        v-model="newChapter.name" 
                                        required
                                    >
                                </div>
                            </div>
                            <div style="margin-bottom: 1rem;">
                                <label for="chapterDescription" style="font-weight: 600; color: #4e73df; margin-bottom: 0.5rem;">Description</label>
                                <div style="display: flex; background-color: #f8f9fa; border-radius: 6px; overflow: hidden;">
                                    <span style="display: flex; align-items: center; justify-content: center; padding: 0 1rem; background-color: #f8f9fa;">
                                        <i class="fas fa-align-left" style="color: #4e73df;"></i>
                                    </span>
                                    <textarea 
                                        class="form-control form-control-lg" 
                                        style="border: none; box-shadow: none; background-color: #f8f9fa; padding: 0.75rem;" 
                                        id="chapterDescription" 
                                        placeholder="Enter chapter description (optional)"
                                        v-model="newChapter.description" 
                                        rows="4"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                        <div style="padding: 1.5rem; background: white; border-top: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: flex-end;">
                            <button type="button" 
                                    class="btn btn-light btn-lg" 
                                    style="margin-right: 0.75rem; padding-left: 1.5rem; padding-right: 1.5rem;" 
                                    @click="closeAddModal">
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                class="btn btn-primary btn-lg" 
                                style="padding-left: 1.5rem; padding-right: 1.5rem; display: flex; align-items: center;" 
                                @click="addChapter" 
                                :disabled="loading || !newChapter.name"
                            >
                                <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                <i v-else class="fas fa-plus-circle me-2"></i>
                                Create Chapter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Edit Chapter Modal -->
            <div v-if="showEditModal" class="modal" style="display: block; background-color: rgba(0, 0, 0, 0.5); position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1050; overflow-x: hidden; overflow-y: auto; outline: 0;">
                <div class="modal-dialog modal-dialog-centered" style="position: relative; width: auto; margin: 1.75rem auto; max-width: 500px; pointer-events: none; z-index: 1051;">
                    <div style="position: relative; display: flex; flex-direction: column; width: 100%; pointer-events: auto; background-color: white; border: none; border-radius: 15px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15); overflow: hidden;">
                        <div style="background: #4e73df; padding: 1.5rem; position: relative;">
                            <div style="display: flex; align-items: center;">
                                <i class="fas fa-edit" style="color: white; font-size: 1.5rem; margin-right: 1rem;"></i>
                                <h5 style="color: white; font-weight: 300; margin: 0;">Edit Chapter</h5>
                            </div>
                            <button type="button" class="btn-close btn-close-white" style="position: absolute; top: 1.25rem; right: 1.25rem;" @click="closeEditModal"></button>
                        </div>
                        <div style="padding: 1.5rem; background: white;">
                            <div style="margin-bottom: 1.5rem;">
                                <label for="editChapterName" style="font-weight: 600; color: #4e73df; margin-bottom: 0.5rem;">Chapter Name</label>
                                <div style="display: flex; background-color: #f8f9fa; border-radius: 6px; overflow: hidden;">
                                    <span style="display: flex; align-items: center; justify-content: center; padding: 0 1rem; background-color: #f8f9fa;">
                                        <i class="fas fa-book" style="color: #4e73df;"></i>
                                    </span>
                                    <input 
                                        type="text" 
                                        class="form-control form-control-lg" 
                                        style="border: none; box-shadow: none; background-color: #f8f9fa; padding: 0.75rem;" 
                                        id="editChapterName" 
                                        placeholder="Enter chapter name"
                                        v-model="editingChapter.name" 
                                        required
                                    >
                                </div>
                            </div>
                            <div style="margin-bottom: 1rem;">
                                <label for="editChapterDescription" style="font-weight: 600; color: #4e73df; margin-bottom: 0.5rem;">Description</label>
                                <div style="display: flex; background-color: #f8f9fa; border-radius: 6px; overflow: hidden;">
                                    <span style="display: flex; align-items: center; justify-content: center; padding: 0 1rem; background-color: #f8f9fa;">
                                        <i class="fas fa-align-left" style="color: #4e73df;"></i>
                                    </span>
                                    <textarea 
                                        class="form-control form-control-lg" 
                                        style="border: none; box-shadow: none; background-color: #f8f9fa; padding: 0.75rem;" 
                                        id="editChapterDescription" 
                                        placeholder="Enter chapter description (optional)"
                                        v-model="editingChapter.description" 
                                        rows="4"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                        <div style="padding: 1.5rem; background: white; border-top: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: flex-end;">
                            <button type="button" 
                                    class="btn btn-light btn-lg" 
                                    style="margin-right: 0.75rem; padding-left: 1.5rem; padding-right: 1.5rem;" 
                                    @click="closeEditModal">
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                class="btn btn-primary btn-lg" 
                                style="padding-left: 1.5rem; padding-right: 1.5rem; display: flex; align-items: center;" 
                                @click="updateChapter" 
                                :disabled="loading || !editingChapter || !editingChapter.name"
                            >
                                <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                <i v-else class="fas fa-save me-2"></i>
                                Update Chapter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Delete Chapter Modal -->
            <div v-if="showDeleteModal" class="modal" style="display: block; background-color: rgba(0, 0, 0, 0.5); position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1050; overflow-x: hidden; overflow-y: auto; outline: 0;">
                <div class="modal-dialog modal-dialog-centered" style="position: relative; width: auto; margin: 1.75rem auto; max-width: 500px; pointer-events: none; z-index: 1051;">
                    <div style="position: relative; display: flex; flex-direction: column; width: 100%; pointer-events: auto; background-color: white; border: none; border-radius: 15px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15); overflow: hidden;">
                        <div style="background: #e74a3b; padding: 1.5rem; position: relative;">
                            <div style="display: flex; align-items: center;">
                                <i class="fas fa-trash-alt" style="color: white; font-size: 1.5rem; margin-right: 1rem;"></i>
                                <h5 style="color: white; font-weight: 300; margin: 0;">Delete Chapter</h5>
                            </div>
                            <button type="button" class="btn-close btn-close-white" style="position: absolute; top: 1.25rem; right: 1.25rem;" @click="closeDeleteModal"></button>
                        </div>
                        <div style="padding: 1.5rem; background: white;" v-if="chapterToDelete">
                            <div style="margin-bottom: 1rem;">
                                <p style="font-size: 1.1rem; color: #5a5c69;">
                                    Are you sure you want to delete the chapter <strong>{{ chapterToDelete.name }}</strong>?
                                </p>
                                <div style="padding: 1rem; background-color: #fff4f4; border-left: 4px solid #e74a3b; margin-top: 1rem; border-radius: 5px;">
                                    <p style="margin-bottom: 0; color: #e74a3b;">
                                        <i class="fas fa-exclamation-triangle me-2"></i> Warning
                                    </p>
                                    <p style="margin-bottom: 0; color: #6e7d88; font-size: 0.9rem;">
                                        This action cannot be undone. All quizzes and questions related to this chapter will also be deleted.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div style="padding: 1.5rem; background: white; border-top: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: flex-end;">
                            <button type="button" 
                                    class="btn btn-light btn-lg" 
                                    style="margin-right: 0.75rem; padding-left: 1.5rem; padding-right: 1.5rem;" 
                                    @click="closeDeleteModal">
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                class="btn btn-danger btn-lg" 
                                style="padding-left: 1.5rem; padding-right: 1.5rem; display: flex; align-items: center;" 
                                @click="deleteChapter" 
                                :disabled="loading"
                            >
                                <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                <i v-else class="fas fa-trash-alt me-2"></i>
                                Delete Chapter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}