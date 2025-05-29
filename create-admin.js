const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Database path
const dbPath = './database/cappalove.db';
const dbDir = path.dirname(dbPath);

// Ensure directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log('🔍 Database path:', dbPath);
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Create users table for admin
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    name TEXT,
    surname TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('❌ Table creation error:', err);
    } else {
      console.log('✅ Users table created');
      
      // Create admin user
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      console.log('🔐 Creating admin with hash length:', hashedPassword.length);
      
      db.run(`INSERT OR REPLACE INTO users (id, email, password, role, name, surname) 
              VALUES (1, 'admin@cappalove.com', ?, 'admin', 'Admin', 'User')`, 
              [hashedPassword], 
              function(err) {
        if (err) {
          console.error('❌ Admin creation error:', err);
        } else {
          console.log('✅ Admin user created successfully!');
          
          // Test the password
          db.get('SELECT * FROM users WHERE email = ?', ['admin@cappalove.com'], (err, row) => {
            if (row) {
              console.log('📧 Found admin:', row.email);
              const isValid = bcrypt.compareSync('admin123', row.password);
              console.log('🔐 Password test:', isValid ? 'SUCCESS ✅' : 'FAILED ❌');
              console.log('🎯 Admin login ready: admin@cappalove.com / admin123');
            } else {
              console.log('❌ Admin not found after creation');
            }
            db.close();
          });
        }
      });
    }
  });
}); 