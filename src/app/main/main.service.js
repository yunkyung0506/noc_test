/**
 * Created by rachel.yang on 2016. 7. 6..
 */

(function () {
  'use strict';

  angular
    .module('power-plant')
    .service('energyService', energyService);


  function energyService($log, $http, $q) {
    $log.info("START energyService!!");

    return {

      energyResources: function () {
        var deferred = $q.defer();

        $http({
          method: 'GET',
          url: 'http://api.ourwatt.com/nvpp/energy/resources/5',
          headers: {
            api_key: 'smartgrid'
          }
        }).then(function (resp) {

          $log.info('energyResources:: ', resp.data);
          var energyResources = resp.data.data;
          deferred.resolve({energyResources: energyResources});
        }, function errorCallback(response) {
          $log.debug('ERRORS:: ', response);
        });
        return deferred.promise;
      },

      companiesResources: function () {
        var deferred = $q.defer();

        $http({
          method: 'GET',
          url: 'http://api.ourwatt.com/nvpp/companies/1/resources',
          headers: {
            api_key: 'smartgrid'
          }
        }).then(function (resp) {

          $log.info('companiesResources:: ', resp.data);
          var companiesResources = resp.data.data;
          deferred.resolve({companiesResources: companiesResources});
        }, function errorCallback(response) {
          $log.debug('ERRORS:: ', response);
        });
        return deferred.promise;
      },

      resourcesConsumers: function () {
        var deferred = $q.defer();

        $http({
          method: 'GET',
          url: 'http://api.ourwatt.com/nvpp/resources/5/consumers',
          headers: {
            api_key: 'smartgrid'
          }
        }).then(function (resp) {

          $log.info('resourcesConsumers:: ', resp.data);
          var resourcesConsumers = resp.data.data;
          deferred.resolve({resourcesConsumers: resourcesConsumers});
        }, function errorCallback(response) {
          $log.debug('ERRORS:: ', response);
        });
        return deferred.promise;
      }


    };
  }


})();
