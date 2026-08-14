function logout() {
  localStorage.removeItem('role');
  window.location.href = 'index.html';
}

const sales = JSON.parse(localStorage.getItem('sales')) || [];
let selectedDate = new Date();

function getSaleDate(sale) {
  return new Date(sale.date);
}

function getMonthValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getSalesForMonth(monthValue) {
  return sales.filter(sale => {
    const saleDate = getSaleDate(sale);
    return getMonthValue(saleDate) === monthValue;
  });
}

function changeDate(direction) {
  selectedDate.setDate(selectedDate.getDate() + direction);
  renderOwnerDashboard();
}

function renderMonthlyDetails(monthlySales) {
  const monthlySalesList = document.getElementById('monthlySalesList');
  monthlySalesList.innerHTML = '';

  const monthlyDetails = monthlySales.reduce((details, sale) => {
    const saleDate = getSaleDate(sale);
    const dateKey = saleDate.toLocaleDateString();

    if (!details[dateKey]) {
      details[dateKey] = {
        date: saleDate,
        bills: 0,
        total: 0
      };
    }

    details[dateKey].bills++;
    details[dateKey].total += sale.total;
    return details;
  }, {});

  const monthlyRows = Object.values(monthlyDetails).sort((a, b) =>
    a.date - b.date
  );

  if (monthlyRows.length === 0) {
    monthlySalesList.innerHTML = '<p class="empty-message">No sales for this month.</p>';
    return;
  }

  monthlyRows.forEach(row => {
    const div = document.createElement('div');
    div.className = 'monthly-row';
    div.innerHTML = `
      <span>${row.date.toLocaleDateString()}</span>
      <span>${row.bills}</span>
      <span>\u20B9${row.total}</span>
    `;
    monthlySalesList.appendChild(div);
  });
}

function renderFavoriteProducts(monthlySales) {
  const chart = document.getElementById('favoriteProductsChart');
  chart.innerHTML = '';

  const productTotals = monthlySales.reduce((totals, sale) => {
    sale.items.forEach(item => {
      totals[item.name] = (totals[item.name] || 0) + item.qty;
    });
    return totals;
  }, {});

  const topProducts = Object.entries(productTotals)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6);

  if (topProducts.length === 0) {
    chart.innerHTML = '<p class="empty-message">No product sales for this month.</p>';
    return;
  }

  const highestQty = Math.max(...topProducts.map(product => product.qty));

  topProducts.forEach(product => {
    const percent = Math.max((product.qty / highestQty) * 100, 8);
    const div = document.createElement('div');
    div.className = 'bar-row';
    div.innerHTML = `
      <span class="bar-label">${product.name}</span>
      <div class="bar-track">
        <div class="bar-fill" style="width: ${percent}%"></div>
      </div>
      <span class="bar-value">${product.qty}</span>
    `;
    chart.appendChild(div);
  });
}

function renderOwnerDashboard() {
  const now = new Date();
  const monthFilter = document.getElementById('monthFilter');

  if (!monthFilter.value) {
    monthFilter.value = getMonthValue(now);
  }

  const selectedMonthDate = new Date(`${monthFilter.value}-01T00:00:00`);
  const monthName = selectedMonthDate.toLocaleString('default', {
    month: 'long',
    year: 'numeric'
  });
  const selectedDay = selectedDate.toLocaleDateString();

  const dailySales = sales.filter(sale =>
    getSaleDate(sale).toLocaleDateString() === selectedDay
  );
  const monthlySales = getSalesForMonth(monthFilter.value);
  const totalAmount = dailySales.reduce((sum, sale) => sum + sale.total, 0);
  const monthlyAmount = monthlySales.reduce((sum, sale) => sum + sale.total, 0);

  document.getElementById('todaySales').textContent = `\u20B9${totalAmount}`;
  document.getElementById('totalBills').textContent = dailySales.length;
  document.getElementById('monthlySales').textContent = `\u20B9${monthlyAmount}`;
  document.getElementById('monthlyBills').textContent = monthlySales.length;
  document.getElementById('monthlyTitle').textContent = monthName;
  document.getElementById('selectedDateText').textContent = selectedDay;

  renderMonthlyDetails(monthlySales);
  renderFavoriteProducts(monthlySales);
}

renderOwnerDashboard();
