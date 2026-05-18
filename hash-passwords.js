const mysql = require('mysql2');
const bcrypt = require('bcrypt');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'insaynitea_db'
});

// List of users with their plain text passwords
const users = [
    { id: 10, username: 'ahmad', password: 'kopio123' },
    { id: 11, username: 'siti', password: 'tehtarik' },
    { id: 12, username: 'faiz', password: 'milokosong' },   
    { id: 13, username: 'nurul', password: 'kawanku456' },
    { id: 14, username: 'hafiz', password: 'roticanai' },
    { id: 15, username: 'linda', password: 'managerlinda' },
    { id: 16, username: 'rizman', password: 'bossrizman' }
];

// bcrypt settings
const saltRounds = 10;  // This is the standard, secure default

async function hashPasswords() {
    console.log('🔐 Hashing passwords with bcrypt...\n');
    
    for (const user of users) {
        // Hash the password with bcrypt (NOT MD5!)
        const hashedPassword = await bcrypt.hash(user.password, saltRounds);
        
        // Update the database
        db.query('UPDATE employee SET Password = ? WHERE EmployeeID = ?', 
            [hashedPassword, user.id], 
            (err, result) => {
                if (err) {
                    console.error(`❌ Failed for ${user.username}:`, err);
                } else if (result.affectedRows > 0) {
                    console.log(`✅ ${user.username} → ${user.password} hashed with bcrypt`);
                } else {
                    console.log(`⚠️ ${user.username} not found (ID: ${user.id})`);
                }
            }
        );
    }
    
    setTimeout(() => {
        console.log('\n✨ All passwords hashed with bcrypt!');
        console.log('\n📋 bcrypt hashes start with "$2b$" - these are secure!');
        db.end();
    }, 2000);
}

// Run the function
hashPasswords();