// Display companies in the new card layout
function displayCompanies(companies) {
    const container = document.getElementById('companiesList');
    container.innerHTML = '';

    if (companies.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-building" style="font-size: 3em; color: var(--primary-gold); margin-bottom: 20px;"></i>
                <div style="font-size: 1.2em; margin-bottom: 10px;">No companies added yet</div>
                <div style="opacity: 0.7;">Use the form above to add your first company</div>
            </div>
        `;
        return;
    }

    companies.forEach(company => {
        const availableChairs = company.total_chairs - company.chairs_occupied;
        const percentage = (company.chairs_occupied / company.total_chairs) * 100;

        const companyElement = document.createElement('div');
        companyElement.className = 'company-card';

        companyElement.innerHTML = `
            <div class="company-header">
                <div style="flex: 1;">
                    <div class="company-name">${company.name}</div>
                    <div class="company-table">Table ${company.table_number}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 0.9em; color: ${availableChairs > 0 ? '#28a745' : '#dc3545'}">
                        ${availableChairs} available
                    </div>
                </div>
            </div>

            <div class="company-stats">
                <div class="stat-item">
                    <div class="stat-value">${company.total_chairs}</div>
                    <div class="stat-title">Total</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" style="color: var(--primary-gold);">${company.chairs_occupied}</div>
                    <div class="stat-title">Occupied</div>
                </div>
            </div>

            <div class="chair-progress">
                <div class="chair-progress-bar" style="width: ${percentage}%"></div>
            </div>

            <div class="company-actions">
                <button onclick="editCompany(${company.id})" class="btn-outline-gold btn-sm">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button onclick="deleteCompany(${company.id})" class="btn-luxury btn-sm" style="background: #dc3545;">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;

        container.appendChild(companyElement);
    });
}
