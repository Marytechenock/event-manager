// Load companies for dropdown
document.addEventListener('DOMContentLoaded', function() {
    const companySelect = document.getElementById('company');

    if (companySelect) {
        fetch('/api/companies')
            .then(response => response.json())
            .then(companies => {
                companies.forEach(company => {
                    const option = document.createElement('option');
                    option.value = company.id;
                    option.textContent = `${company.name}`;
                    companySelect.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error loading companies:', error);
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
                position: document.getElementById('position').value
            };

            fetch('/api/guests/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.message === 'Registration successful') {
                    window.location.href = `success.html?table=${data.tableNumber}`;
                } else {
                    alert('Error: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Registration failed. Please try again.');
            });
        });
    }
});
