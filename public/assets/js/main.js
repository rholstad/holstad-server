var app = angular.module("Collection", ['ngRoute']); 

app.config(['$locationProvider', function($locationProvider) {
  $locationProvider.html5Mode(true);
}]);
app.controller("myCtrl", function($scope, $route, $routeParams, $location) {
  $scope.compact = window.innerWidth <= 500;
  $scope.$route = $route;
  $scope.$location = $location;
  $scope.$routeParams = $routeParams;

  $scope.metaTitle = function() {
    if ($scope.selection !== undefined) {
      return $scope.selection.name;
    }else {
      return "Steph and Ryan's Root Beer Collection";
    }
  }

  XHR.GET('/parse/classes/RootBeer', function(data) {
    const results = JSON.parse(data).results;
    $scope.$apply(function() {
      $scope.bottles = results;
      if ($scope.$location.search().bottle !== undefined) {
        var bottle = results.filter(function(bottle) {
          return bottle.name == $scope.$location.search().bottle;
        })[0];
        if (bottle !== undefined) {
          loadBottle(bottle);
        }
      }
    });
  });

  $scope.itemSelected = function(item) {
    $scope.selection = item;
    if (item.purchaseGeoLocation !== undefined || item.breweryGeoLocation !== undefined) {
      initialize();
    }
  }

  $scope.addPressed = function() {
    $scope.addNew = true;
    $scope.selection = undefined;
  }

  $scope.close = function() {
    $scope.selection = undefined;
    $scope.addNew = false;
  }
});

app.directive('myDirective', ['$window', function ($window) {

  return {
     link: link,
     restrict: 'E',
     template: '<div>window size: {{width}}px</div>'
  };

  function link(scope, element, attrs){

    scope.width = $window.innerWidth;

    angular.element($window).bind('resize', function(){

      scope.compact = $window.innerWidth <= 500;

      // manual $digest required as resize event
      // is outside of angular
      scope.$digest();
    });

  }

}]);

function loadBottle(item) {
  var scope = angular.element($("#outer")).scope();
  setTimeout(function(){ 
    scope.$apply(function() {
      scope.itemSelected(item); 
    });
  }, 0);
}

function submitNew() {
  const value = function(id) {
    let val = document.getElementById(id).value;
    return val.length > 0 ? val : undefined;
  }
  const number = function(id) {
    let val = value(id);
    return val ? parseFloat(val) : undefined;
  }
  const date = function(id) {
    let val = value(id);
    if (val) {
      let date = new Date();
      let selection = new Date(val);
      date.setFullYear(selection.getUTCFullYear);
      date.setMonth(selection.getUTCMonth);
      date.setDate(selection.getUTCDate);
      return date;
    }else {
      return undefined;
    }
  }
  const file = function(id) {
    return document.getElementById(id).files[0];
  }
  
  const name = value("name");
  const rating = number("rating");
  const sugars = number("sugars");
  const notes = value("notes");
  const purchaseDate = date("purchaseDate");
  const image = file("image");

  let data = {name: name};

  if (rating) {
    data.rating = rating;
  }

  if (sugars) {
    data.sugars = sugars;
  }

  if (notes) {
    data.notes = notes;
  }

  if (purchaseDate) {
    data.purchaseDate = purchaseDate
  }

  if (image) {
    var reader = new FileReader();
    reader.readAsArrayBuffer(image);
    reader.onload = function(e) {
        XHR.FILE('image.jpeg',e.target.result, function(callback) {
          let callbackData = JSON.parse(callback);
          data.photo = {
            name: callbackData.name,
            url: callbackData.url,
            __type: 'File'
          }
          XHR.POST('/parse/classes/RootBeer', data, function(callback) {
            refresh();
          });
        });
    };
  }else {
    XHR.POST('/parse/classes/RootBeer', data, function(callback) {
      refresh();
    });
  }
}

