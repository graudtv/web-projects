class WebConsole {
  oninput = null;

  constructor(elementID) {
    this.$elem = $(document.getElementById(elementID));
    this.$output = this.$elem.children('.web-console-output');
    this.$input = this.$elem.find('.web-console-input input');
    this._history = [];
    this._historyIdx = 0;
    this._historyPendingCmd = null;

    this.$input.on('keydown', e => {
      if (e.key === 'Enter') {
        const cmd = this.$input.val().trim();
        if (cmd != '') {
          this._history.push(cmd);
          this._historyIdx = this._history.length;
          this._historyPendingCmd = null;
          this.printCommand(cmd);
          this.$input.val('');
          if (this.oninput !== null)
            this.oninput(cmd)
        }
      } else if (e.key === 'ArrowUp') {
        if (this._historyIdx === this._history.length)
          this._historyPendingCmd = this.$input.val();
        if (this._historyIdx > 0) {
          --this._historyIdx;
          this.$input.val(this._history[this._historyIdx]);
        }
        return false;
        //e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        if (this._historyIdx < this._history.length) {
          ++this._historyIdx;
          const curCmd = (this._historyIdx === this._history.length)
                         ? this._historyPendingCmd : this._history[this._historyIdx]
          this.$input.val(curCmd);
        }
        return false;
      } else if (e.key === 'Tab') {
        return false;
      }
    });
  }

  print(msg) {
    const text = $('<p></p>').text(msg);
    this.$output.append(text);
  }
  printHTML(msg) {
    const text = $('<p></p>').html(msg);
    this.$output.append(text);
  }

  printCommand(cmd) {
    const text = $('<p></p>').text(cmd).prepend('<span class="prompt">&gt </span>');
    this.$output.append(text);
  }

  history() {
    return this._history;
  }

  clear() {
    this.$output.text('');
  }
};
