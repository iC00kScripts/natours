import { login, logout } from './login';
import { displayMap } from './mapbox';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const userDataForm = document.querySelector('.form-user-data');
const userPswForm = document.querySelector('.form-user-settings');
const logoutBtn = document.querySelector('.nav__el--logout');
const bookBtn = document.getElementById('book-tour');

if (mapBox) {
  const locs = JSON.parse(mapBox.dataset.locations);
  displayMap(locs);
}

if (loginForm) {
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logoutBtn) logoutBtn.addEventListener('click', logout);

if (userDataForm) {
  userDataForm.addEventListener('submit', async function (e) {
    if (!e.target.classList.contains('form-user-data')) {
      return;
    }
    e.preventDefault();
    document.querySelector('.btn--save-settings').textContent = 'UPDATING...';
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const photo = document.getElementById('photo').files[0];
    await updateSettings('data', { name, email, photo });
    document.querySelector('.btn--save-settings').textContent = 'SAVE SETTINGS';
    location.reload(true);
  });
}

if (userPswForm) {
  userPswForm.addEventListener('submit', async function (e) {
    // guard to check if different form submitted
    if (!e.target.classList.contains('form-user-settings')) {
      return;
    }
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'UPDATING...';
    const oldPassword = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings('password', {
      oldPassword,
      password,
      passwordConfirm,
    });

    document.querySelector('.btn--save-password').textContent = 'SAVE PASSWORD';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if (bookBtn) {
  bookBtn.addEventListener('click', async function (e) {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    await bookTour(tourId);
  });
}
