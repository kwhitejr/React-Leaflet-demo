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
  zoom: 10,
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

  updateMap: function() {
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
          that.state.numberOfDistricts = res.features.length;
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
    var geojsonLayer = this.state.geojsonLayer;

    // if the GeoJSON layer has already been created, clear it.
    // this allows the GeoJSON to be redrawn when the user filters it
    if (geojsonLayer && data){
      // remove the data from the geojson layer
      geojsonLayer.clearLayers();
      geojsonLayer.addData(data);
    } else if (!geojsonLayer) {
      // add our GeoJSON to the component's state and the Leaflet map
      geojsonLayer = L.geoJson(data, {
        onEachFeature: this.onEachFeature,
        style: this.style
        // pointToLayer: this.pointToLayer,
        // filter: this.filter
      }).addTo(map);
    }

    // set our component's state with the GeoJSON data and L.geoJson layer
    this.setState({
      geojson: data,
      geojsonLayer: geojsonLayer
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
    return d > 35  ? '#08519c' :
           d > 28  ? '#3182bd' :
           d > 21  ? '#6baed6' :
           d > 14  ? '#9ecae1' :
           d > 7   ? '#c6dbef' :
                     '#eff3ff';
  },

  highlightFeature: function (e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }

    this.info.update(layer.feature.properties);
  },

  resetHighlight: function (e) {
    this.state.geojsonLayer.resetStyle(e.target);

    this.info.update();
  },

  zoomToFeature: function (e) {
    map.fitBounds(e.target.getBounds());
  },

  onEachFeature: function (feature, layer) {
    layer.on({
      mouseover: this.highlightFeature,
      mouseout: this.resetHighlight,
      click: this.zoomToFeature
    });
  },

  getID: function() {
    // get the "id" attribute of our component's DOM node
    return ReactDOM.findDOMNode(this).querySelectorAll('#map')[0];
  },

  init: function(mapElement) {
    // this function creates the Leaflet map object and is called after the Map component mounts
    map = L.map(mapElement, config.params);
    L.control.zoom({ position: "bottomleft" }).addTo(map);
    L.control.scale({ position: "bottomleft" }).addTo(map);

    // set our state to include the tile layer
    this.state.tileLayer = L.tileLayer(config.tileLayer.url, config.tileLayer.params).addTo(map);

    // Top right info panel
    var info = this.info = L.control();
    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
        this.update();
        return this._div;
    };
    // method that we will use to update the control based on feature properties passed
    info.update = function (props) {
        this._div.innerHTML = '<h4>Hawaii House Districts</h4>' +  (props ?
            '<b>House District ' + props.objectid + '</b>'
            : 'Hover over a district!');
    };
    info.addTo(map);

    // bottom right legend panel
    var legend = L.control({position: 'bottomright'});
    var _this = this;

    legend.onAdd = function (map) {

      var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 7, 14, 21, 28, 35],
        labels = [];

      // loop through our density intervals and generate a label with a colored square for each interval
      for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
          '<i style="background:' + _this.getColor(grades[i] + 1) + '"></i> ' +
          grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
      }

      return div;
    };

    legend.addTo(map);



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