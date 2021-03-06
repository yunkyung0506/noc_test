(function () {
  'use strict';

  angular
    .module('power-plant')
    .controller('Main_Controller', Main_Controller);

  /** @ngInject */
  function Main_Controller($log, $timeout, energyService, c3, $scope, $http, utilService) {
    var vm = this;
    vm._ = _;

    console.log("# Main_Controller Controller.");


    //전체데이터 가져오기
    getAllData();
    function getAllData(){
      $http({
        method: 'GET',
        url: 'http://api.ourwatt.com/nvpp/noc/total',
        headers: {
          api_key: 'smartgrid'
        }
      }).then(function(resp) {
        vm.apiData = resp.data;
        vm.avgOperRate = parseInt(parseInt(vm.apiData.sector1.ess_oper_rate + vm.apiData.sector1.solar_oper_rate + vm.apiData.sector1.dr_oper_rate) / 3);


        if(vm.apiData.sector4.nega_watt == 0.0) {
          vm.apiData.sector4.nega_watt = 2.7;
          vm.apiData.sector1.power_mw += 2.7;
        }

        $log.info("Api data load complete.");

      }, function errorCallback(response) {
        $log.debug('ERRORS:: ', response);
      });

      $timeout(getAllData, 900000);
    }


     drawGraph();
     function drawGraph(){
        // ess 하단 그래프
        $http({
             method: 'GET',
             url: 'http://api.ourwatt.com/nvpp/noc/ess/resources/5/consumers',
             headers: {
               api_key: 'smartgrid'
             }
           }).then(function(resp) {
             vm.resourcesConsumersEss = resp.data.list;

             // 수용가명 익명화 처리
             if(vm.resourcesConsumersEss){
               for(var i=0 ; i < vm.resourcesConsumersEss.length ; i++){
                 var cons = vm.resourcesConsumersEss[i];

                 if(cons && cons.cons_name){
                   cons.cons_name = utilService.SHA256(cons.cons_name);
                 }
               }
             }
           }, function errorCallback(response) {
             $log.debug('ERRORS:: ', response);
           });


        // solar 하단 그래프
        $http({
             method: 'GET',
             url: 'http://api.ourwatt.com/nvpp/noc/solar/resources/5/consumers',
             headers: {
               api_key: 'smartgrid'
             }
           }).then(function(resp) {
             vm.resourcesConsumersSolar = resp.data.list;

          // 수용가명 익명화 처리
          if(vm.resourcesConsumersSolar){
            for(var i=0 ; i < vm.resourcesConsumersSolar.length ; i++){
              var cons = vm.resourcesConsumersSolar[i];

              if(cons && cons.cons_name){
                cons.cons_name = utilService.SHA256(cons.cons_name);
              }
            }
          }


           }, function errorCallback(response) {
             $log.debug('ERRORS:: ', response);
           });


        // dr 하단 그래프
        $http({
             method: 'GET',
             url: 'http://api.ourwatt.com/nvpp/noc/5/drtype/2/consumers',
             headers: {
               api_key: 'smartgrid'
             }
           }).then(function(resp) {
             vm.resourcesConsumersDR = resp.data.data;

          // 수용가명 익명화 처리
          if(vm.resourcesConsumersDR){
            for(var i=0 ; i < vm.resourcesConsumersDR.length ; i++){
              var cons = vm.resourcesConsumersDR[i];

              if(cons && cons.cons_name){
                cons.cons_name = utilService.SHA256(cons.cons_name);
              }
            }
          }


           }, function errorCallback(response) {
             $log.debug('ERRORS:: ', response);
           });


           $timeout(drawGraph, 900000);
      }



    $scope.essSmallRotate = calcSmallRotate(180);
    $scope.essLargeRotate = calcLargeRotate(1);

    // 가용량
    // 0 이면 12 부터 시작, +30 -> 한 칸 증가
    function calcSmallRotate(degree) {

      var result;

      if(degree < 180 || degree == 360) {
        result = { 'position' : 'absolute' , '-webkit-transform' : 'rotate('+degree+'deg)' ,'left' : '74px' , 'top': '164px'};
      } else if (degree >= 180) {
        result = { 'position' : 'absolute' , '-webkit-transform' : 'rotate('+degree+'deg)' ,'left' : '74px' , 'top': '164px'};
      }

      return result;
    }

    // 현재 출력
    function calcLargeRotate(flag) {

      var result;

      if(flag == 0) {
        result = { 'position' : 'absolute' , '-webkit-transform' : 'rotate(180deg)' ,'left' : '717px' , 'top': '176px'};
      } else if (flag == 1) {
        result = { 'position' : 'absolute' , '-webkit-transform' : 'rotate(253deg)' ,'left' : '717px' , 'top': '176px'};
      } else if (flag == 2) {
        result = { 'position' : 'absolute' , '-webkit-transform' : 'rotate(318deg)' ,'left' : '717px' , 'top': '176px'};
      } else if (flag == 3) {
        result = { 'position' : 'absolute' , '-webkit-transform' : 'rotate(42deg)' ,'left' : '717px' , 'top': '176px'};
      } else if (flag == 4) {
        result = { 'position' : 'absolute' , '-webkit-transform' : 'rotate(108deg)' ,'left' : '717px' , 'top': '176px'};
      }

      return result;
    }



  console.log();

  }
})();
