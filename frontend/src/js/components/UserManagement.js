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
                { value: 'inactive', label: 'Inactive', color: 'secondary' },
                { value: 'suspended', label: 'Suspended', color: 'warning' },
                { value: 'banned', label: 'Banned', color: 'danger' }
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
                
                this.users = response.data.users.map(user => ({
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
                const response = await axios.get(`/api/admin/users/${userId}/stats`, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                this.userStats = response.data;
            } catch (error) {
                console.error('Failed to fetch user stats:', error);
                this.userStats = null;
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
            if (!this.selectedUser) return;
            
            try {
                await axios.delete(`/api/admin/users/${this.selectedUser.id}`, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                
                // Remove from local array
                this.users = this.users.filter(u => u.id !== this.selectedUser.id);
                
                this.$toast.success('User deleted successfully!', {
                    position: 'top-right',
                    timeout: 3000,
                    closeOnClick: true
                });
                
                this.showDeleteModal = false;
                this.selectedUser = null;
                
            } catch (error) {
                console.error('Error deleting user:', error);
                this.$toast.error('Failed to delete user. Please try again.', {
                    position: 'top-right',
                    timeout: 5000,
                    closeOnClick: true
                });
            }
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
                
                this.$toast.success('User status updated!', {
                    position: 'top-right',
                    timeout: 2000,
                    closeOnClick: true
                });
                
            } catch (error) {
                console.error('Failed to update user status:', error);
                this.$toast.error('Failed to update user status', {
                    position: 'top-right',
                    timeout: 3000,
                    closeOnClick: true
                });
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
                                <a class="dropdown-item" href="#">
                                    <i class="fas fa-user fa-sm fa-fw me-2 text-gray-400"></i>
                                    Profile
                                </a>
                                <a class="dropdown-item" href="#">
                                    <i class="fas fa-cogs fa-sm fa-fw me-2 text-gray-400"></i>
                                    Settings
                                </a>
                                <div class="dropdown-divider"></div>
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
                        <div>
                            <button @click="exportUsers" class="btn btn-sm btn-primary shadow-sm me-2">
                                <i class="fas fa-download fa-sm text-white-50 me-1"></i> Export Users
                            </button>
                            <button @click="createUser" class="btn btn-sm btn-success shadow-sm">
                                <i class="fas fa-user-plus fa-sm text-white-50 me-1"></i> Add New User
                            </button>
                        </div>
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
                                                <th style="width: 40px;">
                                                    <input class="form-check-input" type="checkbox" 
                                                           @change="selectAllToggle">
                                                </th>
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
                                                <td>
                                                    <input class="form-check-input" type="checkbox" 
                                                           v-model="bulkSelected" :value="user.id">
                                                </td>
                                                <td>{{ user.username }}</td>
                                                <td>{{ user.full_name }}</td>
                                                <td>{{ user.email }}</td>
                                                <td>
                                                    <span class="badge" 
                                                          :class="user.role === 'admin' ? 'bg-danger' : 'bg-primary'">
                                                        {{ user.role }}
                                                    </span>
                                                </td>
                                                <td>{{ formatDate(user.created_at) }}</td>
                                                <td>
                                                    <div class="dropdown">
                                                        <button class="btn btn-sm rounded-pill dropdown-toggle" 
                                                                :class="getStatusBadgeClass(user.status)" 
                                                                data-bs-toggle="dropdown">
                                                            {{ user.status || 'Active' }}
                                                        </button>
                                                        <ul class="dropdown-menu">
                                                            <li v-for="option in userStatusOptions">
                                                                <a class="dropdown-item" href="#" 
                                                                   @click.prevent="updateUserStatus(user.id, option.value)">
                                                                    <span class="badge me-2" :class="'bg-' + option.color">●</span>
                                                                    {{ option.label }}
                                                                </a>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div class="btn-group">
                                                        <button @click="viewUser(user)" class="btn btn-sm btn-info">
                                                            <i class="fas fa-eye"></i>
                                                        </button>
                                                        <button @click="editUser(user)" class="btn btn-sm btn-warning">
                                                            <i class="fas fa-edit"></i>
                                                        </button>
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
                                
                                <!-- Pagination -->
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        Showing {{ (pagination.currentPage - 1) * pagination.itemsPerPage + 1 }} to 
                                        {{ Math.min(pagination.currentPage * pagination.itemsPerPage, filteredUsers.length) }} 
                                        of {{ filteredUsers.length }} users
                                    </div>
                                    
                                    <nav>
                                        <ul class="pagination">
                                            <li class="page-item" :class="{ disabled: pagination.currentPage === 1 }">
                                                <a class="page-link" href="#" @click.prevent="changePage(1)">
                                                    <i class="fas fa-angle-double-left"></i>
                                                </a>
                                            </li>
                                            <li class="page-item" :class="{ disabled: pagination.currentPage === 1 }">
                                                <a class="page-link" href="#" @click.prevent="changePage(pagination.currentPage - 1)">
                                                    <i class="fas fa-angle-left"></i>
                                                </a>
                                            </li>
                                            
                                            <li v-for="page in pageNumbers" :key="page" 
                                                class="page-item" :class="{ active: page === pagination.currentPage }">
                                                <a class="page-link" href="#" @click.prevent="changePage(page)">
                                                    {{ page }}
                                                </a>
                                            </li>
                                            
                                            <li class="page-item" :class="{ disabled: pagination.currentPage === pagination.totalPages }">
                                                <a class="page-link" href="#" @click.prevent="changePage(pagination.currentPage + 1)">
                                                    <i class="fas fa-angle-right"></i>
                                                </a>
                                            </li>
                                            <li class="page-item" :class="{ disabled: pagination.currentPage === pagination.totalPages }">
                                                <a class="page-link" href="#" @click.prevent="changePage(pagination.totalPages)">
                                                    <i class="fas fa-angle-double-right"></i>
                                                </a>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- User Detail Modal -->
            <div class="modal fade" tabindex="-1" id="userDetailModal" 
                 v-if="selectedUser && !showDeleteModal" 
                 style="display: block; background: rgba(0,0,0,0.5);">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-gradient-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-user-circle me-2"></i>
                                User Profile
                            </h5>
                            <button type="button" class="btn-close btn-close-white" @click="closeUserView"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <!-- User Profile -->
                                <div class="col-md-4 border-end">
                                    <div class="text-center mb-4">
                                        <div class="avatar-circle mb-3 mx-auto">
                                            <span class="avatar-initials">{{ selectedUser.full_name ? selectedUser.full_name.charAt(0).toUpperCase() : 'U' }}</span>
                                        </div>
                                        <h5>{{ selectedUser.full_name }}</h5>
                                        <span class="badge" :class="selectedUser.role === 'admin' ? 'bg-danger' : 'bg-primary'">
                                            {{ selectedUser.role }}
                                        </span>
                                    </div>
                                    
                                    <div class="user-info">
                                        <div class="mb-3">
                                            <label class="text-muted small">Username</label>
                                            <div>{{ selectedUser.username }}</div>
                                        </div>
                                        <div class="mb-3">
                                            <label class="text-muted small">Email</label>
                                            <div>{{ selectedUser.email }}</div>
                                        </div>
                                        <div class="mb-3">
                                            <label class="text-muted small">Registration Date</label>
                                            <div>{{ formatDate(selectedUser.created_at) }}</div>
                                        </div>
                                        <div class="mb-3">
                                            <label class="text-muted small">Status</label>
                                            <div>
                                                <span class="badge" :class="getStatusBadgeClass(selectedUser.status)">
                                                    {{ selectedUser.status || 'Active' }}
                                                </span>
                                            </div>
                                        </div>
                                        <div class="mb-3">
                                            <label class="text-muted small">Qualification</label>
                                            <div>{{ selectedUser.qualification || 'Not specified' }}</div>
                                        </div>
                                        <div class="mb-3">
                                            <label class="text-muted small">Date of Birth</label>
                                            <div>{{ selectedUser.dob || 'Not specified' }}</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- User Stats -->
                                <div class="col-md-8">
                                    <ul class="nav nav-tabs" id="userStatsTabs" role="tablist">
                                        <li class="nav-item" role="presentation">
                                            <button class="nav-link active" id="stats-tab" data-bs-toggle="tab" 
                                                data-bs-target="#stats" type="button" role="tab">
                                                Quiz Statistics
                                            </button>
                                        </li>
                                        <li class="nav-item" role="presentation">
                                            <button class="nav-link" id="subjects-tab" data-bs-toggle="tab" 
                                                data-bs-target="#subjects" type="button" role="tab">
                                                Subject Interests
                                            </button>
                                        </li>
                                    </ul>
                                    
                                    <div class="tab-content p-3" id="userStatsContent">
                                        <!-- Quiz Stats Tab -->
                                        <div class="tab-pane fade show active" id="stats" role="tabpanel">
                                            <div v-if="!userStats" class="text-center py-5">
                                                <div class="spinner-border text-primary" role="status">
                                                    <span class="visually-hidden">Loading...</span>
                                                </div>
                                            </div>
                                            <div v-else-if="!userStats.quizzes_taken" class="text-center py-5">
                                                <div class="text-muted">
                                                    <i class="fas fa-chart-bar fa-3x mb-3"></i>
                                                    <p>No quiz attempts yet</p>
                                                </div>
                                            </div>
                                            <div v-else>
                                                <div class="row g-3 mb-4">
                                                    <div class="col-md-4">
                                                        <div class="card border-left-primary shadow h-100 py-2">
                                                            <div class="card-body">
                                                                <div class="row no-gutters align-items-center">
                                                                    <div class="col mr-2">
                                                                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                                                            Quizzes Taken
                                                                        </div>
                                                                        <div class="h5 mb-0 font-weight-bold text-gray-800">{{ userStats.quizzes_taken }}</div>
                                                                    </div>
                                                                    <div class="col-auto">
                                                                        <i class="fas fa-clipboard-list fa-2x text-gray-300"></i>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-4">
                                                        <div class="card border-left-success shadow h-100 py-2">
                                                            <div class="card-body">
                                                                <div class="row no-gutters align-items-center">
                                                                    <div class="col mr-2">
                                                                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                                                                            Average Score
                                                                        </div>
                                                                        <div class="h5 mb-0 font-weight-bold text-gray-800">
                                                                            {{ userStats.average_score ? userStats.average_score.toFixed(1) + '%' : 'N/A' }}
                                                                        </div>
                                                                    </div>
                                                                    <div class="col-auto">
                                                                        <i class="fas fa-percentage fa-2x text-gray-300"></i>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-4">
                                                        <div class="card border-left-info shadow h-100 py-2">
                                                            <div class="card-body">
                                                                <div class="row no-gutters align-items-center">
                                                                    <div class="col mr-2">
                                                                        <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                                                                            Best Score
                                                                        </div>
                                                                        <div class="h5 mb-0 font-weight-bold text-gray-800">
                                                                            {{ userStats.best_score ? userStats.best_score.toFixed(1) + '%' : 'N/A' }}
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
                                                
                                                <!-- Recent Quiz Attempts Table -->
                                                <h6 class="font-weight-bold">Recent Quiz Attempts</h6>
                                                <div class="table-responsive">
                                                    <table class="table table-bordered table-sm">
                                                        <thead class="table-light">
                                                            <tr>
                                                                <th>Quiz</th>
                                                                <th>Subject</th>
                                                                <th>Score</th>
                                                                <th>Date</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr v-for="attempt in userStats.recent_attempts" :key="attempt.id">
                                                                <td>{{ attempt.quiz_title }}</td>
                                                                <td>{{ attempt.subject_name }}</td>
                                                                <td>
                                                                    <span class="badge" :class="getScoreClass(attempt.score)">
                                                                        {{ attempt.score.toFixed(1) }}%
                                                                    </span>
                                                                </td>
                                                                <td>{{ formatDate(attempt.completed_at) }}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                                
                                                <!-- Performance Chart -->
                                                <div class="mt-4" style="height: 250px">
                                                    <canvas id="userPerformanceChart"></canvas>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Subject Interests Tab -->
                                        <div class="tab-pane fade" id="subjects" role="tabpanel">
                                            <div v-if="!selectedUser.subject_interests || selectedUser.subject_interests.length === 0" class="text-center py-5">
                                                <div class="text-muted">
                                                    <i class="fas fa-book fa-3x mb-3"></i>
                                                    <p>No subject interests specified</p>
                                                </div>
                                            </div>
                                            <div v-else>
                                                <div class="d-flex flex-wrap gap-2">
                                                    <span v-for="subject in selectedUser.subject_interests" 
                                                          class="badge bg-primary p-2">
                                                        <i class="fas fa-book-open me-1"></i> {{ subject }}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="closeUserView">
                                Close
                            </button>
                            <button type="button" class="btn btn-warning" @click="editUser(selectedUser)">
                                <i class="fas fa-edit me-1"></i> Edit User
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- User Form Modal -->
            <div class="modal fade" tabindex="-1" id="userFormModal"
                 v-if="showUserModal"
                 style="display: block; background: rgba(0,0,0,0.5);">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content">
                        <div class="modal-header" :class="userForm.id ? 'bg-warning' : 'bg-success'">
                            <h5 class="modal-title text-white">
                                <i :class="userForm.id ? 'fas fa-edit' : 'fas fa-user-plus'" class="me-2"></i>
                                {{ userForm.id ? 'Edit User' : 'Add New User' }}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" @click="showUserModal = false"></button>
                        </div>
                        <div class="modal-body">
                            <form @submit.prevent="saveUser">
                                <div class="row g-3">
                                    <!-- Left Column -->
                                    <div class="col-md-6">
                                        <!-- Username -->
                                        <div class="mb-3">
                                            <label for="username" class="form-label">Username *</label>
                                            <input type="text" id="username" class="form-control" 
                                                   :class="{'is-invalid': formErrors.username}" 
                                                   v-model="userForm.username">
                                            <div class="invalid-feedback" v-if="formErrors.username">
                                                {{ formErrors.username }}
                                            </div>
                                        </div>
                                        
                                        <!-- Full Name -->
                                        <div class="mb-3">
                                            <label for="fullName" class="form-label">Full Name *</label>
                                            <input type="text" id="fullName" class="form-control" 
                                                   :class="{'is-invalid': formErrors.full_name}"
                                                   v-model="userForm.full_name">
                                            <div class="invalid-feedback" v-if="formErrors.full_name">
                                                {{ formErrors.full_name }}
                                            </div>
                                        </div>
                                        
                                        <!-- Email -->
                                        <div class="mb-3">
                                            <label for="email" class="form-label">Email Address *</label>
                                            <input type="email" id="email" class="form-control" 
                                                   :class="{'is-invalid': formErrors.email}"
                                                   v-model="userForm.email">
                                            <div class="invalid-feedback" v-if="formErrors.email">
                                                {{ formErrors.email }}
                                            </div>
                                        </div>
                                        
                                        <!-- Role -->
                                        <div class="mb-3">
                                            <label for="role" class="form-label">Role</label>
                                            <select id="role" class="form-select" v-model="userForm.role">
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                            <small class="form-text text-muted">
                                                Admin users have full access to all features
                                            </small>
                                        </div>
                                    </div>
                                    
                                    <!-- Right Column -->
                                    <div class="col-md-6">
                                        <!-- Status -->
                                        <div class="mb-3">
                                            <label for="status" class="form-label">Status</label>
                                            <select id="status" class="form-select" v-model="userForm.status">
                                                <option v-for="option in userStatusOptions" :value="option.value">
                                                    {{ option.label }}
                                                </option>
                                            </select>
                                        </div>
                                        
                                        <!-- Qualification -->
                                        <div class="mb-3">
                                            <label for="qualification" class="form-label">Qualification</label>
                                            <input type="text" id="qualification" class="form-control" 
                                                   v-model="userForm.qualification">
                                        </div>
                                        
                                        <!-- Date of Birth -->
                                        <div class="mb-3">
                                            <label for="dob" class="form-label">Date of Birth</label>
                                            <input type="date" id="dob" class="form-control" 
                                                   v-model="userForm.dob">
                                        </div>
                                        
                                        <!-- Subject Interests -->
                                        <div class="mb-3">
                                            <label for="subjects" class="form-label">Subject Interests</label>
                                            <select id="subjects" class="form-select" multiple size="4" 
                                                    v-model="userForm.subject_interests">
                                                <option v-for="subject in subjects" :value="subject.name">
                                                    {{ subject.name }}
                                                </option>
                                            </select>
                                            <small class="form-text text-muted">
                                                Hold Ctrl/Cmd to select multiple subjects
                                            </small>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Password fields - only when creating new user -->
                                <div class="row g-3 mt-2" v-if="!userForm.id">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="password" class="form-label">Password *</label>
                                            <input type="password" id="password" class="form-control" 
                                                   :class="{'is-invalid': formErrors.password}">
                                            <div class="invalid-feedback" v-if="formErrors.password">
                                                {{ formErrors.password }}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="confirmPassword" class="form-label">Confirm Password *</label>
                                            <input type="password" id="confirmPassword" class="form-control"
                                                   :class="{'is-invalid': formErrors.confirm_password}">
                                            <div class="invalid-feedback" v-if="formErrors.confirm_password">
                                                {{ formErrors.confirm_password }}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showUserModal = false">
                                Cancel
                            </button>
                            <button type="button" class="btn" :class="userForm.id ? 'btn-warning' : 'btn-success'" @click="saveUser">
                                <i :class="userForm.id ? 'fas fa-save' : 'fas fa-user-plus'" class="me-1"></i>
                                {{ userForm.id ? 'Update User' : 'Add User' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Delete Confirmation Modal -->
            <div class="modal fade" tabindex="-1" id="deleteModal"
                 v-if="showDeleteModal"
                 style="display: block; background: rgba(0,0,0,0.5);">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                Confirm Deletion
                            </h5>
                            <button type="button" class="btn-close btn-close-white" @click="showDeleteModal = false"></button>
                        </div>
                        <div class="modal-body">
                            <p>Are you sure you want to delete the user <strong>{{ selectedUser.full_name }}</strong>?</p>
                            <p class="mb-0 text-danger"><strong>This action cannot be undone.</strong></p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">
                                Cancel
                            </button>
                            <button type="button" class="btn btn-danger" @click="deleteUser">
                                <i class="fas fa-trash me-1"></i> Delete User
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}