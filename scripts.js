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

  function initCommerceRequestForm() {
    var form = document.getElementById('commerce-request-form');
    if (!form) {
      return;
    }

    var feedback = form.querySelector('#commerce-form-feedback');
    var submitButton = form.querySelector('button[type="submit"]');
    var endpoint = 'https://formsubmit.co/ajax/equipo@mappets.com.ar';

    var fields = {
      name: form.querySelector('#commerce-name'),
      type: form.querySelector('#commerce-type'),
      contact: form.querySelector('#contact-name'),
      email: form.querySelector('#commerce-email'),
      phone: form.querySelector('#commerce-phone'),
      address: form.querySelector('#commerce-address'),
      description: form.querySelector('#commerce-description'),
      latitude: form.querySelector('#commerce-latitude'),
      longitude: form.querySelector('#commerce-longitude'),
      policy: form.querySelector('#commerce-policy')
    };

    function buildMessage(data) {
      return [
        'Nueva solicitud de alta de comercio en Mappets',
        '',
        'Nombre: ' + String(data.get('commerce_name') || ''),
        'Rubro: ' + String(data.get('commerce_type') || ''),
        'Contacto: ' + String(data.get('contact_name') || ''),
        'Email: ' + String(data.get('email') || ''),
        'Telefono: ' + String(data.get('phone') || ''),
        'WhatsApp: ' + String(data.get('whatsapp') || ''),
        'Direccion: ' + String(data.get('address') || ''),
        'Google Maps: ' + String(data.get('location_google') || ''),
        'Latitud: ' + String(data.get('latitude') || ''),
        'Longitud: ' + String(data.get('longitude') || ''),
        'Website: ' + String(data.get('website') || ''),
        'Instagram: ' + String(data.get('instagram') || ''),
        'Facebook: ' + String(data.get('facebook') || ''),
        'Horarios: ' + String(data.get('opening_hours') || ''),
        'Imagenes: se solicitaran por correo durante la validacion.',
        '',
        'Descripcion:',
        String(data.get('description') || '')
      ].join('\n');
    }

    function buildPayload() {
      var data = new FormData(form);
      var payload = new FormData();

      payload.append('_subject', 'Solicitud de alta de comercio - Mappets');
      payload.append('form_type', 'commerce_signup_request');
      payload.append('commerce_name', String(data.get('commerce_name') || ''));
      payload.append('commerce_type', String(data.get('commerce_type') || ''));
      payload.append('contact_name', String(data.get('contact_name') || ''));
      payload.append('email', String(data.get('email') || ''));
      payload.append('phone', String(data.get('phone') || ''));
      payload.append('whatsapp', String(data.get('whatsapp') || ''));
      payload.append('website', String(data.get('website') || ''));
      payload.append('instagram', String(data.get('instagram') || ''));
      payload.append('facebook', String(data.get('facebook') || ''));
      payload.append('address', String(data.get('address') || ''));
      payload.append('location_google', String(data.get('location_google') || ''));
      payload.append('latitude', String(data.get('latitude') || ''));
      payload.append('longitude', String(data.get('longitude') || ''));
      payload.append('opening_hours', String(data.get('opening_hours') || ''));
      payload.append('description', String(data.get('description') || ''));
      payload.append('message', buildMessage(data));

      return payload;
    }

    form.addEventListener('submit', async function (event) {
      event.preventDefault();

      feedback.textContent = '';
      feedback.classList.remove('error');

      if (!fields.name.value.trim()) {
        feedback.textContent = 'Ingresa el nombre del comercio.';
        feedback.classList.add('error');
        fields.name.focus();
        return;
      }

      if (!fields.type.value.trim()) {
        feedback.textContent = 'Selecciona el rubro del comercio.';
        feedback.classList.add('error');
        fields.type.focus();
        return;
      }

      if (!fields.contact.value.trim()) {
        feedback.textContent = 'Ingresa una persona de contacto.';
        feedback.classList.add('error');
        fields.contact.focus();
        return;
      }

      if (!fields.email.value.trim() || !fields.email.checkValidity()) {
        feedback.textContent = 'Ingresa un correo de contacto valido.';
        feedback.classList.add('error');
        fields.email.focus();
        return;
      }

      if (!fields.phone.value.trim()) {
        feedback.textContent = 'Ingresa un telefono de contacto.';
        feedback.classList.add('error');
        fields.phone.focus();
        return;
      }

      if (!fields.address.value.trim()) {
        feedback.textContent = 'Ingresa la direccion del comercio.';
        feedback.classList.add('error');
        fields.address.focus();
        return;
      }

      if (!fields.description.value.trim()) {
        feedback.textContent = 'Describe brevemente el comercio y sus servicios.';
        feedback.classList.add('error');
        fields.description.focus();
        return;
      }

      if (!fields.latitude.value.trim() || !fields.longitude.value.trim()) {
        feedback.textContent = 'Selecciona la ubicacion en el mapa para cargar latitud y longitud.';
        feedback.classList.add('error');
        fields.latitude.focus();
        return;
      }

      if (!fields.policy.checked) {
        feedback.textContent = 'Debes aceptar la validacion de datos para continuar.';
        feedback.classList.add('error');
        fields.policy.focus();
        return;
      }

      var originalLabel = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = 'Enviando...';

      try {
        var response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Accept: 'application/json'
          },
          body: buildPayload()
        });

        if (!response.ok) {
          throw new Error('Invalid response');
        }

        feedback.textContent = 'Solicitud enviada. El equipo revisara los datos y te contactara por correo.';
        window.alert('Solicitud enviada correctamente. Te contactaremos por correo.');
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

  function initCommerceMap() {
    var mapContainer = document.getElementById('commerce-map');
    var latitudeInput = document.getElementById('commerce-latitude');
    var longitudeInput = document.getElementById('commerce-longitude');
    var mapStatus = document.getElementById('map-status');
    var currentLocationButton = document.getElementById('map-current-location');

    if (!mapContainer || !latitudeInput || !longitudeInput) {
      return;
    }

    if (typeof window.L === 'undefined') {
      if (mapStatus) {
        mapStatus.textContent = 'No pudimos cargar el mapa. Completá un link de Google Maps y el equipo validará la ubicación.';
        mapStatus.classList.add('error');
      }
      return;
    }

    var defaultCoords = [-34.6037345, -58.3815704];
    var map = window.L.map(mapContainer, {
      scrollWheelZoom: true,
      touchZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      dragging: true,
      zoomControl: true
    }).setView(defaultCoords, 11);
    window.__mappetsCommerceMap = map;

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    var marker = null;

    function setPoint(lat, lng) {
      var fixedLat = Number(lat).toFixed(7);
      var fixedLng = Number(lng).toFixed(7);
      latitudeInput.value = fixedLat;
      longitudeInput.value = fixedLng;

      if (!marker) {
        marker = window.L.marker([fixedLat, fixedLng]).addTo(map);
      } else {
        marker.setLatLng([fixedLat, fixedLng]);
      }

      if (mapStatus) {
        mapStatus.textContent = 'Ubicacion seleccionada: lat ' + fixedLat + ', lng ' + fixedLng + '.';
        mapStatus.classList.remove('error');
      }
    }

    map.on('click', function (event) {
      setPoint(event.latlng.lat, event.latlng.lng);
    });

    if (currentLocationButton && navigator.geolocation) {
      currentLocationButton.addEventListener('click', function () {
        currentLocationButton.disabled = true;
        navigator.geolocation.getCurrentPosition(
          function (position) {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            map.flyTo([lat, lng], 15);
            setPoint(lat, lng);
            currentLocationButton.disabled = false;
          },
          function () {
            if (mapStatus) {
              mapStatus.textContent = 'No pudimos obtener tu ubicacion actual. Selecciona el punto manualmente en el mapa.';
              mapStatus.classList.add('error');
            }
            currentLocationButton.disabled = false;
          },
          {
            enableHighAccuracy: true,
            timeout: 10000
          }
        );
      });
    }

    if (latitudeInput.value && longitudeInput.value) {
      setPoint(latitudeInput.value, longitudeInput.value);
      map.setView([Number(latitudeInput.value), Number(longitudeInput.value)], 15);
    }

    setTimeout(function () {
      map.invalidateSize();
    }, 120);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initDeletionForm();
    initSupportForm();
    initCommerceRequestForm();
    initCommerceMap();
  });
})();
