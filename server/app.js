const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/admin', require('./routes/admin'));
app.use('/api/guests', require('./routes/guests'));
app.use('/api/companies', require('./routes/companies'));

// Serve main pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin-login.html'));
});

app.listen(PORT, () => {
    console.log(`MAZ Event App running on http://localhost:${PORT}`);
});