$(document).ready(() => {
  console.log("ready");
  const con = new WebConsole('console');
  con.oninput = (cmd) => {
    console.log("command:", cmd);
    cmd = cmd.split(/\s+/);
    console.log(cmd);
    if (cmd[0] === 'help') {
      con.print("Supported commands: help clear history echo");
    } else if (cmd[0] === 'clear') {
      con.clear();
    } else if (cmd[0] === 'history') {
      for (const cmd of con.history())
        con.print(`• ${cmd}`);
    } else if (cmd[0] === 'echo') {
      con.print(cmd.slice(1).join(' '));
    } else {
      con.printHTML(`<span style="color: red">error:</span> no such command '${cmd}'`);
    }
  };
});
