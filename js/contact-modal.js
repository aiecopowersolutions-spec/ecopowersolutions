
/* EcoPower shared contact modal loader with Zoho CRM Web-to-Lead support. */
(function () {
  var MODAL_URL = '/contact-modal';
  var lastFocusedElement = null;
  var FORM_ID = 'webform7281015000001697001';

  function getModal() { return document.getElementById('contactModal'); }

  function openModal(event) {
    var modal = getModal();
    if (!modal) return;
    if (event) event.preventDefault();
    lastFocusedElement = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    var mainNav = document.getElementById('mainNav');
    var menuToggle = document.getElementById('menuToggle');
    if (mainNav && mainNav.classList.contains('open')) {
      mainNav.classList.remove('open');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    }
    window.setTimeout(function () {
      var firstField = modal.querySelector('input:not([type="hidden"]):not([style*="display:none"]), select, textarea, button');
      if (firstField) firstField.focus();
    }, 20);
  }

  function closeModal() {
    var modal = getModal();
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') lastFocusedElement.focus();
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest ? event.target.closest('.open-contact') : null;
    if (trigger) { openModal(event); return; }
    var closeBtn = event.target.closest ? event.target.closest('#modalClose') : null;
    if (closeBtn) { closeModal(); return; }
    var modal = getModal();
    if (modal && event.target === modal) closeModal();
  });

  document.addEventListener('keydown', function (event) {
    var modal = getModal();
    if (event.key === 'Escape' && modal && modal.classList.contains('open')) closeModal();
  });

  function loadExternalScript(src, id) {
    if (document.getElementById(id)) return;
    var script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    document.head.appendChild(script);
  }

  function initializeZohoForm() {
    var form = document.getElementById(FORM_ID);
    if (!form || form.dataset.ecopowerBound === 'true') return;
    form.dataset.ecopowerBound = 'true';

    // Required Zoho CRM scripts. Do NOT insert Zoho's second SalesIQ widget.
    loadExternalScript('https://crm.zohopublic.com/crm/WebFormServlet?rid=b807969c03b4e91dc89c58e9fe425936c941dd10aec4c128ed3cffd28d50970d', 'ecopower-zoho-webform-servlet');
    loadExternalScript('https://crm.zohopublic.com/crm/WebFormAnalyticsServeServlet?rid=8062cefbd295eda961f57de53ec52ae97d387bffd5b3d3b705fda267b5e9be2f051d6a210f18f9d6dfc4e0095f5652dcgide561e1946090bfa5ccfbd1c3fcf2dfbd47e36b0829195e01b0817a0e4479f129gid1f65316846a8a5173b8483cb299d246efdc8f7212e1f96231398df9882420cb6gidab4787136929769327502f64f170fd0ff22a40a8d03eb9ae86f9f40f4ac99915&tw=54d5643173f58465b8861175631baba7226abbb677b72bdb2ed843137a5a5bd3&version=v2', 'wf_anal');

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;
      var submitButton = form.querySelector('#formsubmit');
      var status = document.getElementById('ecopowerFormStatus');
      if (submitButton.disabled) return;
      var email = form.elements.namedItem('Email').value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        status.hidden = false;
        status.textContent = 'Please enter a valid email address.';
        form.elements.namedItem('Email').focus();
        return;
      }
      var data = new FormData(form);
      var message = String(data.get('Description') || '').trim();
      var interest = String(data.get('ecopowerInterest') || '').trim();
      data.delete('ecopowerInterest'); // Not a Zoho CRM field; add it to Description instead.
      data.set('Description', 'Primary interest: ' + interest + '\nUtility: BGE\n\n' + message);

      // Pass visitor identity to existing SalesIQ, without loading a second widget.
      try {
        if (window.$zoho && window.$zoho.salesiq && window.$zoho.salesiq.visitor) {
          var visitor = window.$zoho.salesiq.visitor;
          var first = String(data.get('First Name') || '');
          var last = String(data.get('Last Name') || '');
          if (typeof visitor.name === 'function') visitor.name((first + ' ' + last).trim());
          if (typeof visitor.email === 'function') visitor.email(email);
          if (typeof visitor.uniqueid === 'function') data.set('LDTuvid', visitor.uniqueid());
        }
      } catch (err) { /* Tracking must not block lead submission. */ }

      submitButton.disabled = true;
      status.hidden = false;
      status.textContent = 'Sending your request…';
      if (window._wfa_track && typeof window._wfa_track.wfa_submit === 'function') {
        try { window._wfa_track.wfa_submit(event); } catch (err) {}
      }
      fetch('https://crm.zoho.com/crm/WebToLeadForm', {
        method: 'POST', body: data, cache: 'no-cache'
      }).then(function (response) {
        if (!response.ok) throw new Error('Zoho CRM returned ' + response.status);
        var type = response.headers.get('content-type') || '';
        if (!type.includes('application/json')) throw new Error('Unexpected Zoho CRM response');
        return response.json();
      }).then(function (result) {
        if (result.actionsubmit === 'Splash Message' && result.invalidCaptcha !== 'true' && result.success !== false) {
          status.textContent = result.actionvalue || 'Thank you! We received your request and will be in touch soon.';
          form.reset();
          if (window._wfa_track && typeof window._wfa_track.wfa_post_submit === 'function') {
            try { window._wfa_track.wfa_post_submit(event); } catch (err) {}
          }
        } else if (result.actionsubmit === 'error_msg' || result.actionsubmit === 'captcha_error' || result.invalidCaptcha === 'true') {
          throw new Error(result.message || result.actionvalue || 'Zoho could not accept the request.');
        } else {
          throw new Error('Unexpected response from Zoho CRM. Please verify the lead in CRM before retrying.');
        }
      }).catch(function (error) {
        console.error('EcoPower Zoho lead submission failed:', error);
        status.textContent = 'We could not confirm your request. Please contact EcoPower directly or try again later.';
      }).finally(function () { submitButton.disabled = false; });
    });
  }

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
        initializeZohoForm();
        document.dispatchEvent(new Event('ecopower:contact-modal-ready'));
      })
      .catch(function (error) {
        console.error('EcoPower shared contact modal could not be loaded.', error);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadModal);
  } else { loadModal(); }
}());
