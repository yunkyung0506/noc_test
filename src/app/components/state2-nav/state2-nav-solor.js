/**
 * @description : state2-3 태양광 발전 상세 화면. 좌측 부분
 * @author : Tim
 * @date : 2016. 10. 07.
 * @param urlList
 * @return
 */
(function() {
  'use strict';

  angular
    .module('power-plant')
    .directive('state2NavSolar', state2NavSolar)

  /** @ngInject */
  function state2NavSolar() {
    var directive = {
      restrict: 'E',
      templateUrl: 'app/components/state2-nav/state2-nav-solar.html',
      scope: {
        creationDate: '='
      },
      controller: state2NavController,
      controllerAs: 'vm',
      bindToController: true
    };

    return directive;

    /*
     * 화면 좌측 전체
     */
    function state2NavController(moment, $interval, $state, energyService, $timeout, $log, $http) {
      var vm = this;
      vm.currentState = $state.current.name;

      $interval(function () {
        vm.nowDateTime = moment().format('YYYY-MM-DD h:mm:ss');
        // vm.currentTime = moment().format('h:mm:ss');
      }, 1000);
      vm.currentDay = moment().format('YYYY.MM.DD');

      vm.afterTime = moment().format('h:mm');
      vm.beforeTime = moment().subtract(1, 'hours').format('h:mm');


      /*
       * 좌측 상단 미니 막대차트 8개
       */
      miniBarChart();
      function miniBarChart(){
        $http({
          method: 'GET',
          url: 'http://api.ourwatt.com/nvpp/noc/solar/energy/5',
          headers: {
            api_key: 'smartgrid'
          }
        }).then(function(resp) {
          vm.energyResources = resp.data.data;

          var watt = [];
          vm.currentXtime = [];

          for (var i=0; i<vm.energyResources.length; i++) {
            if(vm.energyResources[i].dem_watt != null && vm.energyResources[i].dem_watt != 0){
              watt.push(parseInt(vm.energyResources[i].dem_watt));
              vm.currentXtime.push(vm.energyResources[i].dem_date);
            }
          }
          watt = watt.splice(watt.length-8, 8);
          vm.currentXtime = vm.currentXtime.splice(vm.currentXtime.length-8, 8); //최근 8개 시간만

          var watt8 = ['전력량'];
          watt8 = watt8.concat(watt);
          var currentXtime8 = ['x'];
          currentXtime8 = currentXtime8.concat(vm.currentXtime);

          var chartbar1 = c3.generate({
            bindto: '#chartbar1',
            data: {
              x: 'x',
              columns: [
                currentXtime8, watt8
              ],
              type: 'bar'
            },
            bar: {
              width: 10 // this makes bar width 100px
            },
            size: {
              width: 300,
              height: 120
            },
            color: {
              pattern: ['#bfffff']
            },
            legend: {
              show: false
            },
            axis: {
              x: {
                type: 'categories',
                tick: {
                  rotate: 90
                },
                show: false
              },
              y: {
                show: false
              }
            }
          });
        }, function errorCallback(response) {
          $log.debug('ERRORS:: ', response);
        });

         $timeout(miniBarChart, 900000);
      }


      /*
       * 태양광발전율, 목표, 예측, 발전, 송전
       */
      getCompaniesResources();
      function getCompaniesResources() {
        $http({
          method: 'GET',
          url: 'http://api.ourwatt.com/nvpp/noc/solar/vision/5',
          headers: {
            api_key: 'smartgrid'
          }
        }).then(function(resp) {

          vm.solarDemandData = resp.data.list;

          vm.maxAvailable = 180 * vm.solarDemandData.goal / vm.solarDemandData.max_limit;
          vm.currentWatt = vm.solarDemandData.nega_watt * 100 / vm.solarDemandData.max_limit;

          vm.currentCompanyNegawattSum = vm.solarDemandData.nega_watt;

        }, function errorCallback(response) {
          $log.debug('ERRORS:: ', response);
        });

        /*
         * 급전지시, RESOURCE POOL, COMMUNICATION ZONE
         */
        energyService.companiesResources().then(
          function (resp) {
            vm.companiesResources = resp.companiesResources;
            vm.currentCompanyResources = vm.companiesResources[0];

            for (var i=0; i<vm.currentCompanyResources.events.length; i++) {
              if (vm.currentCompanyResources.events[i].event_status == 'A') {
                vm.emergencyStartDate = moment(vm.currentCompanyResources.event_start).format('YYYY.MM.DD');
                vm.emergencyStartime = moment(vm.currentCompanyResources.event_start).format('hh:mm');
                vm.emargencyEndtime = moment(vm.currentCompanyResources.event_start).add(vm.currentCompanyResources.events[i].event_duration, 'h').format('hh:mm');
              }
            }
          }
        );

        $timeout(getCompaniesResources, 900000);
      }


      /*
       * 오늘 발전 계획(좌측하단 미니 막대그래프)
       */
      getDevelopPlan();
      function getDevelopPlan() {
        energyService.developPlan().then(
          function (resp) {
            vm.developPlan = resp.developPlan[0];

            var chart2Value = ['발전량'];
            for(var i=1; i<10; i++) {
              chart2Value.push(vm.developPlan['0'+i+':00']);
            }
            for(var i=10; i<25; i++) {
              chart2Value.push(vm.developPlan[i+':00']);
            }

            var chartbar2 = c3.generate({
              bindto: '#chartbar2',
              data: {
                x: 'x',
                columns: [
                  ['x', '1:00', '2:00', '3:00', '4:00', '5:00', '6:00', '7:00', '8:00', '9:00', '10:00',' 11:00', '12:00',
                    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '24:00'],
                  chart2Value
                ],
                type: 'bar'
              },
              bar: {
                width: 3 // this makes bar width 100px
              },
              size: {
                width: 280,
                height: 70
              },
              color: {
                pattern: ['#bfffff']
              },
              legend: {
                show: false
              },
              axis: {
                x: {
                  type: 'categories',
                  show: false
                },
                y: {
                  show: false
                }
              }
            });
            //END chart2
          }
        )
      }
    }
  }




})();
