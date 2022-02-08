const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

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

//console.log(process.env);

//START THE SERVER
const port = process.env.PORT || 8000; //read port from environment if available else use defined port
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
