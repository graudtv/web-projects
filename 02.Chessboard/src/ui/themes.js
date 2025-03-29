import '../../assets/pieces/alpha.css'
import '../../assets/pieces/cburnett.css'
import '../../assets/pieces/merida.css'
import '../../assets/pieces/horsey.css'

class PieceTheme {
  constructor(images) {
    this.images = images;
  }
  /* piece: 'R', 'r', 'N', 'n', etc */
  getImage(piece) {
    const ucPiece = piece.toUpperCase();
    if (!['R', 'N', 'B', 'K', 'Q', 'P'].includes(ucPiece))
      throw new Error(`invalid piece ${piece}`);
    const color = (ucPiece === piece) ? 'w' : 'b';
    return this.images + '/' + color + ucPiece + '.svg';
  }
}

export const boardThemes = {
  themes: [
    { name: 'blue', image: './assets/lichess/board/blue.png' },
    { name: 'brown', image: './assets/lichess/board/brown.png' },
    { name: 'wood', image: './assets/lichess/board/wood.jpg' },
    { name: 'maple', image: './assets/lichess/board/maple.jpg' },
    { name: 'green', image: './assets/lichess/board/green.png' },
    { name: 'pale-green', image: './assets/board/pale-green.svg' },
  ],
  getNames() { return this.themes.map(({name}) => name); },
  getImage(theme) { return this.themes.find(({name}) => name === theme)?.image; },
};

export const pieceThemes = {
  themes: [
    { name: 'cburnett', theme: new PieceTheme('./assets/lichess/pieces/cburnett')},
    { name: 'alpha', theme: new PieceTheme('./assets/lichess/pieces/alpha')},
    { name: 'merida', theme: new PieceTheme('./assets/lichess/pieces/merida')},
    { name: 'horsey', theme: new PieceTheme('./assets/lichess/pieces/horsey')},
  ],
  getNames() { return this.themes.map(({name}) => name); },
  getTheme(theme) { return this.find(({name}) => name === theme)?.theme; },
  getImage(theme, piece) { return this.getTheme(theme)?.getImage(piece); },
};

/* We cannot apply background-image to cg-board element directly because
 * chessground rerenders cg-board occasionaly. Create css rules instead */
document.head.appendChild(document.createElement("style")).innerHTML = 
  boardThemes.themes.map(({name, image}) => `.${name} cg-board { background-image: url(${image}) }`).join('\n');
