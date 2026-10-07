const mongoose = require('mongoose');
const { readConnection, writeConnection } = require('../db');

const bookSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        validate: {
            validator: function (v) {
                // Kiểm tra tiền tố bắt buộc phải là '207' (3 số cuối MSSV)
                return v && v.startsWith('207');
            },
            message: props => `Mã sản phẩm "${props.value}" không hợp lệ! Bắt buộc phải có tiền tố 207 theo MSSV.`
        }
    },
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    priceOriginal: { type: Number, required: true, min: [0, 'Giá gốc phải lớn hơn hoặc bằng 0.'] },
    priceWithVAT: { type: Number } // Giá sau thuế tự động tính
});

// Middleware tự động tính thuế suất VAT = 13% trước khi lưu
bookSchema.pre('save', function () {
    const vatRate = 0.13; // (7 + 6)% = 13%
    const rawPrice = this.priceOriginal * (1 + vatRate);
    this.priceWithVAT = Math.round(rawPrice);
});

// Model đọc gắn với readConnection, Model ghi gắn với writeConnection
const BookReader = readConnection.model('Book', bookSchema);
const BookWriter = writeConnection.model('Book', bookSchema);

module.exports = { BookReader, BookWriter };
