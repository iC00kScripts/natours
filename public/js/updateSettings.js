import { showAlert } from './alerts';

//type is either password or data
//data is the data object
export const updateSettings = async (type, data) => {
  const dt = { ...data };
  console.log(dt);
  try {
    let url = 'http://localhost:3000/api/v1/users/';
    url += type === 'data' ? 'updateMe' : 'updatePassword';

    let response = await fetch(url, {
      method: 'PATCH',
      // headers: {
      //   'content-type': 'application/json',
      // },
      body: dt, //JSON.stringify(dt),
    });
    if (!response.ok) throw response;
    let data = await response.json();

    if (data.status === 'success') {
      showAlert('success', `Updated User ${type} successfully`, 2000);
    }
  } catch (err) {
    err.text().then((errorMessage) => {
      showAlert('error', JSON.parse(errorMessage).message, 5000);
    });
  }
};
