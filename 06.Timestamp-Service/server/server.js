const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8000; 

app.use(cors());
app.use('/', express.static(__dirname + '/../build'));

function formatTime(time) {
  let date = null;
  if (time === 'now') {
    date = new Date();
  } else if (time.match(/^\d+$/)) {
    date = new Date(parseInt(time));
  } else {
    date = new Date(time);
  }
  if (date.toString() === 'Invalid Date')
    return {error: 'Invalid Date'};
  return {unix: date.getTime(), utc: date.toUTCString()};
}

app.get('/api', function (req, res) {
  res.json(formatTime('now'));
});

app.get('/api/:time', function (req, res) {
  res.json(formatTime(req.params.time));
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
});
