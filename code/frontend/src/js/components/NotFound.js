export default {
    template: `
        <div class="d-flex align-items-center justify-content-center" style="height: 100vh; background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);">
            <div class="text-center text-white">
                <h1 class="display-1 fw-bold">404</h1>
                <p class="fs-3">Page Not Found</p>
                <p class="lead">The page you're looking for doesn't exist.</p>
                <router-link to="/" class="btn btn-light px-4 py-2 mt-3">
                    <i class="fas fa-home me-2"></i>Go Home
                </router-link>
            </div>
        </div>
    `
}