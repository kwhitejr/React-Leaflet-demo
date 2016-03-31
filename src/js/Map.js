// this is the Map component for React!
// import some dependencies
var React = require('react');
var ReactDOM = require('react-dom');
var L = require('leaflet');
var qwest = require('qwest');

// add our subway line filter component
var Filter = require('./Filter');

// let's store the map configuration properties,
// we could also move this to a separate file & require it
var config = {};

// a local variable to store our instance of L.map
var map;

// map paramaters to pass to L.map when we instantiate it
config.params = {
  center: [21.289373, -157.917480],
  zoomControl: false,
  zoom: 9,
  // maxZoom: 19,
  // minZoom: 11,
  scrollWheelZoom: false,
  legends: true,
  infoControl: false,
  attributionControl: true
};

// params for the L.tileLayer (aka basemap)
config.tileLayer = {
  url: 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}',
  params: {
    minZoom: 5,
    attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'mapbox.light',
    accessToken: 'pk.eyJ1Ijoia3doaXRlanIiLCJhIjoiY2ltNXdqdGFwMDFzanRzbTRwOW52N2syZCJ9.8tgIWcf7d9ZyJ3gjtOssaQ'
  }
};

// here's the actual component
var Map = React.createClass({
  getInitialState: function() {
    // TODO: if we wanted an initial "state" for our map component we could add it here
    return {
      tileLayer : null,
      geojsonLayer: null,
      geojson: null,
      filter: '*',
      numEntrances: null,
    };
  },

  componentWillMount: function() {

    // code to run just before adding the map

  },

  componentDidMount: function() {

    // code to run just after adding the map to the DOM
    // instantiate the Leaflet map object
    this.init(this.getID());
    // make the Ajax request for the GeoJSON data
    this.getData();
  },

  componentWillReceiveProps: function() {

    // code to run just before updating the map

  },

  componentWillUnmount: function() {

    // code to run just before removing the map

  },

  updateMap: function(line) {
    // change the subway line filter


    this.getData();
  },

  getData: function() {
    var that = this;

    // qwest is a library for making Ajax requests, we use it here to load GeoJSON data
    qwest.get('hshd.geojson', null, { responseType : 'json' })
      .then(function(xhr, res) {

        if (that.isMounted()) {
          // count the number of features and store it in the component's state for use later
          // that.state.numEntrances = res.features.length;
          // that.setState({ numEntrances: that.state.numEntrances });
          // use the component's addGeoJSON method to add the GeoJSON data to the map
          that.addGeoJSON(res);
        }
      })
      .catch(function(xhr, res, e) {
        console.log('qwest catch: ', xhr, res, e);
      });
  },

  addGeoJSON: function(data) {
    this.state.geojson = data;

    // if the GeoJSON layer has already been created, clear it.
    // this allows the GeoJSON to be redrawn when the user filters it
    if (this.state.geojsonLayer && data){
      // remove the data from the geojson layer
      this.state.geojsonLayer.clearLayers();
      this.state.geojsonLayer.addData(data);
    } else if (!this.state.geojsonLayer) {
      // add our GeoJSON to the component's state and the Leaflet map
      this.state.geojsonLayer = L.geoJson(data, {
        onEachFeature: this.onEachFeature,
        style: this.style
        // pointToLayer: this.pointToLayer,
        // filter: this.filter
      }).addTo(map);
    }

    // set our component's state with the GeoJSON data and L.geoJson layer
    this.setState({
      geojson: this.state.geojson,
      geojsonLayer: this.state.geojsonLayer
    });

    // fit the filtered geojson within the map's bounds
    // this.zoomToFeature(this.state.geojsonLayer);
  },

  style: function (feature) {
    return {
      fillColor: this.getColor(feature.properties.objectid),
      "color": "#ffffff",
      "opacity": 1,
      "weight": 1,
      "fillOpacity": 0.7
    };
  },

  getColor: function (d) {
    return d > 21  ? '#800026' :
           d > 18  ? '#BD0026' :
           d > 15  ? '#E31A1C' :
           d > 12  ? '#FC4E2A' :
           d > 9  ? '#FD8D3C' :
           d > 6  ? '#FEB24C' :
           d > 3   ? '#FED976' :
                     '#FFEDA0';
  },

  zoomToFeature: function(target) {
    // pad fitBounds() so features aren't hidden under the Filter UI element
    var fitBoundsParams = {
      paddingTopLeft: [200,10],
      paddingBottomRight: [10,10]
    };
    map.fitBounds(target.getBounds(), fitBoundsParams);
  },

  // filter: function(feature, layer) {
  //   // filter the subway entrances based on the map's current search filter
  //   // returns true only if the filter value matches the value of feature.properties.LINE
  //   var test = feature.properties.LINE.split('-').indexOf(this.state.filter);

  //   if (this.state.filter === '*' || test !== -1) {
  //     return true;
  //   }
  // },

  // pointToLayer: function(feature, latlng) {
  //   // renders our GeoJSON using circle markers, rather than
  //   // Leaflet's default image markers typically used to represent points

  //   // parameters to style the GeoJSON markers
  //   var markerParams = {
  //     radius: 4,
  //     fillColor: 'orange',
  //     color: '#fff',
  //     weight: 1,
  //     opacity: 0.5,
  //     fillOpacity: 0.8
  //   };

  //   return L.circleMarker(latlng, markerParams);
  // },

  onEachFeature: function(feature, layer) {
    // this method is used to create popups for the GeoJSON features

  },

  getID: function() {
    // get the "id" attribute of our component's DOM node
    return ReactDOM.findDOMNode(this).querySelectorAll('#map')[0];
  },

  init: function(id) {
    // this function creates the Leaflet map object and is called after the Map component mounts
    map = L.map(id, config.params);
    L.control.zoom({ position: "bottomleft"}).addTo(map);
    L.control.scale({ position: "bottomleft"}).addTo(map);

    // set our state to include the tile layer
    this.state.tileLayer = L.tileLayer(config.tileLayer.url, config.tileLayer.params).addTo(map);

    this.setState({
      tileLayer: this.state.tileLayer
    });
  },

  render : function() {
    // return our JSX that is rendered to the DOM
    // we pass our Filter component props such as subwayLines array, filter & updateMap methods
    return (
      <div id="mapUI">
        <div id="map"></div>
      </div>
    );
  }
});


// export our Map component so that Browserify can include it with other components that require it
module.exports = Map;