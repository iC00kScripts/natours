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
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('DB Connection successful!');
  });

//
// const testTour = new Tour({ //create a new document based on the Tour model
//   name: 'The Park Camper',
//   price: 997
//
// });
//
// testTour.save().then((savedTour) => {
//   console.log(savedTour);
//
// }).catch((err) => {
//   console.log('Error 🧨: ', err);
//
// });

//START THE SERVER
const port = process.env.PORT || 8000; //read port from environment if available else use defined port
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
