const mongoose = require('mongoose');

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

module.exports = Tour; //export the model