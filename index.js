import express from 'express';
import route from './Routes/index.js';
import cors from 'cors';
import path from 'path';


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());  
app.use(express.json()); // รองรับ JSON
app.use('/api', route); // เรียก route index.js

app.use('/Photo', express.static(path.join(process.cwd(), 'Database', 'Photo')));

app.get('/', (req, res) => {
  res.send('Hello, Express!!!');
});

app.listen(PORT, () => {
  console.log(`Server is Running at http://localhost:${PORT}`);
});
