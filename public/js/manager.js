const API_URL = `${window.location.protocol}//${window.location.hostname}:3000/api`;

// Load and display menu items
async function loadItems() {
    try {
        const response = await fetch(`${API_URL}/menu`);
        const items = await response.json();
        
        const searchTerm = document.getElementById('search').value.toLowerCase();
        const filtered = items.filter(item => 
            item.ItemName.toLowerCase().includes(searchTerm)
        );
        
        const container = document.getElementById('items-list');
        
        if (filtered.length === 0) {
            container.innerHTML = '<p style="text-align:center;">No items found</p>';
            return;
        }
        
        container.innerHTML = filtered.map(item => `
            <div class="menu-item-card">
                <div>
                    <strong>${item.ItemName}</strong><br>
                    <small>${item.Category || 'hot'} | RM${parseFloat(item.Price).toFixed(2)}</small>
                </div>
                <div>
                    <button class="edit-btn" onclick="window.location.href='edit-item.html?id=${item.ItemID}'">Edit</button>
                    <button class="delete-btn" onclick="deleteItem(${item.ItemID})">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error:', error);
    }
}

// Add new item
document.getElementById('add-btn').onclick = async () => {
    const name = document.getElementById('item-name').value.trim();
    const category = document.getElementById('item-category').value;
    const price = parseFloat(document.getElementById('item-price').value);
    
    if (!name || isNaN(price)) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/menu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, category, price })
        });
        
        if (response.ok) {
            alert(`"${name}" added!`);
            document.getElementById('item-name').value = '';
            document.getElementById('item-price').value = '';
            loadItems();
        } else {
            alert('Failed to add item');
        }
    } catch (error) {
        alert('Server error');
    }
};

// Edit item
window.editItem = async (id) => {
    const newName = prompt('Enter new name:');
    if (!newName) return;
    
    const newPrice = parseFloat(prompt('Enter new price:'));
    if (isNaN(newPrice)) return;
    
    const newCategory = prompt('Enter category (hot/iced):', 'hot');
    
    try {
        const response = await fetch(`${API_URL}/menu/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name: newName, 
                category: newCategory || 'hot', 
                price: newPrice 
            })
        });
        
        if (response.ok) {
            alert('Item updated!');
            loadItems();
        } else {
            alert('Failed to update');
        }
    } catch (error) {
        alert('Server error');
    }
};

// Delete item
window.deleteItem = async (id) => {
    if (!confirm('Delete this item?')) return;
    
    try {
        const response = await fetch(`${API_URL}/menu/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Item deleted!');
            loadItems();
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to delete');
        }
    } catch (error) {
        alert('Server error');
    }
};

// Search functionality
document.getElementById('search').addEventListener('input', loadItems);

// Load items on page load
loadItems();