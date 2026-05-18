const API_URL = `${window.location.protocol}//${window.location.hostname}:3000/api`;

// Get item ID from URL
const urlParams = new URLSearchParams(window.location.search);
const itemId = urlParams.get('id');

console.log('Edit page loaded. Item ID:', itemId); // Debug log

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Load item details
async function loadItem() {
    console.log('Loading item...'); // Debug log
    
    if (!itemId) {
        console.error('No item ID found in URL');
        showToast('No item ID specified', 'error');
        setTimeout(() => {
            window.location.href = 'manager.html';
        }, 2000);
        return;
    }
    
    try {
        console.log('Fetching menu from:', `${API_URL}/menu`); // Debug log
        const response = await fetch(`${API_URL}/menu`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const items = await response.json();
        console.log('Loaded items:', items); // Debug log
        
        const item = items.find(i => i.ItemID == itemId);
        console.log('Found item:', item); // Debug log
        
        if (!item) {
            console.error('Item not found with ID:', itemId);
            showToast('Item not found', 'error');
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
        
        console.log('Form populated and displayed'); // Debug log
        
    } catch (error) {
        console.error('Error loading item:', error);
        showToast('Failed to load item details: ' + error.message, 'error');
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
        showToast('Please fill in all fields correctly', 'error');
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
            showToast(`✅ "${name}" updated successfully!`, 'success');
            setTimeout(() => {
                window.location.href = 'manager.html';
            }, 1500);
        } else {
            const error = await response.json();
            showToast(error.error || 'Failed to update item', 'error');
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }
    } catch (error) {
        console.error('Save error:', error);
        showToast('Server error. Please try again.', 'error');
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
});

// Load the item when page loads
loadItem();