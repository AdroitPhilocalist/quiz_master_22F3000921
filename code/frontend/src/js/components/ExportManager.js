export default {
    data() {
        return {
            loading: false,
            exportInProgress: false,
            currentTaskId: null,
            lastExportResult: null,
            statusCheckInterval: null,
            exportHistory: []
        }
    },
    methods: {
        async startExport() {
            if (this.exportInProgress) {
                this.showToast('Export already in progress', 'Warning', 'warning');
                return;
            }

            // Confirm export action
            if (!confirm('This will generate a comprehensive CSV export of all quiz data. This may take a few minutes. Continue?')) {
                return;
            }

            this.loading = true;
            this.exportInProgress = true;

            try {
                const response = await axios.post('/api/admin/quizzes/export', {}, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token'),
                        'Content-Type': 'application/json'
                    }
                });

                this.currentTaskId = response.data.task_id;
                this.showToast('Export started successfully! You will receive an email when complete.', 'Success', 'success');
                
                // Start polling for status
                this.startStatusPolling();

            } catch (error) {
                console.error('Export error:', error);
                this.exportInProgress = false;
                this.showToast(`Export failed: ${error.response?.data?.message || 'Unknown error'}`, 'Error', 'danger');
            } finally {
                this.loading = false;
            }
        },

        startStatusPolling() {
            // Check status every 10 seconds
            this.statusCheckInterval = setInterval(() => {
                this.checkExportStatus();
            }, 10000);

            // Also check immediately
            this.checkExportStatus();
        },

        async checkExportStatus() {
            if (!this.currentTaskId) return;

            try {
                const response = await axios.get(`/api/admin/export/status/${this.currentTaskId}`, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });

                const status = response.data;

                if (status.status === 'completed') {
                    this.exportInProgress = false;
                    this.lastExportResult = status.result;
                    this.stopStatusPolling();
                    this.showToast('Export completed successfully! Check your email for download link.', 'Success', 'success');
                    
                    // Add to history
                    this.exportHistory.unshift({
                        timestamp: new Date().toISOString(),
                        status: 'completed',
                        result: status.result
                    });

                } else if (status.status === 'failed') {
                    this.exportInProgress = false;
                    this.stopStatusPolling();
                    this.showToast(`Export failed: ${status.error || 'Unknown error'}`, 'Error', 'danger');
                    
                    // Add to history
                    this.exportHistory.unshift({
                        timestamp: new Date().toISOString(),
                        status: 'failed',
                        error: status.error
                    });
                }

            } catch (error) {
                console.error('Status check error:', error);
                // Don't stop polling on status check errors
            }
        },

        stopStatusPolling() {
            if (this.statusCheckInterval) {
                clearInterval(this.statusCheckInterval);
                this.statusCheckInterval = null;
            }
        },

        showToast(message, title = "Notification", variant = "info") {
            const toastEl = document.createElement("div");
            toastEl.className = `toast align-items-center text-white bg-${variant} border-0`;
            toastEl.setAttribute("role", "alert");
            toastEl.innerHTML = `
                <div class="d-flex">
                    <div class="toast-body">
                        <strong>${title}:</strong> ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            `;

            let toastContainer = document.querySelector(".toast-container");
            if (!toastContainer) {
                toastContainer = document.createElement("div");
                toastContainer.className = "toast-container position-fixed top-0 end-0 p-3";
                toastContainer.style.zIndex = "1100";
                document.body.appendChild(toastContainer);
            }

            toastContainer.appendChild(toastEl);
            const toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 5000 });
            toast.show();

            toastEl.addEventListener("hidden.bs.toast", () => {
                toastEl.remove();
            });
        },

        formatDate(dateString) {
            return new Date(dateString).toLocaleString();
        },
        downloadFile(downloadUrl) {
            try {
                console.log('Downloading file from:', downloadUrl);
                
                // Method 1: Create invisible link and click it
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = ''; // This attribute forces download
                link.style.display = 'none';
                
                // Add to DOM, click, then remove
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                this.showToast('Download started successfully!', 'Success', 'success');
                
            } catch (error) {
                console.error('Download error:', error);
                this.showToast('Download failed. Please try again.', 'Error', 'danger');
            }
        },

        formatFileSize(mb) {
            if (mb < 1) {
                return `${(mb * 1024).toFixed(0)} KB`;
            }
            return `${mb.toFixed(1)} MB`;
        }
    },

    beforeDestroy() {
        this.stopStatusPolling();
    },

    template: `
        <div class="card shadow-sm border-0">
            <div class="card-header bg-gradient-primary text-white py-3">
                <h5 class="mb-0">
                    <i class="fas fa-download me-2"></i>
                    Data Export Manager
                </h5>
            </div>
            <div class="card-body">
                <!-- Export Control Panel -->
                <div class="row mb-4">
                    <div class="col-md-8">
                        <h6 class="mb-2">Export Quiz Master Data</h6>
                        <p class="text-muted mb-3">
                            Generate a comprehensive CSV export containing user data, quiz attempts, 
                            performance metrics, and quiz metadata.
                        </p>
                        
                        <div class="d-flex align-items-center">
                            <button 
                                class="btn btn-primary me-3" 
                                @click="startExport" 
                                :disabled="loading || exportInProgress">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                                <i v-else class="fas fa-download me-2"></i>
                                {{ loading ? 'Starting Export...' : exportInProgress ? 'Export in Progress...' : 'Start CSV Export' }}
                            </button>
                            
                            <div v-if="exportInProgress" class="text-primary">
                                <i class="fas fa-spinner fa-spin me-2"></i>
                                <small>Export running... You'll receive an email when complete.</small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-4 text-center">
                        <div class="bg-light rounded p-3">
                            <i class="fas fa-file-csv fa-3x text-success mb-2"></i>
                            <div class="small text-muted">CSV Format</div>
                            <div class="small text-muted">Comprehensive Data</div>
                        </div>
                    </div>
                </div>

                <!-- Export Information -->
                <div class="row">
                    <div class="col-12">
                        <div class="bg-info-light p-3 rounded mb-3" style="background-color: #e7f3ff;">
                            <h6 class="text-info mb-2">
                                <i class="fas fa-info-circle me-2"></i>
                                Export Information
                            </h6>
                            <div class="row">
                                <div class="col-md-6">
                                    <ul class="list-unstyled mb-0 small">
                                        <li><i class="fas fa-check text-success me-2"></i>User profiles and statistics</li>
                                        <li><i class="fas fa-check text-success me-2"></i>Quiz attempt details</li>
                                        <li><i class="fas fa-check text-success me-2"></i>Performance metrics</li>
                                    </ul>
                                </div>
                                <div class="col-md-6">
                                    <ul class="list-unstyled mb-0 small">
                                        <li><i class="fas fa-check text-success me-2"></i>Quiz metadata</li>
                                        <li><i class="fas fa-check text-success me-2"></i>Subject/Chapter analysis</li>
                                        <li><i class="fas fa-check text-success me-2"></i>Timestamp information</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Last Export Result -->
                <div v-if="lastExportResult" class="row">
                    <div class="col-12">
                        <div class="alert alert-success">
                            <h6 class="alert-heading">
                                <i class="fas fa-check-circle me-2"></i>
                                Last Export Completed Successfully
                            </h6>
                            <div class="row">
                                <div class="col-md-3">
                                    <strong>File:</strong><br>
                                    <small>{{ lastExportResult.filename }}</small>
                                </div>
                                <div class="col-md-3">
                                    <strong>Records:</strong><br>
                                    <small>{{ lastExportResult.rows_exported?.toLocaleString() }} rows</small>
                                </div>
                                <div class="col-md-3">
                                    <strong>Size:</strong><br>
                                    <small>{{ formatFileSize(lastExportResult.file_size_mb) }}</small>
                                </div>
                                <div class="col-md-3">
                                    <!-- FIXED: Use downloadFile method instead of direct link -->
                                    <button 
                                        class="btn btn-sm btn-outline-success"
                                        @click="downloadFile(lastExportResult.download_url)">
                                        <i class="fas fa-download me-1"></i>
                                        Download
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Export History -->
                <div v-if="exportHistory.length > 0" class="row">
                    <div class="col-12">
                        <h6 class="mb-3">Recent Exports</h6>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>Status</th>
                                        <th>Details</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="exportItem in exportHistory.slice(0, 5)" :key="exportItem.timestamp">
                                        <td>{{ formatDate(exportItem.timestamp) }}</td>
                                        <td>
                                            <span :class="exportItem.status === 'completed' ? 'badge bg-success' : 'badge bg-danger'">
                                                {{ exportItem.status }}
                                            </span>
                                        </td>
                                        <td>
                                            <small v-if="exportItem.result">
                                                {{ exportItem.result.rows_exported?.toLocaleString() }} rows, 
                                                {{ formatFileSize(exportItem.result.file_size_mb) }}
                                            </small>
                                            <small v-else-if="exportItem.error" class="text-danger">
                                                {{ exportItem.error }}
                                            </small>
                                        </td>
                                        <td>
                                            <!-- FIXED: Use downloadFile method instead of direct link -->
                                            <button 
                                                v-if="exportItem.result?.download_url" 
                                                class="btn btn-sm btn-outline-primary"
                                                @click="downloadFile(exportItem.result.download_url)">
                                                Download
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}