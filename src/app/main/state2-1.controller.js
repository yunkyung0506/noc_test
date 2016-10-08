(function () {
  'use strict';

  angular
    .module('power-plant')
    .controller('State2_1Controller', State2_1Controller);

  /** @ngInject */
  function State2_1Controller($log, $timeout, energyService, c3, $scope, computedService, $http) {
    var vm = this;
    vm._ = _;

    $log.info("# State2_1Controller.");


    /*
     * @description : 수용가 리스트 호출
     * @author : Tim
     * @param drType
     *  - all : 전체
     *  - 0 : 기타자원
     *  - 1 : DR1
     *  - 2 : DR2
     *  - 3 : DR3
     *  - 4 : DR4
     */
    function getConsumerList(drType){

      $log.info("#getConsumerList start. drType : " + drType);

      var url;
      if('all' == drType) url = 'http://api.ourwatt.com/nvpp/noc/dr/resources/5/consumers';
      else url = 'http://api.ourwatt.com/nvpp/noc/5/drtype/'+ drType +'/consumers';

      $http({
        method: 'GET',
        url: url,
        headers: {
          api_key: 'smartgrid'
        }
      }).then(function (resp) {

        vm.resourcesConsumers = resp.data.data;

        $log.info("#getConsumerList end.");

        if('all' == drType) vm.consumersBuildings = resp.data.data;   //전체이면 수용가리스트 뿌리기
        else getConsDetailList(vm.resourcesConsumers[0].cons_idx);    //수용가 동 리스트 호출

      }, function errorCallback(response) {
        $log.error('ERRORS:: ', response);
      });
    }

    vm.drType = 'all';
    getConsumerList(vm.drType);
    drawLineChart(vm.drType);


    /*
     * @description : 수용가 동 리스트 호출
     * @author : Tim
     * @param consumer Idx
     */
    function getConsDetailList(consIdx){
      vm.consIdx = consIdx;

      $log.info("#getConsDetailList start. consIdx : " + consIdx);

      $http({
        method: 'GET',
        url: 'http://api.ourwatt.com/nvpp/noc/'+ consIdx +'/buildinglist',
        headers: {
          api_key: 'smartgrid'
        }
      }).then(function (resp) {

        vm.consumersBuildings = resp.data.data;

        //수용가에 동 정보가 없을 경우 수용가 정보 자체를 동 정보로 사용
        if(vm.consumersBuildings.length == 0){
          for(var i=0 ; i < vm.resourcesConsumers.length ; i++){
            if(consIdx == vm.resourcesConsumers[i].cons_idx) vm.consumersBuildings = [vm.resourcesConsumers[i]];
          }
        }

        $log.info("#getConsDetailList end.");

        $(".cons-btn").each(function(){
          if(consIdx == $(this).attr("value")) changeConsBtnClass(this, true);
          else changeConsBtnClass(this, false);
        });

      }, function errorCallback(response) {
        $log.error('ERRORS:: ', response);
      });
    }


    //상단 DR1,2,3,4,etc 클릭 이벤트 처리
    vm.clickDR = function(drType){
      $(".drType-btn").each(function(){
        if(drType == $(this).attr("value")) changeBtnClass(this, true);
        else changeBtnClass(this, false);
      });

      function changeBtnClass(obj, onOff){
        if(onOff){
          $(obj).addClass("state2-btn-dr-on");
          $(obj).removeClass("state2-btn-dr");
        }else{
          $(obj).addClass("state2-btn-dr");
          $(obj).removeClass("state2-btn-dr-on");
        }
      }

      getConsumerList(drType);
      drawLineChart(drType);
    }


    //수용가 리스트 클릭 처리
    vm.clickConsumer = function(consIdx){
      $(".cons-btn").each(function(){
        if(consIdx == $(this).attr("value")) changeConsBtnClass(this, true);
        else changeConsBtnClass(this, false);
      });

      getConsDetailList(consIdx);
    }

    //수용가 리스트 on, off
    function changeConsBtnClass(obj, onOff){
      if(onOff){
        $(obj).addClass("consumer-on");
        $(obj).removeClass("consumer-off");
      }else{
        $(obj).addClass("consumer-off");
        $(obj).removeClass("consumer-on");
      }
    }



    /*
     * @description : drType별 상단 라인차트 그리기
     * @author : Tim
     * @param drType
     */
    function drawLineChart(drType){

      var url;
      if('all' == drType) url = 'http://api.ourwatt.com/nvpp/energy/resources/5';
      else url = 'http://api.ourwatt.com/nvpp/noc/5/energy/' + drType;

      $http({
        method: 'GET',
        url: url,
        headers: {
          api_key: 'smartgrid'
        }
      }).then(function (resp) {

        vm.energyResources = resp.data.data;

        var cbl = ['cbl'];
        var watt = ['전력량'];

        for (var i=0; i<vm.energyResources.length; i++) {
          cbl.push(vm.energyResources[i].dem_cbl);
          watt.push(vm.energyResources[i].dem_watt);

          if(vm.energyResources[i].dem_watt != null && vm.energyResources[i].dem_watt != 0){
            vm.currentXtime = vm.energyResources[i].dem_date;
          }
        }

        var chart2 = c3.generate({
          bindto: '#resource-graph',
          data: {
            x: vm.timeX[0],
            xFormat:'%H:%M',
            columns: [vm.timeX, cbl, watt]
          },
          grid: { //점선
            x: {
              show: false
            },
            y: {
              show: false
            }
          },
          axis: { //가로 세로줄
            x: {
              show: false,
              type: 'timeseries',
              tick: {
                format: '%H:%M',
                values: ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
                  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '24:00']
              }
            },
            y: {
              show: false
            }

          },
          point: {
            show: false
          },
          tooltip: {
            contents: function (d) {
              // $log.debug(d, defaultTitleFormat, defaultValueFormat, color);

              var data = 0;
              for (var i=0; i<d.length; i++) {
                if (d[i].id == "전력량") {
                  data = d[i].value;
                }
              }

              if (data != null) {
                var dataHtml = '<div style="width: 100px;height: 30px;color: #80ffff;background-color: #597c80;' +
                  'border-radius: 10px;font-size: 20px;text-align: center;margin-left: -70px;">' +  data + '</div>'; // formatted html as you want
              } else {
                var dataHtml = '';
              }

              return dataHtml;

            }
          },
          size: {
            width: 1700,
            height: 450
          },
          color: {
            pattern: ['#608080', '#80ffff']
          },
          line: {
            width: 10
          },
          legend: { //밑에 데이터 구분 테이블
            hide: true
          }
        });

        chart2.tooltip.show({x:d3.time.format('%H:%M').parse(vm.currentXtime)});
        $("#resource-graph").mouseleave(function () {
          chart2.tooltip.show({x:d3.time.format('%H:%M').parse(vm.currentXtime)});
        });

      }, function errorCallback(response) {
        $log.error('ERRORS:: ', response);
      });
    }







    computedService.then(function(result) {
      $log.info('computedResult:: ', result);

      if(result.status == false) {
        switch(result.code) {
          case 'FAIL':
            vm.gageCurrentDevelop = 0;
            break;
          case 'CRITICAL':
            vm.gageCurrentDevelop = 45;
            break;
          case 'CRITICALZEROBALANCE':
            vm.gageCurrentDevelop = 67.5;
            break;
          case 'ZERO balance':
            vm.gageCurrentDevelop = 90;
            break;
          case 'MIN':
            vm.gageCurrentDevelop = 45;
            break;
          case 'TARGET NORMAL':
            vm.gageCurrentDevelop = 45;
            break;
          case 'TARGET HIGH':
            vm.gageCurrentDevelop = 45;
            break;
          case 'MAX':
            vm.gageCurrentDevelop = 45;
            break;
          default:
            vm.gageCurrentDevelop = 0;
        }
      } else {
        vm.gageCurrentDevelop = 270;
      }

    });

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
      '23:00', '23:15', '23:30', '23:45', '24:00', '24:15', '24:30', '24:45'
    ];

    //getCompaniesResources();
    function getCompaniesResources() {
      energyService.companiesResources().then(
        function (resp) {
          vm.companiesResources = resp.companiesResources;
          vm.currentCompanyResources = vm.companiesResources[0]; //처음엔 0번째 자원
          vm.currentCompanyMax = parseFloat(vm.companiesResources[0].dem_cbl) - (parseFloat(vm.companiesResources[0].cont_watt) + parseFloat(vm.companiesResources[0].add_cont_watt));
          // $log.debug('currentCompanyMax:',vm.currentCompanyMax, 'dem_negawatt:',vm.currentCompanyResources.dem_negawatt);

          // vm.gageCurrentDevelop = parseFloat(vm.currentCompanyResources.dem_negawatt) / vm.currentCompanyMax *100;

          $timeout(getCompaniesResources, 900000);

        }
      )
    }

    //getResourcesConsumers();
    function getResourcesConsumers() {
      energyService.resourcesConsumers().then(
        function (resp) {
          vm.resourcesConsumers = resp.resourcesConsumers;
          for (var i=0; i<vm.resourcesConsumers.length; i++) {
            // CBL - (계약용량+추가용량)
            vm.resourcesConsumers[i].maxTarget =
              parseFloat(vm.resourcesConsumers[i].dem_cbl) - (parseFloat(vm.resourcesConsumers[i].cont_watt) + parseFloat(vm.resourcesConsumers[i].add_cont_watt));

            // 가동률
            vm.resourcesConsumers[i].operateRatio =
              ((parseFloat(vm.resourcesConsumers[i].dem_cbl) - parseFloat(vm.resourcesConsumers[i].dem_watt))
              / vm.resourcesConsumers[i].maxTarget)*100;

            // resourcesConsumers
            vm.resourcesConsumers[i].building = (parseFloat(vm.resourcesConsumers[i].dem_watt)/parseFloat(vm.resourcesConsumers[i].dem_cbl))*100;


            vm.resourcesConsumers[i].target = vm.resourcesConsumers[i].dem_cbl - vm.resourcesConsumers[i].cont_watt;

            if (vm.resourcesConsumers[i].target == 0) {
              vm.resourcesConsumers[i].line2 = 493; //target 0%
            } else if (vm.resourcesConsumers[i].target > 0) {
              if (vm.resourcesConsumers[i].target == vm.resourcesConsumers[i].dem_cbl) { // target 100%
                vm.resourcesConsumers[i].line2 = 285;
              } else if (vm.resourcesConsumers[i].target < vm.resourcesConsumers[i].dem_cbl) { // target 1 ~ 99%
                vm.resourcesConsumers[i].line2 = 493 - (((vm.resourcesConsumers[i].target/vm.resourcesConsumers[i].dem_cbl) * 100) * 2.08);
              }
            } else {
              vm.resourcesConsumers[i].line2 = 493;
            }

          }

          $timeout(getResourcesConsumers, 900000);

        }
      )
    }



    $log.log('State2_1Controller!');
    vm.consumerBeginNumber = 0;

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