function refresh() {
  var scope = angular.element($("#outer")).scope();
  scope.selection = undefined;
  scope.addNew = false;
  XHR.GET('/parse/classes/RootBeer', function(data) {
    const results = JSON.parse(data).results;
    scope.$apply(function() {
      scope.bottles = results;
      if (scope.$location.search().bottle !== undefined) {
        var bottle = results.filter(function(bottle) {
          return bottle.name == scope.$location.search().bottle;
        })[0];
        if (bottle !== undefined) {
          loadBottle(bottle);
        }
      }
    });
  });
}

/**
 * Config
 */

var Config = {}

Config.getUrl = function() {
  if (url) return url;
  var port = window.location.port;
  var url = window.location.protocol + '//' + window.location.hostname;
  if (port) url = url + ':' + port;
  return url;
}

Config.getAppId = function() {
  return "0zWVMTCav5xJBhq6zH5h";
}


/**
 * XHR object
 */

var XHR = {}

XHR.setCallback = function(callback) {
  this.xhttp = new XMLHttpRequest();
  var _self = this;
  this.xhttp.onreadystatechange = function() {
    if (_self.xhttp.readyState == 4 && _self.xhttp.status >= 200 && _self.xhttp.status <= 299) {
      if (callback) {
        callback(_self.xhttp.responseText);
      }
    }
  };
}

XHR.GET = function(path, callback) {
  XHR.setCallback(callback);
  let url = new URL(Config.getUrl() + path);
  url.searchParams.set("order","name");
  url.searchParams.set("limit", 1000);
  this.xhttp.open("GET", url, true);
  this.xhttp.setRequestHeader("X-Parse-Application-Id", Config.getAppId());
  this.xhttp.setRequestHeader("Content-type", "application/json");
  this.xhttp.send(null);
}

XHR.POST = function(path, data, callback) {
  XHR.setCallback(callback);
  let url = new URL(Config.getUrl() + path);
  url.data = data;
  this.xhttp.open("POST", url), true;
  this.xhttp.setRequestHeader("X-Parse-Application-Id", Config.getAppId());
  this.xhttp.setRequestHeader("Content-type", "application/json");
  this.xhttp.send(JSON.stringify(data));
}

XHR.FILE = function(filename, data, callback) {
  XHR.setCallback(callback);
  let url = new URL(Config.getUrl() + '/parse/files/' + filename);
  this.xhttp.open("POST", url, true);
  this.xhttp.setRequestHeader("X-Parse-Application-Id", Config.getAppId());
  this.xhttp.setRequestHeader("Content-type", "image/jpeg");
  this.xhttp.send(data);
}

/**
 * Map
 */

// Escapes HTML characters in a template literal string, to prevent XSS.
// See https://www.owasp.org/index.php/XSS_%28Cross_Site_Scripting%29_Prevention_Cheat_Sheet#RULE_.231_-_HTML_Escape_Before_Inserting_Untrusted_Data_into_HTML_Element_Content
function sanitizeHTML(strings) {
  const entities = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};
  let result = strings[0];
  for (let i = 1; i < arguments.length; i++) {
    result += String(arguments[i]).replace(/[&<>'"]/g, (char) => {
      return entities[char];
    });
    result += strings[i];
  }
  return result;
}

function loadScript(script_url)
{
    var head= document.getElementsByTagName('head')[0];
    var script= document.createElement('script');
    script.type= 'text/javascript';
    script.src= script_url;
    head.appendChild(script);
}


function initialize() {
  if (mapInitialized == false) {
    loadScript('https://maps.googleapis.com/maps/api/js?key=AIzaSyAwhBUkqH5KnJnVLYd4kdzJxGB38OuaYHM&callback=initMap');
  }else {
    setTimeout(function(){ initMap(); }, 0);
  }
}

