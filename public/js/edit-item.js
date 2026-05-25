const API_URL = `${window.location.protocol}//${window.location.hostname}:3000/api`;

// Get item ID from URL
const urlParams = new URLSearchParams(window.location.search);
const itemId = urlParams.get('id');

console.log('Edit page loaded. Item ID:', itemId);

// Load item details
async function loadItem() {
    console.log('Loading item...');
    
    if (!itemId) {
        showError('No item ID specified');
        setTimeout(() => {
            window.location.href = 'manager.html';
        }, 2000);
        return;
    }
    
    try {
        console.log('Fetching menu from:', `${API_URL}/menu`);
        const response = await fetch(`${API_URL}/menu`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const items = await response.json();
        console.log('Loaded items:', items);
        
        const item = items.find(i => i.ItemID == itemId);
        console.log('Found item:', item);
        
        if (!item) {
            showError('Item not found');
            setTimeout(() => {
                window.location.href = 'manager.html';
            }, 2000);
            return;
        }
        
        // Fill the form with item data
        document.getElementById('edit-name').value = item.ItemName;
        document.getElementById('edit-category').value = item.Category || 'hot';
        document.getElementById('edit-price').value = item.Price;
        document.getElementById('display-item-id').textContent = item.ItemID;
        
        // Hide loading, show form
        document.getElementById('loading-message').style.display = 'none';
        document.getElementById('edit-form').style.display = 'block';
        
        console.log('Form populated and displayed');
        
    } catch (error) {
        console.error('Error loading item:', error);
        showError('Failed to load item details: ' + error.message);
        setTimeout(() => {
            window.location.href = 'manager.html';
        }, 3000);
    }
}

// Save edited item
document.getElementById('edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('edit-name').value.trim();
    const category = document.getElementById('edit-category').value;
    const price = parseFloat(document.getElementById('edit-price').value);
    
    if (!name || isNaN(price)) {
        showError('Please fill in all fields correctly');
        return;
    }
    
    const saveBtn = document.querySelector('.save-btn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}/menu/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, category, price })
        });
        
        if (response.ok) {
            // Use the modal success popup
            showModal({
                icon: '✏️',
                title: 'Item Updated',
                message: `"${name}" has been updated successfully!`,
                confirmText: 'OK',
                hideCancel: true,
                type: 'success',
                onConfirm: () => {
                    window.location.href = 'manager.html';
                }
            });
        } else {
            const error = await response.json();
            showError(error.error || 'Failed to update item');
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }
    } catch (error) {
        console.error('Save error:', error);
        showError('Server error. Please try again.');
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
});

// Load the item when page loads
loadItem();