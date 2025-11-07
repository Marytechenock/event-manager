// Check if user is logged in
function checkAuth() {
    if (!localStorage.getItem('adminLoggedIn')) {
        window.location.href = 'admin-login.html';
        return false;
    }
    return true;
}

// Logout function
function logout() {
    localStorage.removeItem('adminLoggedIn');
    window.location.href = 'admin-login.html';
}

// Global variable to hold current search term
let currentSearchTerm = '';

// Admin Login & Dashboard Initialization
document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('adminLoginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.message === 'Login successful') {
                        localStorage.setItem('adminLoggedIn', 'true');
                        window.location.href = 'admin-dashboard.html';
                    } else {
                        alert('Login failed: ' + data.error);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Login failed. Please try again.');
                });
        });
    }

    // Load dashboard data if on dashboard page
    if (window.location.pathname.includes('admin-dashboard.html')) {
        if (checkAuth()) {
            loadDashboardData();
            setInterval(loadDashboardData, 10000); // Refresh every 10 seconds
        }
    }

    // Search functionality for attendees
    const searchInput = document.getElementById('searchAttendees');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            currentSearchTerm = e.target.value.toLowerCase();
            applySearchFilter(); // Re-apply filter on input
        });
    }
});

// Load dashboard data
let allGuestsData = []; // Store full list for search

function loadDashboardData() {
    fetch('/api/admin/metrics')
        .then(response => response.json())
        .then(data => {
            document.getElementById('totalAttendees').textContent = data.totalAttendees;
            document.getElementById('totalCompanies').textContent = data.companies.length;

            let totalChairs = 0;
            let occupiedChairs = 0;
            let availableChairs = 0;

            data.companies.forEach(company => {
                totalChairs += company.total_chairs;
                occupiedChairs += company.chairs_occupied;
                availableChairs += (company.total_chairs - company.chairs_occupied);
            });

            document.getElementById('availableChairs').textContent = availableChairs;
            document.getElementById('occupiedChairs').textContent = occupiedChairs;

            updateCompaniesStatus(data.companies);
            updateRecentGuests(data.guests.slice(0, 5));

            // Save full guest list for search
            allGuestsData = data.guests;
            // Re-render with current search
            applySearchFilter();
        })
        .catch(error => {
            console.error('Error loading dashboard data:', error);
        });
}

// Apply search filter using stored data
function applySearchFilter() {
    let filteredGuests = allGuestsData;

    if (currentSearchTerm) {
        filteredGuests = allGuestsData.filter(guest =>
            (guest.name || '').toLowerCase().includes(currentSearchTerm) ||
            (guest.surname || '').toLowerCase().includes(currentSearchTerm) ||
            (guest.email || '').toLowerCase().includes(currentSearchTerm) ||
            (guest.phone || '').toLowerCase().includes(currentSearchTerm) ||
            (guest.company_name || '').toLowerCase().includes(currentSearchTerm) ||
            (guest.position || '').toLowerCase().includes(currentSearchTerm)
        );
    }

    renderAllGuests(filteredGuests);
}

// Render guest list (no pagination)
function renderAllGuests(guests) {
    const container = document.getElementById('allGuests');
    container.innerHTML = '';

    guests.forEach(guest => {
        const row = document.createElement('div');
        row.className = 'all-guests-row';

        const date = new Date(guest.registered_at).toLocaleString();

        row.innerHTML = `
            <div>${guest.name || ''}</div>
            <div>${guest.surname || ''}</div>
            <div>${guest.email || ''}</div>
            <div>${guest.phone || ''}</div>
            <div>${guest.company_name || 'N/A'}</div>
            <div>${guest.position || 'N/A'}</div>
            <div>${guest.table_number || 'N/A'}</div>
            <div>${date}</div>
        `;

        container.appendChild(row);
    });
}

// Update companies status (5 random)
function updateCompaniesStatus(companies) {
    const container = document.getElementById('companiesStatus');
    container.innerHTML = '';

    const shuffled = [...companies].sort(() => 0.5 - Math.random());
    const randomFive = shuffled.slice(0, Math.min(5, companies.length));

    randomFive.forEach(company => {
        const available = company.total_chairs - company.chairs_occupied;
        const percentage = (company.chairs_occupied / company.total_chairs) * 100;

        const companyElement = document.createElement('div');
        companyElement.className = 'company-card';

        companyElement.innerHTML = `
            <div class="company-header">
                <div class="company-info">
                    <div class="company-name">${company.name}</div>
                    <div class="company-table">Table ${company.table_number}</div>
                </div>
                <div class="company-availability">
                    <span class="availability-badge ${available > 0 ? 'availability-available' : 'availability-full'}">
                        ${available} seats left
                    </span>
                </div>
            </div>
            <div class="company-stats">
                <div class="stat-item">
                    <div class="stat-value">${company.total_chairs}</div>
                    <div class="stat-title">Total</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${company.chairs_occupied}</div>
                    <div class="stat-title">Occupied</div>
                </div>
            </div>
            <div class="chair-progress">
                <div class="chair-progress-bar" style="width: ${percentage}%"></div>
            </div>
            <div class="progress-label">
                ${company.chairs_occupied} of ${company.total_chairs} chairs filled
            </div>
        `;

        container.appendChild(companyElement);
    });

    if (companies.length > 5) {
        const viewAllDiv = document.createElement('div');
        viewAllDiv.className = 'view-all-companies';
        viewAllDiv.innerHTML = `<a href="manage-companies.html"><i class="fas fa-list"></i> View All Companies</a>`;
        container.appendChild(viewAllDiv);
    }
}

// Update recent guests
function updateRecentGuests(guests) {
    const container = document.getElementById('recentGuests');
    container.innerHTML = '';

    guests.forEach(guest => {
        const row = document.createElement('div');
        row.className = 'table-row';

        const date = new Date(guest.registered_at).toLocaleTimeString();

        row.innerHTML = `
            <div>${guest.name || ''}</div>
            <div>${guest.surname || ''}</div>
            <div>${guest.email || ''}</div>
            <div>${guest.company_name || 'N/A'}</div>
            <div>${guest.table_number || 'N/A'}</div>
            <div>${date}</div>
        `;

        container.appendChild(row);
    });
}