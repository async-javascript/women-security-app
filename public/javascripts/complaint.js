    let currentStep = 1;
        const totalSteps = 4;

        // Initialize form
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM loaded, initializing form...');
            initializeForm();
        });

        function initializeForm() {
            // Set max date to today
            document.getElementById('incidentDate').max = new Date().toISOString().split('T')[0];
            
            // Handle file uploads
            setupFileUpload();
            
            // Handle conditional fields
            setupConditionalFields();
            
            // Handle anonymous toggle
            setupAnonymousToggle();

            // Initialize step display
            updateStepDisplay();
            updateNavigationButtons();
        }

        function setupFileUpload() {
            const fileInput = document.getElementById('evidenceFiles');
            const uploadArea = document.getElementById('fileUploadArea');
            const uploadedFiles = document.getElementById('uploadedFiles');

            // Click to upload
            uploadArea.addEventListener('click', () => {
                fileInput.click();
            });

            // Drag and drop
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                handleFiles(e.dataTransfer.files);
            });

            fileInput.addEventListener('change', (e) => {
                handleFiles(e.target.files);
            });

            function handleFiles(files) {
                Array.from(files).forEach(file => {
                    if (file.size > 10 * 1024 * 1024) { // 10MB limit
                        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
                        return;
                    }
                    
                    const fileItem = document.createElement('div');
                    fileItem.className = 'file-item animate__animated animate__fadeInUp';
                    fileItem.innerHTML = `
                        <div>
                            <i class="fas fa-file me-2"></i>
                            <span>${file.name}</span>
                            <small class="text-muted ms-2">(${formatFileSize(file.size)})</small>
                        </div>
                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeFile(this)">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                    uploadedFiles.appendChild(fileItem);
                });
            }

            function formatFileSize(bytes) {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            }
        }

        function removeFile(button) {
            button.closest('.file-item').remove();
        }

        function setupConditionalFields() {
            // Other incident type
            document.addEventListener('change', (e) => {
                if (e.target.name === 'incidentType') {
                    const otherField = document.getElementById('otherIncidentType');
                    if (e.target.value === 'other') {
                        otherField.style.display = 'block';
                        otherField.querySelector('input').required = true;
                    } else {
                        otherField.style.display = 'none';
                        otherField.querySelector('input').required = false;
                    }
                }
            });

            // Witnesses
            document.getElementById('witnessesPresent').addEventListener('change', function() {
                const witnessDetails = document.getElementById('witnessDetails');
                if (this.checked) {
                    witnessDetails.style.display = 'block';
                } else {
                    witnessDetails.style.display = 'none';
                }
            });

            // Police report
            document.getElementById('policeReported').addEventListener('change', function() {
                const policeDetails = document.getElementById('policeReportDetails');
                if (this.checked) {
                    policeDetails.style.display = 'block';
                } else {
                    policeDetails.style.display = 'none';
                }
            });
        }

        function setupAnonymousToggle() {
            document.getElementById('reportAnonymously').addEventListener('change', function() {
                const contactInfo = document.getElementById('contactInformation');
                const inputs = contactInfo.querySelectorAll('input, select');
                
                if (this.checked) {
                    contactInfo.style.opacity = '0.5';
                    contactInfo.style.pointerEvents = 'none';
                    inputs.forEach(input => {
                        input.required = false;
                        input.disabled = true;
                    });
                } else {
                    contactInfo.style.opacity = '1';
                    contactInfo.style.pointerEvents = 'auto';
                    inputs.forEach(input => {
                        input.disabled = false;
                        if (input.id === 'reporterName' || input.id === 'reporterEmail') {
                            input.required = true;
                        }
                    });
                }
            });
        }

        function changeStep(direction) {
            if (direction === 1) {
                if (!validateCurrentStep()) {
                    return;
                }
                if (currentStep < totalSteps) {
                    currentStep++;
                }
            } else {
                if (currentStep > 1) {
                    currentStep--;
                }
            }

            updateStepDisplay();
            updateNavigationButtons();
            
            if (currentStep === 4) {
                generateReportSummary();
            }
        }

        function validateCurrentStep() {
            const currentStepElement = document.querySelector(`.form-step[data-step="${currentStep}"]`);
            const requiredFields = currentStepElement.querySelectorAll('[required]');
            
            // Check required fields
            for (let field of requiredFields) {
                if (!field.value.trim()) {
                    field.focus();
                    showValidationError(field, 'This field is required');
                    return false;
                }
            }

            // Check radio groups
            if (currentStep === 1) {
                const incidentTypeSelected = document.querySelector('input[name="incidentType"]:checked');
                if (!incidentTypeSelected) {
                    showValidationError(document.querySelector('input[name="incidentType"]'), 'Please select an incident type');
                    return false;
                }
            }

            // Step-specific validations
            if (currentStep === 2) {
                const incidentDate = document.getElementById('incidentDate').value;
                if (incidentDate && new Date(incidentDate) > new Date()) {
                    showValidationError(document.getElementById('incidentDate'), 'Incident date cannot be in the future');
                    return false;
                }
            }

            if (currentStep === 3) {
                const isAnonymous = document.getElementById('reportAnonymously').checked;
                if (!isAnonymous) {
                    const name = document.getElementById('reporterName').value.trim();
                    const email = document.getElementById('reporterEmail').value.trim();
                    
                    if (!name) {
                        showValidationError(document.getElementById('reporterName'), 'Name is required for non-anonymous reports');
                        return false;
                    }
                    
                    if (!email || !isValidEmail(email)) {
                        showValidationError(document.getElementById('reporterEmail'), 'Valid email is required for non-anonymous reports');
                        return false;
                    }
                }
            }

            return true;
        }

        function showValidationError(field, message) {
            // Remove existing error messages
            const existingError = field.parentNode.querySelector('.validation-error');
            if (existingError) {
                existingError.remove();
            }

            // Add error styling
            field.classList.add('is-invalid');
            
            // Create error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'validation-error text-danger small mt-1';
            errorDiv.textContent = message;
            field.parentNode.appendChild(errorDiv);

            // Remove error styling after user starts typing
            field.addEventListener('input', function() {
                this.classList.remove('is-invalid');
                const error = this.parentNode.querySelector('.validation-error');
                if (error) {
                    error.remove();
                }
            });
        }

        function isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        function updateStepDisplay() {
            // Hide all steps
            document.querySelectorAll('.form-step').forEach(step => {
                step.classList.remove('active');
            });

            // Show current step
            document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.add('active');

            // Update step indicators
            document.querySelectorAll('.step').forEach((step, index) => {
                const stepNumber = index + 1;
                step.classList.remove('active', 'completed');
                
                if (stepNumber < currentStep) {
                    step.classList.add('completed');
                    step.innerHTML = '<i class="fas fa-check"></i>';
                } else if (stepNumber === currentStep) {
                    step.classList.add('active');
                    step.innerHTML = stepNumber;
                } else {
                    step.innerHTML = stepNumber;
                }
            });

            // Update step connectors
            document.querySelectorAll('.step-connector').forEach((connector, index) => {
                if (index + 1 < currentStep) {
                    connector.classList.add('active');
                } else {
                    connector.classList.remove('active');
                }
            });
        }

        function updateNavigationButtons() {
            const prevBtn = document.getElementById('prevBtn');
            const nextBtn = document.getElementById('nextBtn');
            const submitBtn = document.getElementById('submitBtn');

            if (currentStep === 1) {
                prevBtn.style.display = 'none';
            } else {
                prevBtn.style.display = 'block';
            }

            if (currentStep === totalSteps) {
                nextBtn.style.display = 'none';
                submitBtn.style.display = 'block';
            } else {
                nextBtn.style.display = 'block';
                submitBtn.style.display = 'none';
            }
        }

        function generateReportSummary() {
            const summary = document.getElementById('reportSummary');
            
            let summaryHTML = '<div class="card border-0 shadow-sm">';
            summaryHTML += '<div class="card-header bg-light"><h5 class="mb-0">Report Summary</h5></div>';
            summaryHTML += '<div class="card-body">';

            // Incident type
            const incidentType = document.querySelector('input[name="incidentType"]:checked')?.value;
            if (incidentType) {
                const typeText = incidentType === 'other' ? 
                    document.getElementById('otherIncidentTypeText').value : 
                    document.querySelector(`label[for="${incidentType}"]`).textContent.trim();
                summaryHTML += `<p><strong>Incident Type:</strong> ${typeText}</p>`;
            }

            // Urgency
            const urgency = document.getElementById('urgencyLevel').value;
            if (urgency) {
                summaryHTML += `<p><strong>Urgency Level:</strong> ${document.querySelector(`#urgencyLevel option[value="${urgency}"]`).textContent}</p>`;
            }

            // Date and time
            const date = document.getElementById('incidentDate').value;
            const time = document.getElementById('incidentTime').value;
            if (date) {
                summaryHTML += `<p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}`;
                if (time) {
                    summaryHTML += ` at ${time}`;
                }
                summaryHTML += '</p>';
            }

            // Location
            const location = document.getElementById('incidentLocation').value;
            if (location) {
                summaryHTML += `<p><strong>Location:</strong> ${location}</p>`;
            }

            // Description
            const description = document.getElementById('incidentDescription').value;
            if (description) {
                summaryHTML += `<p><strong>Description:</strong> ${description.substring(0, 200)}${description.length > 200 ? '...' : ''}</p>`;
            }

            // Anonymous report
            const isAnonymous = document.getElementById('reportAnonymously').checked;
            summaryHTML += `<p><strong>Report Type:</strong> ${isAnonymous ? 'Anonymous' : 'Identified'}</p>`;

            // Contact info (if not anonymous)
            if (!isAnonymous) {
                const name = document.getElementById('reporterName').value;
                const email = document.getElementById('reporterEmail').value;
                if (name) summaryHTML += `<p><strong>Name:</strong> ${name}</p>`;
                if (email) summaryHTML += `<p><strong>Email:</strong> ${email}</p>`;
            }

            summaryHTML += '</div></div>';
            summary.innerHTML = summaryHTML;
        }

        // Form submission
        document.getElementById('complaintForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!validateCurrentStep()) {
                return;
            }

            // Simulate form submission
            const submitBtn = document.getElementById('submitBtn');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Submitting...';

            setTimeout(() => {
                // Generate reference number
                const referenceNumber = 'WS' + Date.now().toString().slice(-8);
                document.getElementById('referenceNumber').textContent = referenceNumber;

                // Show success section
                document.getElementById('reviewSection').style.display = 'none';
                document.getElementById('successSection').style.display = 'block';
                
                // Hide navigation buttons
                document.querySelector('.navigation-buttons').style.display = 'none';

                // Store reference number in localStorage for demo purposes
                localStorage.setItem('lastReportReference', referenceNumber);

            }, 2000);
        });

        // Emergency contacts modal
        function showEmergencyContacts() {
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title"><i class="fas fa-phone me-2"></i>Emergency Contacts</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-12 mb-3">
                                    <div class="card border-danger">
                                        <div class="card-body text-center">
                                            <h6 class="text-danger">Emergency Services</h6>
                                            <h3><a href="tel:911" class="text-decoration-none">911</a></h3>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 mb-3">
                                    <div class="card">
                                        <div class="card-body text-center">
                                            <h6>National Domestic Violence Hotline</h6>
                                            <h5><a href="tel:1-800-799-7233" class="text-decoration-none">1-800-799-7233</a></h5>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 mb-3">
                                    <div class="card">
                                        <div class="card-body text-center">
                                            <h6>RAINN National Sexual Assault Hotline</h6>
                                            <h5><a href="tel:1-800-656-4673" class="text-decoration-none">1-800-656-4673</a></h5>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="card">
                                        <div class="card-body text-center">
                                            <h6>Crisis Text Line</h6>
                                            <p>Text HOME to <strong>741741</strong></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            
            // Remove modal from DOM when hidden
            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
            });
        }

        // Get current location
        function getCurrentLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        
                        // You would typically use a reverse geocoding service here
                        // For demo purposes, we'll just show coordinates
                        document.getElementById('incidentLocation').value = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
                    },
                    function(error) {
                        alert('Unable to retrieve your location. Please enter the location manually.');
                    }
                );
            } else {
                alert('Geolocation is not supported by this browser.');
            }
        }

        // Use current location checkbox
        document.getElementById('useCurrentLocation').addEventListener('change', function() {
            if (this.checked) {
                getCurrentLocation();
            } else {
                document.getElementById('incidentLocation').value = '';
            }
        });