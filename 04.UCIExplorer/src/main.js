import { Chessground } from 'chessground';

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

  const button = document.querySelector('.fen');
  const tooltip = document.querySelector('.chessboard-popup');
  const board = document.querySelector('#main-board');

  const popperInstance = Popper.createPopper(button, tooltip, {
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 8],
        },
      },
    ],
  });

  const cg = Chessground(board, {
    coordinates: true
  });

  function show() {
    // Make the tooltip visible
    tooltip.setAttribute('data-show', '');

    // Enable the event listeners
    popperInstance.setOptions((options) => ({
      ...options,
      modifiers: [
        ...options.modifiers,
        { name: 'eventListeners', enabled: true },
      ],
    }));

    // Update its position
    popperInstance.update();
  }

  function hide() {
    // Hide the tooltip
    tooltip.removeAttribute('data-show');

    // Disable the event listeners
    popperInstance.setOptions((options) => ({
      ...options,
      modifiers: [
        ...options.modifiers,
        { name: 'eventListeners', enabled: false },
      ],
    }));
  }

  const showEvents = ['mouseenter', 'focus'];
  const hideEvents = ['mouseleave', 'blur'];

  showEvents.forEach((event) => {
    button.addEventListener(event, show);
  });

  hideEvents.forEach((event) => {
    button.addEventListener(event, hide);
  });
});
