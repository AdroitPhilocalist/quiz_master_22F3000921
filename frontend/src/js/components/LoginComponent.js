export default {
    data() {
        return {
            email: '',
            password: '',
            loading: false,
            error: null
        }
    },
    methods: {
        async login() {
            this.loading = true;
            this.error = null;
            
            try {
                const response = await axios.post('/login', {
                    email: this.email,
                    password: this.password
                });
                
                if (response.data.status === 'success') {
                    // Store user data in localStorage
                    localStorage.setItem('token', response.data.token);
                    localStorage.setItem('role', response.data.role);
                    localStorage.setItem('full_name', response.data.full_name);
                    localStorage.setItem('id', response.data.id);
                    
                    // Emit login success event
                    this.$emit('login-success');
                    
                    // Redirect based on role
                    if (response.data.role === 'admin') {
                        this.$router.push('/admin');
                    } else {
                        this.$router.push('/user');
                    }
                } else {
                    this.error = response.data.message || 'Login failed';
                }
            } catch (err) {
                this.error = err.response?.data?.message || 'An error occurred during login';
                console.error('Login error:', err);
            } finally {
                this.loading = false;
            }
        }
    },
    template: `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>Quiz Master</h1>
                    <p>Login to your account</p>
                </div>
                <div class="auth-body">
                    <div v-if="error" class="alert alert-danger" role="alert">
                        {{ error }}
                    </div>
                    <form @submit.prevent="login">
                        <div class="mb-3">
                            <label for="email" class="form-label">Email address</label>
                            <input 
                                type="email" 
                                class="form-control" 
                                id="email" 
                                v-model="email" 
                                required
                                placeholder="Enter your email"
                            >
                        </div>
                        <div class="mb-4">
                            <label for="password" class="form-label">Password</label>
                            <input 
                                type="password" 
                                class="form-control" 
                                id="password" 
                                v-model="password" 
                                required
                                placeholder="Enter your password"
                            >
                        </div>
                        <button 
                            type="submit" 
                            class="btn btn-primary w-100" 
                            :disabled="loading"
                        >
                            <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            {{ loading ? 'Logging in...' : 'Login' }}
                        </button>
                    </form>
                </div>
                <div class="auth-footer">
                    <p class="mb-0">Don't have an account? <router-link to="/register">Register</router-link></p>
                </div>
            </div>
        </div>
    `
}