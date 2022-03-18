export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoibjI2dDI3NCIsImEiOiJjbDB1MWc2cHcwaTU4M2pueWFtb2luM210In0.AP8PK2VmZP0_PGKF8hkIpA';
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/n26t274/cl0u2ygzj005315p55cds3i6s',
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();
  locations.forEach((loc) => {
    //create marker
    const el = document.createElement('div');
    el.className = 'marker';

    //add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    //add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    //extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 100,
      left: 100,
      right: 100,
    },
  });
};
