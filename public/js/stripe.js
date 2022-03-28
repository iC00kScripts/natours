export const bookTour = async (tourId) => {
  const stripe = Stripe(
    'pk_test_51KiLedI6D9MKRtdHo7O5ExONzzdsNWDQOoQDRyALMMUUAE8nNBh4GK8m9vJsoL2nClTnF6KmCA3Sku5whZVJWPzZ00f69NUiMb'
  );
  //get checkout session from the server
  const session = await fetch(
    `http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  let data = await session.json();
  console.log(data);

  //create a checkout form and charge card
};
