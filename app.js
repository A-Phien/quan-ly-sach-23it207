const express = require('express');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const path = require('path');
require('dotenv').config();
const { readConnection, writeConnection } = require('./db');
const { BookReader, BookWriter } = require('./models/Book');

const app = express();

// Cấu hình View Engine là Handlebars (hbs)
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Cấu hình Stateless Session lưu trực tiếp trên MongoDB Atlas
app.use(session({
    name: 'book.sid',
    secret: process.env.SESSION_SECRET || 'bi_mat_207',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        client: writeConnection.getClient()
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// Middleware truyền biến chung cho Footer (Họ tên, MSSV, VAT) vào mọi trang Handlebars
app.use((req, res, next) => {
    res.locals.footerInfo = {
        fullName: 'A Phiên',
        mssv: '23IT207',
        vatRate: '13%'
    };
    next();
});

function getBookFormError(err) {
    if (err?.code === 11000) {
        return 'Mã sản phẩm đã tồn tại. Vui lòng nhập mã khác bắt đầu bằng 207.';
    }

    if (err?.name === 'ValidationError') {
        return Object.values(err.errors).map(error => error.message).join(' ');
    }

    return err.message || 'Không thể thêm sách. Vui lòng kiểm tra lại dữ liệu.';
}

function formatBooks(books) {
    return books.map(book => ({
        ...book,
        priceWithVAT: Math.round(book.priceWithVAT)
    }));
}

async function getBooks() {
    const model = readConnection.readyState === 1 ? BookReader : BookWriter;
    return model.find({}).lean();
}

// Route ĐỌC: Lấy danh sách sách (Sử dụng kết nối READER)
app.get('/', async (req, res) => {
    try {
        const books = await getBooks();
        res.render('index', {
            books: formatBooks(books),
            successMessage: req.query.success ? 'Thêm sách thành công!' : null
        });
    } catch (err) {
        res.status(500).send('Lỗi hệ thống khi tải danh sách: ' + err.message);
    }
});

// Route GHI: Thêm mới sách (Sử dụng kết nối WRITER)
app.post('/add-book', async (req, res) => {
    try {
        const productId = String(req.body.productId || '').trim();
        const title = String(req.body.title || '').trim();
        const author = String(req.body.author || '').trim();
        const priceOriginal = Number(req.body.priceOriginal);

        const newBook = new BookWriter({
            productId,
            title,
            author,
            priceOriginal
        });

        await newBook.save();
        res.redirect('/?success=1');
    } catch (err) {
        console.error('Lỗi thêm sách:', err);

        let books = [];
        try {
            books = await getBooks();
        } catch (readErr) {
            console.error('Không thể tải danh sách sách sau khi thêm lỗi:', readErr);
        }

        res.status(200).render('index', {
            books: formatBooks(books),
            errorMessage: getBookFormError(err),
            formData: req.body
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Hệ thống đang chạy phăng phăng tại cổng ${PORT}`);
});
