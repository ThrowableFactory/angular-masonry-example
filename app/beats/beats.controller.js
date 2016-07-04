angular.module('app.modules')
       .controller('beatsCtrl',beatsCtrl);

function beatsCtrl ($scope, $http, $state, $document, appEvent, topicsService,jwtHelper, beatsService, composeService) {
  var vm = this;
  var beatsPerPage = 6;
  var paginationInitBeatsNum = 15;
  var paginationInit = true;
  //Temporarily treat vm.dataSource as a local datasource
  vm.customRefreshEnabled = false;
  vm.monthNeeded = [];
  vm.tabs = [];
  vm.lock = false;
  vm.selectedBeats = [];
  vm.currentSelectedTab = {};
  vm.jcSubNavSettings = [
    {
      type: 'toggle',
      title: 'Featured Only',
      value: false,
      event: 'toggleFeatured'
    },

    {
      type: 'toggle',
      title: 'Hide Selfie',
      value: true,
      event: 'toggleWeired'
    }
  ];

  // TODO MODERATE: comment and tag function to add in further releases
  vm.getBeatOfMonth = getBeatOfMonth;
  vm.scrollTop = scrollTop;
  vm.pushBeatsPaginated = pushBeatsPaginated;
  vm.pageForCustomRefresh = 0;
  activate();
  ////////////////////////////////

  function pushBeatsPaginated(){
    var skipCount = vm.pageForCustomRefresh * beatsPerPage;
    if(paginationInit){
        beatsPerPage = paginationInitBeatsNum;
    }
    if(!vm.lock) {
      vm.lock = true;
      beatsService.fetchBySkipAndLimit(skipCount, beatsPerPage).success(res => {
        if(res && res.length) {
          angular.forEach(res, r => {
              r.init　=　paginationInit;
              if(!vm.selectedBeats.beats){
                vm.selectedBeats.beats = [];
              }
                vm.selectedBeats.beats.push(r);
            }
          );
          vm.pageForCustomRefresh++;
          vm.lock = false;
        }else{
          vm.lock = true;
        }
        paginationInit = false;
      })
    }
  }

  function scrollTop(){
    $document.scrollTop(0, 2000);
  }

  function featureData(){
    var output = [];
    output.beats=[];
    vm.selectedBeats.forEach(function(data){
      if(checkMonth(data.time)){
        output.push(data);
      };
    });
    var newWindow = window.open();
    newWindow.document.write('<pre>'+JSON.stringify(output,undefined, 4)+'</pre>');

    function checkMonth(time){
      for(var i = 0; i < vm.monthNeeded.length; i++){
        if(vm.monthNeeded[i].indexOf(time) >= 0) return true;
      }
      return false;
    }

  }

  function deleteData(event,id){
    beatsService.deleteOne(id);
  }

  function getBeatOfMonth(month){
    vm.currentSelectedMonth = month;
    vm.currentSelectedTab = getTabByMonth(month);
    return beatsService.fetchByMonth(month,1).success(function(res){
      vm.selectedBeats = res;
    });
  }

  function getTabByMonth(yearAndMonth){
    return {
      title: getNavDateLabel(yearAndMonth),
      state: 'beats.specified',
      stateParam : { month: yearAndMonth }
    }
  }

  function activate(){
    topicsService.fetchBySkipAndLimit(0,3).success(res=>vm.topicList = res);
    generatejcSubNavTabs().then(function(tabs){
      vm.tabs = tabs;
      if($state.params.month != null){
        vm.customRefreshEnabled = false;
        getBeatOfMonth($state.params.month);
      }else{
        vm.customRefreshEnabled = true;
        pushBeatsPaginated();
      }
    });
  }



  function generatejcSubNavTabs(){
    var tabs=[{
      title: 'Recent' ,
      state: 'beats'
    }];
    return beatsService.fetchAvailableMonths().then(function(res){
      angular.forEach(res.data , function(yymm){
        tabs.push({
          title: getNavDateLabel(yymm) ,
          state: 'beats.specified',
          stateParam : { month: yymm }
        });
      });
      return tabs;
    });
  }

  function switchTab(event,tab){
    vm.lock = false;
    if(tab.stateParam && tab.stateParam.month){
      vm.selectedBeats = [];
      getBeatOfMonth(tab.stateParam.month);
      vm.customRefreshEnabled = false;
    }else{
      vm.selectedBeats = [];
      vm.pageForCustomRefresh = 0;
      vm.customRefreshEnabled = true;
      pushBeatsPaginated();
    }
  }

  function getNavDateLabel(yearAndMonth){
    var year = yearAndMonth.substring(0, 2);
    var month = yearAndMonth.substring(2, 4);
    return month+'/'+year;
  }


  /*function insertIntoDB(){
    $http.get('data/data.json').then(function(data){
        var dd = data.data;
        angular.forEach(dd,function(d){
            var beats = d.beats;
            angular.forEach(beats,function(b){
            b.time = new Date(b.time*1000);
            composeService.postBeat(b);
            });
        });
    })
  }*/

  function handleTopicSelected(event,id){
    $state.go("topics-detail",id);
  }

  ///////////////////
  appEvent.subscribe('jcSubNavSectionSwitched', switchTab, $scope);
  appEvent.subscribe('featureData', featureData, $scope);
  appEvent.subscribe('deleteData', deleteData, $scope);
  $scope.$on("topicSelected",handleTopicSelected);



}
