// Global cache for validation (in-memory only)
let allCompanies = [];

// Auth check removed - server handles this!
document.addEventListener('DOMContentLoaded', function () {
    // No localStorage check - if page loaded, server says you're authenticated
    loadCompanies();
});

// Load companies from API
function loadCompanies() {
    fetch('/api/companies', {
        credentials: 'same-origin' // Critical for sessions
    })
    .then(response => {
        if (response.status === 401) {
            // Session expired - redirect to login
            window.location.href = '/admin';
            return;
        }
        if (!response.ok) throw new Error('Failed to fetch companies');
        return response.json();
    })
    .then(companies => {
        allCompanies = companies; // In-memory cache only
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

    if (!name || !tableNumber || !totalChairs) {
        alert('Please fill in all required fields.');
        return;
    }

    // Normalize for comparison
    const normalizedName = name.toLowerCase();
    const normalizedTable = tableNumber;

    // Check duplicates using in-memory cache
    const isNameDuplicate = allCompanies.some(company => 
        company.name.toLowerCase() === normalizedName
    );
    const isTableDuplicate = allCompanies.some(company => 
        company.table_number.toUpperCase() === normalizedTable
    );

    if (isNameDuplicate) {
        alert('Company name already exists.');
        return;
    }
    if (isTableDuplicate) {
        alert('Table number already exists.');
        return;
    }

    // Submit to backend with credentials
    fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin', // Critical
        body: JSON.stringify({ name, table_number: tableNumber, total_chairs: totalChairs })
    })
    .then(response => {
        if (response.status === 401) {
            window.location.href = '/admin';
            return;
        }
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Server error');
            });
        }
        return response.json();
    })
    .then(() => {
        document.getElementById('addCompanyForm').reset();
        document.getElementById('totalChairs').value = 10;
        loadCompanies(); // Refresh cache
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Failed to add company: ' + err.message);
    });
});

// Show edit form
function editCompany(companyId) {
    // Find company in current cache (not localStorage!)
    const company = allCompanies.find(c => c.id == companyId);
    if (!company) {
        alert('Company not found. Please refresh the page.');
        return;
    }

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

    // Check duplicates (excluding current company)
    const isNameDuplicate = allCompanies.some(company => 
        company.id != companyId && company.name.toLowerCase() === name.toLowerCase()
    );
    const isTableDuplicate = allCompanies.some(company => 
        company.id != companyId && company.table_number.toUpperCase() === tableNumber
    );

    if (isNameDuplicate) {
        alert('Company name already exists.');
        return;
    }
    if (isTableDuplicate) {
        alert('Table number already exists.');
        return;
    }

    fetch(`/api/companies/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin', // Critical
        body: JSON.stringify({ name, table_number: tableNumber, total_chairs: totalChairs })
    })
    .then(response => {
        if (response.status === 401) {
            window.location.href = '/admin';
            return;
        }
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Server error');
            });
        }
        return response.json();
    })
    .then(() => {
        loadCompanies(); // Refresh cache
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
    if (!confirm('Are you sure you want to delete this company?')) return;

    fetch(`/api/companies/${companyId}`, {
        method: 'DELETE',
        credentials: 'same-origin' // Critical
    })
    .then(response => {
        if (response.status === 401) {
            window.location.href = '/admin';
            return;
        }
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