mapInitialized = false;
function initMap() {
  if (document.getElementById('map') === null) return;

  mapInitialized = true;
  
  // Create the map.
  const map = new google.maps.Map(document.getElementById('map'), {
    styles: mapStyle,
    restriction: {
      latLngBounds: {
          north: 85,
          south: -85,
          west: -180,
          east: 180
      }
    }
  });

  var sel = 'div[ng-controller="myCtrl"]';
  var scope = angular.element(sel).scope();

  // Load the locations' GeoJSON onto the map.
  if (scope.selection.purchaseGeoLocation !== undefined) {
    var geoJSON = createGeoJson(scope.selection.purchaseGeoLocation, "purchased", "Purchase Location", scope.selection.purchaseLocation);
    map.data.addGeoJson(geoJSON);
  }
  if (scope.selection.breweryGeoLocation !== undefined) {
    var geoJSON = createGeoJson(scope.selection.breweryGeoLocation, "brewed", "Brewery Location", scope.selection.breweryLocation);
    map.data.addGeoJson(geoJSON);
  }

  // Define the custom marker icons, using the "category".
  map.data.setStyle(feature => {
    return {
      icon: {
        url: `public/assets/images/icon_${feature.getProperty('category')}.png`,
        scaledSize: new google.maps.Size(64, 64)
      }
    };
  });

  const infoWindow = new google.maps.InfoWindow();
  infoWindow.setOptions({pixelOffset: new google.maps.Size(0, -30)});

  // Show the information for a store when its marker is clicked.
  map.data.addListener('click', event => {

    const description = event.feature.getProperty('description');
    const name = event.feature.getProperty('name');
    const position = event.feature.getGeometry().get();
    const content = sanitizeHTML`
      <div>
        <h5>${description}</h5>
        <p>${name}</p>
      </div>
    `;

    infoWindow.setContent(content);
    infoWindow.setPosition(position);
    infoWindow.open(map);
  });


  zoom(map);
}

/**
 * Update a map's viewport to fit each geometry in a dataset
 * @param {google.maps.Map} map The map to adjust
 */
function zoom(map) {
  var bounds = new google.maps.LatLngBounds();
  map.data.forEach(function(feature) {
    processPoints(feature.getGeometry(), bounds.extend, bounds);
  });
  map.fitBounds(bounds);
}

/**
 * Process each point in a Geometry, regardless of how deep the points may lie.
 * @param {google.maps.Data.Geometry} geometry The structure to process
 * @param {function(google.maps.LatLng)} callback A function to call on each
 *     LatLng point encountered (e.g. Array.push)
 * @param {Object} thisArg The value of 'this' as provided to 'callback' (e.g.
 *     myArray)
 */
function processPoints(geometry, callback, thisArg) {
  if (geometry instanceof google.maps.LatLng) {
    callback.call(thisArg, geometry);
  } else if (geometry instanceof google.maps.Data.Point) {
    callback.call(thisArg, geometry.get());
  } else {
    geometry.getArray().forEach(function(g) {
      processPoints(g, callback, thisArg);
    });
  }
}

function createGeoJson(geoLocation, category, description, name) {
  return {
    "geometry": {
      "type": "Point",
      "coordinates": [
        geoLocation.longitude,
        geoLocation.latitude
      ]
    },
    "type": "Feature",
    "properties": {
      "category": category,
      "description": description,
      "name": name
    }
  }
}

const mapStyle = [
  {
    "featureType": "administrative",
    "elementType": "all",
    "stylers": [
      {
        "visibility": "on"
      },
      {
        "lightness": 33
      }
    ]
  },
  {
    "featureType": "landscape",
    "elementType": "all",
    "stylers": [
      {
        "color": "#f2e5d4"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#c5dac6"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels",
    "stylers": [
      {
        "visibility": "on"
      },
      {
        "lightness": 20
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "all",
    "stylers": [
      {
        "lightness": 20
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#c5c6c6"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e4d7c6"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#fbfaf7"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "all",
    "stylers": [
      {
        "visibility": "on"
      },
      {
        "color": "#acbcc9"
      }
    ]
  }
];