const express = require('express');
const db = require('./db');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));



// ============ AUTHENTICATION WITH BCRYPT ============
const bcrypt = require('bcrypt');

const handleLogin = (role, redirect) => async (req, res) => {
    const { username, password } = req.body;
    
    db.query('SELECT * FROM employee WHERE Username = ? AND Role = ?', 
        [username, role], 
        async (err, users) => {
            if (err || !users?.length) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            const user = users[0];
            
            // Compare with bcrypt (NOT MD5!)
            const isValid = await bcrypt.compare(password, user.Password);
            
            if (!isValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            const { Password, ...userWithoutPassword } = user;
            res.json({ success: true, user: userWithoutPassword, redirect });
        }
    );
};

app.post('/api/login/cashier', handleLogin('cashier', '/pos.html'));
app.post('/api/login/manager', handleLogin('manager', '/pages/manager.html'));

app.post('/api/register', async (req, res) => {
    const { name, username, password, role } = req.body;
    if (!name || !username || !password || !role) {
        return res.status(400).json({ error: 'All fields required' });
    }
    
    // Hash with bcrypt (NOT MD5!)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.query('INSERT INTO employee (Name, Username, Password, Role) VALUES (?, ?, ?, ?)',
        [name, username, hashedPassword, role],
        (err) => {
            if (err?.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Username exists' });
            }
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ success: true, message: 'User registered successfully' });
        }
    );
});

// ============ MENU ROUTES ============
// ============ MENU ROUTES ============

// Get ONLY available items (for POS)
app.get('/api/menu', (req, res) => {
    db.query('SELECT * FROM menuitem WHERE IsAvailable = 1', (err, results) => {
        err ? res.status(500).json({ error: err.message }) : res.json(results);
    });
});

// Get ALL items including disabled (for Manager)
app.get('/api/menu/all', (req, res) => {
    db.query('SELECT * FROM menuitem ORDER BY ItemID', (err, results) => {
        err ? res.status(500).json({ error: err.message }) : res.json(results);
    });
});

// Add new menu item
app.post('/api/menu', (req, res) => {
    const { name, category, price } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Name and price required' });
    
    db.query('INSERT INTO menuitem (ItemName, Category, Price, IsAvailable) VALUES (?, ?, ?, 1)',
        [name.toUpperCase(), category || 'hot', price],
        (err, result) => err ? res.status(500).json({ error: err.message }) : res.json({ success: true, ItemID: result.insertId })
    );
});

// Update menu item
app.put('/api/menu/:id', (req, res) => {
    const { name, category, price } = req.body;
    db.query('UPDATE menuitem SET ItemName = ?, Category = ?, Price = ? WHERE ItemID = ?',
        [name.toUpperCase(), category, price, req.params.id],
        (err) => err ? res.status(500).json({ error: err.message }) : res.json({ success: true })
    );
});

// Disable menu item
app.put('/api/menu/:id/disable', (req, res) => {
    db.query('UPDATE menuitem SET IsAvailable = 0 WHERE ItemID = ?', [req.params.id], (err) => {
        err ? res.status(500).json({ error: err.message }) : res.json({ success: true });
    });
});

// Enable menu item
app.put('/api/menu/:id/enable', (req, res) => {
    db.query('UPDATE menuitem SET IsAvailable = 1 WHERE ItemID = ?', [req.params.id], (err) => {
        err ? res.status(500).json({ error: err.message }) : res.json({ success: true });
    });
});

// Delete menu item
app.delete('/api/menu/:id', (req, res) => {
    db.query('SELECT COUNT(*) as count FROM orderdetails WHERE ItemID = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result[0].count > 0) return res.status(400).json({ error: 'Cannot delete: Item exists in past orders' });
        
        db.query('DELETE FROM menuitem WHERE ItemID = ?', [req.params.id], (err) => {
            err ? res.status(500).json({ error: err.message }) : res.json({ success: true });
        });
    });
});

// ============ ORDER ROUTES ============
app.post('/api/checkout', (req, res) => {
    const { items, total } = req.body;
    if (!items?.length) return res.status(400).json({ error: 'No items in order' });
    
    db.query('INSERT INTO orders (OrderDate, TotalAmount) VALUES (NOW(), ?)', [total], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const orderId = result.insertId;
        let completed = 0;
        
        items.forEach(item => {
            db.query('SELECT ItemID FROM menuitem WHERE ItemName = ?', [item.name], (err, itemResult) => {
                if (!err && itemResult?.length) {
                    db.query('INSERT INTO orderdetails (OrderID, ItemID, Quantity, Subtotal) VALUES (?, ?, ?, ?)',
                        [orderId, itemResult[0].ItemID, 1, item.price]);
                }
                if (++completed === items.length) res.json({ success: true, orderId });
            });
        });
    });
});

