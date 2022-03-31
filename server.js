const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception. Shutting Down');
  console.log(err.toString());

  process.exit(1); //uncaught exception
});

dotenv.config({ path: '.env' }); //load environment variables

//initialize the database using the environment variables.
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DB_PASSWORD);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB Connection successful!');
  });

//START THE SERVER
const port = process.env.PORT || 8000; //read port from environment if available else use defined port
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

//listening for a unhandledRejection event globally
process.on('unhandledRejection', (err) => {
  console.log('Unhandled REJECTION. Shutting Down');
  console.log(err.toString());

  //close the server gracefully
  server.close(() => {
    process.exit(1); //uncaught exception
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('Process Terminated!');
  });
});
