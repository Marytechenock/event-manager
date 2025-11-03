// Update companies status display for new layout
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
                <div style="flex: 1;">
                    <div class="company-name">${company.name}</div>
                    <div class="company-table">Table ${company.table_number}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 0.9em; color: ${available > 0 ? '#28a745' : '#dc3545'}">
                        ${available} seats left
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

            <div style="font-size: 0.8em; color: var(--off-white); text-align: center;">
                ${company.chairs_occupied} of ${company.total_chairs} chairs filled
            </div>
        `;

        container.appendChild(companyElement);
    });
}
