document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const searchInput = document.getElementById('company-search');
    const hiddenInput = document.getElementById('company-id');
    const dropdown = document.getElementById('company-dropdown');
    const registrationForm = document.getElementById('registrationForm');

    // State
    let companies = [];
    let selectedCompany = null;

    // Fetch companies from backend API
    fetch('/api/companies')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            companies = data;
            // Optional: Pre-fill dropdown when focused (we do it on click instead)
        })
        .catch(error => {
            console.error('Error loading companies:', error);
            const li = document.createElement('li');
            li.style.padding = '10px 12px';
            li.style.color = '#d32f2f';
            li.textContent = '❌ Failed to load companies';
            dropdown.appendChild(li);
        });

    // Render company list in dropdown
    function renderDropdown(list) {
        dropdown.innerHTML = '';
        if (list.length === 0) {
            const li = document.createElement('li');
            li.style.padding = '10px 12px';
            li.style.color = '#999';
            li.style.fontStyle = 'italic';
            li.textContent = 'No matching companies';
            dropdown.appendChild(li);
            return;
        }

        list.forEach(company => {
            const li = document.createElement('li');
            li.style.padding = '10px 12px';
            li.style.cursor = 'pointer';
            li.style.borderBottom = '1px solid #eee';
            li.style.fontSize = '14px';
            li.textContent = company.name;
            li.dataset.id = company.id;
            li.dataset.name = company.name;

            // Hover effect
            li.addEventListener('mouseenter', () => {
                li.style.backgroundColor = '#f0f7ff';
            });
            li.addEventListener('mouseleave', () => {
                li.style.backgroundColor = '';
            });

            // Click to select
            li.addEventListener('click', () => {
                selectCompany(company.id, company.name);
            });

            dropdown.appendChild(li);
        });
    }

    // Handle company selection
    function selectCompany(id, name) {
        searchInput.value = name;
        hiddenInput.value = id;
        selectedCompany = { id, name };
        dropdown.style.display = 'none';
        searchInput.setAttribute('readonly', 'readonly'); // Lock to prevent accidental edits
    }

    // Open dropdown on click
    searchInput.addEventListener('click', function () {
        // Allow typing after opening
        this.removeAttribute('readonly');

        // Show all companies
        renderDropdown(companies);
        dropdown.style.display = 'block';
        this.select(); // Optional: highlight text for quick overwrite
    });

    // Live search while typing
    searchInput.addEventListener('input', function () {
        const query = this.value.trim().toLowerCase();
        if (query === '') {
            renderDropdown(companies);
        } else {
            const filtered = companies.filter(company =>
                company.name.toLowerCase().includes(query)
            );
            renderDropdown(filtered);
        }
        dropdown.style.display = 'block';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
        if (
            e.target !== searchInput &&
            !dropdown.contains(e.target)
        ) {
            dropdown.style.display = 'none';
            // Re-enable readonly if a company is selected
            if (selectedCompany && searchInput.value === selectedCompany.name) {
                searchInput.setAttribute('readonly', 'readonly');
            }
        }
    });

    // Handle form submission
    // if (registrationForm) {
    //     registrationForm.addEventListener('submit', function (e) {
    //         // Prevent default form submission
    //         e.preventDefault();

    //         // Ensure company is selected
    //         if (!hiddenInput.value) {
    //             alert('⚠️ Please select a company from the dropdown.');
    //             // Open dropdown to help user
    //             searchInput.removeAttribute('readonly');
    //             searchInput.focus();
    //             renderDropdown(companies);
    //             dropdown.style.display = 'block';
    //             return;
    //         }

    //         // Collect form data
    //         const formData = {
    //             name: document.getElementById('name').value.trim(),
    //             surname: document.getElementById('surname').value.trim(),
    //             email: document.getElementById('email').value.trim(),
    //             phone: document.getElementById('phone').value.trim(),
    //             company_id: parseInt(hiddenInput.value, 10),
    //             position: document.getElementById('position').value.trim(),
    //         };

    //         // Validate required fields
    //         if (!formData.name || !formData.surname || !formData.email || !formData.phone || !formData.company_id || !formData.position) {
    //             alert('⚠️ Please fill in all required fields.');
    //             return;
    //         }

    //         // Loading state
    //         const submitBtn = registrationForm.querySelector('button[type="submit"]');
    //         const originalText = submitBtn.textContent;
    //         submitBtn.disabled = true;
    //         submitBtn.textContent = 'Submitting…';

    //         // Submit via API
    //         fetch('/api/guests/register', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify(formData)
    //         })
    //         .then(response => {
    //             if (!response.ok) {
    //                 throw new Error(`HTTP error! status: ${response.status}`);
    //             }
    //             return response.json();
    //         })
    //         .then(data => {
    //             if (data.success) {
    //                 // Redirect with table & lucky number
    //                 const url = `success.html?table=${encodeURIComponent(data.tableNumber)}&lucky=${encodeURIComponent(data.luckyNumber)}`;
    //                 window.location.href = url;
    //             } else {
    //                 alert('❌ Registration failed: ' + (data.error || 'Unknown error'));
    //             }
    //         })
    //         .catch(error => {
    //             console.error('Submission error:', error);
    //             alert('Email already registered');
    //         })
    //         .finally(() => {
    //             submitBtn.disabled = false;
    //             submitBtn.textContent = originalText;
    //         });
    //     });
    // }

    // In app.js, replace the form submission handler with this:
if (registrationForm) {
    registrationForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const submitBtn = registrationForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        try {
            // Basic validation
            if (!hiddenInput.value) {
                showError('Please select a company from the dropdown.');
                searchInput.focus();
                return;
            }

            const formData = {
                name: document.getElementById('name').value.trim(),
                surname: document.getElementById('surname').value.trim(),
                email: document.getElementById('email').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                company_id: parseInt(hiddenInput.value, 10),
                position: document.getElementById('position').value.trim(),
            };

            // Validate required fields
            for (const [key, value] of Object.entries(formData)) {
                if (!value) {
                    showError(`Please fill in the ${key.replace('_', ' ')} field.`);
                    return;
                }
            }

            // Email validation
            if (!isValidEmail(formData.email)) {
                showError('Please enter a valid email address.');
                return;
            }

            // Set loading state
            submitBtn.disabled = true;
            submitBtn.textContent = 'Registering...';

            // Submit data
            const response = await fetch('/api/guests/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // Success - redirect
            window.location.href = `success.html?table=${encodeURIComponent(data.tableNumber)}&lucky=${encodeURIComponent(data.luckyNumber)}`;

        } catch (error) {
            console.error('Submission error:', error);
            showError(error.message || 'An error occurred. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

// Add these helper functions
function showError(message) {
    // Remove any existing error messages
    const existingError = document.querySelector('.error-message');
    if (existingError) existingError.remove();

    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.style.color = '#d32f2f';
    errorEl.style.margin = '10px 0';
    errorEl.textContent = message;

    // Insert after the form
    const form = document.querySelector('.luxury-form');
    form.insertBefore(errorEl, form.firstChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        errorEl.style.opacity = '0';
        setTimeout(() => errorEl.remove(), 300);
    }, 5000);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
});
