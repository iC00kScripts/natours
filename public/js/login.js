import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const response = await fetch('/api/v1/users/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw response;
    const data = await response.json();

    if (data.status === 'success') {
      window.setTimeout(() => {
        location.assign('/');
      }, 500);
      showAlert('success', 'Logged in successfully');
    }
  } catch (err) {
    err.text().then((errorMessage) => {
      showAlert('error', JSON.parse(errorMessage).message, 5000);
    });
  }
};

export const logout = async () => {
  try {
    const response = await fetch('/api/v1/users/logout', {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
      },
    });
    if (!response.ok) throw response;
    const data = await response.json();

    if (data.status === 'success') {
      window.location.replace('/');
      showAlert('success', 'Logged out successfully', 1000);
    }
  } catch (e) {
    showAlert('error', 'Error logging out! Try again.');
  }
};
