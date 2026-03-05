/* eslint-disable */
export const displayMap = (locations) => {
mapboxgl.accessToken = 
'pk.eyJ1IjoicHJpbmNlaWMxNSIsImEiOiJjbWZ4ajU5YTUwN3NhMmtzYmcxdXo3dnJnIn0.jbovYmPq7cdtctsi8NqUow';
var map = new mapboxgl.Map({
        container: 'map', // container ID
        style: 'mapbox://styles/mapbox/streets-v12',// style URL
        scrollZoom: false
        //center: [-118.488700, 34.114461], // starting position [lng, lat]. Note that lat must be set between -90 and 90
        //zoom: 10 // starting zoom
});
//Basically the area that displays in map
const bounds = new mapboxgl.LngLatBounds();

locations.forEach(loc => {
    // Create Marker
    const el = document.createElement('div');
    el.className = 'marker';
// map variable is the map that already you created
//Add marker
    new mapboxgl.Marker({
        element: el,
        anchor: 'bottom'
    })
    .setLngLat(loc.coordinates)
    .addTo(map);

    //Add Popup
    new mapboxgl.Popup({
        offset: 30
    })
    .setLngLat(loc.coordinates)
    .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
    .addTo(map);
//Extend map bounds to include current location
    bounds.extend(loc.coordinates)
    
});

map.fitBounds(bounds, {
        padding:{
        top:200,
        bottom: 150,
        left:100,
        right: 100
        }
    });
}

