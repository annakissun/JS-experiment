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

// Print receipt after checkout
function printReceipt(orderId, items, total) {
    // Calculate max item name length for alignment
    const maxNameLen = Math.max(...items.map(i => i.name.length), 10);
    
    let receiptLines = [];
    receiptLines.push('================================');
    receiptLines.push('      ☕ INSAYNITEA COFFEE ☕');
    receiptLines.push('================================');
    receiptLines.push(`Order #: ${orderId}`);
    receiptLines.push(`Date: ${new Date().toLocaleString()}`);
    receiptLines.push('================================');
    receiptLines.push('');
    receiptLines.push('ITEMS:');
    
    // Add each item with proper alignment
    items.forEach(item => {
        const name = item.name.padEnd(maxNameLen);
        const qty = `${item.quantity} x RM${item.price.toFixed(2)}`;
        receiptLines.push(` ${name}  ${qty}`);
    });
    
    receiptLines.push('');
    receiptLines.push('================================');
    receiptLines.push(`TOTAL: RM${total.toFixed(2)}`);
    receiptLines.push('================================');
    receiptLines.push('');
    receiptLines.push('Thank you for your order!');
    receiptLines.push('☕ Have a great day! ☕');
    receiptLines.push('================================');
    
    const receipt = receiptLines.join('\n');
    
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receipt #${orderId}</title>
            <style>
                body { 
                    font-family: 'Courier New', monospace; 
                    padding: 20px; 
                    margin: 0;
                    display: flex;
                    justify-content: center;
                }
                .receipt {
                    max-width: 350px;
                    width: 100%;
                }
                pre {
                    font-size: 13px;
                    font-family: 'Courier New', monospace;
                    margin: 0;
                    white-space: pre-wrap;
                    line-height: 1.4;
                }
                button {
                    margin-top: 20px;
                    padding: 10px;
                    width: 100%;
                    background: #4b672f;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-family: monospace;
                }
                @media print {
                    button { display: none; }
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            <div class="receipt">
                <pre>${receipt}</pre>
                <button onclick="window.print()">🖨️ Print Receipt</button>
                <button onclick="window.close()">✕ Close</button>
            </div>
            <script>
                setTimeout(() => window.print(), 500);
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// ============ CHECKOUT FUNCTION ============
async function checkout() {
    if (order.length === 0) {
        alert('Please add items to your order first');
        return;
    }
    
    const total = order.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const itemsForDb = [];
    order.forEach(item => {
        for (let i = 0; i < item.quantity; i++) {
            itemsForDb.push({ name: item.name, price: item.price });
        }
    });
    
    try {
        const response = await fetch(`${API_URL}/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: itemsForDb, total })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`Order #${result.orderId} completed!\nTotal: RM${total.toFixed(2)}`);
            
            const receiptItems = order.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
            }));
            
            printReceipt(result.orderId, receiptItems, total);
            
            order = [];
            updateOrderDisplay();
        } else {
            alert('Error: ' + (result.error || 'Could not save order'));
        }
    } catch (error) {
        console.error('Checkout error:', error);
        alert('Server error. Make sure server is running on port 3000');
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