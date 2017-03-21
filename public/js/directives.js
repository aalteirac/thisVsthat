appThis.directive('optionsClass', function ($parse) {
    return {
        require: 'select',
        link: function(scope, elem, attrs, ngSelect) {
            var getOptionsClass = $parse(attrs.optionsClass);
            scope.$on('change-sel', function(event, args) {
                angular.forEach(scope.fieldsDim, function(item, index) {
                    var classes = getOptionsClass(item),
                        option = elem.find('option[value=' + '"'+ item.$$hashKey + '"'+']');
                    angular.forEach(classes, function(add, className) {
                        if(add) {
                            angular.element(option).removeAttr('class');
                            angular.element(option).addClass(className);
                        }
                    });
                });
            });
        }
    };
});
appThis.directive('dAnd', function() {
    return {
        scope: true,
        link: function($scope, $element, $attr) {
            var el = $element[0],
                counter = 0;
            el.draggable = true;

            el.addEventListener('dragenter', function dragEnter(e) {
                if (e.target === el ) {
                    $scope.dragenter(e);
                    $scope.dragover(e);
                }
                counter++;
            }, false);
            el.addEventListener('dragleave', function dragLeave(e) {
                counter--;
                if (e.target === el ) {
                    $scope.dragleave(e);
                }
            }, false);
            el.addEventListener('drop', function drop(e) {
                counter--;
                if (e.target === el ) {
                    $scope.drop(e);
                }
            }, false);


        }
    };
});
appThis.directive("listbox",['AppService', function(appService) {
    function init(scope, element, attributes) {
        scope.states=appService.states();
        scope.$on("state-change",function(){
            scope.states=appService.states();
        })
        var obj;
        var scp=scope;
        scope.showList = true;
        scope.valSel=[];
        scope.valChangeSingle=function(e) {
            var onlyQ=scp.valSel.map(function(e){return parseInt(e)})
            scp.valSel=onlyQ;
        }
        scope.valChange=function(e){
            var onlyQ=scp.valSel.map(function(e){return parseInt(e)})
            if(obj && onlyQ.length>0) {
                obj.sock().selectListObjectValues("/qListObjectDef", onlyQ, true, false);
                scp.valSel=onlyQ;
            }
        }
        scope.hasGlobalSelection=function(){
            return appService.hasSelection();
        }
        scope.clearAll = function() {
            appService.clearSelection(true,'$');
            scope.$root.$broadcast("change-sel");
        };
        scope.clear = function() {
            obj.sock().clearSelections("/qListObjectDef")
        };
        scope.$watch("field", function (vl,ol) {
            obj=createObj();
        });
        function createObj(){
            if (obj) {
                obj.destroy();
            }
            return Utils.object().app(scope.app).prop({
                qInfo: {
                    qId: "LB",
                    qType: "ListObject"
                },
                qListObjectDef: {
                    qLibraryId: "",
                    qDef: {
                        qFieldDefs: [scope.field],
                        qSortCriterias: [{
                            qSortByAsci: 1
                        }]
                    },
                    qInitialDataFetch: [{
                        qTop: 0,
                        qHeight: 200,
                        qLeft: 0,
                        qWidth: 1
                    }]
                }
            }).callback(function(e) {
                scope.$on("wsUpdate", function(t, r) {
                    r.indexOf(e.sock().handle) > -1 && e.update()
                }), e.buildObj()
            }).build(function(e) {
                if(e.layout().qListObject.qDataPages[0]) {
                    scope.matrix = e.layout().qListObject.qDataPages[0].qMatrix;
                    scope.counts = {
                        total: e.layout().qListObject.qDimensionInfo.qCardinal,
                        selected: e.layout().qListObject.qDimensionInfo.qStateCounts.qSelected
                    };
                    scope.showCount = scope.counts.selected > 0;
                    var temp=scope.matrix.filter(function(v){
                        return v[0].qState==='S';
                    })
                    var select={field:scope.field,selected:temp}
                    if(appService.states().length==0)appService.setSelections(select);
                    appService.setMainSelections({field:scope.field,selected:temp});
                    appService.setFieldSelected(scope.field,scope.showCount);
                    scope.$root.$broadcast("change-sel");
                    scope.$apply()
                }
            }).create()
        }
    }
    return {
        link: init,
        restrict: "E",
        templateUrl: "js/partials/listbox.html",
        scope: {
            field: "=",
            app: "=",
            ctitle: "="
        }
    }
}]);
appThis.directive("chart",['AppService','$timeout', function(appService,$timeout) {
    function init(scope, element, attributes) {
        var obj;
        var objContext;
        scope.chartCreated=false;
        setState();
        function setState(){
            scope.states=appService.states();
            createHyperC();
        }
        function createHyperC(){
            obj=createObj(obj,'$',true);
            if (scope.states.length==1){
                objContext=createObj(objContext,scope.states[0],false)
            }else{
                if (scope.chart && scope.chart.series.length==2) {
                    scope.chart.series.splice(1, 1);
                }
            }
        }
        scope.$on("state-change",function(){
            setState();
        })
        var obj;
        scope.$watch("oper", function (vl,ol) {
            if(vl!=ol)
                createHyperC();
        });
        scope.$watch("fieldMeasure", function (vl,ol) {
            if(vl!=ol)
                createHyperC();
        });
        scope.$watch("fieldDimension", function (vl,ol) {
            if(vl!=ol)
                createHyperC();
        })
        function createObj(hc,context,main){
            if (hc) {
                hc.destroy();
            }
            return Utils.object().app(scope.app).prop({
                qInfo: {
                    qType: "Chart"
                },
                qHyperCubeDef: {
                    qStateName: context,
                    qDimensions: [{
                        qDef: {
                            qFieldDefs: [scope.fieldDimension]
                        }
                    }],
                    qMeasures: [{
                        qSortBy: {
                            qSortByNumeric: -1
                        },
                        qDef: {
                            qDef: scope.oper+'(['+scope.fieldMeasure+"])"
                        }
                    }],
                    qInterColumnSortOrder: [0],
                    qInitialDataFetch: [{
                        qTop: 0,
                        qLeft: 0,
                        qHeight: 1000,
                        qWidth: 2
                    }]
                }
            }).callback(function(e) {
                scope.$on("change-sel",function(){
                    appService.getMainSelectionsString()!=''?scope.chart.series[0].showInLegend=true:scope.chart.series[0].showInLegend=false;
                    scope.chart.series[0].name='Moving Context:<br>' + appService.getMainSelectionsString();
                })
                scope.$on("wsUpdate", function(t, r) {
                    r.indexOf(e.sock().handle) > -1 && e.update()
                }), e.buildObj()
            }).build(function(e) {
                if(e.layout().qHyperCube.qDataPages[0] && e.layout().qHyperCube.qDataPages[0].qMatrix[0].length>1) {
                    scope.matrix = e.layout().qHyperCube.qDataPages[0].qMatrix;
                    e.matrix=scope.matrix;
                    if(main) {
                        if(scope.chartCreated==false){
                            addHighChart(scope.matrix);
                            scope.chart.series.push({showInLegend: false,name:scope.fieldDimension,data:[]});
                            scope.chart.series[0].dataLabels= {enabled: true,format: '{point.y:,.2f}'}
                        }
                        scope.chart.options.yAxis.ctitle.text= scope.fieldMeasure;
                        //scope.chart.series[0].name=scope.fieldDimension;
                        scope.chart.series[0].data = scope.matrix.map(function(d) {
                            return {name:d[0].qText,y:parseFloat(d[1].qText),id:d[0].qElemNumber}
                        })
                    }
                    else if(scope.states.length==1){
                        var selInfo=appService.getSelectionsString();
                        if(scope.chart.series.length==1)
                            scope.chart.series.push({showInLegend: true,name:'Fixed Context:<br>'+ selInfo,data:[],color: '#e6850e'});
                        else
                            scope.chart.series[1].name='Fixed Context:<br>'+ selInfo;
                        scope.chart.series[1].dataLabels= {enabled: true,format: '{point.y:,.2f}'}
                    }
                    if(scope.chart.series.length==2 && obj.matrix && objContext.matrix){
                        scope.chart.series[1].data=[];
                        for (var i = 0; i < obj.matrix.length; i++) {
                            var r = objContext.matrix.filter(function (e) {
                                return e[0].qText === obj.matrix[i][0].qText;
                            });
                            if (r.length == 0){
                                scope.chart.series[1].data.push({name:obj.matrix[i][0].qText,y:null,id:null})
                            }
                            else{
                                scope.chart.series[1].data.push({name:r[0][0].qText,y:parseFloat(r[0][1].qText),id:r[0][0].qElemNumber})
                            }
                        }
                    }
                    var inf=appService.hasSelection()==true?' (filtered)':'';
                    inf='Compare '+scope.oper.toLowerCase()+' of '+scope.fieldMeasure + ' by ' + scope.fieldDimension+inf;
                    scope.title={
                        text: inf
                    }
                    scope.$apply()
                }
            }).create()
        }

        function addHighChart(draw){
            var series=[];
            function selectPointsByDrag(e) {
                //if(e.originalEvent.shiftKey!=true)
                Highcharts.each(this.series, function (series) {
                    Highcharts.each(series.points, function (point) {
                        if (point.id!=null && point.x >= e.xAxis[0].min && point.x <= e.xAxis[0].max &&
                            point.y >= e.yAxis[0].min && point.y <= e.yAxis[0].max) {
                            point.select(true, true);
                        }
                    });
                });
                this.sel=this.getSelectedPoints().map(function(p){return p.id});
                toast(this, '<b>' + this.sel.length + ' values selected.</b>' +
                    '<br>Click on empty space to deselect.');

                obj.sock().selectHyperCubeValues("/qHyperCubeDef",0,this.sel,false);

                return false; // Don't zoom
            }
            function unselectByClick() {
                var points = this.sel;
                if (points && points.length > 0) {
                    obj.sock().selectHyperCubeValues("/qHyperCubeDef",0,this.sel,true);
                    this.sel=[];
                }
            }
            function toast(chart, text) {
                chart.toast = chart.renderer.label(text, 10, 12)
                    .attr({
                        fill: Highcharts.getOptions().colors[1],
                        padding: 10,
                        r: 5,
                        zIndex: 8
                    })
                    .css({
                        color: '#FFFFFF'
                    })
                    .add();

                $timeout(function () {
                    chart.toast.fadeOut();
                }, 4000);
                $timeout(function () {
                    chart.toast = chart.toast.destroy();
                }, 4500);
            }
            var bar={
                options: {
                    chart: {
                        type: 'column',
                        events: {
                            load: function() {
                                this.reflow();
                                $( "text:contains('Highcharts.com')" ).hide();
                            },
                            selection: selectPointsByDrag,
                            click: unselectByClick
                        },
                        zoomType: 'xy'
                    },
                    tooltip: {
                        enabled: true,
                        useHTML: true,
                        //shared: true,
                        followTouchMove: false,
                        followPointer:false,
                        borderWidth: 0
                    },
                    xAxis: {
                        type: 'category',
                        labels: {
                            rotation: -45,
                            style: {
                                fontSize: '11px',
                                fontFamily: 'Verdana, sans-serif'
                            }
                        }
                    },
                    yAxis: {
                        ctitle: {
                            text: scope.fieldMeasure
                        }
                    },
                    plotOptions: {
                        series: {
                            turboThreshold:0,
                            cursor: 'pointer',
                            point: {
                                events: {
                                    click: function (e) {
                                        obj.sock().selectHyperCubeValues("/qHyperCubeDef",0,[this.id],true);
                                    }
                                }
                            },
                            marker: {
                                lineWidth: 1
                            }
                        }//,
                        //column: {colorByPoint: true}
                    }
                },
                series: series
            }
            scope.chart = bar;
            scope.chartCreated=true;

        }
    }
    return {
        link: init,
        restrict: "E",
        templateUrl: "js/partials/chart.html",
        scope: {
            fieldMeasure: "=",
            fieldDimension: "=",
            app: "=",
            oper: "=",
        }
    }
}]);
appThis.directive("category",['AppService','$timeout', function(appService,$timeout) {
    function init(scope, element, attributes) {
        scope.sele=[];
        scope.hasGlobalSelection=function(){
            return appService.hasSelection();
        }
        scope.states=appService.states();
        scope.$on("state-change",function(){
            scope.states=appService.states();
        })
        scope.maxStates=1;
        scope.compare=function() {

        }
        scope.addState=function(){
            var selF=appService.fields();
            var s=selF.filter(function(f){
                return f.sel==true;
            })
            scope.sele= s.map(function(e){return e.qName});
            appService.stateInfo(scope.sele.join(' & '))
            appService.addState().then(function(){
                //appService.clearSelection(true,'$');
            });
        }
        scope.removeState=function(){
            appService.removeState();
        }
    }
    return {
        link: init,
        restrict: "E",
        templateUrl: "js/partials/category.html",
        scope: {
            fielddum: "="
        }
    }
}]);