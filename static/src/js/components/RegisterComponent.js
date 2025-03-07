export default {
    data() {
        return {
            email: '',
            password: '',
            confirmPassword: '',
            full_name: '',
            qualification: '',
            date_of_birth: '',
            loading: false,
            error: null,
            success: null
        }
    },
    methods: {
        async register() {
            this.loading = true;
            this.error = null;
            this.success = null;
            
            // Validate password match
            if (this.password !== this.confirmPassword) {
                this.error = 'Passwords do not match';
                this.loading = false;
                return;
            }
            
            try {
                const response = await axios.post('/register', {
                    email: this.email,
                    password: this.password,
                    full_name: this.full_name,
                    qualification: this.qualification,
                    date_of_birth: this.date_of_birth
                });
                
                if (response.data.status === 'success') {
                    this.success = 'Registration successful! You can now login.';
                    // Clear form
                    this.email = '';
                    this.password = '';
                    this.confirmPassword = '';
                    this.full_name = '';
                    this.qualification = '';
                    this.date_of_birth = '';
                    
                    // Redirect to login after 2 seconds
                    setTimeout(() => {
                        this.$router.push('/login');
                    }, 2000);
                } else {
                    this.error = response.data.message || 'Registration failed';
                }
            } catch (err) {
                this.error = err.response?.data?.message || 'An error occurred during registration';
                console.error('Registration error:', err);
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
                    <p>Create your account</p>
                </div>
                <div class="auth-body">
                    <div v-if="error" class="alert alert-danger" role="alert">
                        {{ error }}
                    </div>
                    <div v-if="success" class="alert alert-success" role="alert">
                        {{ success }}
                    </div>
                    <form @submit.prevent="register">
                        <div class="mb-3">
                            <label for="email" class="form-label">Email address</label>
                            <input 
                                type="email" 
                                class="form-control" 
                                id="email" 
                                v-model="email" 
                                placeholder="Enter your email"
                                required
                            >
                        </div>
                        <div class="mb-3">
                            <label for="full_name" class="form-label">Full Name</label>
                            <input 
                                type="text" 
                                class="form-control" 
                                id="full_name" 
                                v-model="full_name" 
                                placeholder="Enter your full name"
                                required
                            >
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label for="qualification" class="form-label">Qualification</label>
                                <input 
                                    type="text" 
                                    class="form-control" 
                                    id="qualification" 
                                    v-model="qualification" 
                                    placeholder="Your qualification"
                                >
                            </div>
                            <div class="col-md-6">
                                <label for="date_of_birth" class="form-label">Date of Birth</label>
                                <input 
                                    type="date" 
                                    class="form-control" 
                                    id="date_of_birth" 
                                    v-model="date_of_birth"
                                >
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="password" class="form-label">Password</label>
                            <input 
                                type="password" 
                                class="form-control" 
                                id="password" 
                                v-model="password" 
                                placeholder="Create a password"
                                required
                            >
                        </div>
                        <div class="mb-4">
                            <label for="confirmPassword" class="form-label">Confirm Password</label>
                            <input 
                                type="password" 
                                class="form-control" 
                                id="confirmPassword" 
                                v-model="confirmPassword" 
                                placeholder="Confirm your password"
                                required
                            >
                        </div>
                        <button 
                            type="submit" 
                            class="btn btn-primary w-100" 
                            :disabled="loading"
                        >
                            <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            {{ loading ? 'Creating Account...' : 'Create Account' }}
                        </button>
                    </form>
                </div>
                <div class="auth-footer">
                    <p class="mb-0">Already have an account? <router-link to="/login">Login</router-link></p>
                </div>
            </div>
        </div>
    `
}