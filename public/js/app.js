// Load companies for dropdown
document.addEventListener('DOMContentLoaded', function() {
    const companySelect = document.getElementById('company');

    if (companySelect) {
        fetch('/api/companies')
            .then(response => response.json())
            .then(companies => {
                // Add default option
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Select a company';
                defaultOption.disabled = true;
                defaultOption.selected = true;
                companySelect.appendChild(defaultOption);
                
                companies.forEach(company => {
                    const option = document.createElement('option');
                    option.value = company.id;
                    option.textContent = `${company.name}`;
                    companySelect.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error loading companies:', error);
                const option = document.createElement('option');
                option.textContent = 'Error loading companies';
                companySelect.appendChild(option);
            });
    }

    // Registration form handling
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = {
                name: document.getElementById('name').value,
                surname: document.getElementById('surname').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                company_id: document.getElementById('company').value,
                position: document.getElementById('position').value,
            };

            // Validate required fields
            if (!formData.name || !formData.surname || !formData.email || !formData.company_id) {
                alert('Please fill in all required fields.');
                return;
            }

            // Show loading state
            const submitBtn = registrationForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Registering...';
            submitBtn.disabled = true;

            fetch('/api/guests/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Redirect to success page with BOTH table number and lucky number
                    window.location.href = `success.html?table=${encodeURIComponent(data.tableNumber)}&lucky=${encodeURIComponent(data.luckyNumber)}`;
                } else {
                    alert('Error: ' + (data.error || 'Registration failed'));
                }
            })
            .catch(error => {
                console.error('Registration error:', error);
                alert('Registration failed. Please try again.');
            })
            .finally(() => {
                // Restore button state
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            });
        });
    }
});