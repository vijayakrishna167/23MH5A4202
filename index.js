require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const logger = require('./middleware/logger');
const { requestLogger } = require('./middleware/logger');
const urlRoutes = require('./routes/url');

const app = express();

// Connect to Database
connectDB();

// Body Parser Middleware
app.use(bodyParser.json());

// Logging Middleware
app.use(requestLogger);

// Define Routes
app.use('/', urlRoutes); // Handles redirection for shortcodes and API routes

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
