const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;

// Kết nối tới MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'tho300802@',
  database: 'api_cau3',
  port: 3306
});

// Kết nối tới MySQL
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('MySQL connected...');
});

// Sử dụng body-parser middleware
app.use(bodyParser.json());

// Đăng ký
app.post('/register', (req, res) => {
  const { name, password, email, phone, address, birth_date } = req.body;
  // Kiểm tra xem email đã tồn tại chưa
  db.query('SELECT * FROM user WHERE email = ?', [email], (err, result) => {
    if (err) {
      throw err;
    }
    if (result.length > 0) {
      res.status(409).json({ message: 'Email đã tồn tại' });
    } else {
      // Thêm người dùng vào cơ sở dữ liệu
      db.query('INSERT INTO user (name, password, email, phone, address, birth_date, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [name, password, email, phone, address, birth_date],
        (err, result) => {
          if (err) {
            throw err;
          }
          res.status(201).json({ message: 'đăng kí thành công ' });
        });
    }
  });
});

// Đăng nhập
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  // Xác thực thông tin đăng nhập
  db.query('SELECT * FROM user WHERE email = ? AND password = ?', [email, password], (err, result) => {
    if (err) {
      throw err;
    }
    if (result.length > 0) {
      // Tạo JWT
      const token = jwt.sign({ email }, 'your_secret_key', { expiresIn: '1h' });
      res.status(200).json({ token });
    } else {
      res.status(401).json({ message: 'lỗi' });
    }
  });
});

// Sửa thông tin cá nhân
app.put('/profile', verifyToken, (req, res) => {
  const { name, phone, address, birth_date } = req.body;
  jwt.verify(req.token, 'your_secret_key', (err, authData) => {
    if (err) {
      res.status(403).json({ message: 'Forbidden' });
    } else {
      // Cập nhật thông tin cá nhân
      db.query('UPDATE user SET name = ?, phone = ?, address = ?, birth_date = ? WHERE email = ?',
        [name, phone, address, birth_date, authData.email],
        (err, result) => {
          if (err) {
            throw err;
          }
          res.status(200).json({ message: 'thông tin đã được cập nhật' });
        });
    }
  });
});

// Middleware xác thực token
function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization'];
  if (typeof bearerHeader !== 'undefined') {
    const bearerToken = bearerHeader.split(' ')[1];
    req.token = bearerToken;
    next();
  } else {
    res.status(403).json({ message: 'Forbidden' });
  }
}

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
