import './App.css';
import { useState, useEffect } from 'react';

const DateBox = ({date}) => {
  return (
    <div>
      <p>UTC: {date?.utc ?? '?'}</p>
      <p>UNIX: {date?.unix ?? '?'}</p>
    </div>
  );
}

const App = () => {
  //const date = {unix:0, utc:"Thu, 01 Jan 1970 00:00:00 GMT"};
  const [curDate, setCurDate] = useState({});
  const [timerDate, setTimerDate] = useState({});
  const [customDate, setCustomDate] = useState({});

  async function fetchTime(time, callback) {
    try {
      const response = await fetch('/api/' + time);
      const json = await response.json();
      callback(json);
    } catch (e) {
      console.log(e);
      callback({});
    }
  };

  const updateTimer = () => {
    fetchTime('now', setTimerDate);
  };

  const onCustomDateUpdate = (e) => {
    fetchTime(e.target.value, setCustomDate);
  };

  useEffect(() => {
    const delay = 100; // ms
    const interval = setInterval(() => {
      fetchTime('now', setCurDate);
    }, delay);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <h1>Timestamp Service Demo</h1>
      <h2>Current time</h2>
      <DateBox date={curDate} />
      <h2>Timer</h2>
      <button onClick={updateTimer}>Update</button>
      <DateBox date={timerDate} />
      <h2>Custom time</h2>
      <input type="date" onChange={onCustomDateUpdate}/>
      <DateBox date={customDate} />
      <h2>API</h2>
      <p><a href={'/api/now'}>[service]/api/now</a></p>
      <p><a href={'/api/2015-12-25'}>[service]/api/2015-12-25</a></p>
      <p><a href={'/api/1451001600000'}>[service]/api/1451001600000</a></p>
    </>
  );
};

export default App;
