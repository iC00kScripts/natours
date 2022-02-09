//THIS IS AN INDEPENDENT SCRIPT USED TO IMPORT DEV DATA FROM THE JSON FILE INTO THE MONGODB DATABASE RUNNING ON ATLAS
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');

dotenv.config({ path: `${__dirname}/../../.env` }); //load environment variables

//initialize the database using the environment variables.
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DB_PASSWORD);

console.log('Connecting to remote database');

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

//READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'));

//IMPORT DATA INTO THE DATABASE
const importData = async () => {
  await Tour.create(tours); //this takes the tours array and creates a document for each tours present
  console.log('Data Successfully loaded!');
};

// DELETE ALL DATA FROM db
const deleteData = async () => {
  await Tour.deleteMany();
  console.log('Data deleted successfully!');
};

(async () => {
  try {
    await mongoose.connect(DB, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true
    });
    if (process.argv[2] === '--delete') {
      await deleteData();
    } else if (process.argv[2] === '--import') {
      await importData();
    } else {
      console.log('Please specify \'--import\' or \'--delete\'');
    }
  } catch (err) {
    console.log(err);
  }
  await mongoose.disconnect();
})();