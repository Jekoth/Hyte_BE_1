console.log('RUNNING src/index.js');
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import itemRouter from './routes/item-router.js';
import userRouter from './routes/user-router.js';
import requestLogger from './middlewares/logger.js';
import entryRouter from './routes/entry-router.js';
import authRouter from './routes/auth-router.js';
import mealRouter from './routes/meal-router.js';

const hostname = '127.0.0.1';
const app = express();
const port = 3000;

// enable CORS requests
app.use(
  cors({
    origin: ['http://127.0.0.1:5173', 'http://localhost:5173'],
    credentials: true,
  })
);
// Parsitaan cookie header ja lisätään request-objektiin
app.use(cookieParser());
// parsitaan json data pyynnöstä ja lisätään request-objektiin
app.use(express.json());

// Authentication routes
app.use('/api/auth', authRouter);
// Meal routes
app.use('/api/meals', mealRouter);
// tarjoillaan webbisivusto (front-end) palvelimen juuressa
app.use('/', express.static('public'));
// Oma loggeri middleware, käytössä koko sovelluksen laajuisesti eli käsittee kaikki http-pyynnöt
app.use(requestLogger);

// Testi endpoint
app.get('/api', (req, res) => {
  res.send('Teacher example Health Diary API!');
});

// Users resource router for all /api/users routes
app.use('/api/users', userRouter);
// Diary entries resource router
app.use('/api/entries', entryRouter);
// Dummy items resource
app.use('/api/items', itemRouter);

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
