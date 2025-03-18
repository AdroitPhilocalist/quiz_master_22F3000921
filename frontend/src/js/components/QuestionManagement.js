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
            .question-item {
                transition: all 0.3s ease;
                border-radius: 12px !important;
                border: none !important;
                overflow: hidden;
                margin-bottom: 1rem;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            }
            .question-item:hover {
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            }
            .question-header {
                padding: 1rem;
                background-color: white;
                transition: all 0.2s ease;
            }
            .question-header:hover {
                background-color: rgba(78, 115, 223, 0.05);
            }
            .option-card {
                transition: all 0.2s ease;
                border-radius: 8px;
                overflow: hidden;
                margin-bottom: 0.75rem;
            }
            .option-card:hover {
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
            }
            .correct-option {
                border-left: 3px solid #1cc88a;
            }
            .incorrect-option {
                border-left: 3px solid #e74a3b;
            }
            .fade-in-up {
                animation: fadeInUp 0.5s ease forwards;
            }
            .action-btn {
                transition: all 0.2s ease;
                border-radius: 50px;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .action-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
            }
            .btn-floating {
                position: fixed;
                bottom: 2rem;
                right: 2rem;
                border-radius: 50%;
                width: 60px;
                height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                z-index: 1000;
                font-size: 1.5rem;
                transition: all 0.3s ease;
            }
            .btn-floating:hover {
                transform: translateY(-5px) rotate(90deg);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
            }
        `;
        document.head.appendChild(styleEl);
        
        // Remove the style element when component is destroyed
        this.$once('hook:beforeDestroy', () => {
            document.head.removeChild(styleEl);
        });
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
                console.log(this.questions);
            } catch (error) {
                this.error = 'Failed to load questions';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        
        openAddModal() {
            this.error = null;
            this.newQuestion = {
                text: '',
                options: [
                    { text: '', is_correct: true },
                    { text: '', is_correct: false }
                ],
                quiz_id: this.quizId
            };
            this.showAddModal = true;
            // Focus the input field after the modal is shown
            setTimeout(() => {
                const input = document.getElementById('questionText');
                if (input) input.focus();
            }, 100);
        },
        
        closeAddModal() {
            this.showAddModal = false;
        },
        
        openEditModal(question) {
            this.error = null;
            this.editingQuestion = JSON.parse(JSON.stringify(question)); // Deep copy
            this.showEditModal = true;
            // Focus the input field after the modal is shown
            setTimeout(() => {
                const input = document.getElementById('editQuestionText');
                if (input) input.focus();
            }, 100);
        },
        
        closeEditModal() {
            this.showEditModal = false;
        },
        
        openDeleteModal(question) {
            this.questionToDelete = question;
            this.showDeleteModal = true;
        },
        
        closeDeleteModal() {
            this.showDeleteModal = false;
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
                this.closeAddModal();
                this.fetchQuestions();
                this.showToast("Question added successfully", "Success", "success");
            } catch (error) {
                this.error = 'Failed to add question';
                console.error(error);
                this.showToast("Failed to add question", "Error", "danger");
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
                this.closeEditModal();
                this.fetchQuestions();
                this.showToast("Question updated successfully", "Success", "success");
            } catch (error) {
                this.error = 'Failed to update question';
                console.error(error);
                this.showToast("Failed to update question", "Error", "danger");
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
                this.closeDeleteModal();
                this.fetchQuestions();
                this.showToast("Question deleted successfully", "Success", "success");
            } catch (error) {
                this.error = 'Failed to delete question';
                console.error(error);
                this.showToast("Failed to delete question", "Error", "danger");
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
            console.log(dateString);
            return new Date(dateString).toLocaleString();
        }
    },
    template: `
        <div class="container-fluid py-5" style="font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
            <!-- Header Section -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <div style="display: flex; align-items: center;">
                    <button @click="goBack" class="btn btn-outline-primary me-3" 
                            style="border-radius: 50px; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(78, 115, 223, 0.15); transition: all 0.3s ease;">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <div>
                        <h2 style="font-weight: 700; color: #4e73df; margin: 0;">
                            <i class="fas fa-question-circle me-2"></i>{{ quiz ? quiz.title : 'Quiz Questions' }}
                        </h2>
                        <p style="color: #858796; margin: 0; font-size: 0.9rem;">
                            Manage questions and answer options for this quiz
                        </p>
                    </div>
                </div>
                <div class="input-group" style="max-width: 400px;">
                    <input type="text" class="form-control" 
                           style="border-radius: 50px 0 0 50px; padding-left: 1.5rem; border: none; box-shadow: 0 2px 5px rgba(0,0,0,0.1);" 
                           placeholder="Search questions..." 
                           v-model="searchQuery">
                    <span class="input-group-text" style="background: white; border: none; border-radius: 0 50px 50px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                        <i class="fas fa-search" style="color: #4e73df;"></i>
                    </span>
                </div>
            </div>
            
            <!-- Main Content Card -->
            <div style="border: none; border-radius: 15px; box-shadow: 0 5px 25px rgba(0, 0, 0, 0.08); overflow: hidden; margin-bottom: 2rem;">
                <div style="background: linear-gradient(135deg, #4e73df 0%, #224abe 100%); padding: 0;">
                    <div style="padding: 1.5rem; background-color: rgba(0, 0, 0, 0.1);">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center;">
                                <i class="fas fa-brain" style="color: white; font-size: 1.75rem; margin-right: 1rem;"></i>
                                <h4 style="color: white; margin: 0; font-weight: 300;">Quiz Questions</h4>
                            </div>
                            <button @click="openAddModal" class="btn btn-light" 
                                    style="border-radius: 50px; padding: 0.5rem 1.5rem; box-shadow: 0 2px 10px rgba(255, 255, 255, 0.2); transition: all 0.3s ease;">
                                <i class="fas fa-plus me-2"></i> Add Question
                            </button>
                        </div>
                    </div>
                </div>
                
                <div style="padding: 1.5rem;">
                    <!-- Loading State -->
                    <div v-if="loading" style="text-align: center; padding: 5rem;">
                        <div class="spinner-grow text-primary mb-3" style="width: 3rem; height: 3rem;" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p style="color: #6c757d; animation: fadeInOut 1.5s infinite;">Loading questions...</p>
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
                    <div v-else-if="questions.length === 0" style="text-align: center; padding: 5rem;">
                        <div style="margin-bottom: 1.5rem; position: relative;">
                            <i class="fas fa-question-circle" style="font-size: 4rem; color: #adb5bd; opacity: 0.5; margin-bottom: 1rem;"></i>
                            <div style="position: relative;">
                                <i class="fas fa-plus-circle" 
                                   style="color: #4e73df; position: absolute; font-size: 1.5rem; top: -30px; right: calc(50% - 45px); animation: pulse 2s infinite;"></i>
                            </div>
                        </div>
                        <h3 style="color: #6c757d; font-weight: 300;">No questions found</h3>
                        <p style="color: #6c757d; margin-bottom: 1.5rem;">Start by adding your first question to this quiz</p>
                        <button class="btn btn-primary btn-lg" 
                                style="border-radius: 50px; padding: 0.75rem 1.75rem; box-shadow: 0 2px 15px rgba(78, 115, 223, 0.2);" 
                                @click="openAddModal">
                            <i class="fas fa-plus me-2"></i> Add Your First Question
                        </button>
                    </div>
                    
                    <!-- Questions List -->
                    <div v-else>
                        <div class="accordion" id="questionsAccordion">
                            <div v-for="(question, index) in sortedQuestions" 
                                 :key="question.id" 
                                 class="question-item"
                                 :style="{
                                     animationDelay: index * 0.05 + 's'
                                 }"
                                 :class="{'fade-in-up': animateItems}">
                                <div class="accordion-item border-0 shadow-sm">
                                    <h2 class="accordion-header" :id="'heading' + question.id">
                                        <button class="accordion-button collapsed question-header" 
                                                type="button" 
                                                data-bs-toggle="collapse" 
                                                :data-bs-target="'#collapse' + question.id" 
                                                aria-expanded="false" 
                                                :aria-controls="'collapse' + question.id"
                                                style="background-color: white; border-radius: 12px;">
                                            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                                                <div style="display: flex; align-items: center;">
                                                    <span style="background-color: #4e73df; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; margin-right: 1rem; flex-shrink: 0;">
                                                        {{ index + 1 }}
                                                    </span>
                                                    <span style="font-weight: 500; color: #5a5c69;">{{ question.text }}</span>
                                                </div>
                                            </div>
                                        </button>
                                    </h2>
                                    <div :id="'collapse' + question.id" 
                                         class="accordion-collapse collapse" 
                                         :aria-labelledby="'heading' + question.id" 
                                         data-bs-parent="#questionsAccordion">
                                        <div class="accordion-body" style="background-color: #f8f9fc; border-radius: 0 0 12px 12px;">
                                            <div style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
                                                <h6 style="font-weight: 600; color: #4e73df; margin: 0;">
                                                    <i class="fas fa-list-ul me-2"></i>Options:
                                                </h6>
                                                <div>
                                                    <button @click="openEditModal(question)" 
                                                            class="btn btn-outline-primary action-btn me-2"
                                                            style="border-radius: 50%; width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center;">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button @click="openDeleteModal(question)" 
                                                            class="btn btn-outline-danger action-btn"
                                                            style="border-radius: 50%; width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center;">
                                                        <i class="fas fa-trash-alt"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div style="margin-bottom: 1rem;">
                                                <div v-for="option in question.options" 
                                                     :key="option.id"
                                                     class="option-card" 
                                                     :class="option.is_correct ? 'correct-option' : 'incorrect-option'">
                                                    <div style="padding: 0.75rem 1rem; background-color: white; display: flex; align-items: center; justify-content: space-between; border-radius: 8px;">
                                                        <div>{{ option.text }}</div>
                                                        <span v-if="option.is_correct" 
                                                              style="padding: 0.25rem 0.75rem; background-color: rgba(28, 200, 138, 0.1); color: #1cc88a; border-radius: 50px; font-size: 0.8rem; font-weight: 600;">
                                                            <i class="fas fa-check-circle me-1"></i> Correct
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div style="font-size: 0.8rem; color: #858796;">
                                                <i class="far fa-calendar-alt me-1"></i> Created: {{ formatDate(question) }}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <button @click="openAddModal" class="btn btn-primary btn-floating">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Add Question Modal -->
            <div v-if="showAddModal" class="modal" style="display: block; background-color: rgba(0, 0, 0, 0.5); position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1050; overflow-x: hidden; overflow-y: auto; outline: 0;">
                <div class="modal-dialog modal-dialog-centered modal-lg" style="position: relative; width: auto; margin: 1.75rem auto; pointer-events: none; z-index: 1051;">
                    <div style="position: relative; display: flex; flex-direction: column; width: 100%; pointer-events: auto; background-color: white; border: none; border-radius: 15px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15); overflow: hidden;">
                        <div style="background: #4e73df; padding: 1.5rem; position: relative;">
                            <div style="display: flex; align-items: center;">
                                <i class="fas fa-plus-circle" style="color: white; font-size: 1.5rem; margin-right: 1rem;"></i>
                                <h5 style="color: white; font-weight: 300; margin: 0;">Add New Question</h5>
                            </div>
                            <button type="button" class="btn-close btn-close-white" style="position: absolute; top: 1.25rem; right: 1.25rem;" @click="closeAddModal"></button>
                        </div>
                        <div style="padding: 1.5rem; background: white; max-height: 70vh; overflow-y: auto;">
                            <div v-if="error" 
                                 style="padding: 0.75rem 1rem; background-color: #f8d7da; color: #842029; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid #dc3545;">
                                <i class="fas fa-exclamation-circle me-2"></i>{{ error }}
                            </div>
                            
                            <div style="margin-bottom: 1.5rem;">
                                <label for="questionText" style="font-weight: 600; color: #4e73df; margin-bottom: 0.5rem;">Question Text</label>
                                <div style="display: flex; background-color: #f8f9fa; border-radius: 6px; overflow: hidden;">
                                    <span style="display: flex; align-items: center; justify-content: center; padding: 0 1rem; background-color: #f8f9fa;">
                                        <i class="fas fa-question-circle" style="color: #4e73df;"></i>
                                    </span>
                                    <textarea 
                                        class="form-control" 
                                        style="border: none; box-shadow: none; background-color: #f8f9fa; padding: 0.75rem;" 
                                        id="questionText" 
                                        placeholder="Enter your question here"
                                        v-model="newQuestion.text" 
                                        rows="3"
                                        required
                                    ></textarea>
                                </div>
                            </div>
                            
                            <div style="margin-bottom: 1rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                    <label style="font-weight: 600; color: #4e73df; margin: 0;">
                                        <i class="fas fa-list-ul me-2"></i>Answer Options
                                    </label>
                                    <button type="button" 
                                            class="btn btn-outline-primary btn-sm" 
                                            @click="addOption(newQuestion)"
                                            style="border-radius: 50px;">
                                        <i class="fas fa-plus me-1"></i> Add Option
                                    </button>
                                </div>
                                <p style="color: #858796; font-size: 0.85rem; margin-top: -0.5rem; margin-bottom: 1rem;">
                                Select at least one correct answer option.
                                </p>
                                
                                <div v-for="(option, index) in newQuestion.options" :key="index" 
                                     style="margin-bottom: 0.75rem;">
                                    <div style="display: flex; align-items: center; background-color: white; border-radius: 6px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05); padding: 0.5rem; position: relative;" 
                                         :class="option.is_correct ? 'correct-option' : 'incorrect-option'">
                                        <div class="form-check form-switch" style="margin-right: 0.75rem;">
                                            <input class="form-check-input" type="checkbox" 
                                                   style="width: 2.5em; height: 1.25em;"
                                                   :id="'option-correct-' + index" 
                                                   v-model="option.is_correct">
                                            <label class="form-check-label" :for="'option-correct-' + index" style="font-size: 0.8rem; white-space: nowrap; margin-left: 0.7rem;">
                                                {{ option.is_correct ? 'Correct' : 'Incorrect' }}
                                            </label>
                                        </div>
                                        <input type="text" 
                                               class="form-control" 
                                               style="border: none; background-color: transparent;" 
                                               v-model="option.text" 
                                               placeholder="Enter option text">
                                        <button type="button" 
                                                class="btn btn-sm btn-outline-danger" 
                                                style="margin-left: 0.5rem;"
                                                @click="removeOption(newQuestion, index)" 
                                                :disabled="newQuestion.options.length <= 2">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
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
                                @click="addQuestion" 
                                :disabled="loading"
                            >
                                <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                <i v-else class="fas fa-plus-circle me-2"></i>
                                Add Question
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Edit Question Modal -->
            <div v-if="showEditModal" class="modal" style="display: block; background-color: rgba(0, 0, 0, 0.5); position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1050; overflow-x: hidden; overflow-y: auto; outline: 0;">
                <div class="modal-dialog modal-dialog-centered modal-lg" style="position: relative; width: auto; margin: 1.75rem auto; pointer-events: none; z-index: 1051;">
                    <div style="position: relative; display: flex; flex-direction: column; width: 100%; pointer-events: auto; background-color: white; border: none; border-radius: 15px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15); overflow: hidden;">
                        <div style="background: #4e73df; padding: 1.5rem; position: relative;">
                            <div style="display: flex; align-items: center;">
                                <i class="fas fa-edit" style="color: white; font-size: 1.5rem; margin-right: 1rem;"></i>
                                <h5 style="color: white; font-weight: 300; margin: 0;">Edit Question</h5>
                            </div>
                            <button type="button" class="btn-close btn-close-white" style="position: absolute; top: 1.25rem; right: 1.25rem;" @click="closeEditModal"></button>
                        </div>
                        <div v-if="editingQuestion" style="padding: 1.5rem; background: white; max-height: 70vh; overflow-y: auto;">
                            <div v-if="error" 
                                 style="padding: 0.75rem 1rem; background-color: #f8d7da; color: #842029; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid #dc3545;">
                                <i class="fas fa-exclamation-circle me-2"></i>{{ error }}
                            </div>
                            
                            <div style="margin-bottom: 1.5rem;">
                                <label for="editQuestionText" style="font-weight: 600; color: #4e73df; margin-bottom: 0.5rem;">Question Text</label>
                                <div style="display: flex; background-color: #f8f9fa; border-radius: 6px; overflow: hidden;">
                                    <span style="display: flex; align-items: center; justify-content: center; padding: 0 1rem; background-color: #f8f9fa;">
                                        <i class="fas fa-question-circle" style="color: #4e73df;"></i>
                                    </span>
                                    <textarea 
                                        class="form-control" 
                                        style="border: none; box-shadow: none; background-color: #f8f9fa; padding: 0.75rem;" 
                                        id="editQuestionText" 
                                        placeholder="Enter your question here"
                                        v-model="editingQuestion.text" 
                                        rows="3"
                                        required
                                    ></textarea>
                                </div>
                            </div>
                            
                            <div style="margin-bottom: 1rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                    <label style="font-weight: 600; color: #4e73df; margin: 0;">
                                        <i class="fas fa-list-ul me-2"></i>Answer Options
                                    </label>
                                    <button type="button" 
                                            class="btn btn-outline-primary btn-sm" 
                                            @click="addOption()"
                                            style="border-radius: 50px;">
                                        <i class="fas fa-plus me-1"></i> Add Option
                                    </button>
                                </div>
                                
                                <p style="color: #858796; font-size: 0.85rem; margin-top: -0.5rem; margin-bottom: 1rem;">
                                    Select at least one correct answer option.
                                </p>
                                
                                <div v-for="(option, index) in editingQuestion.options" :key="index" 
                                     style="margin-bottom: 0.75rem;">
                                    <div style="display: flex; align-items: center; background-color: white; border-radius: 6px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05); padding: 0.5rem; position: relative;" 
                                         :class="option.is_correct ? 'correct-option' : 'incorrect-option'">
                                        <div class="form-check form-switch" style="margin-right: 0.75rem;">
                                            <input class="form-check-input" type="checkbox" 
                                                   style="width: 2.5em; height: 1.25em;"
                                                   :id="'edit-option-correct-' + index" 
                                                   :checked="option.is_correct"
                                                   @change="setCorrectOption(index, true)">
                                            <label class="form-check-label" :for="'edit-option-correct-' + index" style="font-size: 0.8rem; white-space: nowrap;">
                                                {{ option.is_correct ? 'Correct' : 'Incorrect' }}
                                            </label>
                                        </div>
                                        <input type="text" 
                                               class="form-control" 
                                               style="border: none; background-color: transparent;" 
                                               v-model="option.text" 
                                               placeholder="Enter option text">
                                        <button type="button" 
                                                class="btn btn-sm btn-outline-danger" 
                                                style="margin-left: 0.5rem;"
                                                @click="removeOption(index)" 
                                                :disabled="editingQuestion.options.length <= 2">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
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
                                @click="updateQuestion" 
                                :disabled="loading"
                            >
                                <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                <i v-else class="fas fa-save me-2"></i>
                                Update Question
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Delete Question Modal -->
            <div v-if="showDeleteModal" class="modal" style="display: block; background-color: rgba(0, 0, 0, 0.5); position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1050; overflow-x: hidden; overflow-y: auto; outline: 0;">
                <div class="modal-dialog modal-dialog-centered" style="position: relative; width: auto; margin: 1.75rem auto; pointer-events: none; z-index: 1051;">
                    <div style="position: relative; display: flex; flex-direction: column; width: 100%; pointer-events: auto; background-color: white; border: none; border-radius: 15px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15); overflow: hidden;">
                        <div style="background: #e74a3b; padding: 1.5rem; position: relative;">
                            <div style="display: flex; align-items: center;">
                                <i class="fas fa-trash-alt" style="color: white; font-size: 1.5rem; margin-right: 1rem;"></i>
                                <h5 style="color: white; font-weight: 300; margin: 0;">Delete Question</h5>
                            </div>
                            <button type="button" class="btn-close btn-close-white" style="position: absolute; top: 1.25rem; right: 1.25rem;" @click="closeDeleteModal"></button>
                        </div>
                        <div style="padding: 1.5rem; background: white;" v-if="questionToDelete">
                            <div style="margin-bottom: 1rem;">
                                <p style="font-size: 1.1rem; color: #5a5c69;">
                                    Are you sure you want to delete this question?
                                </p>
                                <div style="padding: 1rem; background-color: #fff4f4; border-left: 4px solid #e74a3b; margin-top: 1rem; border-radius: 5px;">
                                    <p style="margin-bottom: 0; color: #e74a3b;">
                                        <i class="fas fa-exclamation-triangle me-2"></i> Warning
                                    </p>
                                    <p style="margin-bottom: 0; color: #6e7d88; font-size: 0.9rem;">
                                        This action cannot be undone. All student responses associated with this question will also be deleted.
                                    </p>
                                </div>
                                
                                <div style="margin-top: 1.5rem; padding: 1rem; background-color: #f8f9fc; border-radius: 8px;">
                                    <h6 style="font-weight: 600; color: #4e73df; margin-bottom: 0.5rem;">Question to be deleted:</h6>
                                    <p style="color: #5a5c69;">{{ questionToDelete.text }}</p>
                                    
                                    <div style="margin-top: 0.75rem; font-size: 0.85rem; color: #858796;">
                                        <span style="font-weight: 600;">Options:</span> {{ questionToDelete.options.length }}
                                    </div>
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
                                @click="deleteQuestion" 
                                :disabled="loading"
                            >
                                <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                <i v-else class="fas fa-trash-alt me-2"></i>
                                Delete Question
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}