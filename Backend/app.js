import express from 'express';
import dotenv from 'dotenv';
import connectDB from './src/config/DB.js';  // Import DB connection

dotenv.config();  // Load environment variables
connectDB();  // Connect to MongoDB

const app = express();
app.use(express.json());

// Default route
app.get('/', (req, res) => {
    res.send('Backend is running...');
});

// Use port from .env or default to 5000
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
