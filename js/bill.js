function getStoredBill() {
  try {
    return JSON.parse(localStorage.getItem('currentBill')) || {
      items: [],
      total: 0,
      date: new Date().toISOString()
    };
  } catch (error) {
    console.error('Unable to read the current bill.', error);
    return { items: [], total: 0, date: new Date().toISOString() };
  }
}

let bill = getStoredBill();

function parseBillDate(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const legacyDate = value.match(
    /^\s*(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:,\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?\s*$/i
  );
  if (!legacyDate) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const first = Number(legacyDate[1]);
  const second = Number(legacyDate[2]);
  let year = Number(legacyDate[3]);
  if (year < 100) {
    year += year < 50 ? 2000 : 1900;
  }

  let day = first;
  let month = second;
  if (first <= 12 && second > 12) {
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

function renderBill() {
  const billItems = document.getElementById('billItems');
  if (!billItems) {
    return;
  }

  billItems.innerHTML = '';
  let totalQty = 0;
  let total = 0;

  if (!bill.items || bill.items.length === 0) {
    billItems.innerHTML = '<div class="bill-row">No products in the bill.</div>';
    document.getElementById('billTotalQty').textContent = '0';
    document.getElementById('billTotal').textContent = '0';
    document.getElementById('billDate').textContent = '';
    document.getElementById('billTime').textContent = '';
    return;
  }

  bill.items.forEach((item, index) => {
    totalQty += item.qty;
    total += item.price * item.qty;

    const div = document.createElement('div');
    div.className = 'bill-row';
    div.innerHTML = `
      <span>${item.name}</span>
      <div class="qty-control">
        <button type="button" onclick="decreaseQty(${index})" aria-label="Decrease ${item.name} quantity">-</button>
        <span class="qty-value">${item.qty}</span>
        <button type="button" onclick="increaseQty(${index})" aria-label="Increase ${item.name} quantity">+</button>
      </div>
      <span>₹${item.price * item.qty}</span>
      <button type="button" class="delete-btn" onclick="deleteItem(${index})" aria-label="Remove ${item.name} from bill">✕</button>
    `;
    billItems.appendChild(div);
  });

  document.getElementById('billTotalQty').textContent = totalQty;
  document.getElementById('billTotal').textContent = total;

  const billDateTime = parseBillDate(bill.date);
  if (!billDateTime) {
    const [datePart, timePart = ''] = String(bill.date || '').split(',');
    document.getElementById('billDate').textContent = datePart.trim();
    document.getElementById('billTime').textContent = timePart.trim();
  } else {
    document.getElementById('billDate').textContent = billDateTime.toLocaleDateString('en-IN');
    document.getElementById('billTime').textContent = billDateTime.toLocaleTimeString('en-IN');
  }
}

function increaseQty(index) {
  if (!bill.items || !bill.items[index]) {
    return;
  }

  bill.items[index].qty++;
  bill.total = bill.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  saveBill();
  renderBill();
}

function decreaseQty(index) {
  if (!bill.items || !bill.items[index]) {
    return;
  }

  if (bill.items[index].qty > 1) {
    bill.items[index].qty--;
  } else {
    bill.items.splice(index, 1);
  }
  bill.total = bill.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  saveBill();
  renderBill();
}

function saveBill() {
  localStorage.setItem('currentBill', JSON.stringify(bill));
  if (!bill.id) {
    return;
  }

  const storedSales = localStorage.getItem('sales');
  const sales = storedSales ? JSON.parse(storedSales) : [];
  if (!Array.isArray(sales)) {
    throw new Error('Saved sales data is not a list.');
  }
  const saleIndex = sales.findIndex(sale => sale && sale.id === bill.id);
  if (saleIndex !== -1) {
    sales[saleIndex] = { ...bill, items: bill.items.map(item => ({ ...item })) };
    localStorage.setItem('sales', JSON.stringify(sales));
  }
}

function printBill() {
  saveBill();
  localStorage.removeItem('currentBill');
  window.print();
}

function deleteItem(index) {
  if (!bill.items || !bill.items[index]) {
    return;
  }

  bill.items.splice(index, 1);
  bill.total = bill.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  saveBill();
  renderBill();
}

window.addEventListener('pageshow', () => {
  bill = getStoredBill();
  renderBill();
});

renderBill();
