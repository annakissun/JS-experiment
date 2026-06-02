const mysql = require('mysql2');
const bcrypt = require('bcrypt');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'insaynitea_db'
});

const users = [
    { username: 'fahmi', password: 'fahmi123' },
    { username: 'linda', password: 'linda123' },
    { username: 'rizman', password: 'rizman123' },
    { username: 'ahmad', password: 'ahmad123' },
    { username: 'siti', password: 'siti123' },
    { username: 'faiz', password: 'faiz123' },
    { username: 'nurul', password: 'nurul123' },
    { username: 'hafiz', password: 'hafiz123' },
    { username: 'aika', password: 'aika123' }
];

async function hashPasswords() {
    console.log('🔐 Hashing passwords...\n');
    
    for (const user of users) {
        const hashed = await bcrypt.hash(user.password, 10);
        db.query('UPDATE employee SET Password = ? WHERE Username = ?', [hashed, user.username], (err) => {
            if (err) console.error(`❌ Failed for ${user.username}`);
            else console.log(`✅ ${user.username} → hashed`);
        });
    }
    
    setTimeout(() => {
        console.log('\n✨ All passwords hashed!');
        db.end();
    }, 2000);
}

hashPasswords();