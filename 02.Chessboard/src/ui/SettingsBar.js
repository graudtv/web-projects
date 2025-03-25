import { userSettings } from '../app/userSettings.js'
import { boardThemes } from '../ui/themes.js'

export class SettingsBar extends HTMLElement {
  _render() {
    const curTheme = userSettings.get('theme');
    const curMovement = userSettings.get('movement');
    const curBoardStyle = userSettings.get('boardStyle');

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
            <div class="btn-group w-100" role="group" aria-label="Select theme">
              <input type="radio" class="btn-check" name="settings-theme"
                     id="settings-theme-light" value="light" autocomplete="off"
                     ${curTheme === 'light' ? 'checked' : ''}>
              <label class="btn btn-outline-primary" for="settings-theme-light">Light</label>
              <input type="radio" class="btn-check" name="settings-theme"
                     id="settings-theme-dark" value="dark" autocomplete="off"
                     ${curTheme === 'dark' ? 'checked' : ''}>
              <label class="btn btn-outline-primary" for="settings-theme-dark">Dark</label>
            </div>
          </li>
          <li class="nav-item mb-2">
            <h6>Piece movement</h6>
            <div class="btn-group w-100" role="group" aria-label="Select piece movement style">
              <input type="radio" class="btn-check" name="settings-movement"
                     id="settings-movement-drag" value="drag" autocomplete="off"
                     ${curMovement === 'drag' ? 'checked' : ''}>
              <label class="btn btn-outline-primary" for="settings-movement-drag">Drag</label>
              <input type="radio" class="btn-check" name="settings-movement"
                     id="settings-movement-click" value="click" autocomplete="off"
                     ${curMovement === 'click' ? 'checked' : ''}>
              <label class="btn btn-outline-primary" for="settings-movement-click">Click</label>
              <input type="radio" class="btn-check" name="settings-movement"
                     id="settings-movement-both" value="both" autocomplete="off"
                     ${curMovement === 'both' ? 'checked' : ''}>
              <label class="btn btn-outline-primary" for="settings-movement-both">Both</label>
            </div>
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

    $(this).find('input[type="radio"][name="settings-theme"]').click(function() {
      userSettings.set('theme', $(this).attr('value'));
    });
    $(this).find('input[type="radio"][name="settings-movement"]').click(function() {
      userSettings.set('movement', $(this).attr('value'));
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
