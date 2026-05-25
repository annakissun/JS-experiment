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
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');
    
    // Set content
    icon.innerHTML = options.icon || '❓';
    title.textContent = options.title || 'Confirm Action';
    message.textContent = options.message || 'Are you sure?';
    confirmBtn.textContent = options.confirmText || 'OK';
    cancelBtn.textContent = options.cancelText || 'Cancel';
    
    // Set button styles
    if (options.type === 'danger') {
        confirmBtn.className = 'modal-btn modal-btn-danger';
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
    
    newCancelBtn.onclick = () => {
        closeModal();
        if (options.onCancel) options.onCancel();
    };
    
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

// Quick preset functions
function confirmLogout(callback) {
    showModal({
        icon: '🚪',
        title: 'Logout Confirmation',
        message: 'Are you sure you want to logout?',
        confirmText: 'Yes, Logout',
        cancelText: 'Cancel',
        onConfirm: callback,
        onCancel: () => {}
    });
}

function confirmDelete(itemName, callback) {
    showModal({
        icon: '🗑️',
        title: 'Delete Confirmation',
        message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
        confirmText: 'Yes, Delete',
        cancelText: 'Cancel',
        type: 'danger',
        onConfirm: callback
    });
}

function showSuccess(message, callback) {
    showModal({
        icon: '✅',
        title: 'Success!',
        message: message,
        confirmText: 'OK',
        cancelText: '',
        type: 'success',
        onConfirm: callback
    });
    // Hide cancel button for success messages
    setTimeout(() => {
        const cancelBtn = document.getElementById('modal-cancel');
        if (cancelBtn) cancelBtn.style.display = 'none';
    }, 50);
}

function showError(message) {
    showModal({
        icon: '❌',
        title: 'Error',
        message: message,
        confirmText: 'OK',
        cancelText: '',
        type: 'danger',
        onConfirm: () => {}
    });
    setTimeout(() => {
        const cancelBtn = document.getElementById('modal-cancel');
        if (cancelBtn) cancelBtn.style.display = 'none';
    }, 50);
}

function showInfo(title, message, callback) {
    showModal({
        icon: 'ℹ️',
        title: title,
        message: message,
        confirmText: 'OK',
        cancelText: '',
        onConfirm: callback
    });
    setTimeout(() => {
        const cancelBtn = document.getElementById('modal-cancel');
        if (cancelBtn) cancelBtn.style.display = 'none';
    }, 50);
}