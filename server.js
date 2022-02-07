const app = require('./app');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

console.log(process.env);

//START THE SERVER
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
