import { userSettings } from '../app/userSettings.js'
import { boardThemes } from '../ui/themes.js'

export class SettingsBar extends HTMLElement {
  _render() {
    const namespace = 'settings';
    const capitalizeFirstLetter = str => str.charAt(0).toUpperCase() + str.slice(1);
    const curBoardStyle = userSettings.get('boardStyle');

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

    const boardThemesHTML = boardThemes.map(({name, image}) => `
      <button class="overflow-hidden border ${name === curBoardStyle ? 'border-primary border-3' : 'border-secondary-subtle'} m-0 p-0"
              style="width: 20%; aspect-ratio: 1"
              data-settings-key="boardStyle" data-settings-value="${name}">
        <img src="${image}" style="width: 402%; height: 402%">
      </button>
    `).join('');


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
            <h6>Board style</h6>
            <div class="w-100 d-flex flex-wrap gap-2">
              ${boardThemesHTML}
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
    $(this).find('button[data-settings-key="boardStyle"').click(function() {
      $(this).siblings().removeClass('border-primary border-3').addClass('border-secondary-subtle');
      $(this).addClass('border-primary border-3').removeClass('border-secondary-subtle');
      userSettings.set('boardStyle', $(this).attr('data-settings-value'));
    });
    $(this).find('button[data-btn-id="reset"]').click(() => {
      userSettings.reset();
      this._render();
    });
  }
  connectedCallback() {
    this._render();
  }
}

customElements.define('settings-bar', SettingsBar);
