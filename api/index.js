import 'dotenv/config';
import app from '../backend/app.js';
if(!process.env.VERCEL){app.listen(process.env.PORT||5000,()=>console.log('API on http://localhost:'+(process.env.PORT||5000)))}
export default app;
