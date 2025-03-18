export default {
  data() {
    return {
      subjects: [],
      loading: false,
      error: null,
      newSubject: {
        name: "",
        description: "",
      },
      editingSubject: null,
      showAddModal: false,
      showEditModal: false,
      showDeleteModal: false,
      subjectToDelete: null,
    };
  },
  mounted() {
    // Initialize tooltips if bootstrap is available
    if (typeof bootstrap !== 'undefined') {
      const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
      tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
      });
    }

    // Create and inject animations dynamically
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @keyframes fadeInOut {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
      }
      @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(styleEl);
    
    // Remove the style element when component is destroyed
    this.$once('hook:beforeDestroy', () => {
      document.head.removeChild(styleEl);
    });
  },
  created() {
    this.fetchSubjects();
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
      this.loading = true;
      try {
        const response = await axios.get("/api/subjects", {
          headers: {
            "Authentication-Token": localStorage.getItem("token"),
          },
        });
        this.subjects = response.data;
      } catch (error) {
        this.error = "Failed to load subjects";
        console.error(error);
      } finally {
        this.loading = false;
      }
    },
    openAddModal() {
      this.newSubject = { name: "", description: "" };
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
        await axios.post("/api/subjects", this.newSubject, {
          headers: {
            "Authentication-Token": localStorage.getItem("token"),
            "Content-Type": "application/json",
          },
        });
        this.showAddModal = false;
        this.fetchSubjects();
        this.showToast("Subject added successfully", "Success", "success");
      } catch (error) {
        this.error = "Failed to add subject";
        console.error(error);
        this.showToast("Failed to add subject", "Error", "danger");
      } finally {
        this.loading = false;
      }
    },
    async updateSubject() {
      this.loading = true;
      try {
        await axios.put(
          `/api/subjects/${this.editingSubject.id}`,
          {
            name: this.editingSubject.name,
            description: this.editingSubject.description,
          },
          {
            headers: {
              "Authentication-Token": localStorage.getItem("token"),
              "Content-Type": "application/json",
            },
          }
        );
        this.showEditModal = false;
        this.fetchSubjects();
        this.showToast("Subject updated successfully", "Success", "success");
      } catch (error) {
        this.error = "Failed to update subject";
        console.error(error);
        this.showToast("Failed to update subject", "Error", "danger");
      } finally {
        this.loading = false;
      }
    },
    async deleteSubject() {
      this.loading = true;
      try {
        await axios.delete(`/api/subjects/${this.subjectToDelete.id}`, {
          headers: {
            "Authentication-Token": localStorage.getItem("token"),
          },
        });
        this.showDeleteModal = false;
        this.fetchSubjects();
        this.showToast("Subject deleted successfully", "Success", "success");
      } catch (error) {
        this.error = "Failed to delete subject";
        console.error(error);
        this.showToast("Failed to delete subject", "Error", "danger");
      } finally {
        this.loading = false;
      }
    },
    viewChapters(subjectId) {
      this.$router.push(`/admin/subjects/${subjectId}/chapters`);
    },
  },
  template: `
  <div class="container-fluid py-5" style="font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
      <div class="row">
          <div class="col-12">
              <!-- Header Section -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                  <h2 style="font-weight: 700; color: #4e73df; margin: 0;">
                      <i class="fas fa-book-open me-2"></i>Subject Management
                  </h2>
                  <button class="btn btn-primary btn-lg" 
                          style="border-radius: 50px; padding: 0.5rem 1.5rem; box-shadow: 0 2px 10px rgba(78, 115, 223, 0.2); transition: all 0.3s ease;" 
                          @click="openAddModal">
                      <i class="fas fa-plus me-2"></i> Add New Subject
                  </button>
              </div>
              
              <!-- Main Content Card -->
              <div style="border: none; border-radius: 10px; box-shadow: 0 5px 25px rgba(0, 0, 0, 0.08); overflow: hidden; margin-bottom: 2rem; transition: all 0.3s ease;">
                  <div style="background: linear-gradient(135deg, #4e73df 0%, #224abe 100%); padding: 0;">
                      <div style="padding: 1.5rem; background-color: rgba(0, 0, 0, 0.1);">
                          <div style="display: flex; justify-content: space-between; align-items: center;">
                              <div style="display: flex; align-items: center;">
                                  <i class="fas fa-layer-group" style="color: white; font-size: 1.75rem; margin-right: 1rem;"></i>
                                  <h4 style="color: white; margin: 0; font-weight: 300;">Your Subjects Collection</h4>
                              </div>
                              <div v-if="subjects.length > 0" 
                                   style="background-color: white; color: #4e73df; border-radius: 50px; padding: 0.35rem 1rem; font-size: 0.85rem; font-weight: 600;">
                                  <i class="fas fa-clipboard-list me-1"></i> {{subjects.length}} Subjects
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
                          <p style="color: #6c757d; animation: fadeInOut 1.5s infinite;">Loading subjects...</p>
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
                      <div v-else-if="subjects.length === 0" style="text-align: center; padding: 5rem;">
                          <div style="margin-bottom: 1.5rem; position: relative;">
                              <i class="fas fa-book" style="font-size: 4rem; color: #adb5bd; opacity: 0.5; margin-bottom: 1rem;"></i>
                              <div style="position: relative;">
                                  <i class="fas fa-plus-circle" 
                                     style="color: #4e73df; position: absolute; font-size: 1.5rem; top: -30px; right: calc(50% - 45px); animation: pulse 2s infinite;"></i>
                              </div>
                          </div>
                          <h3 style="color: #6c757d; font-weight: 300;">No subjects found</h3>
                          <p style="color: #6c757d; margin-bottom: 1.5rem;">Get started by creating your first subject</p>
                          <button class="btn btn-primary btn-lg" 
                                  style="border-radius: 50px; padding: 0.75rem 1.75rem; box-shadow: 0 2px 15px rgba(78, 115, 223, 0.2);" 
                                  @click="openAddModal">
                              <i class="fas fa-plus me-2"></i> Add Your First Subject
                          </button>
                      </div>
                      
                      <!-- Subjects Table -->
                      <div v-else class="table-responsive">
                          <table class="table mb-0" style="border-collapse: separate; border-spacing: 0;">
                              <thead>
                                  <tr style="background-color: #f8f9fa;">
                                      <th style="padding: 1rem 1.5rem; font-size: 0.75rem; letter-spacing: 0.05rem; text-transform: uppercase; font-weight: 600; color: #4e73df; border-bottom: 1px solid #e3e6f0;">Name</th>
                                      <th style="padding: 1rem 1.5rem; font-size: 0.75rem; letter-spacing: 0.05rem; text-transform: uppercase; font-weight: 600; color: #4e73df; border-bottom: 1px solid #e3e6f0;">Description</th>
                                      <th style="padding: 1rem 1.5rem; font-size: 0.75rem; letter-spacing: 0.05rem; text-transform: uppercase; font-weight: 600; color: #4e73df; border-bottom: 1px solid #e3e6f0;">Created At</th>
                                      <th style="padding: 1rem 1.5rem; font-size: 0.75rem; letter-spacing: 0.05rem; text-transform: uppercase; font-weight: 600; color: #4e73df; border-bottom: 1px solid #e3e6f0; text-align: right;">Actions</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  <tr v-for="subject in subjects" :key="subject.id" 
                                      style="transition: all 0.2s ease; border-bottom: 1px solid #e3e6f0;"
                                      :style="{ backgroundColor: subject === subjectToDelete ? 'rgba(253, 237, 237, 0.5)' : 'transparent' }">
                                      <td style="padding: 1rem 1.5rem; vertical-align: middle;">
                                          <div style="display: flex; align-items: center;">
                                              <div style="width: 40px; height: 40px; background-color: rgba(78, 115, 223, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 1rem;">
                                                  <i class="fas fa-book" style="color: #4e73df;"></i>
                                              </div>
                                              <div>
                                                  <h6 style="font-weight: 600; margin-bottom: 0;">{{ subject.name }}</h6>
                                              </div>
                                          </div>
                                      </td>
                                      <td style="padding: 1rem 1.5rem; vertical-align: middle;">
                                          <p style="color: #6c757d; margin-bottom: 0; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ subject.description || 'No description' }}</p>
                                      </td>
                                      <td style="padding: 1rem 1.5rem; vertical-align: middle;">
                                          <div style="display: flex; align-items: center;">
                                              <i class="far fa-calendar-alt" style="color: #6c757d; margin-right: 0.5rem;"></i>
                                              <span style="color: #495057;">{{ new Date(subject.created_at).toLocaleString() }}</span>
                                          </div>
                                      </td>
                                      <td style="padding: 1rem 1.5rem; vertical-align: middle; text-align: right;">
                                          <div style="display: flex; justify-content: flex-end;">
                                              <button class="btn btn-light btn-sm" 
                                                      style="margin-right: 0.5rem; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: none;" 
                                                      data-bs-toggle="tooltip" 
                                                      title="View Chapters"
                                                      @click="viewChapters(subject.id)">
                                                  <i class="fas fa-list-ul" style="color: #4e73df;"></i>
                                              </button>
                                              <button class="btn btn-light btn-sm" 
                                                      style="margin-right: 0.5rem; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: none;" 
                                                      data-bs-toggle="tooltip" 
                                                      title="Edit Subject"
                                                      @click="openEditModal(subject)">
                                                  <i class="fas fa-edit" style="color: #6c757d;"></i>
                                              </button>
                                              <button class="btn btn-light btn-sm" 
                                                      style="border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: none;" 
                                                      data-bs-toggle="tooltip" 
                                                      title="Delete Subject"
                                                      @click="openDeleteModal(subject)">
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
          </div>
      </div>

      <!-- Add Subject Modal -->
      <div class="modal fade" :class="{ 'show d-block': showAddModal }" tabindex="-1" role="dialog" style="backdrop-filter: blur(5px);">
          <div class="modal-dialog modal-dialog-centered" style="max-width: 500px;">
              <div style="border: none; border-radius: 15px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15); overflow: hidden;">
                  <div style="background: #4e73df; padding: 1.5rem;">
                      <div style="display: flex; align-items: center;">
                          <i class="fas fa-plus-circle" style="color: white; font-size: 1.5rem; margin-right: 1rem;"></i>
                          <h5 style="color: white; font-weight: 300; margin: 0;">Add New Subject</h5>
                      </div>
                      <button type="button" class="btn-close btn-close-white" style="position: absolute; top: 1.25rem; right: 1.25rem;" @click="showAddModal = false"></button>
                  </div>
                  <div style="padding: 1.5rem; background: white;">
                      <div style="margin-bottom: 1.5rem;">
                          <label for="subjectName" style="font-weight: 600; color: #4e73df; margin-bottom: 0.5rem;">Subject Name</label>
                          <div style="display: flex; background-color: #f8f9fa; border-radius: 6px; overflow: hidden;">
                              <span style="display: flex; align-items: center; justify-content: center; padding: 0 1rem; background-color: #f8f9fa;">
                                  <i class="fas fa-book" style="color: #4e73df;"></i>
                              </span>
                              <input 
                                  type="text" 
                                  class="form-control form-control-lg" 
                                  style="border: none; box-shadow: none; background-color: #f8f9fa; padding: 0.75rem;" 
                                  id="subjectName" 
                                  placeholder="Enter subject name"
                                  v-model="newSubject.name" 
                                  required
                              >
                          </div>
                      </div>
                      <div style="margin-bottom: 1rem;">
                          <label for="subjectDescription" style="font-weight: 600; color: #4e73df; margin-bottom: 0.5rem;">Description</label>
                          <div style="display: flex; background-color: #f8f9fa; border-radius: 6px; overflow: hidden;">
                              <span style="display: flex; align-items: center; justify-content: center; padding: 0 1rem; background-color: #f8f9fa;">
                                  <i class="fas fa-align-left" style="color: #4e73df;"></i>
                              </span>
                              <textarea 
                                  class="form-control form-control-lg" 
                                  style="border: none; box-shadow: none; background-color: #f8f9fa; padding: 0.75rem;" 
                                  id="subjectDescription" 
                                  placeholder="Enter subject description (optional)"
                                  v-model="newSubject.description" 
                                  rows="4"
                              ></textarea>
                          </div>
                      </div>
                  </div>
                  <div style="padding: 1.5rem; background: white; border-top: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: flex-end;">
                      <button type="button" 
                              class="btn btn-light btn-lg" 
                              style="margin-right: 0.75rem; padding-left: 1.5rem; padding-right: 1.5rem;" 
                              @click="showAddModal = false">
                          Cancel
                      </button>
                      <button 
                          type="button" 
                          class="btn btn-primary btn-lg" 
                          style="padding-left: 1.5rem; padding-right: 1.5rem; display: flex; align-items: center;" 
                          @click="addSubject" 
                          :disabled="loading || !newSubject.name"
                      >
                          <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          <i v-else class="fas fa-plus-circle me-2"></i>
                          Create Subject
                      </button>
                  </div>
              </div>
          </div>
      </div>
      <div class="modal-backdrop fade" :class="{ 'show': showAddModal }" v-if="showAddModal" style="opacity: 0.6;"></div>

      <!-- Edit Subject Modal -->
      <div class="modal fade" :class="{ 'show d-block': showEditModal }" tabindex="-1" role="dialog" style="backdrop-filter: blur(5px);">
          <div class="modal-dialog modal-dialog-centered" style="max-width: 500px;">
              <div style="border: none; border-radius: 15px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15); overflow: hidden;">
                  <div style="background: #4e73df; padding: 1.5rem;">
                      <div style="display: flex; align-items: center;">
                          <i class="fas fa-edit" style="color: white; font-size: 1.5rem; margin-right: 1rem;"></i>
                          <h5 style="color: white; font-weight: 300; margin: 0;">Edit Subject</h5>
                      </div>
                      <button type="button" class="btn-close btn-close-white" style="position: absolute; top: 1.25rem; right: 1.25rem;" @click="showEditModal = false"></button>
                  </div>
                  <div style="padding: 1.5rem; background: white;" v-if="editingSubject">
                      <div style="margin-bottom: 1.5rem;">
                          <label for="editSubjectName" style="font-weight: 600; color: #4e73df; margin-bottom: 0.5rem;">Subject Name</label>
                          <div style="display: flex; background-color: #f8f9fa; border-radius: 6px; overflow: hidden;">
                              <span style="display: flex; align-items: center; justify-content: center; padding: 0 1rem; background-color: #f8f9fa;">
                                  <i class="fas fa-book" style="color: #4e73df;"></i>
                              </span>
                              <input 
                                  type="text" 
                                  class="form-control form-control-lg" 
                                  style="border: none; box-shadow: none; background-color: #f8f9fa; padding: 0.75rem;" 
                                  id="editSubjectName" 
                                  v-model="editingSubject.name" 
                                  required
                              >
                          </div>
                      </div>
                      <div style="margin-bottom: 1rem;">
                          <label for="editSubjectDescription" style="font-weight: 600; color: #4e73df; margin-bottom: 0.5rem;">Description</label>
                          <div style="display: flex; background-color: #f8f9fa; border-radius: 6px; overflow: hidden;">
                              <span style="display: flex; align-items: center; justify-content: center; padding: 0 1rem; background-color: #f8f9fa;">
                                  <i class="fas fa-align-left" style="color: #4e73df;"></i>
                              </span>
                              <textarea 
                                  class="form-control form-control-lg" 
                                  style="border: none; box-shadow: none; background-color: #f8f9fa; padding: 0.75rem;" 
                                  id="editSubjectDescription" 
                                  v-model="editingSubject.description" 
                                  rows="4"
                              ></textarea>
                          </div>
                      </div>
                  </div>
                  <div style="padding: 1.5rem; background: white; border-top: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: flex-end;">
                      <button type="button" 
                              class="btn btn-light btn-lg" 
                              style="margin-right: 0.75rem; padding-left: 1.5rem; padding-right: 1.5rem;" 
                              @click="showEditModal = false">
                          Cancel
                      </button>
                      <button 
                          type="button" 
                          class="btn btn-primary btn-lg" 
                          style="padding-left: 1.5rem; padding-right: 1.5rem; display: flex; align-items: center;" 
                          @click="updateSubject" 
                          :disabled="loading || !editingSubject?.name"
                      >
                          <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          <i v-else class="fas fa-save me-2"></i>
                          Update Subject
                      </button>
                  </div>
              </div>
          </div>
      </div>
      <div class="modal-backdrop fade" :class="{ 'show': showEditModal }" v-if="showEditModal" style="opacity: 0.6;"></div>

      <!-- Delete Subject Modal -->
      <div class="modal fade" :class="{ 'show d-block': showDeleteModal }" tabindex="-1" role="dialog" style="backdrop-filter: blur(5px);">
          <div class="modal-dialog modal-dialog-centered" style="max-width: 500px;">
              <div style="border: none; border-radius: 15px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15); overflow: hidden;">
                  <div style="background: #e74a3b; padding: 1.5rem;">
                      <div style="display: flex; align-items: center;">
                          <i class="fas fa-exclamation-triangle" style="color: white; font-size: 1.5rem; margin-right: 1rem;"></i>
                          <h5 style="color: white; font-weight: 300; margin: 0;">Delete Subject</h5>
                      </div>
                      <button type="button" class="btn-close btn-close-white" style="position: absolute; top: 1.25rem; right: 1.25rem;" @click="showDeleteModal = false"></button>
                  </div>
                  <div style="padding: 1.5rem; background: white;" v-if="subjectToDelete">
                      <div style="text-align: center; margin-bottom: 1.5rem;">
                          <div style="width: fit-content; margin: 0 auto 1.5rem; padding: 1.5rem; background-color: rgba(231, 74, 59, 0.1); border-radius: 50%;">
                              <i class="fas fa-trash" style="font-size: 2.5rem; color: #e74a3b;"></i>
                          </div>
                          <h4 style="margin-bottom: 0.5rem;">Are you sure?</h4>
                          <p style="color: #6c757d;">You are about to delete the subject <strong style="color: #e74a3b;">{{ subjectToDelete.name }}</strong></p>
                      </div>
                      <div style="padding: 1rem; background-color: #fff3cd; border-radius: 6px; color: #856404;">
                          <div style="display: flex;">
                              <i class="fas fa-exclamation-circle" style="font-size: 1.25rem; margin-right: 1rem;"></i>
                              <div>
                                  <p style="margin-bottom: 0;"><strong>Warning:</strong> This will permanently delete all chapters, quizzes, and questions associated with this subject. This action cannot be undone.</p>
                              </div>
                          </div>
                      </div>
                  </div>
                  <div style="padding: 1.5rem; background: white; border-top: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: flex-end;">
                      <button type="button" 
                              class="btn btn-light btn-lg" 
                              style="margin-right: 0.75rem; padding-left: 1.5rem; padding-right: 1.5rem;" 
                              @click="showDeleteModal = false">
                          Cancel
                      </button>
                      <button 
                          type="button" 
                          class="btn btn-danger btn-lg" 
                          style="padding-left: 1.5rem; padding-right: 1.5rem; display: flex; align-items: center;" 
                          @click="deleteSubject" 
                          :disabled="loading"
                      >
                          <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          <i v-else class="fas fa-trash-alt me-2"></i>
                          Delete Subject
                      </button>
                  </div>
              </div>
          </div>
      </div>
      <div class="modal-backdrop fade" :class="{ 'show': showDeleteModal }" v-if="showDeleteModal" style="opacity: 0.6;"></div>
  </div>
    `,
};
