const API_URL = `${window.location.protocol}//${window.location.hostname}:3000/api`;
let ordersData = [];
let orderToDelete = null;

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Load all orders
async function loadOrders() {
    try {
        const response = await fetch(`${API_URL}/orders`);
        ordersData = await response.json();
        filterAndDisplayOrders();
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('orders-list').innerHTML = 
            '<div class="empty-state">❌ Failed to load orders. Make sure server is running.</div>';
    }
}

// Filter and display orders
function filterAndDisplayOrders() {
    let filtered = [...ordersData];
    
    // Search filter
    const searchTerm = document.getElementById('search-order').value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(order => 
            order.OrderID.toString().includes(searchTerm)
        );
    }
    
    // Date filter
    const dateFilter = document.getElementById('date-filter').value;
    const now = new Date();
    
    filtered = filtered.filter(order => {
        const orderDate = new Date(order.OrderDate);
        
        switch(dateFilter) {
            case 'today':
                return orderDate.toDateString() === now.toDateString();
            case 'yesterday':
                const yesterday = new Date(now);
                yesterday.setDate(now.getDate() - 1);
                return orderDate.toDateString() === yesterday.toDateString();
            case 'week':
                const weekAgo = new Date(now);
                weekAgo.setDate(now.getDate() - 7);
                return orderDate >= weekAgo;
            case 'month':
                const monthAgo = new Date(now);
                monthAgo.setMonth(now.getMonth() - 1);
                return orderDate >= monthAgo;
            default:
                return true;
        }
    });
    
    updateStats(filtered);
    displayOrders(filtered);
}

// Update statistics
function updateStats(orders) {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.TotalAmount), 0);
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('total-revenue').textContent = `RM${totalRevenue.toFixed(2)}`;
    document.getElementById('avg-order').textContent = `RM${avgOrder.toFixed(2)}`;
}

// Display orders
function displayOrders(orders) {
    const container = document.getElementById('orders-list');
    
    if (orders.length === 0) {
        container.innerHTML = '<div class="empty-state">📭 No orders found</div>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div class="order-id">Order #${order.OrderID}</div>
                <div class="order-date">${new Date(order.OrderDate).toLocaleString()}</div>
                <div class="order-total">RM${parseFloat(order.TotalAmount).toFixed(2)}</div>
            </div>
            <div class="order-items-preview">
                ${order.ItemCount || 0} item(s) in this order
            </div>
            <div class="order-actions">
                <button class="view-details-btn" onclick="viewOrderDetails(${order.OrderID})">👁️ View Details</button>
                <button class="delete-order-btn" onclick="showDeleteConfirm(${order.OrderID})">🗑️ Delete Order</button>
            </div>
        </div>
    `).join('');
}

// View order details
window.viewOrderDetails = async (orderId) => {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`);
        const data = await response.json();
        
        const modal = document.getElementById('order-modal');
        const detailsDiv = document.getElementById('order-details');
        
        detailsDiv.innerHTML = `
            <div style="padding: 1rem;">
                <p><strong>Order ID:</strong> #${data.order.OrderID}</p>
                <p><strong>Date:</strong> ${new Date(data.order.OrderDate).toLocaleString()}</p>
                <p><strong>Total:</strong> RM${parseFloat(data.order.TotalAmount).toFixed(2)}</p>
                <hr style="margin: 1rem 0; border-color: #d8af81;">
                <h4>Items:</h4>
                ${data.items.map(item => `
                    <div class="order-details-item">
                        <span>${item.ItemName}</span>
                        <span>${item.Quantity} x RM${parseFloat(item.Subtotal / item.Quantity).toFixed(2)} = RM${parseFloat(item.Subtotal).toFixed(2)}</span>
                    </div>
                `).join('')}
                <div class="order-details-total">
                    Total: RM${parseFloat(data.order.TotalAmount).toFixed(2)}
                </div>
            </div>
        `;
        
        modal.classList.add('active');
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to load order details', 'error');
    }
};

// Show delete confirmation
window.showDeleteConfirm = (orderId) => {
    orderToDelete = orderId;
    document.getElementById('delete-modal').classList.add('active');
};

// Confirm delete
window.confirmDelete = async () => {
    if (!orderToDelete) return;
    
    try {
        const response = await fetch(`${API_URL}/orders/${orderToDelete}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast(`Order #${orderToDelete} deleted successfully!`, 'success');
            closeDeleteModal();
            loadOrders(); // Refresh the list
        } else {
            const error = await response.json();
            showToast(error.error || 'Failed to delete order', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Server error. Please try again.', 'error');
    }
};

// Close modals
window.closeOrderModal = () => {
    document.getElementById('order-modal').classList.remove('active');
};

window.closeDeleteModal = () => {
    document.getElementById('delete-modal').classList.remove('active');
    orderToDelete = null;
};

// Refresh orders
window.refreshOrders = () => {
    loadOrders();
    showToast('Refreshing orders...', 'success');
};

// Event listeners
document.getElementById('search-order').addEventListener('input', filterAndDisplayOrders);
document.getElementById('date-filter').addEventListener('change', filterAndDisplayOrders);

// Close modal when clicking outside
document.getElementById('order-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('order-modal')) {
        closeOrderModal();
    }
});

document.getElementById('delete-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('delete-modal')) {
        closeDeleteModal();
    }
});

// Load orders on page load
loadOrders();