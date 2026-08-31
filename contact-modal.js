/* EcoPower shared contact modal loader.
   Include this file on every page that has a #contact-modal-include mount
   point and one or more ".open-contact" trigger elements (buttons/links).

   Usage on each page:
     <div id="contact-modal-include"></div>
     <script src="/js/contact-modal.js"></script>

   Adjust the fetch URL below if /contact-modal is served from a different
   path or filename in your routing setup.
*/
(function () {
  var MODAL_URL = '/contact-modal';
  var lastFocusedElement = null;

  function getModal() {
    return document.getElementById('contactModal');
  }

  function openModal(event) {
    var modal = getModal();
    if (!modal) return;
    if (event) event.preventDefault();

    lastFocusedElement = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    // Close the mobile nav if it's open, in case the trigger lives there.
    var mainNav = document.getElementById('mainNav');
    var menuToggle = document.getElementById('menuToggle');
    if (mainNav && mainNav.classList.contains('open')) {
      mainNav.classList.remove('open');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    }

    window.setTimeout(function () {
      var firstField = modal.querySelector('input, select, textarea, button');
      if (firstField) firstField.focus();
    }, 20);
  }

  function closeModal() {
    var modal = getModal();
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  // Event delegation: works no matter when the modal fragment finishes
  // loading, and no matter which page or element triggers it (header,
  // hero buttons, service cards, footer links, etc.).
  document.addEventListener('click', function (event) {
    var trigger = event.target.closest ? event.target.closest('.open-contact') : null;
    if (trigger) {
      openModal(event);
      return;
    }

    var closeBtn = event.target.closest ? event.target.closest('#modalClose') : null;
    if (closeBtn) {
      closeModal();
      return;
    }

    var modal = getModal();
    if (modal && event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', function (event) {
    var modal = getModal();
    if (event.key === 'Escape' && modal && modal.classList.contains('open')) {
      closeModal();
    }
  });

  function loadModal() {
    var mount = document.getElementById('contact-modal-include');
    if (!mount) {
      console.error('EcoPower contact modal: no #contact-modal-include mount point found on this page.');
      return;
    }

    fetch(MODAL_URL)
      .then(function (response) {
        if (!response.ok) throw new Error('Contact modal request failed: ' + response.status);
        return response.text();
      })
      .then(function (html) {
        mount.outerHTML = html;
        document.dispatchEvent(new Event('ecopower:contact-modal-ready'));
      })
      .catch(function (error) {
        console.error('EcoPower shared contact modal could not be loaded.', error);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadModal);
  } else {
    loadModal();
  }
}());
