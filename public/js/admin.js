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

// Admin Login
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('adminLoginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
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
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#allGuests tr');

            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
});

// Load dashboard data
function loadDashboardData() {
    fetch('/api/admin/metrics')
        .then(response => response.json())
        .then(data => {
            // Update metrics
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

            // Update companies status
            updateCompaniesStatus(data.companies);

            // Update recent guests
            updateRecentGuests(data.guests.slice(0, 5));

            // Update all guests
            updateAllGuests(data.guests);
        })
        .catch(error => {
            console.error('Error loading dashboard data:', error);
        });
}

// Update companies status display
function updateCompaniesStatus(companies) {
    const container = document.getElementById('companiesStatus');
    container.innerHTML = '';

    companies.forEach(company => {
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
}

// Update recent guests
function updateRecentGuests(guests) {
    const container = document.getElementById('recentGuests');
    container.innerHTML = '';

    guests.forEach(guest => {
        const row = document.createElement('tr');
        const date = new Date(guest.registered_at).toLocaleTimeString();

        row.innerHTML = `
            <td>${guest.name} ${guest.surname}</td>
            <td>${guest.email}</td>
            <td>${guest.company_name || 'N/A'}</td>
            <td>${guest.table_number || 'N/A'}</td>
            <td>${date}</td>
        `;

        container.appendChild(row);
    });
}

// Update all guests
function updateAllGuests(guests) {
    const container = document.getElementById('allGuests');
    container.innerHTML = '';

    guests.forEach(guest => {
        const row = document.createElement('tr');
        const date = new Date(guest.registered_at).toLocaleString();

        row.innerHTML = `
            <td>${guest.name}</td>
            <td>${guest.surname}</td>
            <td>${guest.email}</td>
            <td>${guest.phone}</td>
            <td>${guest.company_name || 'N/A'}</td>
            <td>${guest.position}</td>
            <td>${guest.table_number || 'N/A'}</td>
            <td>${date}</td>
        `;

        container.appendChild(row);
    });
}


// // Update companies status display for new layout
// function updateCompaniesStatus(companies) {
//     const container = document.getElementById('companiesStatus');
//     container.innerHTML = '';

//     companies.forEach(company => {
//         const available = company.total_chairs - company.chairs_occupied;
//         const percentage = (company.chairs_occupied / company.total_chairs) * 100;

//         const companyElement = document.createElement('div');
//         companyElement.className = 'company-card';

//         companyElement.innerHTML = `
//             <div class="company-header">
//                 <div style="flex: 1;">
//                     <div class="company-name">${company.name}</div>
//                     <div class="company-table">Table ${company.table_number}</div>
//                 </div>
//                 <div style="text-align: right;">
//                     <div style="font-size: 0.9em; color: ${available > 0 ? '#28a745' : '#dc3545'}">
//                         ${available} seats left
//                     </div>
//                 </div>
//             </div>

//             <div class="company-stats">
//                 <div class="stat-item">
//                     <div class="stat-value">${company.total_chairs}</div>
//                     <div class="stat-title">Total</div>
//                 </div>
//                 <div class="stat-item">
//                     <div class="stat-value" style="color: var(--primary-gold);">${company.chairs_occupied}</div>
//                     <div class="stat-title">Occupied</div>
//                 </div>
//             </div>

//             <div class="chair-progress">
//                 <div class="chair-progress-bar" style="width: ${percentage}%"></div>
//             </div>

//             <div style="font-size: 0.8em; color: var(--off-white); text-align: center;">
//                 ${company.chairs_occupied} of ${company.total_chairs} chairs filled
//             </div>
//         `;

//         container.appendChild(companyElement);
//     });
// }
