const express = require('express');

const app = express();

const port = 3000;

//ROUTES

app.get('/', (req, res) => {
  res.json({ message: 'Hello from the Server side', app: 'Natours' });
});

app.post('/', (req, res) => {
  res.send('You can post to this endpoint');
});

//START THE APP
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
