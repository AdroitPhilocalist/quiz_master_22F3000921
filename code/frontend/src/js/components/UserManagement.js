export default {
    data() {
        return {
            users: [],
            loading: false,
            error: null,
            searchQuery: '',
            sortKey: 'created_at',
            sortOrder: 'desc',
            pagination: {
                currentPage: 1,
                totalPages: 1,
                itemsPerPage: 10,
                totalItems: 0
            },
            selectedUser: null,
            showUserModal: false,
            showDeleteModal: false,
            userForm: {
                id: null,
                username: '',
                full_name: '',
                email: '',
                role: 'user',
                qualification: '',
                dob: '',
                subject_interests: []
            },
            formErrors: {},
            subjects: [],
            userStats: null,
            selectedTab: 'all',
            filters: {
                role: '',
                status: ''
            },
            bulkSelected: [],
            userStatusOptions: [
                { value: 'active', label: 'Active', color: 'success' },
                { value: 'inactive', label: 'Inactive', color: 'secondary' }
                
            ]
        }
    },
    computed: {
        filteredUsers() {
            let result = [...this.users];
            
            // Filter by search
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                result = result.filter(user => 
                    user.username.toLowerCase().includes(query) || 
                    user.full_name.toLowerCase().includes(query) || 
                    user.email.toLowerCase().includes(query)
                );
            }
            
            // Filter by role
            if (this.filters.role) {
                result = result.filter(user => user.role === this.filters.role);
            }
            
            // Filter by status
            if (this.filters.status) {
                result = result.filter(user => user.status === this.filters.status);
            }
            
            // Filter by tab
            if (this.selectedTab === 'recent') {
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                result = result.filter(user => new Date(user.created_at) >= oneWeekAgo);
            }
            
            // Sort users
            result.sort((a, b) => {
                let aValue = a[this.sortKey];
                let bValue = b[this.sortKey];
                
                // Handle null values
                if (aValue === null) return 1;
                if (bValue === null) return -1;
                
                // String comparison
                if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }
                
                // Sort in ascending or descending order
                if (this.sortOrder === 'asc') {
                    return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
                } else {
                    return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
                }
            });
            
            return result;
        },
        paginatedUsers() {
            const start = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
            const end = start + this.pagination.itemsPerPage;
            return this.filteredUsers.slice(start, end);
        },
        pageNumbers() {
            const pages = [];
            const maxPages = Math.min(this.pagination.totalPages, 5);
            let startPage = Math.max(1, this.pagination.currentPage - 2);
            const endPage = Math.min(startPage + maxPages - 1, this.pagination.totalPages);
            
            if (endPage - startPage + 1 < maxPages) {
                startPage = Math.max(1, endPage - maxPages + 1);
            }
            
            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }
            
            return pages;
        }
    },
    created() {
        this.fetchUsers();
        this.fetchSubjects();
    },
    methods: {
        async fetchUsers() {
            this.loading = true;
            try {
                const response = await axios.get('/api/admin/users', {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                console.log('API response:', response.data);
                
                // Filter out admin users, only keep normal users
                const normalUsers = response.data.filter(user => user.role !== 'admin');
                
                this.users = normalUsers.map(user => ({
                    ...user,
                    status: user.status || 'active' // Default status if not provided
                }));
                
                this.pagination.totalItems = this.users.length;
                this.pagination.totalPages = Math.ceil(this.users.length / this.pagination.itemsPerPage);
                
            } catch (error) {
                this.error = 'Failed to load users';
                console.error('API error:', error);
            } finally {
                this.loading = false;
            }
        },
        async fetchSubjects() {
            try {
                const response = await axios.get('/api/subjects', {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                this.subjects = response.data.subjects;
            } catch (error) {
                console.error('Failed to fetch subjects:', error);
            }
        },
        async fetchUserStats(userId) {
            try {
                const response = await axios.get(`/api/user/profile`);
                this.userStats = response.data;
            } catch (error) {
                console.error("Failed to fetch user stats:", error);
            }
        },
        sortBy(key) {
            if (this.sortKey === key) {
                this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortKey = key;
                this.sortOrder = 'asc';
            }
        },
        getSortIconClass(key) {
            if (this.sortKey !== key) return 'fa-sort text-muted';
            return this.sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
        },
        changePage(page) {
            if (page < 1 || page > this.pagination.totalPages) return;
            this.pagination.currentPage = page;
        },
        resetPagination() {
            this.pagination.currentPage = 1;
        },
        viewUser(user) {
            this.selectedUser = user;
            this.showUserModal = true;
            this.fetchUserStats(user.id);
        },
        closeUserView() {
            this.selectedUser = null;
            this.userStats = null;
        },
        editUser(user) {
            this.userForm = {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                qualification: user.qualification || '',
                dob: user.dob || '',
                subject_interests: user.subject_interests || [],
                status: user.status || 'active'
            };
            this.formErrors = {};
            this.showUserModal = true;
        },
        createUser() {
            this.userForm = {
                id: null,
                username: '',
                full_name: '',
                email: '',
                role: 'user',
                qualification: '',
                dob: '',
                subject_interests: [],
                status: 'active'
            };
            this.formErrors = {};
            this.showUserModal = true;
        },
        confirmDeleteUser(user) {
            this.selectedUser = user;
            this.showDeleteModal = true;
        },
        async saveUser() {
            this.formErrors = {};
            
            // Basic validation
            if (!this.userForm.username) this.formErrors.username = 'Username is required';
            if (!this.userForm.full_name) this.formErrors.full_name = 'Full name is required';
            if (!this.userForm.email) {
                this.formErrors.email = 'Email is required';
            } else if (!/\S+@\S+\.\S+/.test(this.userForm.email)) {
                this.formErrors.email = 'Invalid email format';
            }
            
            if (Object.keys(this.formErrors).length > 0) return;
            
            try {
                let response;
                
                if (this.userForm.id) {
                    // Update existing user
                    response = await axios.put(`/api/admin/users/${this.userForm.id}`, this.userForm, {
                        headers: {
                            'Authentication-Token': localStorage.getItem('token')
                        }
                    });
                    
                    // Update local users array
                    const index = this.users.findIndex(u => u.id === this.userForm.id);
                    if (index !== -1) {
                        this.users[index] = { ...this.users[index], ...response.data.user };
                    }
                    
                    this.$toast.success('User updated successfully!', {
                        position: 'top-right',
                        timeout: 3000,
                        closeOnClick: true
                    });
                } else {
                    // Create new user
                    response = await axios.post('/api/admin/users', this.userForm, {
                        headers: {
                            'Authentication-Token': localStorage.getItem('token')
                        }
                    });
                    
                    // Add to local users array
                    this.users.unshift(response.data.user);
                    
                    this.$toast.success('User created successfully!', {
                        position: 'top-right',
                        timeout: 3000,
                        closeOnClick: true
                    });
                }
                
                this.showUserModal = false;
                
            } catch (error) {
                console.error('Error saving user:', error);
                if (error.response && error.response.data && error.response.data.errors) {
                    this.formErrors = error.response.data.errors;
                } else {
                    this.$toast.error('Failed to save user. Please try again.', {
                        position: 'top-right',
                        timeout: 5000,
                        closeOnClick: true
                    });
                }
            }
        },
        async deleteUser() {
            try {
                await axios.delete(`/api/admin/users/${this.selectedUser.id}`, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                this.users = this.users.filter(u => u.id !== this.selectedUser.id);
                this.showDeleteModal = false;
                this.$toast.success('User deleted successfully');
            } catch (error) {
                console.error("Failed to delete user:", error);
                this.$toast.error(error.response?.data?.message || 'Failed to delete user');
            }
        },
        
        closeModal() {
            this.showUserModal = false;
            this.showDeleteModal = false;
            this.selectedUser = null;
        },
        selectAllToggle(event) {
            const isChecked = event.target.checked;
            if (isChecked) {
                this.bulkSelected = this.paginatedUsers.map(user => user.id);
            } else {
                this.bulkSelected = [];
            }
        },
        async updateUserStatus(userId, newStatus) {
            try {
                await axios.patch(`/api/admin/users/${userId}/status`, 
                    { status: newStatus },
                    { 
                        headers: {
                            'Authentication-Token': localStorage.getItem('token')
                        }
                    }
                );
                
                // Update local user data
                const userIndex = this.users.findIndex(u => u.id === userId);
                if (userIndex !== -1) {
                    this.users[userIndex].status = newStatus;
                }
                
                alert("user status updated!");
                
            } catch (error) {
                console.error('Failed to update user status:', error);
                alert("user status updation failed!");
            }
        },
        async toggleUserActivation(userId, currentlyActive) {
            try {
                const newActiveStatus = !currentlyActive;
                await axios.patch(`/api/admin/users/${userId}/activate`, 
                    { active: newActiveStatus },
                    { 
                        headers: {
                            'Authentication-Token': localStorage.getItem('token')
                        }
                    }
                );
                
                // Update local user data
                const userIndex = this.users.findIndex(u => u.id === userId);
                if (userIndex !== -1) {
                    this.users[userIndex].active = newActiveStatus;
                }
                
                const message = newActiveStatus ? 'User activated successfully!' : 'User deactivated successfully!';
                alert("success");
                
            } catch (error) {
                console.error('Failed to update user activation status:', error);
                alert("error");
            }
        },
        getStatusBadgeClass(status) {
            const statusOption = this.userStatusOptions.find(opt => opt.value === status);
            return statusOption ? `bg-${statusOption.color}` : 'bg-secondary';
        },
        formatDate(dateString) {
            if (!dateString) return 'N/A';
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        exportUsers() {
            // This would typically trigger a call to an API endpoint that returns a CSV
            const endpoint = '/api/admin/users/export';
            window.open(`${endpoint}?token=${localStorage.getItem('token')}`, '_blank');
        }
    },
    watch: {
        searchQuery() {
            this.resetPagination();
        },
        'filters.role'() {
            this.resetPagination();
        },
        'filters.status'() {
            this.resetPagination();
        },
        selectedTab() {
            this.resetPagination();
        }
    },
    template: `
        <div class="d-flex">
            <!-- Sidebar (reused from AdminDashboard) -->
            <div class="sidebar" style="width: 250px;">
                <div class="sidebar-brand d-flex align-items-center justify-content-center py-4">
                    <div class="sidebar-brand-icon me-2">
                        <i class="fas fa-brain"></i>
                    </div>
                    <div class="sidebar-brand-text">Quiz Master</div>
                </div>
                
                <hr class="sidebar-divider my-0">
                
                <ul class="nav flex-column">
                    <li class="nav-item">
                        <router-link class="nav-link" to="/admin">
                            <i class="fas fa-fw fa-tachometer-alt"></i>
                            <span>Dashboard</span>
                        </router-link>
                    </li>
                    
                    <hr class="sidebar-divider">
                    <div class="sidebar-heading px-3 py-2 text-uppercase opacity-75 small">
                        Management
                    </div>
                    
                    <li class="nav-item">
                        <router-link class="nav-link active" to="/admin/users">
                            <i class="fas fa-fw fa-users"></i>
                            <span>Users</span>
                        </router-link>
                    </li>
                    <li class="nav-item">
                        <router-link class="nav-link" to="/admin/subjects">
                            <i class="fas fa-fw fa-book"></i>
                            <span>Subjects</span>
                        </router-link>
                    </li>
                    <li class="nav-item">
                        <router-link class="nav-link" to="/admin/chapters">
                            <i class="fas fa-fw fa-bookmark"></i>
                            <span>Chapters</span>
                        </router-link>
                    </li>
                    <li class="nav-item">
                        <router-link class="nav-link" to="/admin/quizzes">
                            <i class="fas fa-fw fa-question-circle"></i>
                            <span>Quizzes</span>
                        </router-link>
                    </li>
                    
                    <hr class="sidebar-divider">
                    <div class="sidebar-heading px-3 py-2 text-uppercase opacity-75 small">
                        Reports
                    </div>
                    
                    <li class="nav-item">
                        <router-link class="nav-link" to="/admin/analytics">
                            <i class="fas fa-fw fa-chart-bar"></i>
                            <span>Analytics</span>
                        </router-link>
                    </li>
                </ul>
            </div>
            
            <!-- Main Content -->
            <div class="flex-grow-1">
                <!-- Topbar -->
                <nav class="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow">
                    <button class="btn btn-link d-md-none rounded-circle mr-3">
                        <i class="fa fa-bars"></i>
                    </button>
                    
                    <ul class="navbar-nav ms-auto">
                        <li class="nav-item dropdown no-arrow">
                            <a class="nav-link dropdown-toggle text-dark me-3" href="#" id="userDropdown" role="button"
                                data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                <span class="me-2 d-none d-lg-inline">Admin</span>
                                <i class="fas fa-user-circle fa-fw text-dark"></i>
                            </a>
                            
                            <div class="dropdown-menu dropdown-menu-end shadow animated--grow-in"
                                aria-labelledby="userDropdown">
                                <a class="dropdown-item" href="#" @click.prevent="$emit('logout')">
                                    <i class="fas fa-sign-out-alt fa-sm fa-fw me-2 text-gray-400"></i>
                                    Logout
                                </a>
                            </div>
                        </li>
                    </ul>
                </nav>
                
                <!-- Begin Page Content -->
                <div class="container-fluid px-4">
                    <div class="d-sm-flex align-items-center justify-content-between mb-4">
                        <h1 class="h3 mb-0 text-gray-800">User Management</h1>
                        
                    </div>
                    
                    <div v-if="loading" class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                    
                    <div v-else-if="error" class="alert alert-danger" role="alert">
                        {{ error }}
                    </div>
                    
                    <div v-else>
                        <!-- User Management Tabs -->
                        <div class="card mb-4">
                            <div class="card-header bg-white py-3">
                                <ul class="nav nav-tabs card-header-tabs">
                                    <li class="nav-item">
                                        <a class="nav-link" :class="{ active: selectedTab === 'all' }" 
                                           href="#" @click.prevent="selectedTab = 'all'">
                                           All Users
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" :class="{ active: selectedTab === 'recent' }"
                                           href="#" @click.prevent="selectedTab = 'recent'">
                                           Recently Registered
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            
                            <div class="card-body">
                                <!-- Filters & Search -->
                                <div class="row mb-4 g-3">
                                    <div class="col-md-4">
                                        <div class="input-group">
                                            <span class="input-group-text bg-primary text-white">
                                                <i class="fas fa-search"></i>
                                            </span>
                                            <input type="text" class="form-control" placeholder="Search users..." 
                                                   v-model="searchQuery">
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-3">
                                        <select class="form-select" v-model="filters.role">
                                            <option value="">All Roles</option>
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    
                                    <div class="col-md-3">
                                        <select class="form-select" v-model="filters.status">
                                            <option value="">All Statuses</option>
                                            <option v-for="option in userStatusOptions" :value="option.value">
                                                {{ option.label }}
                                            </option>
                                        </select>
                                    </div>
                                    
                                    <div class="col-md-2">
                                        <button class="btn btn-outline-secondary w-100" @click="fetchUsers">
                                            <i class="fas fa-sync-alt me-1"></i> Refresh
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Users Table -->
                                <div class="table-responsive">
                                    <table class="table table-bordered table-hover align-middle">
                                        <thead class="table-light">
                                            <tr>
                                                <th @click="sortBy('username')" style="cursor: pointer">
                                                    Username 
                                                    <i class="fas" :class="getSortIconClass('username')"></i>
                                                </th>
                                                <th @click="sortBy('full_name')" style="cursor: pointer">
                                                    Full Name
                                                    <i class="fas" :class="getSortIconClass('full_name')"></i>
                                                </th>
                                                <th @click="sortBy('email')" style="cursor: pointer">
                                                    Email
                                                    <i class="fas" :class="getSortIconClass('email')"></i>
                                                </th>
                                                <th >
                                                    Qualification
                                                    <i class="fas" ></i>
                                                </th>
                                                <th @click="sortBy('role')" style="cursor: pointer">
                                                    Role
                                                    <i class="fas" :class="getSortIconClass('role')"></i>
                                                </th>
                                                <th @click="sortBy('created_at')" style="cursor: pointer">
                                                    Registration Date
                                                    <i class="fas" :class="getSortIconClass('created_at')"></i>
                                                </th>
                                                <th @click="sortBy('status')" style="cursor: pointer">
                                                    Status
                                                    <i class="fas" :class="getSortIconClass('status')"></i>
                                                </th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="user in paginatedUsers" :key="user.id" 
                                                :class="{'table-active': bulkSelected.includes(user.id)}">
                                
                                                <td>{{ user.username }}</td>
                                                <td>{{ user.full_name }}</td>
                                                <td>{{ user.email }}</td>
                                                <td>{{ user.qualification }}</td>
                                                
                                                <td>
                                                    <span class="badge" 
                                                          :class="user.role === 'admin' ? 'bg-danger' : 'bg-primary'">
                                                        {{ user.role }}
                                                    </span>
                                                </td>
                                                <td>{{ formatDate(user.created_at) }}</td>
                                            
                                                <td>
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" 
                                                            :checked="user.active !== false" 
                                                            @change="toggleUserActivation(user.id, user.active !== false)">
                                                        <label class="form-check-label">
                                                            {{ user.active !== false ? 'Active' : 'Inactive' }}
                                                        </label>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div class="btn-group">
                                                        <button @click="confirmDeleteUser(user)" class="btn btn-sm btn-danger" 
                                                                :disabled="user.role === 'admin'">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr v-if="paginatedUsers.length === 0">
                                                <td colspan="8" class="text-center py-4">
                                                    <div class="text-muted">
                                                        <i class="fas fa-search fa-2x mb-3"></i>
                                                        <p>No users found matching your criteria</p>
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
            </div>
            
           <!-- User Detail Modal -->
    <div class="modal fade" :class="{ show: showUserModal }" v-if="showUserModal" style="display: block; background: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
            <div class="modal-header bg-gradient-primary text-white">
                <h5 class="modal-title">
                    <i class="fas fa-user-circle me-2"></i>
                    User Profile: {{ selectedUser.full_name }}
                </h5>
                <button type="button" class="btn-close btn-close-white" @click="closeModal"></button>
            </div>
            <div class="modal-body">
                <!-- ... existing modal body content ... -->
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeModal">
                    Close
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Delete Confirmation Modal -->
<div class="modal fade" :class="{ show: showDeleteModal }" v-if="showDeleteModal" style="display: block; background: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header bg-danger text-white">
                <h5 class="modal-title">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Confirm Deletion
                </h5>
                <button type="button" class="btn-close btn-close-white" @click="closeModal"></button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete user <strong>{{ selectedUser.username }}</strong>?</p>
                <p class="text-danger">This action cannot be undone!</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeModal">
                    Cancel
                </button>
                <button type="button" class="btn btn-danger" @click="deleteUser">
                    <i class="fas fa-trash me-1"></i> Delete
                </button>
            </div>
        </div>
    </div>
</div>
</div>
    `
}