import { showAlert } from './alerts';

export const updateData = async (name, email) => {
  try {
    const response = await fetch(
      'http://localhost:3000/api/v1/users/updateMe',
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ name, email }),
      }
    );
    if (!response.ok) throw response;
    const data = await response.json();

    if (data.status === 'success') {
      window.location.reload(true);
      showAlert('success', 'Updated User data successfully', 2000);
    }
  } catch (err) {
    err.text().then((errorMessage) => {
      showAlert('error', JSON.parse(errorMessage).message, 5000);
    });
  }
};
