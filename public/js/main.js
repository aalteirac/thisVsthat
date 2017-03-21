var appThis=angular.module('thisthatApp', ["highcharts-ng"]);


appThis.controller('mainController',["AppService","$scope", function(appService,$scope) {
        var self = this;
        $scope.states=appService.states();
        $scope.$on("state-change",function(){
            $scope.states=appService.states();
        })
        $scope.id=appService.guid();
        $scope.loaded=false;
        $scope.myField1={qName:"NO DATA YET"};
        $scope.myField2=$scope.myField1;
        $scope.fields=[$scope.myField1];
        $scope.fieldsDim=[$scope.myField1];
        $scope.operators=["SUM","AVG","COUNT"];
        $scope.operator=$scope.operators[0];
        var control=false;
        function message(msg){
            $( '#popupText' ).html( msg + "<br>" );
        }
        function sortCopy(arr) {
            return arr.slice(0).sort(compareFields);
        }
        function compareFields(a,b) {
            if (a.qnPresentDistinctValues < b.qnPresentDistinctValues)
                return -1;
            else if (a.qnPresentDistinctValues > b.qnPresentDistinctValues)
                return 1;
            else
                return 0;
        }
        function listen(e) {
            var data = JSON.parse(e.data);
            if(data.hasOwnProperty("change"))
                $scope.$broadcast("wsUpdate", data.change)
            if(data.hasOwnProperty("method") && data.method=='OnSessionTimedOut'){
                message("Disconnected due to inactivity, reload page");
                $( '#popup' ).fadeIn( 1000 );
            }
        }
        appService.subscribe($scope,function(){
            $( '#popup' ).fadeIn( 1000 );
            $scope.loaded=false,$scope.myField1={},$scope.$apply();
            $scope.fields=appService.fields();
            //$scope.fieldsDim=appService.fields();
            $scope.fieldsDim=sortCopy(appService.fields());
            $scope.app=appService.app();
            if($scope.fields.length>0) {
                var sock = appService.app().session.rpc.socket;
                sock.removeEventListener("message",listen);
                sock.addEventListener("message", listen)
                $scope.myField1 = $scope.fieldsDim[0];
                $scope.myField2 = appService.fields()[0];
                $scope.loaded=true;
                $( '#popup' ).delay( 1000 ).fadeOut( 1000 );
            }
            $scope.dropStatus=appService.msg();
            message(appService.msg());
            $scope.$apply();

        })
        $scope.dropStatus='Drop Excel File Here';
        $( '#popupText' ).html( $scope.dropStatus + '<a href="sample.xlsx"> (Sample)</a><br>' );
        $scope.dragenter = function (event) {
            event.preventDefault();
            event.currentTarget.classList.add('drop-ready');
            return false;
        };
        ;
        $scope.dragleave = function (event) {
            event.preventDefault();
            event.currentTarget.classList.remove('drop-ready');
            $scope.dropStatus='Drop Excel File Here';
            $scope.$apply();
            return false;
        };
        ;
        $scope.dragover = function (event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
            return false;
        };
        ;
        $scope.drop = function (event) {
            $( '#popup' ).fadeIn( 1000 );
            message("");
            $scope.loaded=false;
            event.preventDefault();
            var file = event.dataTransfer.files[0];
            if (!file)
                return;
            if (!/\.xlsx$/i.test(file.name)) {
                $( '#popup' ).fadeIn( 1000 );
                message("Only .xlsx allowed");
                $( '#popup' ).fadeOut( 3000 );
                return;
            }
            appService.closeSession();
            event.currentTarget.classList.remove('drop-ready');
            $scope.$apply();
            var me = this;
            var id = $scope.id;
			$scope.dropStatus="Uploading."
            var h = window.setInterval(function () {
                if ($scope.dropStatus.length >= 25) {
                    $scope.dropStatus = appService.msg();
                    message($scope.dropStatus);
                }
                else {
                    $scope.dropStatus += '.';
                    message($scope.dropStatus);
                }
                $scope.$apply();
            }, 577);
            var xhr = new XMLHttpRequest();
            xhr.addEventListener('load', function (ev) {
                if (200 <= ev.target.status && ev.target.status <= 204) {
                    appService.closeSession().then(function(){
                        self.global_promise = appService.global().then(function(){
                            appService.createApp().then(function(){
                                window.clearInterval(h);
                            });
                        });
                    });

                }
                else {
                    me.showError = true;
                    me.errorMessage = ev.target.statusText;
                    window.clearInterval(h);
                }


            });
            xhr.addEventListener('error', function (ev) {
                window.clearInterval(h);
            });
            xhr.open('post',  'create/'+id);
            xhr.setRequestHeader('Content-Type', 'application/octet-stream');
            xhr.send(file);
        };
    }]);