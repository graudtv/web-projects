import '../../assets/pieces/alpha.css'
import '../../assets/pieces/cburnett.css'
import '../../assets/pieces/horsey.css'
import '../../assets/pieces/merida.css'

export const boardThemes = [
  { name: 'blue', image: './assets/board/lichess/blue.png' },
  { name: 'brown', image: './assets/board/lichess/brown.png' },
  { name: 'wood', image: './assets/board/lichess/wood.jpg' },
  { name: 'maple', image: './assets/board/lichess/maple.jpg' },
  { name: 'green', image: './assets/board/lichess/green.png' },
  { name: 'legacy', image: './assets/board/pale-green.svg' },
];

/* We cannot apply background-image to cg-board element directly because
 * chessground rerenders cg-board occasionaly. Create css rules instead */
document.head.appendChild(document.createElement("style")).innerHTML = 
  boardThemes.map(({name, image}) => `.${name} cg-board { background-image: url(${image}) }`).join('\n');
