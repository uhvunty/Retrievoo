import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
const app=express();app.use(cors());app.use(express.json({limit:'32kb'}));
app.get('/api/health',(req,res)=>res.json({ok:true}));
app.use('/api/auth',authRoutes);app.use('/api/items',itemRoutes);
app.use((err,req,res,next)=>{console.error(err);if(err.code==='LIMIT_FILE_SIZE')return res.status(413).json({error:'Image must be under 3 MB'});res.status(500).json({error:'Server error'});});
export default app;
