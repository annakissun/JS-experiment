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
        console.error('Error loading menu:', error);
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

// ============ PRINT RECEIPT FUNCTION ============
function printReceipt(orderId, items, total) {
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
    
    const printWindow = window.open('', '_blank', 'width=450,height=600');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receipt #${orderId} - Insaynitea</title>
            <style>
                body { font-family: 'Courier New', monospace; padding: 20px; margin: 0; display: flex; justify-content: center; background: #f0e5dc; }
                .receipt { max-width: 380px; width: 100%; background: white; padding: 20px; border-radius: 12px; }
                pre { font-size: 13px; font-family: 'Courier New', monospace; margin: 0; white-space: pre-wrap; }
                .qr-section { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px dashed #ccc; }
                .qr-section img { width: 180px; height: 180px; margin: 10px auto; display: block; }
                button { margin-top: 20px; padding: 10px; width: 100%; background: #4b672f; color: white; border: none; border-radius: 8px; cursor: pointer; }
                @media print { button { display: none; } body { background: white; } .receipt { box-shadow: none; } }
            </style>
        </head>
        <body>
            <div class="receipt">
                <pre>${receipt}</pre>
                <div class="qr-section">
                    <img src="../img/bank-qr.png" alt="Payment QR Code" onerror="this.style.display='none'">
                    <p style="font-size: 11px;">Scan QR code to pay</p>
                </div>
                <button onclick="window.print()">🖨️ Print</button>
                <button onclick="window.close()">✕ Close</button>
            </div>
            <script>setTimeout(() => window.print(), 500);<\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// ============ PROCESS PAYMENT ============
async function processPayment(orderId, total, currentOrder, method) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/payment`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentMethod: method, paymentStatus: 'completed' })
        });
        
        if (response.ok) {
            const receiptItems = currentOrder.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
            }));
            
            printReceipt(orderId, receiptItems, total);
            
            if (method === 'qr') {
                const paymentUrl = `pages/payment.html?id=${orderId}&total=${total}`;
                window.open(paymentUrl, '_blank', 'width=450,height=700');
            }
            
            // Replace alert with modal
            showModal({
                icon: method === 'qr' ? '📱' : '💵',
                title: 'Payment Completed!',
                message: `Order #${orderId} completed!\nPayment method: ${method.toUpperCase()}\nTotal: RM${total.toFixed(2)}`,
                confirmText: 'OK',
                hideCancel: true,
                type: 'success',
                onConfirm: () => {
                    order = [];
                    updateOrderDisplay();
                }
            });
        } else {
            showError('Failed to process payment');
        }
    } catch (error) {
        console.error('Payment error:', error);
        showError('Server error');
    }
}

// ============ PAYMENT METHOD MODAL ============
function showPaymentMethodModal(orderId, total, currentOrder) {
    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(3px);
        display: flex; justify-content: center; align-items: center;
        z-index: 10001;
    `;
    
    modalOverlay.innerHTML = `
        <div style="max-width: 400px; width: 90%; background: #fefaf5; border-radius: 20px; overflow: hidden;">
            <div style="padding: 1.5rem 1.5rem 0 1.5rem; text-align: center;">
                <div style="font-size: 3rem;">💰</div>
                <h3 style="color: #2c1810;">Select Payment Method</h3>
            </div>
            <div style="padding: 1rem 1.5rem; text-align: center;">
                <p style="font-size: 1.3rem; font-weight: bold; margin-bottom: 1.5rem; color: #2c1810;">Total: RM${total.toFixed(2)}</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button id="cash-pay-btn" style="background: #4b672f; color: white; border: none; padding: 12px 28px; border-radius: 40px; cursor: pointer; font-weight: bold;">💵 Cash</button>
                    <button id="qr-pay-btn" style="background: #2c1810; color: white; border: none; padding: 12px 28px; border-radius: 40px; cursor: pointer; font-weight: bold;">📱 QR Pay</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
    
    document.getElementById('cash-pay-btn').onclick = () => {
        modalOverlay.remove();
        processPayment(orderId, total, currentOrder, 'cash');
    };
    
    document.getElementById('qr-pay-btn').onclick = () => {
        modalOverlay.remove();
        processPayment(orderId, total, currentOrder, 'qr');
    };
    
    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.remove();
            alert('Payment cancelled');
        }
    };
}

// ============ CHECKOUT FUNCTION ============
async function checkout() {
    if (order.length === 0) {
        alert('Please add items to your order first');
        return;
    }
    
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const employeeId = user.EmployeeID || null;
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
            body: JSON.stringify({ items: itemsForDb, total, employeeId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showPaymentMethodModal(result.orderId, total, [...order]);
        } else {
            alert('Error: ' + (result.error || 'Could not save order'));
        }
    } catch (error) {
        console.error('Checkout error:', error);
        alert('Server error');
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