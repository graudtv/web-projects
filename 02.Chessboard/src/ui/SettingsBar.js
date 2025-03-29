import { userSettings } from '../app/userSettings.js'
import { boardThemes, pieceThemes } from '../ui/themes.js'

export class SettingsBar extends HTMLElement {
  _render() {
    const namespace = 'settings';
    const capitalizeFirstLetter = str => str.charAt(0).toUpperCase() + str.slice(1);
    const curBoardTheme = userSettings.get('boardTheme');
    const curPieceSet = userSettings.get('pieceSet');

    const createButtonGroup = (key, values) => {
      const curValue = userSettings.get(key);
      const buttons = values.map(value => `
        <input type="radio" class="btn-check" name="${namespace}-${key}"
               id="${namespace}-${key}-${value}" value="${value}" autocomplete="off"
               ${value === curValue ? 'checked' : ''}>
        <label class="btn btn-outline-primary" for="${namespace}-${key}-${value}">${capitalizeFirstLetter(value)}</label>
      `).join('');
      return `
        <div class="btn-group w-100" role="group" aria-label="select ${key}">
          ${buttons}
        </div>
      `;
    };

    const boardThemesHTML = boardThemes.themes.map(({name, image}) => `
      <button class="overflow-hidden m-0 p-0 border-0 position-relative"
              style="width: 18%; aspect-ratio: 1"
              data-settings-key="boardTheme" data-settings-value="${name}">
        <img src="${image}" style="width: 400%; height: 400%">
        <div class="border ${name === curBoardTheme ? 'border-primary border-3' : 'border-secondary-subtle'} position-absolute top-0 start-0 w-100 h-100"></div>
      </button>
    `).join('');

    const pieceThemesHTML = pieceThemes.themes.map(({name, theme}) => {
      return `
        <button class="overflow-hidden m-0 p-0 border-0 position-relative"
                style="width: 18%; aspect-ratio: 1;"
                data-settings-key="pieceSet" data-settings-value="${name}">
          <img src="${boardThemes.getImage(curBoardTheme)}" style="width: 400%; height: 400%" class="position-absolute top-0 start-0 cur-board-theme">
          <img src="${theme.getImage('q')}" class="position-absolute w-50 h-50 top-0 start-0">
          <img src="${theme.getImage('n')}" class="position-absolute w-50 h-50 top-0 end-0">
          <img src="${theme.getImage('N')}" class="position-absolute w-50 h-50 bottom-0 start-0">
          <img src="${theme.getImage('Q')}" class="position-absolute w-50 h-50 bottom-0 end-0">
          <div class="border ${name === curPieceSet ? 'border-primary border-3' : 'border-secondary-subtle'} position-absolute top-0 start-0 w-100 h-100"></div>
        </button>
      `;
    }).join('');


    $(this).addClass('offcanvas offcanvas-end').attr('tabindex', '-1').html(`
      <div class="offcanvas-header">
        <h4 class="offcanvas-title">Settings</h5>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
      </div>
      <div class="offcanvas-body">
        <ul class="navbar-nav justify-content-end flex-grow-1 pe-3">
          <li class="nav-item mb-2">
            <h6>Theme</h6>
            ${createButtonGroup('theme', ['light', 'dark'])}
          </li>
          <li class="nav-item mb-2">
            <h6>Piece movement</h6>
            ${createButtonGroup('movement', ['drag', 'click', 'both'])}
          </li>
          <li class="nav-item mb-2">
            <h6>Board theme: <span class="fw-normal cur-board-theme-name">${curBoardTheme}</span></h6>
            <div class="w-100 d-flex flex-wrap row-gap-2" style="column-gap: 2.5%">
              ${boardThemesHTML}
            </div>
          </li>
          <li class="nav-item mb-2">
            <h6>Piece set: <span class="fw-normal cur-piece-set-name">${curPieceSet}</span></h6>
            <div class="w-100 d-flex flex-wrap row-gap-2" style="column-gap: 2.5%">
              ${pieceThemesHTML}
            </div>
          </li>
          <hr>
          <li class="mb" style="margin: 0 auto;">
            <button class="btn btn-danger" data-btn-id="reset">Reset to defaults</button>
          </li>
        </ul>
      </div>
    `);

    ['theme', 'movement'].forEach(key => {
      $(this).find(`input[type="radio"][name="${namespace}-${key}"]`).click(function() {
        userSettings.set(key, $(this).attr('value'));
      });
    });
    const $settings = $(this);
    $settings.find('button[data-settings-key="boardTheme"').click(function() {
      const theme = $(this).attr('data-settings-value');
      $(this).siblings().children('div.border').removeClass('border-primary border-3').addClass('border-secondary-subtle');
      $(this).children('div.border').addClass('border-primary border-3').removeClass('border-secondary-subtle');
      $settings.find('img.cur-board-theme').attr('src', boardThemes.getImage(theme));
      $settings.find('span.cur-board-theme-name').text(theme);
      userSettings.set('boardTheme', theme);
    });
    $settings.find('button[data-settings-key="pieceSet"').click(function() {
      const theme = $(this).attr('data-settings-value');
      $(this).siblings().children('div.border').removeClass('border-primary border-3').addClass('border-secondary-subtle');
      $(this).children('div.border').addClass('border-primary border-3').removeClass('border-secondary-subtle');
      $settings.find('span.cur-piece-set-name').text(theme);
      userSettings.set('pieceSet', theme);
    });
    $settings.find('button[data-btn-id="reset"]').click(() => {
      userSettings.reset();
      this._render();
    });
  }
  connectedCallback() {
    this._render();
  }
}

customElements.define('settings-bar', SettingsBar);
