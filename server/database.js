// server/database.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./study_docs.db', (err) => {
  if (err) {
    console.error('Lỗi kết nối CSDL:', err.message);
  } else {
    console.log('Đã kết nối thành công CSDL SQLite.');
  }
});

db.serialize(() => {
  // 1. Tạo bảng Môn học
  db.run(`
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);

  // 2. Tạo bảng Tài liệu (có khóa ngoại liên kết tới bảng subjects)
  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      link TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      subject_id INTEGER,
      FOREIGN KEY (subject_id) REFERENCES subjects(id)
    )
  `);

  // 3. Chèn các môn học cơ bản mặc định
  const defaultSubjects = ['Toán', 'Ngữ Văn', 'Tiếng Anh', 'Vật Lý', 'Hóa Học', 'Sinh Học', 'Lịch Sử', 'Địa Lý', 'Tin Học'];
  defaultSubjects.forEach(sub => {
    db.run(`INSERT OR IGNORE INTO subjects (name) VALUES (?)`, [sub]);
  });
});

module.exports = db;