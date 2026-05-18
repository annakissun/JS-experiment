// Auto-detect API URL
const API_URL = `${window.location.protocol}//${window.location.hostname}:3000/api`;
let currentCategory = 'all';
let order = [];

// ============ MENU FUNCTIONS ============
async function loadMenu() {
    try {
        const response = await fetch(`${API_URL}/menu`);
        const items = await response.json();
        displayMenu(items);
    } catch (error) {
        document.getElementById('menu-grid').innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:2rem; color:red;">❌ Failed to load menu</div>';
    }
}

function displayMenu(items) {
    const filtered = currentCategory === 'all' ? items : items.filter(i => i.Category?.toLowerCase() === currentCategory);
    const menuGrid = document.getElementById('menu-grid');
    
    if (!filtered.length) {
        menuGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:2rem;">No items in this category</div>';
        return;
    }
    
    menuGrid.innerHTML = filtered.map(item => `
        <div class="menu-tile">
            <div class="tile-content">
                <span class="tile-icon">☕</span>
                <h3>${item.ItemName}</h3>
                <p class="price">RM${parseFloat(item.Price).toFixed(2)}</p>
                <button class="add-order-btn" data-name="${item.ItemName}" data-price="${item.Price}">+ ADD</button>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.add-order-btn').forEach(btn => {
        btn.addEventListener('click', () => addToOrder({ name: btn.dataset.name, price: parseFloat(btn.dataset.price) }));
    });
}

// ============ ORDER FUNCTIONS ============
function addToOrder(item) {
    const existing = order.find(i => i.name === item.name);
    existing ? (existing.quantity++, existing.totalPrice = existing.price * existing.quantity) : order.push({ ...item, quantity: 1, totalPrice: item.price });
    updateOrderDisplay();
}

function updateOrderDisplay() {
    const container = document.getElementById('order-items');
    const totalSpan = document.getElementById('total-price');
    
    if (!order.length) {
        container.innerHTML = '<p class="empty-message">No items added yet</p>';
        totalSpan.textContent = 'RM0.00';
        return;
    }
    
    let total = 0;
    container.innerHTML = '';
    
    order.forEach((item, idx) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const div = document.createElement('div');
        div.className = 'order-item';
        div.innerHTML = `
            <div style="flex:1">
                <span class="order-item-name">${item.name}</span>
                <div style="display:flex; gap:0.5rem; margin-top:0.25rem;">
                    <button class="qty-btn" data-idx="${idx}" data-change="-1">-</button>
                    <span class="order-item-quantity">${item.quantity}</span>
                    <button class="qty-btn" data-idx="${idx}" data-change="1">+</button>
                </div>
            </div>
            <div>
                <span class="order-item-price">RM${itemTotal.toFixed(2)}</span>
                <button class="remove-item" data-idx="${idx}">✕</button>
            </div>
        `;
        container.appendChild(div);
    });
    
    totalSpan.textContent = `RM${total.toFixed(2)}`;
    
    document.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.idx);
            const change = parseInt(btn.dataset.change);
            if (order[idx].quantity + change <= 0) order.splice(idx, 1);
            else order[idx].quantity += change;
            updateOrderDisplay();
        });
    });
    
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', () => {
            order.splice(parseInt(btn.dataset.idx), 1);
            updateOrderDisplay();
        });
    });
}

async function checkout() {
    if (!order.length) return alert('Please add items first');
    
    const total = order.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const itemsForDb = order.flatMap(i => Array(i.quantity).fill({ name: i.name, price: i.price }));
    
    try {
        const response = await fetch(`${API_URL}/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: itemsForDb, total }) });
        const result = await response.json();
        
        if (result.success) {
            alert(`✅ Order #${result.orderId} completed!\nTotal: RM${total.toFixed(2)}`);
            order = [];
            updateOrderDisplay();
        } else alert('Error: ' + (result.error || 'Could not save order'));
    } catch (error) {
        alert('Server error. Make sure server is running');
    }
}

// ============ FILTERS & INIT ============
function setupFilters() {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            loadMenu();
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadMenu();
    setupFilters();
    document.querySelector('.checkout-btn')?.addEventListener('click', checkout);
});
// Print receipt after checkout
async function printReceipt(orderId, items, total) {
    const receipt = `
        ================================
           INSAYNITEA COFFEE
        ================================
        Order #: ${orderId}
        Date: ${new Date().toLocaleString()}
        Cashier: ${sessionStorage.getItem('cashierName') || 'Cashier'}
        ================================
        
        ITEMS:
        ${items.map(item => `${item.name.padEnd(20)} ${item.quantity} x RM${item.price.toFixed(2)}`).join('\n')}
        
        ================================
        TOTAL: RM${total.toFixed(2)}
        ================================
        
        Thank you for your order!
        ☕ Have a great day! ☕
        ================================
    `;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head><title>Receipt #${orderId}</title>
        <style>
            body { font-family: monospace; padding: 20px; }
            pre { font-size: 12px; }
            @media print {
                body { margin: 0; padding: 10px; }
            }
        </style>
        </head>
        <body><pre>${receipt}</pre></body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
}

// After successful checkout, show receipt
if (result.success) {
    const receiptItems = order.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
    }));
    
    const receiptUrl = `pages/receipt.html?id=${result.orderId}&total=${total}&items=${encodeURIComponent(JSON.stringify(receiptItems))}`;
    window.open(receiptUrl, '_blank', 'width=400,height=600');
    
    order = [];
    updateOrderDisplay();
}