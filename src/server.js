const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load shared environment variables first
dotenv.config({ path: path.join(__dirname, '../../shared/.env') });
// Load service-specific environment variables (can override shared ones if needed)
dotenv.config();

const userRoutes = require('./routes/userRoutes');
const { KafkaClient, Consumer, Producer } = require('kafka-node');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`USER SERVICE --> Received request for ${req.url}`);
  next();
});
app.use('/api/users', userRoutes);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const kafkaClient = new KafkaClient({ kafkaHost: process.env.KAFKA_BROKER });
const producer = new Producer(kafkaClient);

producer.on('ready', () => {
  console.log('Kafka Producer is connected and ready.');
});

producer.on('error', (err) => {
  console.error('Kafka Producer error:', err);
});

io.on('connection', (socket) => {
  console.log('a user connected');
});

server.listen(process.env.PORT, () => {
  console.log(`User service running on port ${process.env.PORT}`);
});
