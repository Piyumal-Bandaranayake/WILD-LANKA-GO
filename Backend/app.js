import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';    
import connectDB from './src/config/DB.js';

dotenv.config();
connectDB();    

const app= express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('MongoDB Connected');       
}).catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
});
app.get('/', (req, res) => {
    res.send('Backend is running...');
}); 

const port = process.env.Port || 5000;
app.listen(port, () => {    
    console.log(`Server running on port ${port}`);
}   );

