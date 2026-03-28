require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use('/api/event-types', require('./routes/eventTypes'));
app.use('/api/availability', require('./routes/availability'));
app.use('/api/bookings',     require('./routes/bookings'));
app.use('/api/meetings',     require('./routes/meetings'));
app.use('/api/questions', require('./routes/questions'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));