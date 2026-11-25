function logout() {
  localStorage.removeItem('role');
  window.location.href = 'index.html';
}

let selectedDate = new Date();

function getSales() {
  try {
    const storedSales = localStorage.getItem('sales');
    const parsedSales = storedSales ? JSON.parse(storedSales) : [];
    if (!Array.isArray(parsedSales)) {
      console.error('Saved sales data is not a list.');
      return [];
    }
    return parsedSales;
  } catch (error) {
    console.error('Unable to read saved sales.', error);
    return [];
  }
}

function getSaleDate(sale) {
  if (!sale || typeof sale.date !== 'string') {
    return null;
  }

  const legacyDate = sale.date.match(
    /^\s*(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:,\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?\s*$/i
  );
  if (!legacyDate) {
    const parsed = new Date(sale.date);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  let first = Number(legacyDate[1]);
  let second = Number(legacyDate[2]);
  let year = Number(legacyDate[3]);
  if (year < 100) {
    year += year < 50 ? 2000 : 1900;
  }

  // Prefer Indian day/month order for ambiguous historical locale dates.
  let day = first;
  let month = second;
  if (first > 12) {
    day = first;
    month = second;
  } else if (second > 12) {
    day = second;
    month = first;
  }

  let hour = Number(legacyDate[4] || 0);
  const minute = Number(legacyDate[5] || 0);
  const secondOfMinute = Number(legacyDate[6] || 0);
  const meridiem = legacyDate[7] && legacyDate[7].toUpperCase();
  if (meridiem) {
    if (hour < 1 || hour > 12) {
      return null;
    }
    hour = hour % 12 + (meridiem === 'PM' ? 12 : 0);
  }

  const date = new Date(year, month - 1, day, hour, minute, secondOfMinute);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

function getMonthValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getSaleTotal(sale) {
  const total = Number(sale && sale.total);
  if (Number.isFinite(total)) {
    return total;
  }
  if (!sale || !Array.isArray(sale.items)) {
    return 0;
  }
  return sale.items.reduce((sum, item) => {
    const price = Number(item && item.price);
    const qty = Number(item && item.qty);
    return Number.isFinite(price) && Number.isFinite(qty) ? sum + price * qty : sum;
  }, 0);
}

function getDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
    if (!saleDate) {
      return details;
    }
    const dateKey = getDateKey(saleDate);

    if (!details[dateKey]) {
      details[dateKey] = {
        date: saleDate,
        bills: 0,
        total: 0
      };
    }

    details[dateKey].bills++;
    details[dateKey].total += getSaleTotal(sale);
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
      <span>${row.date.toLocaleDateString('en-IN')}</span>
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
    if (Array.isArray(sale.items)) {
      sale.items.forEach(item => {
        const qty = Number(item && item.qty);
        if (item && typeof item.name === 'string' && Number.isFinite(qty) && qty > 0) {
          totals[item.name] = (totals[item.name] || 0) + qty;
        }
      });
    }
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
  const sales = getSales();
  const monthFilter = document.getElementById('monthFilter');

  if (!monthFilter.value) {
    monthFilter.value = getMonthValue(now);
  }

  const selectedMonthDate = /^\d{4}-\d{2}$/.test(monthFilter.value)
    ? new Date(`${monthFilter.value}-01T00:00:00`)
    : now;
  const monthName = selectedMonthDate.toLocaleString('en-IN', {
    month: 'long',
    year: 'numeric'
  });
  const selectedDay = selectedDate.toLocaleDateString('en-IN');

  const dailySales = sales.filter(sale => {
    const saleDate = getSaleDate(sale);
    return saleDate && getDateKey(saleDate) === getDateKey(selectedDate);
  });
  const monthlySales = sales.filter(sale => {
    const saleDate = getSaleDate(sale);
    return saleDate && getMonthValue(saleDate) === monthFilter.value;
  });
  const totalAmount = dailySales.reduce((sum, sale) => sum + getSaleTotal(sale), 0);
  const monthlyAmount = monthlySales.reduce((sum, sale) => sum + getSaleTotal(sale), 0);

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

window.addEventListener('storage', event => {
  if (event.key === 'sales' || event.key === null) {
    renderOwnerDashboard();
  }
});
