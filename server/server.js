const express = require('express');
const cors  = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const wasteRoutes = require('./routes/wasteRoutes'); 
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const { scheduleDailyReports } = require('./utils/dailyReportScheduler');

// Initialize daily reports scheduler
scheduleDailyReports();


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});
mongoose.connection.on('error', (err) => {
    console.log('Error while connecting to MongoDB', err);
});

const app = express();

// Middlewares  
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);

app.get('/', (req, res) => {
    res.send('Upcycling AI Backend Running Successfully');
});

// Start Server
const PORT = process.env.PORT || 7070;
app.listen(PORT, () => {
    console.log('Server is running on port', PORT);
});