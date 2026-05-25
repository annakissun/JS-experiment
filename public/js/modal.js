// ========================================
// INSAYNITEA MODAL POPUP SYSTEM
// ========================================

// Create modal HTML dynamically
function createModal() {
    if (document.getElementById('insaynitea-modal')) return;
    
    const modalHTML = `
        <div id="insaynitea-modal" class="modal-overlay">
            <div class="modal-container">
                <div class="modal-header">
                    <div class="modal-icon" id="modal-icon">❓</div>
                    <h3 id="modal-title">Confirm Action</h3>
                </div>
                <div class="modal-body">
                    <p id="modal-message">Are you sure?</p>
                </div>
                <div class="modal-footer" id="modal-buttons">
                    <button class="modal-btn modal-btn-cancel" id="modal-cancel">Cancel</button>
                    <button class="modal-btn modal-btn-confirm" id="modal-confirm">OK</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Show modal with custom options
function showModal(options) {
    createModal();
    
    const modal = document.getElementById('insaynitea-modal');
    const icon = document.getElementById('modal-icon');
    const title = document.getElementById('modal-title');
    const message = document.getElementById('modal-message');
    let confirmBtn = document.getElementById('modal-confirm');
    let cancelBtn = document.getElementById('modal-cancel');
    
    // Set content
    icon.innerHTML = options.icon || '❓';
    title.textContent = options.title || 'Confirm Action';
    message.textContent = options.message || 'Are you sure?';
    confirmBtn.textContent = options.confirmText || 'OK';
    
    // Handle cancel button visibility
    if (options.cancelText === '' || options.hideCancel) {
        cancelBtn.style.display = 'none';
    } else {
        cancelBtn.style.display = 'block';
        cancelBtn.textContent = options.cancelText || 'Cancel';
    }
    
    // Set button styles
    if (options.type === 'danger') {
        confirmBtn.className = 'modal-btn modal-btn-danger';
    } else if (options.type === 'success') {
        confirmBtn.className = 'modal-btn modal-btn-confirm';
    } else {
        confirmBtn.className = 'modal-btn modal-btn-confirm';
    }
    
    // Remove old listeners and add new ones
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    
    // Add event listeners
    newConfirmBtn.onclick = () => {
        closeModal();
        if (options.onConfirm) options.onConfirm();
    };
    
    if (!options.hideCancel) {
        newCancelBtn.onclick = () => {
            closeModal();
            if (options.onCancel) options.onCancel();
        };
    }
    
    // Close on overlay click
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeModal();
            if (options.onCancel) options.onCancel();
        }
    };
    
    // Show modal
    modal.classList.add('active');
}

// Close modal
function closeModal() {
    const modal = document.getElementById('insaynitea-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// ============ CRUD CONFIRMATION FUNCTIONS ============

// 1. LOGOUT
function confirmLogout() {
    const isInSubfolder = window.location.pathname.includes('/pages/');
    const logoutPath = isInSubfolder ? '../index.html' : 'index.html';
    
    showModal({
        icon: '🚪',
        title: 'Logout Confirmation',
        message: 'Are you sure you want to logout?',
        confirmText: 'Yes, Logout',
        cancelText: 'Cancel',
        onConfirm: () => {
            sessionStorage.clear();
            window.location.href = logoutPath;
        }
    });
}

// 2. DELETE MENU ITEM
function confirmDeleteMenuItem(itemName, onConfirm) {
    showModal({
        icon: '🗑️',
        title: 'Delete Menu Item',
        message: `Are you sure you want to delete "${itemName}" from the menu? This action cannot be undone.`,
        confirmText: 'Yes, Delete',
        cancelText: 'Cancel',
        type: 'danger',
        onConfirm: onConfirm
    });
}

// 3. EDIT MENU ITEM (just notification, no confirmation needed usually)
function notifyEditSuccess(itemName) {
    showModal({
        icon: '✏️',
        title: 'Item Updated',
        message: `"${itemName}" has been updated successfully!`,
        confirmText: 'OK',
        hideCancel: true,
        type: 'success'
    });
}

// 4. ADD MENU ITEM SUCCESS
function notifyAddSuccess(itemName) {
    showModal({
        icon: '✅',
        title: 'Item Added',
        message: `"${itemName}" has been added to the menu!`,
        confirmText: 'OK',
        hideCancel: true,
        type: 'success'
    });
}

// 5. DELETE USER
function confirmDeleteUser(userName, onConfirm) {
    showModal({
        icon: '👤',
        title: 'Delete User',
        message: `Are you sure you want to delete "${userName}"? This action cannot be undone.`,
        confirmText: 'Yes, Delete',
        cancelText: 'Cancel',
        type: 'danger',
        onConfirm: onConfirm
    });
}

// 6. EDIT USER SUCCESS
function notifyEditUserSuccess(userName) {
    showModal({
        icon: '✏️',
        title: 'User Updated',
        message: `"${userName}" has been updated successfully!`,
        confirmText: 'OK',
        hideCancel: true,
        type: 'success'
    });
}

// 7. ADD USER SUCCESS
function notifyAddUserSuccess(userName) {
    showModal({
        icon: '✅',
        title: 'User Added',
        message: `"${userName}" has been registered successfully!`,
        confirmText: 'OK',
        hideCancel: true,
        type: 'success'
    });
}

// 8. DELETE ORDER
function confirmDeleteOrder(orderId, onConfirm) {
    showModal({
        icon: '🧾',
        title: 'Delete Order',
        message: `Are you sure you want to delete Order #${orderId}? This action cannot be undone.`,
        confirmText: 'Yes, Delete',
        cancelText: 'Cancel',
        type: 'danger',
        onConfirm: onConfirm
    });
}

// 9. CHECKOUT SUCCESS
function notifyCheckoutSuccess(orderId, total, onConfirm) {
    showModal({
        icon: '🧾',
        title: 'Order Completed!',
        message: `Order #${orderId} completed!\nTotal: RM${total.toFixed(2)}`,
        confirmText: 'Print Receipt',
        cancelText: 'Close',
        onConfirm: onConfirm
    });
}

// 10. GENERIC SUCCESS
function showSuccess(message, onConfirm) {
    showModal({
        icon: '✅',
        title: 'Success!',
        message: message,
        confirmText: 'OK',
        hideCancel: true,
        type: 'success',
        onConfirm: onConfirm
    });
}

// 11. GENERIC ERROR
function showError(message) {
    showModal({
        icon: '❌',
        title: 'Error',
        message: message,
        confirmText: 'OK',
        hideCancel: true,
        type: 'danger'
    });
}

// 12. GENERIC CONFIRMATION
function showConfirmation(title, message, onConfirm, onCancel) {
    showModal({
        icon: '⚠️',
        title: title,
        message: message,
        confirmText: 'Yes',
        cancelText: 'No',
        onConfirm: onConfirm,
        onCancel: onCancel
    });
}