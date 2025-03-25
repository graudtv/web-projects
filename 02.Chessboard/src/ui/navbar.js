import './SettingsBar.js'

export class NavBar extends HTMLElement {
  connectedCallback() {
    $(this).html(`
      <nav class="navbar navbar-dark bg-dark">
        <div class="container-fluid">
          <a class="navbar-brand" href="#">chessboard</a>
          <button class="navbar-toggler border-0" type="button" data-bs-toggle="offcanvas" data-bs-target="#settings" aria-controls="settings" aria-label="Toggle settings">
            <i class="fa fa-regular fa-gear"></i>
          </button>
          <settings-bar id="settings"></settings-bar>
        </div>
      </nav>
    `);
  }
}

customElements.define('nav-bar', NavBar);
