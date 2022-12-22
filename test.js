const express = require('express');
const metriker = require('./index');

const app = express();

app.use(express.json())
app.use(metriker({
  callback: (data) => {
    console.log(data);
  }
}));

app.use('/', (request, response) => {
  return response.status(201).json({
    message: Math.random()
  })
})

app.listen(3002, () => console.log('Server running on port 3002'));