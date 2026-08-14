function getStoredBill() {
  return JSON.parse(localStorage.getItem('currentBill')) || { items: [], total: 0, date: new Date().toLocaleString() };
}

let bill = getStoredBill();

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

  const billDateTime = new Date(bill.date);
  if (Number.isNaN(billDateTime.getTime())) {
    const [datePart, timePart = ''] = bill.date.split(',');
    document.getElementById('billDate').textContent = datePart.trim();
    document.getElementById('billTime').textContent = timePart.trim();
  } else {
    document.getElementById('billDate').textContent = billDateTime.toLocaleDateString();
    document.getElementById('billTime').textContent = billDateTime.toLocaleTimeString();
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

function clearCurrentBill() {
  localStorage.removeItem('currentBill');
  bill = { items: [], total: 0, date: new Date().toLocaleString() };
  renderBill();
}

window.addEventListener('pageshow', () => {
  bill = getStoredBill();
  renderBill();
});

renderBill();
