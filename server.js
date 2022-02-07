const dotenv = require('dotenv');
const app = require('./app');

dotenv.config({ path: '.env' }); //load environment variables

//console.log(process.env);

//START THE SERVER
const port = process.env.PORT || 8000; //read port from environment if available else use defined port
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
