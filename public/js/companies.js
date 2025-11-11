// Global cache for validation
let allCompanies = [];

// Auth check on load
document.addEventListener('DOMContentLoaded', function () {
    if (!localStorage.getItem('adminLoggedIn')) {
        window.location.href = 'admin-login.html';
        return;
    }
    loadCompanies();
});

// Load companies and cache for validation
function loadCompanies() {
    fetch('/api/companies')
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch companies');
            return response.json();
        })
        .then(companies => {
            allCompanies = companies; // Cache for duplicate checks
            companies.forEach(company => {
                localStorage.setItem(`company_${company.id}`, JSON.stringify(company));
            });
            renderCompanies(companies);
        })
        .catch(err => {
            console.error('Error:', err);
            document.getElementById('companiesList').innerHTML = 
                `<tr><td colspan="6" class="empty-state">Failed to load companies. Please try again.</td></tr>`;
        });
}

// Render companies as table rows
function renderCompanies(companies) {
    const container = document.getElementById('companiesList');
    if (companies.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">No companies added yet.</td>
            </tr>
        `;
        return;
    }

    container.innerHTML = companies.map(company => {
        const percentage = company.total_chairs > 0 ? (company.chairs_occupied / company.total_chairs * 100) : 0;
        let statusClass = 'status-active';
        let statusText = 'Active';

        if (percentage === 0) {
            statusClass = 'status-inactive';
            statusText = 'Empty';
        } else if (percentage < 100) {
            statusClass = 'status-partial';
            statusText = 'Partial';
        }

        return `
            <tr data-id="${company.id}">
                <td>${escapeHtml(company.name)}</td>
                <td>${escapeHtml(company.table_number)}</td>
                <td>${company.total_chairs}</td>
                <td>
                    ${company.chairs_occupied || 0}
                    <div class="chair-progress">
                        <div class="chair-progress-bar" style="width: ${percentage}%"></div>
                    </div>
                </td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td class="actions">
                    <button class="action-btn edit" onclick="editCompany(${company.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteCompany(${company.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Add company form
document.getElementById('addCompanyForm')?.addEventListener('submit', function (e) {
    e.preventDefault();
    
    const name = document.getElementById('companyName').value.trim();
    const tableNumber = document.getElementById('tableNumber').value.trim().toUpperCase();
    const totalChairs = parseInt(document.getElementById('totalChairs').value);

    // Validation
    if (!name || !tableNumber || !totalChairs) {
        alert('Please fill in all required fields.');
        return;
    }

    // Normalize for comparison
    const normalizedName = name.toLowerCase();
    const normalizedTable = tableNumber;

    // Check for duplicate company name
    const isNameDuplicate = allCompanies.some(company => 
        company.name.toLowerCase() === normalizedName
    );

    // Check for duplicate table number
    const isTableDuplicate = allCompanies.some(company => 
        company.table_number.toUpperCase() === normalizedTable
    );

    if (isNameDuplicate) {
        alert('Company name already exists. Please choose a different name.');
        return;
    }

    if (isTableDuplicate) {
        alert('Table number already exists. Please choose a different table number.');
        return;
    }

    // Submit to backend
    fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, table_number: tableNumber, total_chairs: totalChairs })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Server error');
            });
        }
        return response.json();
    })
    .then(() => {
        // Reset form
        document.getElementById('addCompanyForm').reset();
        document.getElementById('totalChairs').value = 10;
        loadCompanies(); // Refresh list and cache
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Failed to add company: ' + err.message);
    });
});

// Show edit form
function editCompany(companyId) {
    const companyData = localStorage.getItem(`company_${companyId}`);
    if (!companyData) {
        alert('Company data not found. Please refresh and try again.');
        return;
    }
    const company = JSON.parse(companyData);

    const row = document.querySelector(`tr[data-id="${companyId}"]`);
    row.innerHTML = `
        <td colspan="6">
            <form class="edit-form" onsubmit="saveCompany(${companyId}, event)">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label>Company Name</label>
                        <input type="text" name="name" value="${escapeHtml(company.name)}" required>
                    </div>
                    <div>
                        <label>Table Number</label>
                        <input type="text" name="table_number" value="${escapeHtml(company.table_number)}" required>
                    </div>
                    <div>
                        <label>Total Chairs</label>
                        <input type="number" name="total_chairs" value="${company.total_chairs}" min="1" required>
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button type="submit" class="btn-small" style="background: var(--btn-blue); color: white; border: none; border-radius: 4px;">
                        <i class="fas fa-save"></i> Save
                    </button>
                    <button type="button" class="btn-outline" onclick="cancelEdit(${companyId})">
                        Cancel
                    </button>
                </div>
            </form>
        </td>
    `;
}

// Save edited company
function saveCompany(companyId, e) {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const tableNumber = form.table_number.value.trim().toUpperCase();
    const totalChairs = parseInt(form.total_chairs.value);

    if (!name || !tableNumber || !totalChairs) {
        alert('All fields are required.');
        return;
    }

    // Normalize for comparison
    const normalizedName = name.toLowerCase();
    const normalizedTable = tableNumber;

    // Check for duplicate name (exclude current company)
    const isNameDuplicate = allCompanies.some(company => 
        company.id !== companyId && company.name.toLowerCase() === normalizedName
    );

    // Check for duplicate table (exclude current company)
    const isTableDuplicate = allCompanies.some(company => 
        company.id !== companyId && company.table_number.toUpperCase() === normalizedTable
    );

    if (isNameDuplicate) {
        alert('Company name already exists. Please choose a different name.');
        return;
    }

    if (isTableDuplicate) {
        alert('Table number already exists. Please choose a different table number.');
        return;
    }

    fetch(`/api/companies/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, table_number: tableNumber, total_chairs: totalChairs })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Server error');
            });
        }
        return response.json();
    })
    .then(() => {
        loadCompanies(); // Refresh list and cache
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Update failed: ' + err.message);
    });
}

// Cancel edit
function cancelEdit(companyId) {
    loadCompanies();
}

// Delete company
function deleteCompany(companyId) {
    if (!confirm('Are you sure you want to delete this company? This cannot be undone.')) return;

    fetch(`/api/companies/${companyId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Server error');
            });
        }
        return response.json();
    })
    .then(() => {
        loadCompanies();
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Failed to delete company: ' + err.message);
    });
}

// Prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}