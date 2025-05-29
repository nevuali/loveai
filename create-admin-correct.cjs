const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Database path - backend'in kullandığı database
const dbPath = './database/cappalove.db';
const dbDir = path.dirname(dbPath);

// Ensure directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log('🔍 Database path:', dbPath);
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Create admin_users table (backend'in kullandığı tablo)
  db.run(`CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
  )`, (err) => {
    if (err) {
      console.error('❌ Table creation error:', err);
    } else {
      console.log('✅ Admin_users table created');
      
      // Create admin user with bcryptjs (backend'in kullandığı)
      const adminEmail = 'admin@cappalove.com';
      const adminPassword = 'admin123';
      
      bcrypt.hash(adminPassword, 12, (err, hashedPassword) => {
        if (err) {
          console.error('❌ Hash error:', err);
          return;
        }
        
        console.log('🔐 Creating admin with hash length:', hashedPassword.length);
        
        db.run(`INSERT OR REPLACE INTO admin_users (id, username, email, password_hash, role, is_active) 
                VALUES (1, 'admin', ?, ?, 'admin', 1)`, 
                [adminEmail, hashedPassword], 
                function(err) {
          if (err) {
            console.error('❌ Admin creation error:', err);
          } else {
            console.log('✅ Admin user created successfully!');
            
            // Test the password
            db.get('SELECT * FROM admin_users WHERE email = ?', [adminEmail], (err, row) => {
              if (row) {
                console.log('📧 Found admin:', row.email);
                bcrypt.compare(adminPassword, row.password_hash, (err, isValid) => {
                  console.log('🔐 Password test:', isValid ? 'SUCCESS ✅' : 'FAILED ❌');
                  console.log('🎯 Admin login ready: admin@cappalove.com / admin123');
                  console.log('🔧 Backend will use admin_users table');
                  db.close();
                });
              } else {
                console.log('❌ Admin not found after creation');
                db.close();
              }
            });
          }
        });
      });
    }
  });
}); 