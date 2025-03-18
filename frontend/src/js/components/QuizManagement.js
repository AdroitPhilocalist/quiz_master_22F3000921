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
            .quiz-card {
                transition: all 0.3s ease;
                border-radius: 12px !important;
                border: none !important;
                overflow: hidden;
            }
            .quiz-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
            }
            .fade-in-up {
                animation: fadeInUp 0.5s ease forwards;
            }
            .quiz-action-btn {
                transition: all 0.2s ease;
            }
            .quiz-action-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
            }
            .published-badge {
                padding: 5px 10px;
                border-radius: 50px;
                font-size: 0.7rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .sortable {
                cursor: pointer;
            }
            .sortable:hover {
                background-color: rgba(78, 115, 223, 0.05);
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
            // Focus the input field after the modal is shown
            setTimeout(() => {
                const titleInput = document.getElementById('quizTitle');
                if (titleInput) titleInput.focus();
            }, 100);
        },
        
        closeAddModal() {
            this.showAddModal = false;
        },
        
        openEditModal(quiz) {
            this.editingQuiz = { ...quiz };
            this.showEditModal = true;
            // Focus the input field after the modal is shown
            setTimeout(() => {
                const titleInput = document.getElementById('editQuizTitle');
                if (titleInput) titleInput.focus();
            }, 100);
        },
        
        closeEditModal() {
            this.showEditModal = false;
        },
        
        openDeleteModal(quiz) {
            this.quizToDelete = quiz;
            this.showDeleteModal = true;
        },
        
        closeDeleteModal() {
            this.showDeleteModal = false;
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
                this.closeAddModal();
                this.fetchQuizzes();
                this.showToast("Quiz added successfully", "Success", "success");
            } catch (error) {
                this.error = 'Failed to add quiz';
                console.error(error);
                this.showToast("Failed to add quiz", "Error", "danger");
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
                this.closeEditModal();
                this.fetchQuizzes();
                this.showToast("Quiz updated successfully", "Success", "success");
            } catch (error) {
                this.error = 'Failed to update quiz';
                console.error(error);
                this.showToast("Failed to update quiz", "Error", "danger");
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
                this.closeDeleteModal();
                this.fetchQuizzes();
                this.showToast("Quiz deleted successfully", "Success", "success");
            } catch (error) {
                this.error = 'Failed to delete quiz';
                console.error(error);
                this.showToast("Failed to delete quiz", "Error", "danger");
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
        <div class="container-fluid py-5" style="font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
            <!-- Header Section -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <div style="display: flex; align-items: center;">
                    <button @click="goBack" class="btn btn-outline-primary me-3" 
                            style="border-radius: 50px; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(78, 115, 223, 0.15); transition: all 0.3s ease;">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2 style="font-weight: 700; color: #4e73df; margin: 0;">
                        <i class="fas fa-clipboard-list me-2"></i>{{ chapterName ? chapterName + ' - Quizzes' : 'All Quizzes' }}
                    </h2>
                </div>
                <button @click="openAddModal" class="btn btn-primary btn-lg" 
                        style="border-radius: 50px; padding: 0.5rem 1.5rem; box-shadow: 0 2px 10px rgba(78, 115, 223, 0.2); transition: all 0.3s ease;">
                    <i class="fas fa-plus me-2"></i> Add New Quiz
                </button>
            </div>
            
            <!-- Main Content Card -->
            <div style="border: none; border-radius: 10px; box-shadow: 0 5px 25px rgba(0, 0, 0, 0.08); overflow: hidden; margin-bottom: 2rem; transition: all 0.3s ease;">
                <div style="background: linear-gradient(135deg, #4e73df 0%, #224abe 100%); padding: 0;">
                    <div style="padding: 1.5rem; background-color: rgba(0, 0, 0, 0.1);">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center;">
                                <i class="fas fa-graduation-cap" style="color: white; font-size: 1.75rem; margin-right: 1rem;"></i>
                                <h4 style="color: white; margin: 0; font-weight: 300;">Your Quiz Collection</h4>
                            </div>
                            <div class="input-group" style="max-width: 400px;">
                                <input type="text" class="form-control" 
                                       style="border-radius: 50px 0 0 50px; padding-left: 1.5rem; border: none;" 
                                       placeholder="Search quizzes..." 
                                       v-model="searchQuery">
                                <span class="input-group-text" style="background: white; border: none; border-radius: 0 50px 50px 0;">
                                    <i class="fas fa-search" style="color: #4e73df;"></i>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="padding: 1.5rem;">
                    <!-- Loading State -->
                    <div v-if="loading" style="text-align: center; padding: 5rem;">
                        <div class="spinner-grow text-primary mb-3" style="width: 3rem; height: 3rem;" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p style="color: #6c757d; animation: fadeInOut 1.5s infinite;">Loading quizzes...</p>
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
                    <div v-else-if="quizzes.length === 0" style="text-align: center; padding: 5rem;">
                        <div style="margin-bottom: 1.5rem; position: relative;">
                            <i class="fas fa-clipboard-list" style="font-size: 4rem; color: #adb5bd; opacity: 0.5; margin-bottom: 1rem;"></i>
                            <div style="position: relative;">
                                <i class="fas fa-plus-circle" 
                                   style="color: #4e73df; position: absolute; font-size: 1.5rem; top: -30px; right: calc(50% - 45px); animation: pulse 2s infinite;"></i>
                            </div>
                        </div>
                        <h3 style="color: #6c757d; font-weight: 300;">No quizzes found</h3>
                        <p style="color: #6c757d; margin-bottom: 1.5rem;">Get started by creating your first quiz</p>
                        <button class="btn btn-primary btn-lg" 
                                style="border-radius: 50px; padding: 0.75rem 1.75rem; box-shadow: 0 2px 15px rgba(78, 115, 223, 0.2);" 
                                @click="openAddModal">
                            <i class="fas fa-plus me-2"></i> Add Your First Quiz
                        </button>
                    </div>
                    
                    <!-- Quizzes Grid -->
                    <div v-else class="row">
                        <div v-for="(quiz, index) in sortedQuizzes" 
                             :key="quiz.id" 
                             class="col-xl-4 col-md-6 mb-4"
                             :style="{
                                 animationDelay: index * 0.05 + 's'
                             }"
                             :class="{'fade-in-up': animateItems}">
                            <div class="card quiz-card shadow h-100" 
                                 :style="{
                                     borderLeft: quiz.is_published ? '4px solid #1cc88a' : '4px solid #4e73df'
                                 }">
                                <div class="card-body" style="padding: 1.5rem;">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                                        <span class="published-badge" 
                                              :style="{
                                                  backgroundColor: quiz.is_published ? 'rgba(28, 200, 138, 0.1)' : 'rgba(78, 115, 223, 0.1)',
                                                  color: quiz.is_published ? '#1cc88a' : '#4e73df'
                                              }">
                                            <i class="fas" :class="quiz.is_published ? 'fa-check-circle' : 'fa-clock'"></i>
                                            {{ quiz.is_published ? 'Published' : 'Draft' }}
                                        </span>
                                        <span style="font-size: 0.8rem; color: #858796; background-color: rgba(133, 135, 150, 0.1); padding: 5px 10px; border-radius: 50px;">
                                            <i class="fas fa-clock me-1"></i> {{ formatTimeLimit(quiz.time_limit) }}
                                        </span>
                                    </div>
                                    
                                    <h5 style="font-weight: 700; color: #5a5c69; margin-bottom: 0.75rem;">{{ quiz.title }}</h5>
                                    
                                    <p style="color: #858796; font-size: 0.9rem; margin-bottom: 0.75rem; height: 60px; overflow: hidden; text-overflow: ellipsis;">
                                        {{ quiz.description || 'No description provided for this quiz.' }}
                                    </p>
                                    
                                    <div style="font-size: 0.8rem; color: #858796; margin-bottom: 1.25rem;">
                                        <i class="far fa-calendar-alt me-1"></i> Created: {{ formatDate(quiz.created_at) }}
                                    </div>
                                    
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <button @click="viewQuestions(quiz.id)" 
                                                class="btn btn-info quiz-action-btn" 
                                                style="border-radius: 6px; border: none; box-shadow: 0 2px 6px rgba(54, 185, 204, 0.15);">
                                            <i class="fas fa-question-circle me-1"></i> Questions
                                        </button>
                                        
                                        <div>
                                            <button @click="togglePublishStatus(quiz)" 
                                                    class="btn quiz-action-btn" 
                                                    :class="quiz.is_published ? 'btn-outline-warning' : 'btn-outline-success'"
                                                    style="border-radius: 6px; margin-right: 0.25rem;">
                                                <i class="fas" :class="quiz.is_published ? 'fa-eye-slash' : 'fa-eye'"></i>
                                            </button>
                                            
                                            <button @click="openEditModal(quiz)" 
                                                    class="btn btn-outline-primary quiz-action-btn" 
                                                    style="border-radius: 6px; margin-right: 0.25rem;">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            
                                            <button @click="openDeleteModal(quiz)" 
                                                    class="btn btn-outline-danger quiz-action-btn" 
                                                    style="border-radius: 6px;">
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
            
            <!-- Add Quiz Modal -->
            <div v-if="showAddModal" class="modal" style="display: block; background-color: rgba(0, 0, 0, 0.5); position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1050; overflow-x: hidden; overflow-y: auto; outline: 0;">
                <div class="modal-dialog modal-dialog-centered" style="position: relative; width: auto; margin: 1.75rem auto; max-width: 500px; pointer-events: none; z-index: 1051;">
                    <div style="position: relative; display: flex; flex-direction: column; width: 100%; pointer-events: auto; background-color: white; border: none; border-radius: 15px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15); overflow: hidden;">
                        <div style="background: #4e73df; padding: 1.5rem; position: relative;">
                            <div style="display: flex; align-items: center;">
                                <i class="fas fa-plus-circle" style="color: white; font-size: 1.5rem; margin-right: 1rem;"></i>
                                <h5 style="color: white; font-weight: 300; margin: 0;">Add New Quiz</h5>
                            </div>
                            <button type="button" class="btn-close btn-close-white" style="position: absolute; top: 1.25rem; right: 1.25rem;" @click="closeAddModal"></button>
                        </div>
                        <div style="padding: 1.5rem; background: white;">
                            <div style="margin-bottom: 1.5rem;">
                                <label for="quizTitle" style="font-weight: 600; color: #4e73df; margin-bottom: 0.5rem;">Quiz Title</label>
                                <div style="display: flex; background-color: #f8f9fa; border-radius: 6px; overflow: hidden;">
                                    <span style="display: flex; align-items: center; justify-content: center; padding: 0 1rem; background-color: #f8f9fa;">
                                        <i class="fas fa-clipboard-list" style="color: #4e73df;"></i>
                                    </span>
                                    <input 
                                        type="text" 
                                        class="form-control form-control-lg" 
                                        style="border: none; box-shadow: none; background-color: #f8f9fa; padding: 0.75rem;" 
                                        id="quizTitle" 
                                        placeholder="Enter quiz title"
                                        v-model="newQuiz.title" 
                                        required
                                    >
                                </div>
                            </div>
                            <div style="margin-bottom: 1.5rem;">
                                <label for="quizDescription" style="font-weight: 600; color: #4e73df; margin-bottom: 0.5rem;">Description</label>
                                <div style="display: flex; background-color: #f8f9fa; border-radius: 6px; overflow: hidden;">
                                    <span style="display: flex; align-items: center; justify-content: center; padding: 0 1rem; background-color: #f8f9fa;">
                                        <i class="fas fa-align-left" style="color: #4e73df;"></i>
                                    </span>
                                    <textarea 
                                        class="form-control form-control-lg" 
                                        style="border: none; box-shadow: none; background-color: #f8f9fa; padding: 0.75rem;" 
                                        id="quizDescription" 
                                        placeholder="Enter quiz description (optional)"
                                        v-model="newQuiz.description" 
                                        rows="4"
                                    ></textarea>
                                </div>
                            </div>
                            <div style="margin-bottom: 1.5rem;">
                                <label for="quizTimeLimit" style="font-weight: 600; color: #4e73df; margin-bottom: 0.5rem;">Time Limit (minutes)</label>
                                <div style="display: flex; background-color: #f8f9fa; border-radius: 6px; overflow: hidden;">
                                    <span style="display: flex; align-items: center; justify-content: center; padding: 0 1rem; background-color: #f8f9fa;">
                                        <i class="fas fa-clock" style="color: #4e73df;"></i>
                                    </span>
                                    <input 
                                        type="number" 
                                        class="form-control form-control-lg" 
                                        style="border: none; box-shadow: none; background-color: #f8f9fa; padding: 0.75rem;" 
                                        id="quizTimeLimit" 
                                        placeholder="Time in minutes"
                                        v-model="newQuiz.time_limit" 
                                        min="1"
                                        required
                                    >
                                </div>
                            </div>
                            <div style="margin-bottom: 1rem; display: flex; align-items: center;">
                                <div class="form-check form-switch">
                                    <input 
                                        class="form-check-input" 
                                        type="checkbox" 
                                        id="quizPublished" 
                                        v-model="newQuiz.is_published" 
                                        style="width: 3em; height: 1.5em; margin-right: 1rem;"
                                    >
                                </div>
                                <label class="form-check-label" for="quizPublished" style="font-weight: 600; color: #4e73df;">
                                    Publish immediately
                                </label>
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
                                    @click="addQuiz" 
                                    :disabled="loading || !newQuiz.title"
                                >
                                    <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    <i v-else class="fas fa-plus-circle me-2"></i>
                                    Create Quiz
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Edit Quiz Modal -->
                <div v-if="showEditModal" class="modal" style="display: block; background-color: rgba(0, 0, 0, 0.5); position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1050; overflow-x: hidden; overflow-y: auto; outline: 0;">
                    <div class="modal-dialog modal-dialog-centered" style="position: relative; width: auto; margin: 1.75rem auto; max-width: 500px; pointer-events: none; z-index: 1051;">
                        <div style="position: relative; display: flex; flex-direction: column; width: 100%; pointer-events: auto; background-color: white; border: none; border-radius: 15px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15); overflow: hidden;">
                            <div style="background: #4e73df; padding: 1.5rem; position: relative;">
                                <div style="display: flex; align-items: center;">
                                    <i class="fas fa-edit" style="color: white; font-size: 1.5rem; margin-right: 1rem;"></i>
                                    <h5 style="color: white; font-weight: 300; margin: 0;">Edit Quiz</h5>
                                </div>
                                <button type="button" class="btn-close btn-close-white" style="position: absolute; top: 1.25rem; right: 1.25rem;" @click="closeEditModal"></button>
                            </div>
                            <div style="padding: 1.5rem; background: white;" v-if="editingQuiz">
                                <div style="margin-bottom: 1.5rem;">
                                    <label for="editQuizTitle" style="font-weight: 600; color: #4e73df; margin-bottom: 0.5rem;">Quiz Title</label>
                                    <div style="display: flex; background-color: #f8f9fa; border-radius: 6px; overflow: hidden;">
                                        <span style="display: flex; align-items: center; justify-content: center; padding: 0 1rem; background-color: #f8f9fa;">
                                            <i class="fas fa-clipboard-list" style="color: #4e73df;"></i>
                                        </span>
                                        <input 
                                            type="text" 
                                            class="form-control form-control-lg" 
                                            style="border: none; box-shadow: none; background-color: #f8f9fa; padding: 0.75rem;" 
                                            id="editQuizTitle" 
                                            placeholder="Enter quiz title"
                                            v-model="editingQuiz.title" 
                                            required
                                        >
                                    </div>
                                </div>
                                <div style="margin-bottom: 1.5rem;">
                                    <label for="editQuizDescription" style="font-weight: 600; color: #4e73df; margin-bottom: 0.5rem;">Description</label>
                                    <div style="display: flex; background-color: #f8f9fa; border-radius: 6px; overflow: hidden;">
                                        <span style="display: flex; align-items: center; justify-content: center; padding: 0 1rem; background-color: #f8f9fa;">
                                            <i class="fas fa-align-left" style="color: #4e73df;"></i>
                                        </span>
                                        <textarea 
                                            class="form-control form-control-lg" 
                                            style="border: none; box-shadow: none; background-color: #f8f9fa; padding: 0.75rem;" 
                                            id="editQuizDescription" 
                                            placeholder="Enter quiz description (optional)"
                                            v-model="editingQuiz.description" 
                                            rows="4"
                                        ></textarea>
                                    </div>
                                </div>
                                <div style="margin-bottom: 1.5rem;">
                                    <label for="editQuizTimeLimit" style="font-weight: 600; color: #4e73df; margin-bottom: 0.5rem;">Time Limit (minutes)</label>
                                    <div style="display: flex; background-color: #f8f9fa; border-radius: 6px; overflow: hidden;">
                                        <span style="display: flex; align-items: center; justify-content: center; padding: 0 1rem; background-color: #f8f9fa;">
                                            <i class="fas fa-clock" style="color: #4e73df;"></i>
                                        </span>
                                        <input 
                                            type="number" 
                                            class="form-control form-control-lg" 
                                            style="border: none; box-shadow: none; background-color: #f8f9fa; padding: 0.75rem;" 
                                            id="editQuizTimeLimit" 
                                            placeholder="Time in minutes"
                                            v-model="editingQuiz.time_limit" 
                                            min="1"
                                            required
                                        >
                                    </div>
                                </div>
                                <div style="margin-bottom: 1rem; display: flex; align-items: center;">
                                    <div class="form-check form-switch">
                                        <input 
                                            class="form-check-input" 
                                            type="checkbox" 
                                            id="editQuizPublished" 
                                            v-model="editingQuiz.is_published" 
                                            style="width: 3em; height: 1.5em; margin-right: 1rem;"
                                        >
                                    </div>
                                    <label class="form-check-label" for="editQuizPublished" style="font-weight: 600; color: #4e73df;">
                                        Published
                                    </label>
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
                                    @click="updateQuiz" 
                                    :disabled="loading || !editingQuiz || !editingQuiz.title"
                                >
                                    <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    <i v-else class="fas fa-save me-2"></i>
                                    Update Quiz
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Delete Quiz Modal -->
                <div v-if="showDeleteModal" class="modal" style="display: block; background-color: rgba(0, 0, 0, 0.5); position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1050; overflow-x: hidden; overflow-y: auto; outline: 0;">
                    <div class="modal-dialog modal-dialog-centered" style="position: relative; width: auto; margin: 1.75rem auto; max-width: 500px; pointer-events: none; z-index: 1051;">
                        <div style="position: relative; display: flex; flex-direction: column; width: 100%; pointer-events: auto; background-color: white; border: none; border-radius: 15px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15); overflow: hidden;">
                            <div style="background: #e74a3b; padding: 1.5rem; position: relative;">
                                <div style="display: flex; align-items: center;">
                                    <i class="fas fa-trash-alt" style="color: white; font-size: 1.5rem; margin-right: 1rem;"></i>
                                    <h5 style="color: white; font-weight: 300; margin: 0;">Delete Quiz</h5>
                                </div>
                                <button type="button" class="btn-close btn-close-white" style="position: absolute; top: 1.25rem; right: 1.25rem;" @click="closeDeleteModal"></button>
                            </div>
                            <div style="padding: 1.5rem; background: white;" v-if="quizToDelete">
                                <div style="margin-bottom: 1rem;">
                                    <p style="font-size: 1.1rem; color: #5a5c69;">
                                        Are you sure you want to delete the quiz <strong>{{ quizToDelete.title }}</strong>?
                                    </p>
                                    <div style="padding: 1rem; background-color: #fff4f4; border-left: 4px solid #e74a3b; margin-top: 1rem; border-radius: 5px;">
                                        <p style="margin-bottom: 0; color: #e74a3b;">
                                            <i class="fas fa-exclamation-triangle me-2"></i> Warning
                                        </p>
                                        <p style="margin-bottom: 0; color: #6e7d88; font-size: 0.9rem;">
                                            This action cannot be undone. All questions and student attempts associated with this quiz will also be deleted.
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
                                    @click="deleteQuiz" 
                                    :disabled="loading"
                                >
                                    <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    <i v-else class="fas fa-trash-alt me-2"></i>
                                    Delete Quiz
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    }