
/* EcoPower shared contact modal — Zoho CRM Web-to-Lead */
(function () {
  'use strict';

  var MODAL_URL = '/contact-modal';
  var FORM_ID = 'webform7281015000001697001';
  var lastFocusedElement = null;
  var toastTimer = null;

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

    var mainNav = document.getElementById('mainNav');
    var menuToggle = document.getElementById('menuToggle');

    if (mainNav && mainNav.classList.contains('open')) {
      mainNav.classList.remove('open');
      if (menuToggle) {
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    }

    window.setTimeout(function () {
      var firstField = modal.querySelector(
        'input:not([type="hidden"]):not([style*="display:none"]), select, textarea, button'
      );
      if (firstField) firstField.focus();
    }, 20);
  }

  function closeModal() {
    var modal = getModal();
    if (!modal) return;

    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');

    if (
      lastFocusedElement &&
      typeof lastFocusedElement.focus === 'function'
    ) {
      lastFocusedElement.focus();
    }
  }

  function showSuccessToast(message) {
    var toast = document.getElementById('ecopowerSuccessToast');

    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ecopowerSuccessToast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');

      Object.assign(toast.style, {
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#167a45',
        color: '#ffffff',
        padding: '14px 22px',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
        zIndex: '2147483647',
        maxWidth: 'calc(100% - 32px)',
        width: 'max-content',
        textAlign: 'center',
        fontSize: '15px',
        lineHeight: '1.5'
      });

      document.body.appendChild(toast);
    }

    toast.textContent =
      message ||
      "Thank you! We've received your request and will be in touch soon.";

    toast.hidden = false;
    toast.style.display = 'block';

    if (toastTimer) window.clearTimeout(toastTimer);

    toastTimer = window.setTimeout(function () {
      toast.hidden = true;
      toast.style.display = 'none';
    }, 5000);
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest
      ? event.target.closest('.open-contact')
      : null;

    if (trigger) {
      openModal(event);
      return;
    }

    var closeButton = event.target.closest
      ? event.target.closest('#modalClose')
      : null;

    if (closeButton) {
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

    if (
      event.key === 'Escape' &&
      modal &&
      modal.classList.contains('open')
    ) {
      closeModal();
    }
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

    // Zoho CRM Webform tracking.
    // Do not load a second Zoho SalesIQ widget.
    loadExternalScript(
      'https://crm.zohopublic.com/crm/WebFormServlet?rid=b807969c03b4e91dc89c58e9fe425936c941dd10aec4c128ed3cffd28d50970d',
      'ecopower-zoho-webform-servlet'
    );

    loadExternalScript(
      'https://crm.zohopublic.com/crm/WebFormAnalyticsServeServlet?rid=140aee6ec21869c82d95fbf3989364d6876a6b7bf06b93915fa8ce32c93debe604211554524ed9043bc08d640607f5c2gid97bdfb81e3e4160eee01874e4e884c7653e1951c4d7c553aa09c83a4ed6668f3gid479d5dd261ea7984ade8c77526c8f50feed891053ce74f8184d1d7c514ba016agid60f7aac4f0681bf846ee3be44f9ce36fafa6f0fbf92accb1572dfc3e17a82810&tw=005c50409bb26e61f3f1662f0ec4ce66a2fd36f2d1a15936f78bf9fde2d64d51&version=v2',
      'wf_anal'
    );

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      if (!form.reportValidity()) return;

      var submitButton = form.querySelector('#formsubmit');
      var status = document.getElementById('ecopowerFormStatus');

      if (!submitButton || submitButton.disabled) return;

      var emailField = form.elements.namedItem('Email');
      var email = emailField ? emailField.value.trim() : '';

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (status) {
          status.hidden = false;
          status.textContent = 'Please enter a valid email address.';
        }
        if (emailField) emailField.focus();
        return;
      }

      var data = new FormData(form);

      // Keep the custom EcoPower interest selection in Zoho's
      // Description field without submitting an unknown CRM field.
      var message = String(data.get('Description') || '').trim();
      var interest = String(data.get('ecopowerInterest') || '').trim();

      data.delete('ecopowerInterest');

      data.set(
        'Description',
        'Primary interest: ' + interest +
        '\nUtility: BGE\n\n' +
        message
      );

      // Connect the existing SalesIQ visitor where available.
      // This does NOT install or initialize another chat widget.
      try {
        if (
          window.$zoho &&
          window.$zoho.salesiq &&
          window.$zoho.salesiq.visitor
        ) {
          var visitor = window.$zoho.salesiq.visitor;
          var first = String(data.get('First Name') || '');
          var last = String(data.get('Last Name') || '');

          if (typeof visitor.name === 'function') {
            visitor.name((first + ' ' + last).trim());
          }

          if (typeof visitor.email === 'function') {
            visitor.email(email);
          }

          if (typeof visitor.uniqueid === 'function') {
            var visitorId = visitor.uniqueid();
            if (visitorId) data.set('LDTuvid', visitorId);
          }
        }
      } catch (err) {
        console.warn('SalesIQ visitor linking unavailable:', err);
      }

      submitButton.disabled = true;

      if (status) {
        status.hidden = false;
        status.textContent = 'Sending your request…';
      }

      try {
        if (
          window._wfa_track &&
          typeof window._wfa_track.wfa_submit === 'function'
        ) {
          window._wfa_track.wfa_submit(event);
        }
      } catch (err) {
        console.warn('Zoho pre-submit tracking unavailable:', err);
      }

      fetch('https://crm.zoho.com/crm/WebToLeadForm', {
        method: 'POST',
        body: data,
        cache: 'no-cache'
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error(
              'Zoho CRM returned HTTP ' + response.status
            );
          }

          var contentType =
            response.headers.get('content-type') || '';

          if (!contentType.includes('application/json')) {
            throw new Error(
              'Zoho returned a non-JSON response; submission cannot be confirmed.'
            );
          }

          return response.json();
        })
        .then(function (result) {
          var success =
            result &&
            result.actionsubmit === 'Splash Message' &&
            result.invalidCaptcha !== true &&
            result.invalidCaptcha !== 'true' &&
            result.success !== false;

          if (!success) {
            throw new Error(
              (result && (result.message || result.actionvalue)) ||
              'Zoho did not confirm a successful submission.'
            );
          }

          try {
            if (
              window._wfa_track &&
              typeof window._wfa_track.wfa_post_submit === 'function'
            ) {
              window._wfa_track.wfa_post_submit(event);
            }
          } catch (err) {
            console.warn('Zoho post-submit tracking unavailable:', err);
          }

          // Only close the popup after confirmed Zoho success.
          form.reset();

          if (status) {
            status.hidden = true;
            status.textContent = '';
          }

          closeModal();

          showSuccessToast(
            result.actionvalue ||
            "Thank you! We've received your request and will be in touch soon."
          );
        })
        .catch(function (error) {
          console.error(
            'EcoPower Zoho lead submission failed:',
            error
          );

          // Keep popup open and preserve entered information.
          if (status) {
            status.hidden = false;
            status.textContent =
              'We could not confirm your request. ' +
              'Please try again or contact EcoPower directly.';
          }
        })
        .finally(function () {
          submitButton.disabled = false;
        });
    });
  }

  function loadModal() {
    var mount = document.getElementById(
      'contact-modal-include'
    );

    if (!mount) {
      console.error(
        'EcoPower contact modal mount point not found.'
      );
      return;
    }

    fetch(MODAL_URL)
      .then(function (response) {
        if (!response.ok) {
          throw new Error(
            'Contact modal request failed: ' +
            response.status
          );
        }

        return response.text();
      })
      .then(function (html) {
        mount.outerHTML = html;
        initializeZohoForm();

        document.dispatchEvent(
          new Event('ecopower:contact-modal-ready')
        );
      })
      .catch(function (error) {
        console.error(
          'EcoPower shared contact modal could not be loaded.',
          error
        );
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      loadModal
    );
  } else {
    loadModal();
  }
}());
