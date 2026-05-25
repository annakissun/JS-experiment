const API_URL = `${window.location.protocol}//${window.location.hostname}:3000/api`;

// ============ LOAD MENU ITEMS ============
async function loadItems() {
    try {
        const response = await fetch(`${API_URL}/menu/all`);
        const items = await response.json();
        const searchTerm = document.getElementById('search').value.toLowerCase();
        
        const filtered = items.filter(item => 
            item.ItemName.toLowerCase().includes(searchTerm)
        );
        
        displayMenuItems(filtered);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('items-list').innerHTML = '<div class="empty-state">❌ Failed to load menu items</div>';
    }
}

// ============ DISPLAY MENU ITEMS ============
function displayMenuItems(items) {
    const container = document.getElementById('items-list');
    
    if (items.length === 0) {
        container.innerHTML = '<div class="empty-state">📭 No menu items found</div>';
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="menu-item-card ${!item.IsAvailable ? 'disabled-item' : ''}">
            <div class="menu-item-info">
                <div class="menu-item-name">
                    ${item.ItemName}
                    ${!item.IsAvailable ? '<span class="badge-disabled">(DISABLED)</span>' : ''}
                </div>
                <div class="menu-item-details">
                    ${item.Category === 'hot' ? '🔥' : '❄️'} ${item.Category || 'hot'} | 
                    Price: <span class="menu-item-price">RM${parseFloat(item.Price).toFixed(2)}</span>
                </div>
            </div>
            <div class="menu-item-actions">
                <button class="edit-btn" onclick="editItem(${item.ItemID})">✏️ Edit</button>
                ${item.IsAvailable ? 
                    `<button class="disable-btn" onclick="toggleItemStatus(${item.ItemID}, true)">🔴 Disable</button>` :
                    `<button class="enable-btn" onclick="toggleItemStatus(${item.ItemID}, false)">🟢 Enable</button>`
                }
                <button class="delete-btn" onclick="deleteItem(${item.ItemID}, '${item.ItemName}')">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

// ============ ADD NEW ITEM ============
document.getElementById('add-btn').onclick = async () => {
    const name = document.getElementById('item-name').value.trim();
    const category = document.getElementById('item-category').value;
    const price = parseFloat(document.getElementById('item-price').value);
    
    if (!name || isNaN(price)) {
        showError('Please fill in all fields correctly');
        return;
    }
    
    const addBtn = document.getElementById('add-btn');
    const originalText = addBtn.textContent;
    addBtn.textContent = 'Adding...';
    addBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}/menu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, category, price })
        });
        
        if (response.ok) {
            showModal({
                icon: '✅',
                title: 'Item Added',
                message: `"${name}" has been added to the menu!`,
                confirmText: 'OK',
                hideCancel: true,
                type: 'success',
                onConfirm: () => {
                    document.getElementById('item-name').value = '';
                    document.getElementById('item-price').value = '';
                    loadItems();
                }
            });
        } else {
            const error = await response.json();
            showError(error.error || 'Failed to add item');
        }
    } catch (error) {
        showError('Server error. Please try again.');
    } finally {
        addBtn.textContent = originalText;
        addBtn.disabled = false;
    }
};

// ============ EDIT ITEM ============
window.editItem = async (id) => {
    try {
        const response = await fetch(`${API_URL}/menu/all`);
        const items = await response.json();
        const item = items.find(i => i.ItemID === id);
        
        if (!item) {
            showError('Item not found');
            return;
        }
        
        // Create modal for editing
        showModal({
            icon: '✏️',
            title: 'Edit Menu Item',
            message: `
                <div class="modal-form">
                    <div class="form-group">
                        <label>Item Name</label>
                        <input type="text" id="edit-name" value="${item.ItemName}" class="modal-input">
                    </div>
                    <div class="form-group">
                        <label>Category</label>
                        <select id="edit-category" class="modal-select">
                            <option value="hot" ${item.Category === 'hot' ? 'selected' : ''}>🔥 Hot</option>
                            <option value="iced" ${item.Category === 'iced' ? 'selected' : ''}>❄️ Iced</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Price (RM)</label>
                        <input type="number" id="edit-price" value="${item.Price}" step="0.01" class="modal-input">
                    </div>
                </div>
            `,
            confirmText: 'Save Changes',
            cancelText: 'Cancel',
            onConfirm: async () => {
                const name = document.getElementById('edit-name').value.trim();
                const category = document.getElementById('edit-category').value;
                const price = parseFloat(document.getElementById('edit-price').value);
                
                if (!name || isNaN(price)) {
                    showError('Please fill in all fields correctly');
                    return;
                }
                
                const response = await fetch(`${API_URL}/menu/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, category, price })
                });
                
                if (response.ok) {
                    showModal({
                        icon: '✅',
                        title: 'Item Updated',
                        message: `"${name}" has been updated successfully!`,
                        confirmText: 'OK',
                        hideCancel: true,
                        type: 'success',
                        onConfirm: () => loadItems()
                    });
                } else {
                    const error = await response.json();
                    showError(error.error || 'Failed to update item');
                }
            }
        });
        
    } catch (error) {
        console.error('Error editing item:', error);
        showError('Failed to load item details');
    }
};

// ============ TOGGLE ITEM STATUS (DISABLE/ENABLE) ============
window.toggleItemStatus = async (itemId, isCurrentlyAvailable) => {
    const action = isCurrentlyAvailable ? 'disable' : 'enable';
    const actionText = isCurrentlyAvailable ? 'disable' : 'enable';
    
    showModal({
        icon: isCurrentlyAvailable ? '🔴' : '🟢',
        title: `${isCurrentlyAvailable ? 'Disable' : 'Enable'} Menu Item`,
        message: `Are you sure you want to ${actionText} this item?${isCurrentlyAvailable ? ' It will be hidden from the POS menu.' : ' It will appear in the POS menu again.'}`,
        confirmText: `Yes, ${actionText}`,
        cancelText: 'Cancel',
        type: isCurrentlyAvailable ? 'warning' : 'success',
        onConfirm: async () => {
            try {
                const response = await fetch(`${API_URL}/menu/${itemId}/${action}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (response.ok) {
                    showModal({
                        icon: '✅',
                        title: 'Success',
                        message: `Item has been ${actionText}d successfully!`,
                        confirmText: 'OK',
                        hideCancel: true,
                        type: 'success',
                        onConfirm: () => loadItems()
                    });
                } else {
                    const error = await response.json();
                    showError(error.error || `Failed to ${action} item`);
                }
            } catch (error) {
                showError('Server error. Please try again.');
            }
        }
    });
};

// ============ DELETE ITEM ============
window.deleteItem = async (id, itemName) => {
    showModal({
        icon: '🗑️',
        title: 'Delete Menu Item',
        message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
        confirmText: 'Yes, Delete',
        cancelText: 'Cancel',
        type: 'danger',
        onConfirm: async () => {
            try {
                const response = await fetch(`${API_URL}/menu/${id}`, { method: 'DELETE' });
                
                if (response.ok) {
                    showModal({
                        icon: '✅',
                        title: 'Item Deleted',
                        message: `"${itemName}" has been deleted from the menu!`,
                        confirmText: 'OK',
                        hideCancel: true,
                        type: 'success',
                        onConfirm: () => loadItems()
                    });
                } else {
                    const error = await response.json();
                    showError(error.error || 'Failed to delete item');
                }
            } catch (error) {
                showError('Server error. Please try again.');
            }
        }
    });
};

// ============ SEARCH ============
document.getElementById('search').addEventListener('input', loadItems);

// ============ LOAD ITEMS ON PAGE LOAD ============
loadItems();