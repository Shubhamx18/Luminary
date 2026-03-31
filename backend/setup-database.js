const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  try {
    console.log('🔄 Connecting to MySQL...');
    
    // Connect to MySQL without specifying database first
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Shubham@6024',
      port: 3306
    });

    console.log('✅ Connected to MySQL');

    // Read and execute schema
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🔄 Creating database and tables...');
    
    // Split the SQL file by semicolons and execute each statement
    const statements = schemaSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
        } catch (error) {
          // Ignore errors for statements that might already exist
          if (!error.message.includes('already exists')) {
            console.log('⚠️  Warning:', error.message);
          }
        }
      }
    }

    console.log('✅ Database schema created successfully!');
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  }
}

setupDatabase();
