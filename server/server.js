// server/server.js
const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

// API 1: Lấy danh sách tất cả các môn học
app.get('/api/subjects', (req, res) => {
  db.all('SELECT * FROM subjects ORDER BY name ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// API 2: Lấy danh sách tài liệu (kèm tên môn học, hỗ trợ tìm kiếm và lọc)
app.get('/api/documents', (req, res) => {
  const { subject_id, search } = req.query;
  let sql = `
    SELECT documents.*, subjects.name AS subject_name 
    FROM documents 
    LEFT JOIN subjects ON documents.subject_id = subjects.id
    WHERE 1=1
  `;
  const params = [];

  if (subject_id && subject_id !== 'all') {
    sql += ` AND documents.subject_id = ?`;
    params.push(subject_id);
  }

  if (search) {
    sql += ` AND (documents.title LIKE ? OR documents.notes LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ` ORDER BY documents.id DESC`;

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// API 3: Thêm mới tài liệu (Create)
app.post('/api/documents', (req, res) => {
  const { title, subject_id, type, link, notes } = req.body;
  if (!title || !subject_id || !link) {
    return res.status(400).json({ error: 'Vui lòng điền đủ: tiêu đề, môn học và link tài liệu.' });
  }

  const sql = `INSERT INTO documents (title, subject_id, type, link, notes) VALUES (?, ?, ?, ?, ?)`;
  db.run(sql, [title, subject_id, type, link, notes], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, message: 'Thêm tài liệu thành công!' });
  });
});

// API 4: Xóa tài liệu (Delete)
app.delete('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM documents WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Xóa tài liệu thành công!' });
  });
});

// Khởi chạy server tại cổng 5000
// API 5: Cập nhật tài liệu (Update)
app.put('/api/documents/:id', (req, res) => {
    const { id } = req.params;
    const { title, subject_id, type, link, notes } = req.body;
  
    if (!title || !subject_id || !link) {
      return res.status(400).json({ error: 'Vui lòng điền đủ: tiêu đề, môn học và link tài liệu.' });
    }
  
    const sql = `
      UPDATE documents 
      SET title = ?, subject_id = ?, type = ?, link = ?, notes = ?
      WHERE id = ?
    `;
  
    db.run(sql, [title, subject_id, type, link, notes, id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Không tìm thấy tài liệu để sửa.' });
      res.json({ message: 'Cập nhật tài liệu thành công!' });
    });
  });
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server API đang chạy tại http://localhost:${PORT}`);
});