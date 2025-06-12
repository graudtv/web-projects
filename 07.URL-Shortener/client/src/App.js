import './App.css';
import { useState } from 'react';

import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

const App = () => {
  const [mappings, setMappings] = useState([]);
  const [originalUrl, setOriginalUrl] = useState('http://example.com');
  const [shortUrl, setShortUrl] = useState(null);
  const [error, setError] = useState(null);

  const loadMappings = () => {
    fetch('/api/shorturl').then(res => res.json()).then(data => setMappings(data));
  };

  const items = mappings.map(({original_url, short_url, id}) => {
    return (
      <li key={id}>
        <a href={short_url}>{short_url}</a> -> <a href={original_url}>{original_url}</a>
      </li>
    );
  });

  const handleOriginalUrlUpdate = (e) => {
    setOriginalUrl(e.target.value);
    setShortUrl(null);
    setError(null);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setShortUrl(null);
    try {
      const res = await fetch('/api/shorturl', {method: 'POST', body: originalUrl});
      if (!res.ok) {
        setError(res.text());
        return;
      }
      const data = await res.json();
      if (data.short_url)
        setShortUrl(data.short_url);
      else if (data.error)
        setError(data.error);
      else
        setError('unknown error');
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Container>
      <h1 className="my-3">URL shortener</h1>
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md>
            <Form.Control type="text" placeholder="Enter URL" value={originalUrl} onChange={handleOriginalUrlUpdate}/>
          </Col>
          <Col sm="auto">
            <Button className="w-100" variant="primary" type="submit">
              Shorten URL
            </Button>
          </Col>
        </Row>
      </Form>
      {shortUrl ? <p className="my-3 text-center">Your Short URL: <a href={shortUrl} target="_blank">{shortUrl}</a></p> : ''}
      {error ? <p className="my-3 text-center text-danger">Error: {error}</p> : ''}
      {/*
      <hr />
      <Button onClick={loadMappings}>Show url mappings</Button>
      <ul>{items}</ul>
      */}
    </Container>
  );
};

export default App;
