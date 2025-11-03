import { useState, useRef } from 'react';
import './Webconsole.css';

const Webconsole = ({onCommand}) => {
  const history = useRef([]);
  const historyIdx = useRef(0);
  const historyPendingCmd = useRef(null);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState([
      <p>Try running some command!</p>,
      <p>Run <span style={{color: 'green'}}>help</span> to show available commands</p>
  ]);

  const api = {
    print(msg) {
      setOutput(output => [...output, <p>{msg}</p>]);
    },
    error(msg) {
      setOutput(output => [...output, <p><span style={{color: 'red'}}>error:</span> {msg}</p>]);
    },
    printCommand(cmd) {
    },
    history() {
      return history.current;
    },
    clear() {
      setOutput([]);
    }
  };

  const handleInput = (e) => {
    if (e.key === 'Enter') {
      const cmd = e.target.value.trim().split(/\s+/);
      if (cmd != '') {
        const prettyCmd = cmd.join(' ');
        history.current.push(prettyCmd);
        historyIdx.current = history.current.length;
        historyPendingCmd.current = null;
        setInput('');
        api.print(<><span className="prompt">{'>'}</span> {prettyCmd}</>);
        if (onCommand)
          onCommand(cmd, api);
      }
    } else if (e.key === 'ArrowUp') {
      if (historyIdx.current === history.current.length)
        historyPendingCmd.current = e.target.value;
      if (historyIdx.current > 0) {
        --historyIdx.current;
        setInput(history.current[historyIdx.current]);
      }
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      if (historyIdx.current < history.current.length) {
        ++historyIdx.current;
        const curCmd = (historyIdx.current === history.current.length)
                       ? historyPendingCmd.current
                       : history.current[historyIdx.current];
        setInput(curCmd);
      }
      e.preventDefault();
    } else if (e.key === 'Tab') {
      e.preventDefault();
    }
  };

  return (
    <div className="web-console">
      <div className="web-console-output">
        {output}
      </div>
      <div className="web-console-input">
        <span className="prompt">{'>'}</span>
        <input type="text" value={input} onInput={(e) => setInput(e.target.value)} onKeyDown={handleInput} />
      </div>
    </div>
  );
};

export default Webconsole;
