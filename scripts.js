(function () {
  'use strict';

  function initNavigation() {
    var navToggle = document.querySelector('.nav-toggle');
    var mainNav = document.getElementById('main-nav');
    if (!navToggle || !mainNav) {
      return;
    }

    var mobileQuery = window.matchMedia('(max-width: 900px)');

    function setOpenState(isOpen) {
      var value = isOpen ? 'true' : 'false';
      mainNav.setAttribute('data-open', value);
      navToggle.setAttribute('aria-expanded', value);
      navToggle.setAttribute('aria-label', isOpen ? 'Cerrar menu' : 'Abrir menu');
    }

    setOpenState(false);

    navToggle.addEventListener('click', function () {
      var currentlyOpen = mainNav.getAttribute('data-open') === 'true';
      setOpenState(!currentlyOpen);
    });

    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        if (mobileQuery.matches) {
          setOpenState(false);
        }
      });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && mainNav.getAttribute('data-open') === 'true') {
        setOpenState(false);
        navToggle.focus();
      }
    });
  }

  function setupModal(modal) {
    if (!modal) {
      return { open: function () {}, close: function () {} };
    }

    var closeButton = modal.querySelector('[data-close-modal]');
    var lastFocus = null;

    function onEscape(event) {
      if (event.key === 'Escape') {
        close();
      }
    }

    function open() {
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', onEscape);
      if (closeButton) {
        closeButton.focus();
      }
    }

    function close() {
      modal.hidden = true;
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onEscape);
      if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus();
      }
    }

    if (closeButton) {
      closeButton.addEventListener('click', close);
    }

    modal.addEventListener('click', function (event) {
      if (event.target === modal) {
        close();
      }
    });

    return { open: open, close: close };
  }

  function initDeletionForm() {
    var form = document.getElementById('deletion-form');
    if (!form) {
      return;
    }

    var emailInput = form.querySelector('#email');
    var feedback = form.querySelector('#form-feedback');
    var submitButton = form.querySelector('button[type="submit"]');
    var endpoint = 'https://formsubmit.co/ajax/equipo@mappets.com.ar';

    form.addEventListener('submit', async function (event) {
      event.preventDefault();

      feedback.textContent = '';
      feedback.classList.remove('error');

      var emailValue = emailInput.value.trim();

      if (!emailValue) {
        feedback.textContent = 'Ingresa tu correo electronico para continuar.';
        feedback.classList.add('error');
        emailInput.focus();
        return;
      }

      if (!emailInput.checkValidity()) {
        feedback.textContent = 'Revisa el formato del correo ingresado.';
        feedback.classList.add('error');
        emailInput.focus();
        return;
      }

      var originalLabel = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = 'Enviando...';

      var payload = {
        _subject: 'Solicitud de eliminacion de datos personales',
        email: emailValue,
        message: [
          'Hola equipo Mappets,',
          '',
          'Solicito la eliminacion definitiva de mis datos personales asociados a este correo.',
          '',
          'Por favor, confirmen cuando el proceso este completo.',
          '',
          'Gracias.'
        ].join('\n')
      };

      try {
        var response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error('Invalid response');
        }

        feedback.textContent = 'Solicitud enviada. Te responderemos a la brevedad.';
        form.reset();
      } catch (error) {
        feedback.textContent = 'No pudimos enviar la solicitud. Escribenos a equipo@mappets.com.ar.';
        feedback.classList.add('error');
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
      }
    });
  }

  function initSupportForm() {
    var form = document.getElementById('support-form');
    if (!form) {
      return;
    }

    var feedback = form.querySelector('#form-feedback');
    var submitButton = form.querySelector('button[type="submit"]');
    var endpoint = 'https://formsubmit.co/ajax/equipo@mappets.com.ar';
    var modalApi = setupModal(document.getElementById('success-modal'));

    form.addEventListener('submit', async function (event) {
      event.preventDefault();

      feedback.textContent = '';
      feedback.classList.remove('error');

      var formData = new FormData(form);
      var email = String(formData.get('email') || '').trim();
      var mensaje = String(formData.get('mensaje') || '').trim();

      var emailField = form.querySelector('#email');
      var messageField = form.querySelector('#mensaje');

      if (!email || !emailField.checkValidity()) {
        feedback.textContent = 'Ingresa un correo valido para continuar.';
        feedback.classList.add('error');
        emailField.focus();
        return;
      }

      if (!mensaje) {
        feedback.textContent = 'Cuentanos brevemente tu consulta.';
        feedback.classList.add('error');
        messageField.focus();
        return;
      }

      var payload = {
        _subject: 'Consulta de soporte - Mappets (iOS)',
        nombre: String(formData.get('nombre') || ''),
        email: email,
        motivo: String(formData.get('motivo') || 'Consulta general'),
        ios_version: String(formData.get('ios') || ''),
        app_version: String(formData.get('app') || ''),
        device: String(formData.get('dispositivo') || ''),
        message: mensaje
      };

      var originalLabel = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = 'Enviando...';

      try {
        var response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error('Invalid response');
        }

        feedback.textContent = 'Consulta enviada. Te responderemos por correo.';
        form.reset();
        modalApi.open();
      } catch (error) {
        feedback.textContent = 'No pudimos enviar el formulario. Escribenos a equipo@mappets.com.ar.';
        feedback.classList.add('error');
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initDeletionForm();
    initSupportForm();
  });
})();
