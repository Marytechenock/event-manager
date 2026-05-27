document.addEventListener('DOMContentLoaded', function () {
    const registrationForm = document.getElementById('registrationForm');

    // Handle form submission
    if (registrationForm) {
        registrationForm.addEventListener('submit', function (e) {
            // Prevent default form submission
            e.preventDefault();

            // Collect form data
            const formData = {
                name: document.getElementById('name').value.trim(),
                surname: document.getElementById('surname').value.trim(),
                email: document.getElementById('email').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                organisation_name: document.getElementById('organisation-name').value.trim(),
                position: document.getElementById('position').value.trim(),
            };

            // Validate required fields
            if (!formData.name || !formData.surname || !formData.email || !formData.phone || !formData.organisation_name || !formData.position) {
                alert('⚠️ Please fill in all required fields.');
                return;
            }

            // Loading state
            const submitBtn = registrationForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting…';

            // Submit via API
            fetch('/api/guests/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })
            .then(response => {
                return response.json().then(data => {
                    if (!response.ok) {
                        throw new Error(data.error || `HTTP error! status: ${response.status}`);
                    }
                    return data;
                });
            })
            .then(data => {
                if (data.success) {
                    // Redirect with table & lucky number
                    const params = new URLSearchParams();
                    if (data.tableNumber) {
                        params.set('table', data.tableNumber);
                    }
                    if (data.luckyNumber) {
                        params.set('lucky', data.luckyNumber);
                    }
                    const queryString = params.toString();
                    const url = queryString ? `success.html?${queryString}` : 'success.html';
                    window.location.href = url;
                } else {
                    alert('❌ Registration failed: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Submission error:', error);
                alert(`❌ Registration failed: ${error.message}`);
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            });
        });
    }
});
