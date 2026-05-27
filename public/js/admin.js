// Global variable to hold current search term
let currentSearchTerm = '';

// Logout function – calls server to destroy session
function logout() {
    fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'same-origin'
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'same-origin'
            })
            .then(response => response.json())
            .then(data => {
                if (data.message === 'Login successful') {
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

    if (window.location.pathname.includes('admin-dashboard.html')) {
        loadDashboardData();
        loadWinnersData();
        setInterval(loadDashboardData, 10000);
        setInterval(loadWinnersData, 10000);
    }

    const searchInput = document.getElementById('searchAttendees');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            currentSearchTerm = e.target.value.toLowerCase();
            applySearchFilter();
        });
    }

    const pdfBtn = document.getElementById('exportWinnersPdf');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', exportWinnersPdf);
    }
});

let allGuestsData = [];

function loadDashboardData() {
    fetch('/api/admin/metrics')
        .then(response => response.json())
        .then(data => {
            const totalAttendees = data.totalAttendees;
            const attendingCompanies = new Set(
                data.guests
                    .map(guest => (guest.company_name || '').trim())
                    .filter(Boolean)
            ).size;
            const guestsWithOrganisation = data.guests.filter(guest =>
                Boolean((guest.company_name || '').trim())
            ).length;

            let totalChairs = 0;

            data.companies.forEach(company => {
                totalChairs += company.total_chairs;
            });

            const occupiedChairs = totalAttendees;
            const availableChairs = Math.max(totalChairs - totalAttendees, 0);

            document.getElementById('totalAttendees').textContent = totalAttendees;
            document.getElementById('companyAttendanceCount').textContent = attendingCompanies;
            document.getElementById('availableChairs').textContent = availableChairs;
            document.getElementById('occupiedChairs').textContent = occupiedChairs;

            if (totalChairs > 0) {
                const attendancePercent = Math.min(100, Math.round((totalAttendees / totalChairs) * 100));
                document.getElementById('attendanceUtil').textContent = `${attendancePercent}%`;
            } else {
                document.getElementById('attendanceUtil').textContent = '0%';
            }

            if (totalAttendees > 0) {
                const organisationCoveragePercent = Math.round((guestsWithOrganisation / totalAttendees) * 100);
                document.getElementById('companyAttendanceUtil').textContent = `${organisationCoveragePercent}% covered`;
            } else {
                document.getElementById('companyAttendanceUtil').textContent = '0%';
            }

            if (totalChairs > 0) {
                const availablePercent = Math.round((availableChairs / totalChairs) * 100);
                document.getElementById('availableChairsUtil').textContent = `${availablePercent}%`;
            } else {
                document.getElementById('availableChairsUtil').textContent = '0%';
            }

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

function loadWinnersData() {
    fetch('/api/raffle/winners')
        .then(response => response.json())
        .then(winners => {
            renderRaffleWinners(winners);
        })
        .catch(error => {
            console.error('Error loading winners:', error);
        });
}

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

function renderRaffleWinners(winners) {
    const container = document.getElementById('raffleWinnersList');
    container.innerHTML = '';
    if (winners.length === 0) {
        container.innerHTML = '<div class="winner-row"><div colspan="5" style="text-align:center;color:#888">No winners yet</div></div>';
        return;
    }
    winners.forEach(winner => {
        const row = document.createElement('div');
        row.className = 'winner-row';
        row.innerHTML = `
            <div><strong>${winner.lucky_number}</strong></div>
            <div>${winner.name} ${winner.surname}</div>
            <div>${winner.company_name || 'N/A'}</div>
            <div>${winner.table_number || 'N/A'}</div>
            <div>${winner.sponsor_company}</div>
        `;
        container.appendChild(row);
    });
}

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
                    <div class="company-table">${company.table_number}</div>
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

// === EXCEL EXPORT ===
async function exportToExcel() {
  try {
    if (typeof XLSX === 'undefined') {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Excel library.'));
        document.head.appendChild(script);
      });
    }

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

    const worksheetData = exportData.map(guest => ({
      Name: guest.name || '',
      Surname: guest.surname || '',
      Email: guest.email || '',
      Phone: guest.phone || '',
      Organisation: guest.company_name || 'N/A',
      Position: guest.position || 'N/A',
      Table: guest.table_number || 'N/A',
      'Lucky Number': guest.lucky_number || 'N/A', 
    }));

    const ws = XLSX.utils.aoa_to_sheet([Object.keys(worksheetData[0] || {
      Name: '', Surname: '', Email: '', Phone: '', Organisation: '', Position: '', Table: '', 'Lucky Number': ''
    })]);

    if (worksheetData.length > 0) {
      const dataRows = worksheetData.map(item => Object.values(item));
      XLSX.utils.sheet_add_aoa(ws, dataRows, { origin: 'A2' });
    }

    if (ws['!ref']) {
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: 0, c: C });
        if (ws[addr]) {
          ws[addr].s = { font: { bold: true } };
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendees');
    XLSX.writeFile(wb, `attendees_${new Date().toISOString().slice(0,10)}.xlsx`);
  } catch (error) {
    console.error('Export failed:', error);
    alert('Export failed: ' + (error.message || 'An unexpected error occurred. Please try again.'));
  }
}

// ✅ WORKING PDF EXPORT
async function exportWinnersPdf() {
    try {
        // Load jsPDF + autoTable from a single CDN that includes both
        await new Promise((resolve, reject) => {
            if (window.jspdf && window.jspdf.jspdf && window.jspdf.AutoTable) {
                return resolve();
            }
            
            // Create a combined script tag for jsPDF + autoTable
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                // Load autoTable after jsPDF
                const autoTableScript = document.createElement('script');
                autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js';
                autoTableScript.onload = () => resolve();
                autoTableScript.onerror = () => reject(new Error('Failed to load autoTable.'));
                document.head.appendChild(autoTableScript);
            };
            script.onerror = () => reject(new Error('Failed to load jsPDF.'));
            document.head.appendChild(script);
        });

        const { jsPDF } = window.jspdf;
        const winners = await fetch('/api/raffle/winners').then(r => r.json());
        
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('MAZ Superbrand Awards - Raffle Winners', 14, 20);
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        const headers = ['Lucky Number', 'Name', 'Organisation', 'Table', 'Sponsor'];
        const rows = winners.map(w => [
            `${w.lucky_number}`,
            `${w.name} ${w.surname}`,
            w.company_name || 'N/A',
            w.table_number || 'N/A',
            w.sponsor_company
        ]);

        // ✅ Use autoTable correctly
        doc.autoTable({
            head: [headers],
            body: rows,
            startY: 40,
            theme: 'grid',
            styles: { fontSize: 10, cellPadding: 4 },
            headStyles: { 
                fillColor: [212, 175, 55], // Gold
                textColor: [0, 0, 0],
                fontSize: 12,
                fontStyle: 'bold'
            },
            margin: { top: 40 }
        });

        doc.save(`raffle-winners-${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (error) {
        console.error('PDF export error:', error);
        alert('Failed to export PDF: ' + error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToExcel);
    }
});
