var app = angular.module("Collection", []); 
app.controller("myCtrl", function($scope) {
  $scope.compact = window.innerWidth <= 500;
  XHR.setCallback(function(data){
    const results = JSON.parse(data).results;
    console.log(results);
    $scope.$apply(function() {
      $scope.bottles = results;
    });
  });
  XHR.GET('/parse/classes/RootBeer');

  $scope.itemSelected = function(item) {
    $scope.selection = item;
    if (item.photo !== undefined) {
      console.log(item.photo.url);
    }
  }

  $scope.close = function() {
    $scope.selection = undefined;
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
      callback(_self.xhttp.responseText);
    }
  };
}

XHR.GET = function(path, callback) {
  let url = new URL(Config.getUrl() + path);
  url.searchParams.set("order","name");
  this.xhttp.open("GET", url);
  this.xhttp.setRequestHeader("X-Parse-Application-Id", Config.getAppId());
  this.xhttp.setRequestHeader("Content-type", "application/json");
  this.xhttp.send(null);
}