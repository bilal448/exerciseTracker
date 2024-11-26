const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

// In-memory storage for users and exercises
const users = [];
const exercises = [];

// Serve HTML
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Create a new user
app.post('/api/users', (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const newUser = { _id: String(users.length + 1), username };
  users.push(newUser);
  res.json(newUser);
});

// Get all users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// Add an exercise for a user
app.post('/api/users/:_id/exercises', (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  const user = users.find((u) => u._id === _id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!description || !duration) {
    return res.status(400).json({ error: 'Description and duration are required' });
  }

  const exerciseDate = date ? new Date(date) : new Date();
  if (isNaN(exerciseDate)) {
    return res.status(400).json({ error: 'Invalid date' });
  }

  const exercise = {
    _id,
    description,
    duration: parseInt(duration),
    date: exerciseDate.toDateString(),
  };
  exercises.push(exercise);

  res.json({
    username: user.username,
    _id: user._id,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date,
  });
});

// Get a user's exercise log
app.get('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  const user = users.find((u) => u._id === _id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let userExercises = exercises.filter((e) => e._id === _id);

  // Filter by date range
  if (from) {
    const fromDate = new Date(from);
    if (!isNaN(fromDate)) {
      userExercises = userExercises.filter((e) => new Date(e.date) >= fromDate);
    }
  }

  if (to) {
    const toDate = new Date(to);
    if (!isNaN(toDate)) {
      userExercises = userExercises.filter((e) => new Date(e.date) <= toDate);
    }
  }

  // Apply limit
  if (limit) {
    userExercises = userExercises.slice(0, parseInt(limit));
  }

  res.json({
    username: user.username,
    _id: user._id,
    count: userExercises.length,
    log: userExercises.map((e) => ({
      description: e.description,
      duration: e.duration,
      date: e.date,
    })),
  });
});

// Start server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
