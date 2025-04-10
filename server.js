const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
const corsOptions = {
  origin: 'http://localhost:5173', // Frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Successfully connected to MongoDB Atlas');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Todo Schema
const todoSchema = new mongoose.Schema({
  text: { 
    type: String, 
    required: [true, 'Todo text is required'] 
  },
  completed: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt field before saving
todoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create Todo model
const Todo = mongoose.model('Todo', todoSchema);

// Routes

// GET all todos
app.get('/api/todos', async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      throw new Error('Database not connected');
    }
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ 
      message: 'Error fetching todos',
      error: error.message 
    });
  }
});

// POST new todo
app.post('/api/todos', async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      throw new Error('Database not connected');
    }
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Todo text is required' });
    }
    const todo = new Todo({ text: text.trim() });
    const savedTodo = await todo.save();
    res.status(201).json(savedTodo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ 
      message: 'Error creating todo',
      error: error.message 
    });
  }
});

// PUT update todo
app.put('/api/todos/:id', async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      throw new Error('Database not connected');
    }

    const { id } = req.params;
    const { text, completed } = req.body;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid todo ID' });
    }

    // Find and update the todo
    const updatedTodo = await Todo.findByIdAndUpdate(
      id,
      { 
        text: text.trim(),
        completed: completed,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!updatedTodo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    res.json(updatedTodo);

  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ 
      message: 'Error updating todo',
      error: error.message 
    });
  }
});

// DELETE todo
app.delete('/api/todos/:id', async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      throw new Error('Database not connected');
    }

    const { id } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid todo ID' });
    }

    // Find and delete todo
    const todo = await Todo.findByIdAndDelete(id);
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    res.json({ 
      message: 'Todo deleted successfully',
      deletedTodo: todo 
    });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ 
      message: 'Error deleting todo',
      error: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 