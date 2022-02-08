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

const tourSchema = new mongoose.Schema({ //Creating the Tour Schema in Mongoose

  name: {
    type: String,
    required: [true, 'A Tour must have a name'],
    unique: true
  },

  rating: {
    type: Number,
    default: 4.5
  },

  price: {
    type: Number,
    required: [true, 'A tour must have a price']
  }

});

const Tour = mongoose.model('Tour', tourSchema); //creating the model based on the defined schema

const testTour = new Tour({ //create a new document based on the Tour model
  name: 'The Park Camper',
  price: 997

});

testTour.save().then((savedTour) => {
  console.log(savedTour);

}).catch((err) => {
  console.log('Error 🧨: ', err);

});

//START THE SERVER
const port = process.env.PORT || 8000; //read port from environment if available else use defined port
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
