import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import dns from 'node:dns';
import 'dotenv/config';
import encodeUrl from './encode.js';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 8000;

/* for fcc testing */
//app.use(cors());

const urlMappingSchema = new mongoose.Schema({
  o: {
    type: String,
    unique: true,
    alias: 'originalUrl'
  },
  s: {
    type: String,
    unique: true,
    alias: 'shortUrl'
  }
});

const UrlMapping = mongoose.model('urls', urlMappingSchema);

/* https://stackoverflow.com/a/43467144/16620735 */
function isValidUrl(string) {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}

async function makeShortUrl(originalUrl) {
  if (!isValidUrl(originalUrl))
    throw new Error('invalid url');
  let mapping = await UrlMapping.findOne({o: originalUrl}); 
  if (mapping)
    return mapping.shortUrl;
  const shortUrl = encodeUrl(++lastUrl);
  await new UrlMapping({originalUrl, shortUrl}).save();
  return shortUrl;
}

app.post('/api/shorturl', bodyParser.text({type: '*/*'}), async (req, res, next) => {
  if (!req.body) {
    res.sendStatus(400);
    return;
  }
  const originalUrl = req.body.replace(/^url=/, '');
  makeShortUrl(originalUrl, req.hostname).then(shortUrl => {
    res.json({
      'original_url': originalUrl,
      'short_url': `http://${req.host}/api/shorturl/${shortUrl}`
      //'short_url': shortUrl
    });
  }).catch(e => {
    res.status(400).json({'error': e.message});
  });
});

/* get all existing mappings */
app.get('/api/shorturl/', async (req, res) => {
  const mappings = await UrlMapping.find();
  // TODO: use aggregates
  res.json(mappings.map(({originalUrl, shortUrl, _id}) => {
    return {
      'original_url': originalUrl,
      'short_url': `http://${req.host}/api/shorturl/${shortUrl}`,
      id: _id
    };
  }));
});

/* redirection */
app.get('/api/shorturl/:url', async (req, res) => {
  const mapping = await UrlMapping.findOne({s: req.params.url});
  if (mapping) {
    res.redirect(mapping.originalUrl);
  } else {
    res.sendStatus(404);
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
}

await mongoose.connect(process.env.MONGO_URI);
console.log("Connected to mongodb");
let lastUrl = await UrlMapping.countDocuments();

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
});
