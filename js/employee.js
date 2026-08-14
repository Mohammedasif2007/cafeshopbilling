const products = [
  { name: 'Tea', price: 15, image: 'assets/products/tea.png' },
  { name: 'Coffee', price: 20, image: 'assets/products/coffee.png' },
  { name: 'Boost', price: 30, image: 'assets/products/boost.png' },
  { name: 'Horlicks', price: 35, image: 'assets/products/horlicks.png' },
  { name: 'Milk', price: 25, image: 'assets/products/milk.png' },
  { name: 'Black Tea', price: 20, image: 'assets/products/black-tea.png' },
  { name: 'Green Tea', price: 25, image: 'assets/products/green-tea.png' },
  { name: 'Lemon Tea', price: 25, image: 'assets/products/lemon-tea.png' },
  { name: 'Ginger Tea', price: 20, image: 'assets/products/ginger-tea.png' },
  { name: 'Masala Tea', price: 25, image: 'assets/products/masala-tea.png' },
  { name: 'Cold Coffee', price: 60, image: 'assets/products/cold-coffee.png' },
  { name: 'Badam Milk', price: 50, image: 'assets/products/badam-milk.png' },
  { name: 'Rose Milk', price: 40, image: 'assets/products/rose-milk.png' },
  { name: 'Samosa', price: 12, image: 'assets/products/samosa.png' },
  { name: 'Veg Puff', price: 20, image: 'assets/products/veg-puff.png' },
  { name: 'Egg Puff', price: 25, image: 'assets/products/egg-puff.png' },
  { name: 'Vada', price: 10, image: 'assets/products/vada.png' },
  { name: 'Bajji', price: 15, image: 'assets/products/bajji.png' },
  { name: 'Biscuit', price: 10, image: 'assets/products/biscuit.png' },
  { name: 'Cake Slice', price: 30, image: 'assets/products/cake.png' },
  { name: 'Water Bottle', price: 20, image: 'assets/products/water.png' }
];

let cart = [];

function loadSavedBill() {
  const savedBill = JSON.parse(localStorage.getItem('currentBill'));
  if (savedBill && Array.isArray(savedBill.items) && savedBill.items.length) {
    cart = savedBill.items.map(item => ({ ...item }));
  } else {
    cart = [];
  }
}

loadSavedBill();

function logout() {
  localStorage.removeItem('role');
  window.location.href = 'index.html';
}

function renderProducts(filteredProducts = products) {
  const productList = document.getElementById('productList');
  productList.innerHTML = '';

  filteredProducts.forEach((product) => {
    const index = products.findIndex(p => p.name === product.name);
    const div = document.createElement('div');
    div.className = 'product-card';
    div.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='assets/products/placeholder.png'">
      <h3>${product.name}</h3>
      <p>\u20B9${product.price}</p>
      <button class="small-add-btn" onclick="addToCart(${index}, this)">Add</button>
    `;
    productList.appendChild(div);
  });
}

function addToCart(index, sourceElement) {
  const product = products[index];
  const existing = cart.find(item => item.name === product.name);
  const productCard = sourceElement?.closest('.product-card');

  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  if (productCard) {
    productCard.classList.remove('is-selected');
    void productCard.offsetWidth;
    productCard.classList.add('is-selected');
  }

  renderCart();
}

function renderCart() {
  const cartItems = document.getElementById('cartItems');
  const totalEl = document.getElementById('total');

  if (!cartItems || !totalEl) {
    return;
  }

  cartItems.innerHTML = '';
  let total = 0;

  const header = document.createElement('div');
  header.className = 'cart-row cart-header';
  header.innerHTML = `
    <span>products</span>
    <span>quantity</span>
    <span>price</span>
  `;
  cartItems.appendChild(header);

  cart.forEach(item => {
    total += item.price * item.qty;

    const div = document.createElement('div');
    div.className = 'cart-row cart-item';
    div.innerHTML = `
      <span>${item.name}</span>
      <div class="qty-control">
        <button type="button" onclick="decreaseQty(${products.findIndex(product => product.name === item.name)})" aria-label="Decrease ${item.name} quantity">-</button>
        <span class="qty-value">${item.qty}</span>
        <button type="button" onclick="increaseQty(${products.findIndex(product => product.name === item.name)})" aria-label="Increase ${item.name} quantity">+</button>
      </div>
      <span>\u20B9${item.price * item.qty}</span>
      <button type="button" class="delete-btn" onclick="removeFromCart('${item.name}')" aria-label="Remove ${item.name} from cart">✕</button>
    `;
    cartItems.appendChild(div);
  });

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalQtyEl = document.getElementById('totalQty');

  if (totalQtyEl) {
    totalQtyEl.textContent = totalQty;
  }

  totalEl.textContent = total;
}

function increaseQty(index) {
  addToCart(index);
}

function decreaseQty(index) {
  const product = products[index];
  const existingIndex = cart.findIndex(item => item.name === product.name);

  if (existingIndex === -1) {
    return;
  }

  cart[existingIndex].qty--;

  if (cart[existingIndex].qty <= 0) {
    cart.splice(existingIndex, 1);
  }

  renderCart();
}

function removeFromCart(productName) {
  const existingIndex = cart.findIndex(item => item.name === productName);

  if (existingIndex !== -1) {
    cart.splice(existingIndex, 1);
  }

  renderCart();
}

function goToCurrentOrder() {
  const orderPanel = document.querySelector('.order-panel');

  if (orderPanel) {
    orderPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function goToProducts() {
  const menuPanel = document.querySelector('.menu-panel');

  if (menuPanel) {
    menuPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function finishOrder() {
  if (cart.length === 0) {
    alert('Please add at least one item.');
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const bill = {
    items: cart,
    total,
    date: new Date().toLocaleString()
  };

  localStorage.setItem('currentBill', JSON.stringify(bill));

  const sales = JSON.parse(localStorage.getItem('sales')) || [];
  sales.push(bill);
  localStorage.setItem('sales', JSON.stringify(sales));

  window.location.href = 'bill.html';
}

function searchProducts() {
  const keyword = document.getElementById('searchInput').value.toLowerCase();
  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(keyword)
  );
  renderProducts(filtered);
}

window.addEventListener('pageshow', () => {
  loadSavedBill();
  renderCart();
});

renderProducts();
renderCart();