app.get('/api/orders', (req, res) => {
    db.query(`
        SELECT o.OrderID, o.OrderDate, o.TotalAmount, COUNT(od.OrderDetailID) as ItemCount
        FROM orders o LEFT JOIN orderdetails od ON o.OrderID = od.OrderID
        GROUP BY o.OrderID ORDER BY o.OrderDate DESC
    `, (err, results) => err ? res.status(500).json({ error: err.message }) : res.json(results));
});

app.get('/api/orders/:id', (req, res) => {
    db.query('SELECT * FROM orders WHERE OrderID = ?', [req.params.id], (err, order) => {
        if (err || !order?.length) return res.status(500).json({ error: err?.message || 'Order not found' });
        
        db.query(`
            SELECT od.Quantity, od.Subtotal, mi.ItemName
            FROM orderdetails od JOIN menuitem mi ON od.ItemID = mi.ItemID WHERE od.OrderID = ?
        `, [req.params.id], (err, items) => {
            res.json({ order: order[0], items: items || [] });
        });
    });
});

app.delete('/api/orders/:id', (req, res) => {
    db.query('DELETE FROM orderdetails WHERE OrderID = ?', [req.params.id], () => {
        db.query('DELETE FROM orders WHERE OrderID = ?', [req.params.id], (err) => {
            err ? res.status(500).json({ error: err.message }) : res.json({ success: true });
        });
    });
});
// ============ TOP SELLING ITEMS REPORT (WITH DATE FILTER) ============
app.get('/api/top-items', (req, res) => {
    const { startDate, endDate, limit } = req.query;
    
    let query = `
        SELECT 
            mi.ItemName,
            mi.Category,
            mi.Price,
            SUM(od.Quantity) as TotalSold,
            SUM(od.Subtotal) as TotalRevenue
        FROM orderdetails od
        JOIN menuitem mi ON od.ItemID = mi.ItemID
        JOIN orders o ON od.OrderID = o.OrderID
    `;
    
    const params = [];
    
    // Add date filter if provided
    if (startDate && endDate) {
        query += ` WHERE DATE(o.OrderDate) BETWEEN ? AND ?`;
        params.push(startDate, endDate);
    }
    
    query += `
        GROUP BY mi.ItemID
        ORDER BY TotalSold DESC
        LIMIT ?
    `;
    
    params.push(parseInt(limit) || 10);
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error fetching top items:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// ============ SALES STATISTICS (SIMPLIFIED) ============
app.get('/api/sales-stats', (req, res) => {
    const { startDate, endDate } = req.query;
    
    // Get order stats
    let orderQuery = `SELECT COUNT(*) as totalOrders, SUM(TotalAmount) as totalRevenue, AVG(TotalAmount) as avgOrder FROM orders`;
    const params = [];
    
    if (startDate && endDate) {
        orderQuery += ` WHERE DATE(OrderDate) BETWEEN ? AND ?`;
        params.push(startDate, endDate);
    }
    
    db.query(orderQuery, params, (err, orderResults) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: err.message });
        }
        
        // Get total items sold
        let itemsQuery = `SELECT SUM(Quantity) as totalItems FROM orderdetails od JOIN orders o ON od.OrderID = o.OrderID`;
        
        if (startDate && endDate) {
            itemsQuery += ` WHERE DATE(o.OrderDate) BETWEEN ? AND ?`;
        }
        
        db.query(itemsQuery, params, (err2, itemsResults) => {
            if (err2) {
                console.error('Error:', err2);
                return res.status(500).json({ error: err2.message });
            }
            
            res.json({
                totalOrders: orderResults[0]?.totalOrders || 0,
                totalRevenue: parseFloat(orderResults[0]?.totalRevenue) || 0,
                avgOrder: parseFloat(orderResults[0]?.avgOrder) || 0,
                totalItems: itemsResults[0]?.totalItems || 0
            });
        });
    });
});

// ============ USER MANAGEMENT ============

// GET all users
app.get('/api/users', (req, res) => {
    db.query('SELECT EmployeeID, Name, Username, Role FROM employee ORDER BY EmployeeID', (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// UPDATE user
app.put('/api/users/:id', async (req, res) => {
    const { name, role, password } = req.body;
    const userId = req.params.id;
    
    if (password && password.trim() !== '') {
        // Update with new password
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query('UPDATE employee SET Name = ?, Role = ?, Password = ? WHERE EmployeeID = ?',
            [name, role, hashedPassword, userId], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            });
    } else {
        // Update without changing password
        db.query('UPDATE employee SET Name = ?, Role = ? WHERE EmployeeID = ?',
            [name, role, userId], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            });
    }
});

// DELETE user
app.delete('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    
    db.query('DELETE FROM employee WHERE EmployeeID = ?', [userId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true });
    });
});

// ============ START SERVER ============
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    const { networkInterfaces } = require('os');
    Object.values(networkInterfaces()).flat().forEach(net => {
        if (net.family === 'IPv4' && !net.internal) console.log(`📱 http://${net.address}:${PORT}`);
    });
});