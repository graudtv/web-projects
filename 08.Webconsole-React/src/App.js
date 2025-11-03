import './App.css';
import { useState } from 'react';
import Webconsole from './Webconsole.js';

const App = () => {
  const [consoleVisible, setConsoleVisible] = useState(true);
  const handleCommand = (cmd, console) => {
    if (cmd[0] === 'help') {
      console.print("Supported commands: help clear history echo");
    } else if (cmd[0] === 'clear') {
      console.clear();
    } else if (cmd[0] === 'history') {
      for (const cmd of console.history())
        console.print(`• ${cmd}`);
    } else if (cmd[0] === 'echo') {
      console.print(cmd.slice(1).join(' '));
    } else {
      console.error(`no such command '${cmd[0]}'`);
    }
  };

  return (
    <>
      <button onClick={
        () => setConsoleVisible(!consoleVisible)
      }>Toggle console</button>
      {consoleVisible && <Webconsole onCommand={handleCommand} />}
    </>
  );
};

export default App;
