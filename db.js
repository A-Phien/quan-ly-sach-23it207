const mongoose = require('mongoose');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
require('dotenv').config();

const connectionOptions = {
    tlsAllowInvalidCertificates: true,
    serverSelectionTimeoutMS: 10000
};

function logInitialConnection(connection, name) {
    connection.asPromise().catch((err) => {
        console.error(`Không thể khởi tạo kết nối ${name}:`, err.message);
    });
}

// Kết nối tài khoản đọc (Reader)
const readConnection = mongoose.createConnection(process.env.MONGODB_URI_READER, connectionOptions);
readConnection.on('connected', () => console.log('Đã kết nối thành công với tài khoản Reader!'));
readConnection.on('error', (err) => console.error('Lỗi kết nối Reader:', err));
logInitialConnection(readConnection, 'Reader');

// Kết nối tài khoản ghi (Writer)
const writeConnection = mongoose.createConnection(process.env.MONGODB_URI_WRITER, connectionOptions);
writeConnection.on('connected', () => console.log('Đã kết nối thành công với tài khoản Writer!'));
writeConnection.on('error', (err) => console.error('Lỗi kết nối Writer:', err));
logInitialConnection(writeConnection, 'Writer');

module.exports = { readConnection, writeConnection };
