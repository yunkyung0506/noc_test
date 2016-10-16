(function () {
  'use strict';

  angular
    .module('power-plant')
    .controller('State2_3Controller', State2_3Controller);

  /** @ngInject */
  function State2_3Controller($log, $timeout, energyService, c3, $scope, $http, utilService, $rootScope, $interval) {
    var vm = this;
    vm._ = _;

    console.log("# Solar. state2-3 Controller.");

    $interval(function () {
      vm.nowDateTime = moment().format('YYYY-MM-DD h:mm:ss');
      // vm.currentTime = moment().format('h:mm:ss');
    }, 1000);
    vm.currentDay = moment().format('YYYY.MM.DD');

    vm.afterTime = moment().format('h:mm');
    vm.beforeTime = moment().subtract(1, 'hours').format('h:mm');

    vm.consumerBeginNumber = 0;


    getDemandData();
    function getDemandData(){
      $http({
        method: 'GET',
        url: 'http://api.ourwatt.com/nvpp/noc/solar/vision/5',
        headers: {
          api_key: 'smartgrid'
        }
      }).then(function(resp) {

        //전력 데이터 집합
        vm.solarDemandData = resp.data.list;

        //중앙 원형 그래프 %
        vm.gageCurrentDevelop = vm.solarDemandData.nega_watt_rate;

        if (vm.solarDemandData.event.event_status == 'A') {
          vm.emergencyStartDate = moment(vm.solarDemandData.event.event_start).format('YYYY.MM.DD');
          vm.emergencyStartime = moment(vm.solarDemandData.event.event_start).format('hh:mm');
          vm.emargencyEndtime = moment(vm.solarDemandData.event.event_start).add(vm.solarDemandData.event.event_duration, 'h').format('hh:mm');
        }


      }, function errorCallback(response) {
        $log.debug('ERRORS:: ', response);
      });

      $timeout(getDemandData, 900000);
    }

    vm.currentTime = moment().format('YYYY-MM-DD hh:mm:ss');

    vm.timeX = ['x',
                  '00:00', '00:15', '00:30', '00:45', '01:00', '01:15', '01:30', '01:45',
                  '02:00', '02:15', '02:30', '02:45', '03:00', '03:15', '03:30', '03:45',
                  '04:00', '04:15', '04:30', '04:45', '05:00', '05:15', '05:30', '05:45',
                  '06:00', '06:15', '06:30', '06:45', '07:00', '07:15', '07:30', '07:45',
                  '08:00', '08:15', '08:30', '08:45', '09:00', '09:15', '09:30', '09:45',
                  '10:00', '10:15', '10:30', '10:45', '11:00', '11:15', '11:30', '11:45',
                  '12:00', '12:15', '12:30', '12:45', '13:00', '13:15', '13:30', '13:45',
                  '14:00', '14:15', '14:30', '14:45', '15:00', '15:15', '15:30', '15:45',
                  '16:00', '16:15', '16:30', '16:45', '17:00', '17:15', '17:30', '17:45',
                  '18:00', '18:15', '18:30', '18:45', '19:00', '19:15', '19:30', '19:45',
                  '20:00', '20:15', '20:30', '20:45', '21:00', '21:15', '21:30', '21:45',
                  '22:00', '22:15', '22:30', '22:45', '23:00', '23:15', '23:30', '23:45'
                ];


    //중앙 상단 라인차트
    drawLineChart();
    function drawLineChart(){
      $http({
        method: 'GET',
        url: 'http://api.ourwatt.com/nvpp/noc/solar/energy/5',
        headers: {
          api_key: 'smartgrid'
        }
      }).then(function(resp) {

        vm.energyResources = resp.data.data;

        var avg = ['avg'];
        var watt = ['발전량'];

        for (var i=0; i<vm.energyResources.length; i++) {
          avg.push(vm.energyResources[i].dem_cbl);
          watt.push(vm.energyResources[i].dem_watt);

          if(vm.energyResources[i].dem_watt != null){
            vm.currentXtime = vm.energyResources[i].dem_date;
            vm.currentXtime8 = vm.energyResources[i].dem_date;
          }
        }

        //죄측상단 미니막대그래프 8개
        utilService.drawMiniEightChart('#chartbar1', vm);

        //중앙상단 라인차트
        utilService.drawTopLineChart('#resource-graph', avg, watt, vm);

      }, function errorCallback(response) {
        $log.debug('ERRORS:: ', response);
      });

      $timeout(drawLineChart, 900000);
    }



    //중앙 하단 막대그래프, 수용가 건물 리스트
    getSolarConsumers();
    function getSolarConsumers() {

      vm.consumerBeginNumber = 0;

      $http({
        method: 'GET',
        url: 'http://api.ourwatt.com/nvpp/noc/solar/resources/5/consumers',
        headers: {
          api_key: 'smartgrid'
        }
      }).then(function(resp) {
        vm.resourcesConsumers = resp.data.list;

        for (var i=0; i<vm.resourcesConsumers.length; i++) {

          var currentConsumer = vm.resourcesConsumers[i];

          // 가동률
          try{
             vm.resourcesConsumers[i].operateRatio = currentConsumer.ac / currentConsumer.goal * 100;
          }catch(e){
             vm.resourcesConsumers[i].operateRatio = 0;
            $log.error('ERRORS:: ', e);
          }

          //최소한계출력 라인
          vm.resourcesConsumers[i].line2 = 442;
        }


        //페이징
        vm.currentPage = 1;
        if (vm.resourcesConsumers.length%6 != 0) vm.consumerPageNum = parseInt(vm.resourcesConsumers.length/6 +1);
        else vm.consumerPageNum = parseInt(vm.resourcesConsumers.length/6);

        // Tim 수정. 이전페이지 다음페이지가 있을 경우에만 클릭동작, 버튼 on 작업
        vm.existPrevPage = false;
        vm.existNextPage = false;

        if(vm.resourcesConsumers.length > 6)vm.existNextPage = true;

        utilService.buttonCtrl(vm);


      }, function errorCallback(response) {
        $log.debug('ERRORS:: ', response);
        vm.error = response;
        utilService.buttonCtrl(vm);
      });

      $timeout(getSolarConsumers, 900000);
    }


     vm.clickedR = function () {
        if (vm.currentPage < vm.consumerPageNum) {  //다음 페이지가 있음
          vm.consumerBeginNumber = vm.consumerBeginNumber+6;
          vm.currentPage = vm.currentPage+1;
          $rootScope.$broadcast('consumerBeginNumber-changedR', {
            consumerBeginNumber: vm.consumerBeginNumber
          });

          if(vm.currentPage < vm.consumerPageNum){  //또 다음 페이지가 있음
            vm.existPrevPage = true;
            vm.existNextPage = true;
          }else{
            vm.existPrevPage = true;
            vm.existNextPage = false;
          }

        } else if (vm.currentPage == vm.consumerPageNum) { //없음
          //alert
          alert('last page!!');
        }

        utilService.buttonCtrl(vm);

      };

      vm.clickedL = function () {
        if (vm.currentPage > 1) { //이전 페이지가 있음
          vm.consumerBeginNumber = vm.consumerBeginNumber-6;
          vm.currentPage = vm.currentPage-1;
          $rootScope.$broadcast('consumerBeginNumber-changedL', {
            consumerBeginNumber: vm.consumerBeginNumber
          });

          if(vm.currentPage > 1){  //또 이전 페이지가 있음
            vm.existPrevPage = true;
            vm.existNextPage = true;
          }else{
            vm.existPrevPage = false;
            vm.existNextPage = true;
          }

        } else if (vm.currentPage == 1) { //없음
          //alert
          alert('first page!!');
        }

        utilService.buttonCtrl(vm);
      };



    $scope.$on('consumerBeginNumber-changedR', function(event, args) {
      vm.consumerBeginNumber = args.consumerBeginNumber;
      $log.debug('vm.consumerBeginNumber:', vm.consumerBeginNumber);
    });

    $scope.$on('consumerBeginNumber-changedL', function(event, args) {
      vm.consumerBeginNumber = args.consumerBeginNumber;
      $log.debug('vm.consumerBeginNumber:', vm.consumerBeginNumber);
    });




  }
})();
