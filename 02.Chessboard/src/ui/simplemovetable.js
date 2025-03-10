import { movesToFEN } from '../chess/utils.js'

export class SimpleMoveTableUI {
  moves = []
  curMoveIndex = 0;
  moveEventListeners = [];

  constructor(elementId) {
    this.$tableElem = $(`#${elementId}`);
  }

  reset(moveList=[]) {
    this.moves = moveList;
    this.curMoveIndex = 0;
    this.render();
  }

  #notifyListeners() {
    for (const listener of this.moveEventListeners)
      listener(this.curMoveIndex);
  }

  render() {
    const handleClick = (moveIndex) => {
      const prevIndex = this.curMoveIndex;
      this.setCurrentMove(moveIndex);
      if (prevIndex !== this.curMoveIndex)
        this.#notifyListeners();
    };

    this.$tableElem.empty();
    for (let i = 0; i < this.moves.length; i += 2) {
      const tr = $('<tr></tr>');
      tr.append(`<th>${i / 2 + 1}</th>`);
      tr.append($(`<td>${this.moves[i]}</td>`).click(() => {handleClick(i)}));
      if (this.moves[i + 1])
        tr.append($(`<td>${this.moves[i + 1]}</td>`).click(() => {handleClick(i + 1)}));
      this.$tableElem.append(tr);
    }
    this.setCurrentMove(this.curMoveIndex);
  }

  constrainMoveIndex(moveIndex) {
    if (moveIndex < 0 || this.moves.length === 0)
      return 0;
    if (moveIndex >= this.moves.length)
      return this.moves.length - 1;
    return moveIndex;
  }

  getCurrentMoveIndex() {
    return this.curMoveIndex;
  }

  setCurrentMove(moveIndex) {
    moveIndex = this.constrainMoveIndex(moveIndex);
    this.$tableElem.find('td').removeClass('active');
    this.$tableElem.find(`tr:nth-child(${Math.floor(moveIndex / 2) + 1}) td:nth-of-type(${moveIndex % 2 + 1})`).addClass('active');
    this.curMoveIndex = moveIndex;
  }

  focusTop(moveIndex) {
    if (this.moves.length === 0)
      return;
    moveIndex = this.constrainMoveIndex(moveIndex);
    const $wrapper = this.$tableElem.parent();
    const $td = this.$tableElem.find('td').eq(moveIndex);
    const tdTop = $td.position().top;
    $wrapper.get(0).scrollTo(0, tdTop);
  }

  focusBottom(moveIndex) {
    if (this.moves.length === 0)
      return;
    moveIndex = this.constrainMoveIndex(moveIndex);
    const $wrapper = this.$tableElem.parent();
    const $td = this.$tableElem.find('td').eq(moveIndex);
    const tdBottom = $td.position().top + $td.height();
    $wrapper.get(0).scrollTo(0, tdBottom - $wrapper.height());
  }

  isFullyVisible(moveIndex) {
    if (this.moves.length === 0)
      return true;
    moveIndex = this.constrainMoveIndex(moveIndex);
    const $wrapper = this.$tableElem.parent();
    const wrapper = $wrapper.get(0);
    const $td = this.$tableElem.find('td').eq(moveIndex);
    const tdTop = $td.position().top;
    const tdBottom = $td.position().top + $td.height();
    return tdTop >= wrapper.scrollTop && tdBottom <= wrapper.scrollTop + $wrapper.height();
  }

  gotoNextMove() {
    this.setCurrentMove(this.curMoveIndex + 1);
    if (!this.isFullyVisible(this.curMoveIndex))
      this.focusBottom(this.curMoveIndex);
    this.#notifyListeners();
  }

  gotoPrevMove() {
    this.setCurrentMove(this.curMoveIndex - 1);
    if (!this.isFullyVisible(this.curMoveIndex))
      this.focusTop(this.curMoveIndex);
    this.#notifyListeners();
  }

  gotoFirstMove() {
    this.setCurrentMove(0);
    this.focusBottom(this.curMoveIndex);
    this.#notifyListeners();
  }

  gotoLastMove() {
    this.setCurrentMove(this.moves.length - 1);
    this.focusBottom(this.curMoveIndex);
    this.#notifyListeners();
  }

  pushMove(mv) {
    this.moves = this.moves.slice(0, this.curMoveIndex + 1);
    this.moves.push(mv);
    this.curMoveIndex += 1;
    this.render();
    this.focusBottom(this.curMoveIndex);
  }

  getCurrentFEN() {
    return movesToFEN(this.moves.slice(0, this.curMoveIndex + 1));
  }

  /* Example: tableUI.addMoveEventListener((moveIndex) => { ... }) */
  addMoveEventListener(listener) {
    this.moveEventListeners.push(listener);
  }
}
