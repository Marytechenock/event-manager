// Global variable to hold current search term
let currentSearchTerm = '';

// Logout function – calls server to destroy session
function logout() {
    fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'same-origin' // ensures cookies are sent
    }).finally(() => {
        window.location.href = 'admin-login.html';
    });
}

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
                body: JSON.stringify({ username, password }),
                credentials: 'same-origin' // critical for sessions
            })
                .then(response => response.json())
                .then(data => {
                    if (data.message === 'Login successful') {
                        // Redirect directly – no localStorage needed
                        window.location.href = 'admin-dashboard.html';
                    } else {
                        alert('Login failed: ' + (data.error || 'Invalid credentials'));
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
        // No auth check needed — server already protected this page
        loadDashboardData();
        setInterval(loadDashboardData, 10000); // Refresh every 10 seconds
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
            const totalAttendees = data.totalAttendees;
            const totalCompanies = data.companies.length;

            // Calculate company attendance (companies with ≥1 occupied chair)
            const attendingCompanies = data.companies.filter(company => 
                (company.chairs_occupied || 0) > 0
            ).length;

            let totalChairs = 0;
            let occupiedChairs = 0;
            let availableChairs = 0;

            data.companies.forEach(company => {
                totalChairs += company.total_chairs;
                occupiedChairs += company.chairs_occupied;
                availableChairs += (company.total_chairs - company.chairs_occupied);
            });

            // Update counts
            document.getElementById('totalAttendees').textContent = totalAttendees;
            document.getElementById('companyAttendanceCount').textContent = attendingCompanies;
            document.getElementById('availableChairs').textContent = availableChairs;
            document.getElementById('occupiedChairs').textContent = occupiedChairs;

            // === UPDATE UTILIZATION PERCENTAGES ===

            // Attendance % = (Attendees / Total Chairs) * 100
            if (totalChairs > 0) {
                const attendancePercent = Math.min(100, Math.round((totalAttendees / totalChairs) * 100));
                document.getElementById('attendanceUtil').textContent = `${attendancePercent}%`;
            } else {
                document.getElementById('attendanceUtil').textContent = '0%';
            }

            // Company Attendance % = (Attending Companies / Total Companies) * 100
            if (totalCompanies > 0) {
                const companyAttendancePercent = Math.round((attendingCompanies / totalCompanies) * 100);
                document.getElementById('companyAttendanceUtil').textContent = `${companyAttendancePercent}%`;
            } else {
                document.getElementById('companyAttendanceUtil').textContent = '0%';
            }

            // Available Chairs %
            if (totalChairs > 0) {
                const availablePercent = Math.round((availableChairs / totalChairs) * 100);
                document.getElementById('availableChairsUtil').textContent = `${availablePercent}%`;
            } else {
                document.getElementById('availableChairsUtil').textContent = '0%';
            }

            // Occupied Chairs %
            if (totalChairs > 0) {
                const occupiedPercent = Math.round((occupiedChairs / totalChairs) * 100);
                document.getElementById('occupiedChairsUtil').textContent = `${occupiedPercent}%`;
            } else {
                document.getElementById('occupiedChairsUtil').textContent = '0%';
            }

            updateCompaniesStatus(data.companies);
            updateRecentGuests(data.guests.slice(0, 5));
            allGuestsData = data.guests;
            applySearchFilter();
        })
        .catch(error => {
            console.error('Error loading dashboard ', error);
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
            (guest.position || '').toLowerCase().includes(currentSearchTerm) ||
            (guest.lucky_number || '').toString().includes(currentSearchTerm)
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

        row.innerHTML = `
            <div>${guest.name || ''}</div>
            <div>${guest.surname || ''}</div>
            <div>${guest.email || ''}</div>
            <div>${guest.phone || ''}</div>
            <div>${guest.company_name || 'N/A'}</div>
            <div>${guest.position || 'N/A'}</div>
            <div>${guest.table_number || 'N/A'}</div>
            <div><strong>${guest.lucky_number || 'N/A'}</strong></div>
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

        row.innerHTML = `
            <div>${guest.name || ''}</div>
            <div>${guest.surname || ''}</div>
            <div>${guest.email || ''}</div>
            <div>${guest.company_name || 'N/A'}</div>
            <div>${guest.table_number || 'N/A'}</div>
            <div><strong>${guest.lucky_number || 'N/A'}</strong></div>
        `;

        container.appendChild(row);
    });
}

// === EXCEL EXPORT FUNCTIONALITY ===
// Export filtered or full guest list to Excel with BOLD HEADERS
async function exportToExcel() {
  try {
    // Load SheetJS if not already loaded
    if (typeof XLSX === 'undefined') {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Excel library. Check your internet connection.'));
        document.head.appendChild(script);
      });
    }

    // Use filtered data if search is active
    let exportData = allGuestsData;
    if (currentSearchTerm) {
      exportData = allGuestsData.filter(guest =>
        (guest.name || '').toLowerCase().includes(currentSearchTerm) ||
        (guest.surname || '').toLowerCase().includes(currentSearchTerm) ||
        (guest.email || '').toLowerCase().includes(currentSearchTerm) ||
        (guest.phone || '').toLowerCase().includes(currentSearchTerm) ||
        (guest.company_name || '').toLowerCase().includes(currentSearchTerm) ||
        (guest.position || '').toLowerCase().includes(currentSearchTerm) ||
        (guest.lucky_number || '').toString().includes(currentSearchTerm)
      );
    }

    // Format data for Excel - ADD LUCKY NUMBER COLUMN
    const worksheetData = exportData.map(guest => ({
      Name: guest.name || '',
      Surname: guest.surname || '',
      Email: guest.email || '',
      Phone: guest.phone || '',
      Company: guest.company_name || 'N/A',
      Position: guest.position || 'N/A',
      Table: guest.table_number || 'N/A',
      'Lucky Number': guest.lucky_number || 'N/A', 
    }));

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet([Object.keys(worksheetData[0] || {
      Name: '', Surname: '', Email: '', Phone: '', Company: '', Position: '', Table: '', 'Lucky Number': ''
    })]);

    // Add data rows
    if (worksheetData.length > 0) {
      const dataRows = worksheetData.map(item => Object.values(item));
      XLSX.utils.sheet_add_aoa(ws, dataRows, { origin: 'A2' });
    }

    // Make headers bold
    if (ws['!ref']) {
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: 0, c: C });
        if (ws[addr]) {
          ws[addr].s = { font: { bold: true } };
        }
      }
    }

    // Create and download workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendees');
    XLSX.writeFile(wb, `attendees_${new Date().toISOString().slice(0,10)}.xlsx`);
    
  } catch (error) {
    console.error('Export failed:', error);
    alert('Export failed: ' + (error.message || 'An unexpected error occurred. Please try again.'));
  }
}

// Attach export button handler
document.addEventListener('DOMContentLoaded', () => {
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportToExcel);
  }
});