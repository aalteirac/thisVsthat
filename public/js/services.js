appThis.service("AppService", ["$q", "$rootScope","$timeout", function($q,$rootScope,$timeout) {
    this.guid=function(){
        return mguid;
    }
    this.app = function() {
        return curDoc;
    };
    this.getSelectionsString=function(){
        var sel=selections.filter(function(e) { return e.selected.length>0; });
        var res=sel.map(function(m){
            var selF=m.selected.map(function(elem){return elem[0].qText;}).join(",");
            if(selF.length>100)
                selF= m.selected.length +' values selected';
            return m.field + ':'+ selF})
        return res.join(' <br> ')
    }
    this.getMainSelectionsString=function(){
        var sel=mainSelections.filter(function(e) { return e.selected.length>0; });
        var res=sel.map(function(m){
            var selF=m.selected.map(function(elem){return elem[0].qText;}).join(",");
            if(selF.length>100)
                selF= m.selected.length +' values selected';
            return m.field + ':'+ selF})
        return res.join(' <br> ')
    }
    this.getSelections=function(fieldName){
        var id=selections.map(function(e) { return e.field; }).indexOf(fieldName);
        if(id!=-1)
            return selections[id];
        return {field:fieldName,selected:[]}
    }
    this.setSelections = function(select) {
        var index=selections.map(function(e) { return e.field; }).indexOf(select.field);
        if (index!=-1){
            selections[index].selected=select.selected;
        }else{
            selections.push(select);
        }
    };
    this.setMainSelections = function(select) {
        var index=mainSelections.map(function(e) { return e.field; }).indexOf(select.field);
        if (index!=-1){
            mainSelections[index].selected=select.selected;
        }else{
            mainSelections.push(select);
        }
    };
    this.msg=function(){
        return msg;
    }
    this.closeSession=function(){
		msg="Uploading.";
        var deferred = $q.defer();
        if(glob) {
            glob.session.close().then(function(){
                console.log();
                deferred.resolve();
            });
        }
        else{
            deferred.resolve();
        }
        return deferred.promise;
    }
    this.subscribe=function(scope,callback){
        subscribe(scope, callback);
    }
    this.createApp=function(){
      return createApp();
    };
    this.global = function() {

        connect = enigma.getService( "qix", config );
        return connect;
    };
    this.fields=function(){
        return fields
    };
    this.setFieldSelected=function(fieldName,sel){
        fields.map(function(f){
            if(f.qName==fieldName) {
                f.sel = sel;
            }
            return f;
        })
    }
    this.hasSelection=function(){
        var s=fields.filter(function(f){
            return f.sel==true;
        })
        return s.length>0;
    }
    this.clearSelection=function(lock, context){
        if(states.length==0)selections=[];
        mainSelections=[];
        if(lock && context)
            curDoc.clearAll(lock,context);
        else
            curDoc.clearAll();
        fields.map(function(f){
                f.sel = false;
            return f;
        })
    }
    this.states=function(){
        return states
    }
    this.addState=function(){
        var def=$q.defer();
        if(states.indexOf("State1")==-1) {
            states.push("State1");
            this.app().addAlternateState("State1").then(function(){
                def.resolve();
                $rootScope.$broadcast("state-change");
                $timeout(function(){
                    curDoc.clearAll(true,'$').then(function(){
                        mainSelections=[];
                        $rootScope.$broadcast("change-sel");
                    });
                    fields.map(function(f){
                        f.sel = false;
                    return f;

                })},10);
            });
        }
        else {
            states.push("State2");
            this.app().addAlternateState("State2").then(function(){
                def.resolve();
                $rootScope.$broadcast("state-change");
            });
        }

        return def.promise;

    }
    this.removeState=function(){
        states=[];
        selections=[];
        this.app().removeAlternateState("State1");
        //this.app().removeAlternateState("State2");
        $timeout(function(){self.clearSelection()},0);
        $rootScope.$broadcast("state-change");
    }
    this.stateInfo=function(info){
        if(info)
            stInfo=info;
        else
            return stInfo
    }
    var stInfo="";
    const config = {
        Promise: window.Promise,
        schema: schema,
        session: {
            host: "localhost:4848",
            isSecure:false,
            route: "app/engineData"
        },
        createSocket( url ) {
        url=url.replace('wss://','ws://');
        var ss=new window.WebSocket( url);
        return ss;}}
    var cppath="C:\\Users\\aai\\Documents\\Qlik\\Sense\\Apps\\ThisThat.qvf";
    // CONFIG SERVER
    //const config = {
    //    Promise: window.Promise,
    //    schema: schema,
    //    session: {
    //        host: "rd-aai-wid.rdlund.qliktech.com",
    //        route: "app/engineData"
    //    },
    //    createSocket( url ) {
    //    url=url.replace('wss://','ws://');
    //    var ss=new window.WebSocket( url);
    //    return ss;}}
//var cppath="762a0a3c-fd1c-49a4-b05e-630e8b591e64";

var selections=[];
var mainSelections=[];
var states=[];
var mguid=guid();
var fields=[];
var msg="Uploading.";
var connect;
var glob;
var mon;
var curDoc;
var self=this;

function subscribe(scope, callback) {
    var handler = $rootScope.$on('service-event', callback);
    scope.$on('$destroy', handler);
}
function guid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}
function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
}
function notify() {
    $rootScope.$emit('service-event');
}
function unique(a) {
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i].qName === a[j].qName)
                a.splice(j--, 1);
        }
    }
    return a;
};
function monitorReload(Q) {
    mon=setInterval(function () {
        Q.getProgress(0).then(function (result) {
            if (result.qPersistentProgress) {
                console.log(result.qPersistentProgress);
                var rePattern = new RegExp(/Text << fields ([0-9,]+) Lines fetched/g);
                var match = rePattern.exec(result.qPersistentProgress);
                while (match != null) {
                    msg=result.qPersistentProgress+' ' +match[1] + ' rows fetched...';
                    //notify();
                    console.log( result.qPersistentProgress);
                    console.log(match[1] + ' rows fetched...');
                    match = rePattern.exec(result.qPersistentProgress);
                }
            }
        })
    }, 2000);
}
function createDoc(){
    var def=$q.defer();
    msg="Creating your space.."
    notify();
    glob.createSessionAppFromApp(cppath).then(function (doc) {
        monitorReload(glob);
        doc.getScript().then(function(s){
            doc.setScript(s.replace('%id%',mguid)).then(function(){
                msg="Computing..."
                notify();
                curDoc=doc;
                doc.doReload().then(function(reply) {
                    msg="Ready !";
                    notify();
                    clearInterval(mon);
                    doc.getTablesAndKeys({"qcx": 1000,"qcy": 1000},{"qcx": 0,"qcy": 0},30, false, false
                    ).then(function(rep){
                            fields=[];
                            rep.qtr.map(function(el){return fields=fields.concat(el.qFields)})
                            fields=unique(fields);
                            notify();
                            def.resolve(doc);
                        })
                });
            })
        })
    }, function (msg){
		console.log(msg)
	});
    return def.promise;
}
var createApp=function() {
    var def=$q.defer();
        connect.then(function(glo){
            glob=glo;
            fields=[];
            createDoc().then(function(){
                def.resolve();
            });
        })
    return def.promise;
}

}]);


var schema={
    "structs": {
        "Field":{
            "GetCardinal": {
                "In": [],
                "Out": []
            },
            "GetAndMode": {
                "In": [],
                "Out": []
            },
            "SelectValues": {
                "In": [{ "Name": "qFieldValues","DefaultValue": [{"qText": "", "qIsNumeric": false, "qNumber": 0}] }, { "Name": "qToggleMode","DefaultValue": false, "Optional": true }, { "Name": "qSoftLock","DefaultValue": false, "Optional": true }],
                "Out": []
            },
            "Select": {
                "In": [{ "Name": "qMatch","DefaultValue": "" }, { "Name": "qSoftLock","DefaultValue": false, "Optional": true }, { "Name": "qExcludedValuesMode","DefaultValue": 0, "Optional": true }],
                "Out": []
            },
            "ToggleSelect": {
                "In": [{ "Name": "qMatch","DefaultValue": "" }, { "Name": "qSoftLock","DefaultValue": false, "Optional": true }, { "Name": "qExcludedValuesMode","DefaultValue": 0, "Optional": true }],
                "Out": []
            },
            "ClearAllButThis": {
                "In": [{ "Name": "qSoftLock","DefaultValue": false, "Optional": true }],
                "Out": []
            },
            "SelectPossible": {
                "In": [{ "Name": "qSoftLock","DefaultValue": false, "Optional": true }],
                "Out": []
            },
            "SelectExcluded": {
                "In": [{ "Name": "qSoftLock","DefaultValue": false, "Optional": true }],
                "Out": []
            },
            "SelectAll": {
                "In": [{ "Name": "qSoftLock","DefaultValue": false, "Optional": true }],
                "Out": []
            },
            "Lock": {
                "In": [],
                "Out": []
            },
            "Unlock": {
                "In": [],
                "Out": []
            },
            "GetNxProperties": {
                "In": [],
                "Out": [{ "Name": "qProperties" }]
            },
            "SetNxProperties": {
                "In": [{ "Name": "qProperties","DefaultValue": {"qOneAndOnlyOne": false} }],
                "Out": []
            },
            "SetAndMode": {
                "In": [{ "Name": "qAndMode","DefaultValue": false }],
                "Out": []
            },
            "SelectAlternative": {
                "In": [{ "Name": "qSoftLock","DefaultValue": false, "Optional": true }],
                "Out": []
            },
            "LowLevelSelect": {
                "In": [{ "Name": "qValues","DefaultValue": [0] }, { "Name": "qToggleMode","DefaultValue": false }, { "Name": "qSoftLock","DefaultValue": false, "Optional": true }],
                "Out": []
            },
            "Clear": {
                "In": [],
                "Out": []
            }
        },
        "Variable":{
            "GetContent": {
                "In": [],
                "Out": [{ "Name": "qContent" }]
            },
            "GetRawContent": {
                "In": [],
                "Out": []
            },
            "SetContent": {
                "In": [{ "Name": "qContent","DefaultValue": "" }, { "Name": "qUpdateMRU","DefaultValue": false }],
                "Out": []
            },
            "ForceContent": {
                "In": [{ "Name": "qs","DefaultValue": "" }, { "Name": "qd","DefaultValue": 0 }],
                "Out": []
            },
            "GetNxProperties": {
                "In": [],
                "Out": [{ "Name": "qProperties" }]
            },
            "SetNxProperties": {
                "In": [{ "Name": "qProperties","DefaultValue": {"qName": "", "qNumberPresentation": {"qType": 0, "qnDec": 0, "qUseThou": 0, "qFmt": "", "qDec": "", "qThou": ""}, "qIncludeInBookmark": false, "qUsePredefListedValues": false, "qPreDefinedList": [""]} }],
                "Out": []
            }
        },
        "GenericObject":{
            "GetLayout": {
                "In": [],
                "Out": [{ "Name": "qLayout" }]
            },
            "GetListObjectData": {
                "In": [{ "Name": "qPath","DefaultValue": "" }, { "Name": "qPages","DefaultValue": [{"qLeft": 0, "qTop": 0, "qWidth": 0, "qHeight": 0}] }],
                "Out": [{ "Name": "qDataPages" }]
            },
            "GetHyperCubeData": {
                "In": [{ "Name": "qPath","DefaultValue": "" }, { "Name": "qPages","DefaultValue": [{"qLeft": 0, "qTop": 0, "qWidth": 0, "qHeight": 0}] }],
                "Out": [{ "Name": "qDataPages" }]
            },
            "GetHyperCubeReducedData": {
                "In": [{ "Name": "qPath","DefaultValue": "" }, { "Name": "qPages","DefaultValue": [{"qLeft": 0, "qTop": 0, "qWidth": 0, "qHeight": 0}] }, { "Name": "qZoomFactor","DefaultValue": 0 }, { "Name": "qReductionMode","DefaultValue": 0 }],
                "Out": [{ "Name": "qDataPages" }]
            },
            "GetHyperCubePivotData": {
                "In": [{ "Name": "qPath","DefaultValue": "" }, { "Name": "qPages","DefaultValue": [{"qLeft": 0, "qTop": 0, "qWidth": 0, "qHeight": 0}] }],
                "Out": [{ "Name": "qDataPages" }]
            },
            "GetHyperCubeStackData": {
                "In": [{ "Name": "qPath","DefaultValue": "" }, { "Name": "qPages","DefaultValue": [{"qLeft": 0, "qTop": 0, "qWidth": 0, "qHeight": 0}] }, { "Name": "qMaxNbrCells","DefaultValue": 0, "Optional": true }],
                "Out": [{ "Name": "qDataPages" }]
            },
            "GetHyperCubeBinnedData": {
                "In": [{ "Name": "qPath","DefaultValue": "" }, { "Name": "qPages","DefaultValue": [{"qLeft": 0, "qTop": 0, "qWidth": 0, "qHeight": 0}] }, { "Name": "qViewport","DefaultValue": {"qWidth": 0, "qHeight": 0, "qZoomLevel": 0} }, { "Name": "qDataRanges","DefaultValue": [{"qLeft": 0, "qTop": 0, "qWidth": 0, "qHeight": 0}] }, { "Name": "qMaxNbrCells","DefaultValue": 0 }, { "Name": "qQueryLevel","DefaultValue": 0 }, { "Name": "qBinningMethod","DefaultValue": 0 }],
                "Out": [{ "Name": "qDataPages" }]
            },
            "ApplyPatches": {
                "In": [{ "Name": "qPatches","DefaultValue": [{"qOp": 0, "qPath": "", "qValue": ""}] }, { "Name": "qSoftPatch","DefaultValue": false, "Optional": true }],
                "Out": []
            },
            "ClearSoftPatches": {
                "In": [],
                "Out": []
            },
            "SetProperties": {
                "In": [{ "Name": "qProp","DefaultValue": {"qInfo": {"qId": "", "qType": ""}, "qExtendsId": "", "qMetaDef": {}} }],
                "Out": []
            },
            "GetProperties": {
                "In": [],
                "Out": [{ "Name": "qProp" }]
            },
            "GetEffectiveProperties": {
                "In": [],
                "Out": [{ "Name": "qProp" }]
            },
            "SetFullPropertyTree": {
                "In": [{ "Name": "qPropEntry","DefaultValue": {"qProperty": {"qInfo": {"qId": "", "qType": ""}, "qExtendsId": "", "qMetaDef": {}}, "qChildren": [], "qEmbeddedSnapshotRef": null} }],
                "Out": []
            },
            "GetFullPropertyTree": {
                "In": [],
                "Out": [{ "Name": "qPropEntry" }]
            },
            "GetInfo": {
                "In": [],
                "Out": [{ "Name": "qInfo" }]
            },
            "ClearSelections": {
                "In": [{ "Name": "qPath","DefaultValue": "" }, { "Name": "qColIndices","DefaultValue": [0], "Optional": true }],
                "Out": []
            },
            "ExportData": {
                "In": [{ "Name": "qFileType","DefaultValue": 0 }, { "Name": "qPath","DefaultValue": "", "Optional": true }, { "Name": "qFileName","DefaultValue": "", "Optional": true }, { "Name": "qExportState","DefaultValue": 0, "Optional": true }],
                "Out": [{ "Name": "qUrl" }]
            },
            "SelectListObjectValues": {
                "In": [{ "Name": "qPath","DefaultValue": "" }, { "Name": "qValues","DefaultValue": [0] }, { "Name": "qToggleMode","DefaultValue": false }, { "Name": "qSoftLock","DefaultValue": false, "Optional": true }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "SelectListObjectPossible": {
                "In": [{ "Name": "qPath","DefaultValue": "" }, { "Name": "qSoftLock","DefaultValue": false, "Optional": true }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "SelectListObjectExcluded": {
                "In": [{ "Name": "qPath","DefaultValue": "" }, { "Name": "qSoftLock","DefaultValue": false, "Optional": true }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "SelectListObjectAlternative": {
                "In": [{ "Name": "qPath","DefaultValue": "" }, { "Name": "qSoftLock","DefaultValue": false, "Optional": true }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "SelectListObjectAll": {
                "In": [{ "Name": "qPath","DefaultValue": "" }, { "Name": "qSoftLock","DefaultValue": false, "Optional": true }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "SearchListObjectFor": {
                "In": [{ "Name": "qPath","DefaultValue": "" }, { "Name": "qMatch","DefaultValue": "" }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "AbortListObjectSearch": {
                "In": [{ "Name": "qPath","DefaultValue": "" }],
                "Out": []
            },
            "AcceptListObjectSearch": {
                "In": [{ "Name": "qPath","DefaultValue": "" }, { "Name": "qToggleMode","DefaultValue": false }, { "Name": "qSoftLock","DefaultValue": false, "Optional": true }],
                "Out": []
            },
            "ExpandLeft": {
                "In": [{ "Name": "qPath","DefaultValue": "" }, { "Name": "qRow","DefaultValue": 0 }, { "Name": "qCol","DefaultValue": 0 }, { "Name": "qAll","DefaultValue": false }],
                "Out": []
            },
            "ExpandTop": {
                "In": [{ "Name": "qPath","DefaultValue": "" }, { "Name": "qRow","DefaultValue": 0 }, { "Name": "qCol","DefaultValue": 0 }, { "Name": "qAll","DefaultValue": false }],
                "Out": []
            },
            "CollapseLeft": {
                "In": [{ "Name": "qPath","DefaultValue": "" }, { "Name": "qRow","DefaultValue": 0 }, { "Name": "qCol","DefaultValue": 0 }, { "Name": "qAll","DefaultValue": false }],
                "Out": []
            },
            "CollapseTop": {
                "In": [{ "Name": "qPath","DefaultValue": "" }, { "Name": "qRow","DefaultValue": 0 }, { "Name": "qCol","DefaultValue": 0 }, { "Name": "qAll","DefaultValue": false }],
                "Out": []
            },
            "DrillUp": {
                "In": [{ "Name": "qPath","DefaultValue": "" }, { "Name": "qDimNo","DefaultValue": 0 }, { "Name": "qNbrSteps","DefaultValue": 0 }],
                "Out": []
            },
            "Lock": {
                "In": [{ "Name": "qPath","DefaultValue": "" }, { "Name": "qColIndices","DefaultValue": [0], "Optional": true }],
                "Out": []
            },
            "Unlock": {
                "In": [{ "Name": "qPath","DefaultValue": "" }, { "Name": "qColIndices","DefaultValue": [0], "Optional": true }],
                "Out": []
            },
            "SelectHyperCubeValues": {
                "In": [{ "Name": "qPath","DefaultValue": "" }, { "Name": "qDimNo","DefaultValue": 0 }, { "Name": "qValues","DefaultValue": [0] }, { "Name": "qToggleMode","DefaultValue": false }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "SelectHyperCubeCells": {
                "In": [{ "Name": "qPath","DefaultValue": "" }, { "Name": "qRowIndices","DefaultValue": [0] }, { "Name": "qColIndices","DefaultValue": [0] }, { "Name": "qSoftLock","DefaultValue": false, "Optional": true }, { "Name": "qDeselectOnlyOneSelected","DefaultValue": false, "Optional": true }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "SelectPivotCells": {
                "In": [{ "Name": "qPath","DefaultValue": "" }, { "Name": "qSelections","DefaultValue": [{"qType": 0, "qCol": 0, "qRow": 0}] }, { "Name": "qSoftLock","DefaultValue": false, "Optional": true }, { "Name": "qDeselectOnlyOneSelected","DefaultValue": false, "Optional": true }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "RangeSelectHyperCubeValues": {
                "In": [{ "Name": "qPath","DefaultValue": "" }, { "Name": "qRanges","DefaultValue": [{"qRange": {"qMin": 0, "qMax": 0, "qMinInclEq": false, "qMaxInclEq": false}, "qMeasureIx": 0}] }, { "Name": "qColumnsToSelect","DefaultValue": [0], "Optional": true }, { "Name": "qOrMode","DefaultValue": false, "Optional": true }, { "Name": "qDeselectOnlyOneSelected","DefaultValue": false, "Optional": true }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "GetChild": {
                "In": [{ "Name": "qId","DefaultValue": "" }],
                "Out": []
            },
            "GetChildInfos": {
                "In": [],
                "Out": [{ "Name": "qInfos" }]
            },
            "CreateChild": {
                "In": [{ "Name": "qProp","DefaultValue": {"qInfo": {"qId": "", "qType": ""}, "qExtendsId": "", "qMetaDef": {}} }, { "Name": "qPropForThis","DefaultValue": null, "Optional": true }],
                "Out": [{ "Name": "qInfo" }]
            },
            "DestroyChild": {
                "In": [{ "Name": "qId","DefaultValue": "" }, { "Name": "qPropForThis","DefaultValue": null, "Optional": true }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "DestroyAllChildren": {
                "In": [{ "Name": "qPropForThis","DefaultValue": null, "Optional": true }],
                "Out": []
            },
            "SetChildArrayOrder": {
                "In": [{ "Name": "qIds","DefaultValue": [""] }],
                "Out": []
            },
            "GetLinkedObjects": {
                "In": [],
                "Out": [{ "Name": "qItems" }]
            },
            "CopyFrom": {
                "In": [{ "Name": "qFromId","DefaultValue": "" }],
                "Out": []
            },
            "BeginSelections": {
                "In": [{ "Name": "qPaths","DefaultValue": [""] }],
                "Out": []
            },
            "EndSelections": {
                "In": [{ "Name": "qAccept","DefaultValue": false }],
                "Out": []
            },
            "ResetMadeSelections": {
                "In": [],
                "Out": []
            },
            "EmbedSnapshotObject": {
                "In": [{ "Name": "qId","DefaultValue": "" }],
                "Out": []
            },
            "GetSnapshotObject": {
                "In": [],
                "Out": []
            },
            "Publish": {
                "In": [],
                "Out": []
            },
            "UnPublish": {
                "In": [],
                "Out": []
            }
        },
        "GenericDimension":{
            "GetLayout": {
                "In": [],
                "Out": [{ "Name": "qLayout" }]
            },
            "ApplyPatches": {
                "In": [{ "Name": "qPatches","DefaultValue": [{"qOp": 0, "qPath": "", "qValue": ""}] }],
                "Out": []
            },
            "SetProperties": {
                "In": [{ "Name": "qProp","DefaultValue": {"qInfo": {"qId": "", "qType": ""}, "qDim": {"qGrouping": 0, "qFieldDefs": [""], "qFieldLabels": [""]}, "qMetaDef": {}} }],
                "Out": []
            },
            "GetProperties": {
                "In": [],
                "Out": [{ "Name": "qProp" }]
            },
            "GetInfo": {
                "In": [],
                "Out": [{ "Name": "qInfo" }]
            },
            "GetDimension": {
                "In": [],
                "Out": [{ "Name": "qDim" }]
            },
            "GetLinkedObjects": {
                "In": [],
                "Out": [{ "Name": "qItems" }]
            },
            "Publish": {
                "In": [],
                "Out": []
            },
            "UnPublish": {
                "In": [],
                "Out": []
            }
        },
        "GenericBookmark":{
            "GetLayout": {
                "In": [],
                "Out": [{ "Name": "qLayout" }]
            },
            "ApplyPatches": {
                "In": [{ "Name": "qPatches","DefaultValue": [{"qOp": 0, "qPath": "", "qValue": ""}] }],
                "Out": []
            },
            "SetProperties": {
                "In": [{ "Name": "qProp","DefaultValue": {"qInfo": {"qId": "", "qType": ""}, "qMetaDef": {}} }],
                "Out": []
            },
            "GetProperties": {
                "In": [],
                "Out": [{ "Name": "qProp" }]
            },
            "GetInfo": {
                "In": [],
                "Out": [{ "Name": "qInfo" }]
            },
            "Apply": {
                "In": [],
                "Out": [{ "Name": "qSuccess" }]
            },
            "Publish": {
                "In": [],
                "Out": []
            },
            "UnPublish": {
                "In": [],
                "Out": []
            }
        },
        "GenericVariable":{
            "GetLayout": {
                "In": [],
                "Out": [{ "Name": "qLayout" }]
            },
            "ApplyPatches": {
                "In": [{ "Name": "qPatches","DefaultValue": [{"qOp": 0, "qPath": "", "qValue": ""}] }],
                "Out": []
            },
            "SetProperties": {
                "In": [{ "Name": "qProp","DefaultValue": {"qInfo": {"qId": "", "qType": ""}, "qMetaDef": {}, "qName": "", "qComment": "", "qNumberPresentation": {"qType": 0, "qnDec": 0, "qUseThou": 0, "qFmt": "", "qDec": "", "qThou": ""}, "qIncludeInBookmark": false, "qDefinition": ""} }],
                "Out": []
            },
            "GetProperties": {
                "In": [],
                "Out": [{ "Name": "qProp" }]
            },
            "GetInfo": {
                "In": [],
                "Out": [{ "Name": "qInfo" }]
            },
            "SetStringValue": {
                "In": [{ "Name": "qVal","DefaultValue": "" }],
                "Out": []
            },
            "SetNumValue": {
                "In": [{ "Name": "qVal","DefaultValue": 0 }],
                "Out": []
            },
            "SetDualValue": {
                "In": [{ "Name": "qText","DefaultValue": "" }, { "Name": "qNum","DefaultValue": 0 }],
                "Out": []
            }
        },
        "GenericMeasure":{
            "GetLayout": {
                "In": [],
                "Out": [{ "Name": "qLayout" }]
            },
            "ApplyPatches": {
                "In": [{ "Name": "qPatches","DefaultValue": [{"qOp": 0, "qPath": "", "qValue": ""}] }],
                "Out": []
            },
            "SetProperties": {
                "In": [{ "Name": "qProp","DefaultValue": {"qInfo": {"qId": "", "qType": ""}, "qMeasure": {"qLabel": "", "qDef": "", "qGrouping": 0, "qExpressions": [""], "qActiveExpression": 0}, "qMetaDef": {}} }],
                "Out": []
            },
            "GetProperties": {
                "In": [],
                "Out": [{ "Name": "qProp" }]
            },
            "GetInfo": {
                "In": [],
                "Out": [{ "Name": "qInfo" }]
            },
            "GetMeasure": {
                "In": [],
                "Out": [{ "Name": "qMeasure" }]
            },
            "GetLinkedObjects": {
                "In": [],
                "Out": [{ "Name": "qItems" }]
            },
            "Publish": {
                "In": [],
                "Out": []
            },
            "UnPublish": {
                "In": [],
                "Out": []
            }
        },
        "GenericDerivedDefinition":{
            "SetProperties": {
                "In": [{ "Name": "qProp","DefaultValue": {"qInfo": {"qId": "", "qType": ""}, "qDerivedDefinition": {"qName": "", "qTags": [""], "qParameters": [{"qName": "", "qValue": ""}], "qFieldDefs": [{"qName": "", "qExpression": "", "qTags": [""]}], "qGroupDefs": [{"qName": "", "qGrouping": 0, "qFieldDerivedDefinitionNames": [""]}]}, "qMetaDef": {}} }],
                "Out": []
            },
            "GetProperties": {
                "In": [],
                "Out": [{ "Name": "qProp" }]
            },
            "MatchTags": {
                "In": [{ "Name": "qTags","DefaultValue": [""] }],
                "Out": []
            },
            "GetInfo": {
                "In": [],
                "Out": [{ "Name": "qInfo" }]
            },
            "GetDerivedDefinitionData": {
                "In": [],
                "Out": [{ "Name": "qData" }]
            },
            "GetExpression": {
                "In": [{ "Name": "qExpressionName","DefaultValue": "" }, { "Name": "qParameters","DefaultValue": [""] }],
                "Out": []
            }
        },
        "GenericDerivedFields":{
            "SetProperties": {
                "In": [{ "Name": "qProp","DefaultValue": {"qInfo": {"qId": "", "qType": ""}, "qDerivedDefinitionId": "", "qFieldName": [""], "qMetaDef": {}} }],
                "Out": []
            },
            "GetProperties": {
                "In": [],
                "Out": [{ "Name": "qProp" }]
            },
            "GetInfo": {
                "In": [],
                "Out": [{ "Name": "qInfo" }]
            },
            "GetDerivedFieldData": {
                "In": [],
                "Out": [{ "Name": "qData" }]
            },
            "GetDerivedField": {
                "In": [{ "Name": "qId","DefaultValue": "" }],
                "Out": [{ "Name": "qFields" }]
            },
            "GetListData": {
                "In": [],
                "Out": [{ "Name": "qListData" }]
            },
            "GetDerivedFields": {
                "In": [],
                "Out": [{ "Name": "qFields" }]
            },
            "GetDerivedGroups": {
                "In": [],
                "Out": [{ "Name": "qGroups" }]
            }
        },
        "InternalTest":{
            "Initialised": {
                "In": [],
                "Out": []
            },
            "TestMemoryManagement": {
                "In": [],
                "Out": []
            },
            "TestNextFileFormat": {
                "In": [],
                "Out": []
            },
            "BombQRS": {
                "In": [],
                "Out": []
            },
            "BombQRSParallel": {
                "In": [{ "Name": "qNThreads","DefaultValue": 0 }],
                "Out": []
            },
            "TestLogging": {
                "In": [{ "Name": "qLogger","DefaultValue": "" }, { "Name": "qVerbosity","DefaultValue": 0 }, { "Name": "qSteps","DefaultValue": 0, "Optional": true }],
                "Out": []
            },
            "TestRepositoryLogging": {
                "In": [{ "Name": "qLogger","DefaultValue": "" }, { "Name": "qVerbosity","DefaultValue": 0 }, { "Name": "qMessage","DefaultValue": "" }],
                "Out": []
            },
            "GetQixCounters": {
                "In": [],
                "Out": [{ "Name": "qCounters" }]
            },
            "ResetQixCounters": {
                "In": [],
                "Out": []
            }
        },
        "Doc":{
            "GetProperties": {
                "In": [],
                "Out": []
            },
            "GetField": {
                "In": [{ "Name": "qFieldName","DefaultValue": "" }, { "Name": "qStateName","DefaultValue": "", "Optional": true }],
                "Out": []
            },
            "GetFieldDescription": {
                "In": [{ "Name": "qFieldName","DefaultValue": "" }],
                "Out": []
            },
            "GetVariable": {
                "In": [{ "Name": "qName","DefaultValue": "" }],
                "Out": []
            },
            "GetLooselyCoupledVector": {
                "In": [],
                "Out": [{ "Name": "qv" }]
            },
            "SetLooselyCoupledVector": {
                "In": [{ "Name": "qv","DefaultValue": [0] }],
                "Out": []
            },
            "Evaluate": {
                "In": [{ "Name": "qExpression","DefaultValue": "" }],
                "Out": []
            },
            "EvaluateEx": {
                "In": [{ "Name": "qExpression","DefaultValue": "" }],
                "Out": [{ "Name": "qValue" }]
            },
            "ClearAll": {
                "In": [{ "Name": "qLockedAlso","DefaultValue": false, "Optional": true }, { "Name": "qStateName","DefaultValue": "", "Optional": true }],
                "Out": []
            },
            "LockAll": {
                "In": [{ "Name": "qStateName","DefaultValue": "", "Optional": true }],
                "Out": []
            },
            "UnlockAll": {
                "In": [{ "Name": "qStateName","DefaultValue": "", "Optional": true }],
                "Out": []
            },
            "Back": {
                "In": [],
                "Out": []
            },
            "Forward": {
                "In": [],
                "Out": []
            },
            "ReduceData": {
                "In": [{ "Name": "qConfirm","DefaultValue": false, "Optional": true }, { "Name": "qDropFieldNames","DefaultValue": [""], "Optional": true }],
                "Out": []
            },
            "RemoveAllData": {
                "In": [{ "Name": "qConfirm","DefaultValue": false, "Optional": true }],
                "Out": []
            },
            "CreateVariable": {
                "In": [{ "Name": "qName","DefaultValue": "" }],
                "Out": []
            },
            "RemoveVariable": {
                "In": [{ "Name": "qName","DefaultValue": "" }],
                "Out": []
            },
            "GetLocaleInfo": {
                "In": [],
                "Out": []
            },
            "GetTablesAndKeys": {
                "In": [{ "Name": "qWindowSize","DefaultValue": {"qcx": 0, "qcy": 0} }, { "Name": "qNullSize","DefaultValue": {"qcx": 0, "qcy": 0} }, { "Name": "qCellHeight","DefaultValue": 0 }, { "Name": "qSyntheticMode","DefaultValue": false }, { "Name": "qIncludeSysVars","DefaultValue": false }],
                "Out": [{ "Name": "qtr" }, { "Name": "qk" }]
            },
            "GetViewDlgSaveInfo": {
                "In": [],
                "Out": []
            },
            "SetViewDlgSaveInfo": {
                "In": [{ "Name": "qInfo","DefaultValue": {"qPos": {"qLeft": 0, "qTop": 0, "qWidth": 0, "qHeight": 0}, "qCtlInfo": {"qInternalView": {"qTables": [{"qPos": {"qLeft": 0, "qTop": 0, "qWidth": 0, "qHeight": 0}, "qCaption": ""}], "qBroomPoints": [{"qPos": {"qx": 0, "qy": 0}, "qTable": "", "qFields": [""]}], "qConnectionPoints": [{"qPos": {"qx": 0, "qy": 0}, "qFields": [""]}], "qZoomFactor": 0}, "qSourceView": {"qTables": [{"qPos": {"qLeft": 0, "qTop": 0, "qWidth": 0, "qHeight": 0}, "qCaption": ""}], "qBroomPoints": [{"qPos": {"qx": 0, "qy": 0}, "qTable": "", "qFields": [""]}], "qConnectionPoints": [{"qPos": {"qx": 0, "qy": 0}, "qFields": [""]}], "qZoomFactor": 0}}, "qMode": 0} }],
                "Out": []
            },
            "GetEmptyScript": {
                "In": [{ "Name": "qLocalizedMainSection","DefaultValue": "", "Optional": true }],
                "Out": []
            },
            "DoReload": {
                "In": [{ "Name": "qMode","DefaultValue": 0, "Optional": true }, { "Name": "qPartial","DefaultValue": false, "Optional": true }, { "Name": "qDebug","DefaultValue": false, "Optional": true }],
                "Out": []
            },
            "GetScriptBreakpoints": {
                "In": [],
                "Out": [{ "Name": "qBreakpoints" }]
            },
            "SetScriptBreakpoints": {
                "In": [{ "Name": "qBreakpoints","DefaultValue": [{"qbufferName": "", "qlineIx": 0, "qEnabled": false}] }],
                "Out": []
            },
            "GetScript": {
                "In": [],
                "Out": [{ "Name": "qScript" }]
            },
            "GetTextMacros": {
                "In": [],
                "Out": [{ "Name": "qMacros" }]
            },
            "SetFetchLimit": {
                "In": [{ "Name": "qLimit","DefaultValue": 0 }],
                "Out": []
            },
            "DoSave": {
                "In": [{ "Name": "qFileName","DefaultValue": "", "Optional": true }],
                "Out": []
            },
            "GetTableData": {
                "In": [{ "Name": "qOffset","DefaultValue": 0 }, { "Name": "qRows","DefaultValue": 0 }, { "Name": "qSyntheticMode","DefaultValue": false }, { "Name": "qTableName","DefaultValue": "" }],
                "Out": [{ "Name": "qData" }]
            },
            "GetAppLayout": {
                "In": [],
                "Out": [{ "Name": "qLayout" }]
            },
            "SetAppProperties": {
                "In": [{ "Name": "qProp","DefaultValue": {"qTitle": "", "qLastReloadTime": "", "qMigrationHash": "", "qSavedInProductVersion": "", "qThumbnail": {"qUrl": ""}} }],
                "Out": []
            },
            "GetAppProperties": {
                "In": [],
                "Out": [{ "Name": "qProp" }]
            },
            "CreateSessionObject": {
                "In": [{ "Name": "qProp","DefaultValue": {"qInfo": {"qId": "", "qType": ""}, "qExtendsId": "", "qMetaDef": {}} }],
                "Out": []
            },
            "DestroySessionObject": {
                "In": [{ "Name": "qId","DefaultValue": "" }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "CreateObject": {
                "In": [{ "Name": "qProp","DefaultValue": {"qInfo": {"qId": "", "qType": ""}, "qExtendsId": "", "qMetaDef": {}} }],
                "Out": [{ "Name": "qInfo" }]
            },
            "DestroyObject": {
                "In": [{ "Name": "qId","DefaultValue": "" }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "GetObject": {
                "In": [{ "Name": "qId","DefaultValue": "" }],
                "Out": []
            },
            "CloneObject": {
                "In": [{ "Name": "qId","DefaultValue": "" }],
                "Out": [{ "Name": "qCloneId" }]
            },
            "CreateDraft": {
                "In": [{ "Name": "qId","DefaultValue": "" }],
                "Out": [{ "Name": "qDraftId" }]
            },
            "CommitDraft": {
                "In": [{ "Name": "qId","DefaultValue": "" }],
                "Out": []
            },
            "DestroyDraft": {
                "In": [{ "Name": "qId","DefaultValue": "" }, { "Name": "qSourceId","DefaultValue": "" }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "Undo": {
                "In": [],
                "Out": [{ "Name": "qSuccess" }]
            },
            "Redo": {
                "In": [],
                "Out": [{ "Name": "qSuccess" }]
            },
            "ClearUndoBuffer": {
                "In": [],
                "Out": []
            },
            "CreateDimension": {
                "In": [{ "Name": "qProp","DefaultValue": {"qInfo": {"qId": "", "qType": ""}, "qDim": {"qGrouping": 0, "qFieldDefs": [""], "qFieldLabels": [""]}, "qMetaDef": {}} }],
                "Out": [{ "Name": "qInfo" }]
            },
            "DestroyDimension": {
                "In": [{ "Name": "qId","DefaultValue": "" }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "GetDimension": {
                "In": [{ "Name": "qId","DefaultValue": "" }],
                "Out": []
            },
            "CloneDimension": {
                "In": [{ "Name": "qId","DefaultValue": "" }],
                "Out": [{ "Name": "qCloneId" }]
            },
            "CreateMeasure": {
                "In": [{ "Name": "qProp","DefaultValue": {"qInfo": {"qId": "", "qType": ""}, "qMeasure": {"qLabel": "", "qDef": "", "qGrouping": 0, "qExpressions": [""], "qActiveExpression": 0}, "qMetaDef": {}} }],
                "Out": [{ "Name": "qInfo" }]
            },
            "DestroyMeasure": {
                "In": [{ "Name": "qId","DefaultValue": "" }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "GetMeasure": {
                "In": [{ "Name": "qId","DefaultValue": "" }],
                "Out": []
            },
            "CloneMeasure": {
                "In": [{ "Name": "qId","DefaultValue": "" }],
                "Out": [{ "Name": "qCloneId" }]
            },
            "CreateSessionVariable": {
                "In": [{ "Name": "qProp","DefaultValue": {"qInfo": {"qId": "", "qType": ""}, "qMetaDef": {}, "qName": "", "qComment": "", "qNumberPresentation": {"qType": 0, "qnDec": 0, "qUseThou": 0, "qFmt": "", "qDec": "", "qThou": ""}, "qIncludeInBookmark": false, "qDefinition": ""} }],
                "Out": []
            },
            "DestroySessionVariable": {
                "In": [{ "Name": "qId","DefaultValue": "" }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "CreateVariableEx": {
                "In": [{ "Name": "qProp","DefaultValue": {"qInfo": {"qId": "", "qType": ""}, "qMetaDef": {}, "qName": "", "qComment": "", "qNumberPresentation": {"qType": 0, "qnDec": 0, "qUseThou": 0, "qFmt": "", "qDec": "", "qThou": ""}, "qIncludeInBookmark": false, "qDefinition": ""} }],
                "Out": [{ "Name": "qInfo" }]
            },
            "DestroyVariableById": {
                "In": [{ "Name": "qId","DefaultValue": "" }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "DestroyVariableByName": {
                "In": [{ "Name": "qName","DefaultValue": "" }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "GetVariableById": {
                "In": [{ "Name": "qId","DefaultValue": "" }],
                "Out": []
            },
            "GetVariableByName": {
                "In": [{ "Name": "qName","DefaultValue": "" }],
                "Out": []
            },
            "MigrateVariables": {
                "In": [],
                "Out": []
            },
            "CreateDerivedDefinition": {
                "In": [{ "Name": "qProp","DefaultValue": {"qInfo": {"qId": "", "qType": ""}, "qDerivedDefinition": {"qName": "", "qTags": [""], "qParameters": [{"qName": "", "qValue": ""}], "qFieldDefs": [{"qName": "", "qExpression": "", "qTags": [""]}], "qGroupDefs": [{"qName": "", "qGrouping": 0, "qFieldDerivedDefinitionNames": [""]}]}, "qMetaDef": {}} }],
                "Out": [{ "Name": "qInfo" }]
            },
            "DestroyDerivedDefinition": {
                "In": [{ "Name": "qId","DefaultValue": "" }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "GetDerivedDefinition": {
                "In": [{ "Name": "qId","DefaultValue": "" }],
                "Out": []
            },
            "GetDerivedDefinitionByName": {
                "In": [{ "Name": "qName","DefaultValue": "" }],
                "Out": []
            },
            "CloneDerivedDefinition": {
                "In": [{ "Name": "qId","DefaultValue": "" }],
                "Out": [{ "Name": "qCloneId" }]
            },
            "GetDerivedDefinitionsForTags": {
                "In": [{ "Name": "qTags","DefaultValue": [""] }],
                "Out": [{ "Name": "qInstanceName" }]
            },
            "AssignDerivedFieldFor": {
                "In": [{ "Name": "qFieldName","DefaultValue": "" }, { "Name": "qDerivedDefinitionNames","DefaultValue": [""] }],
                "Out": []
            },
            "CreateDerivedFields": {
                "In": [{ "Name": "qProp","DefaultValue": {"qInfo": {"qId": "", "qType": ""}, "qDerivedDefinitionId": "", "qFieldName": [""], "qMetaDef": {}} }],
                "Out": [{ "Name": "qInfo" }]
            },
            "DestroyDerivedFields": {
                "In": [{ "Name": "qId","DefaultValue": "" }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "GetDerivedFields": {
                "In": [{ "Name": "qId","DefaultValue": "" }],
                "Out": []
            },
            "GetAllDerivedFields_INTERNAL": {
                "In": [],
                "Out": [{ "Name": "qDerivedFields" }]
            },
            "GetDerivedFieldDimensionDef": {
                "In": [{ "Name": "qLibraryId","DefaultValue": "" }],
                "Out": [{ "Name": "qDimensionDef" }]
            },
            "GetDerivedFieldFor": {
                "In": [{ "Name": "qFieldName","DefaultValue": "" }, { "Name": "qGetDerivedDefinitionsForTags","DefaultValue": "" }],
                "Out": []
            },
            "GetAllDerivedFieldsFor": {
                "In": [{ "Name": "qFieldName","DefaultValue": "" }],
                "Out": [{ "Name": "qDerivedFields" }]
            },
            "MigrateDerivedFields": {
                "In": [],
                "Out": []
            },
            "CheckExpression": {
                "In": [{ "Name": "qExpr","DefaultValue": "" }, { "Name": "qLabels","DefaultValue": [""], "Optional": true }],
                "Out": [{ "Name": "qErrorMsg" }, { "Name": "qBadFieldNames" }, { "Name": "qDangerousFieldNames" }]
            },
            "CheckNumberOrExpression": {
                "In": [{ "Name": "qExpr","DefaultValue": "" }],
                "Out": [{ "Name": "qErrorMsg" }, { "Name": "qBadFieldNames" }]
            },
            "AddAlternateState": {
                "In": [{ "Name": "qStateName","DefaultValue": "" }],
                "Out": []
            },
            "RemoveAlternateState": {
                "In": [{ "Name": "qStateName","DefaultValue": "" }],
                "Out": []
            },
            "CreateBookmark": {
                "In": [{ "Name": "qProp","DefaultValue": {"qInfo": {"qId": "", "qType": ""}, "qMetaDef": {}} }],
                "Out": [{ "Name": "qInfo" }]
            },
            "DestroyBookmark": {
                "In": [{ "Name": "qId","DefaultValue": "" }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "GetBookmark": {
                "In": [{ "Name": "qId","DefaultValue": "" }],
                "Out": []
            },
            "ApplyBookmark": {
                "In": [{ "Name": "qId","DefaultValue": "" }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "CloneBookmark": {
                "In": [{ "Name": "qId","DefaultValue": "" }],
                "Out": [{ "Name": "qCloneId" }]
            },
            "AddFieldFromExpression": {
                "In": [{ "Name": "qName","DefaultValue": "" }, { "Name": "qExpr","DefaultValue": "" }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "GetAllInfos": {
                "In": [],
                "Out": [{ "Name": "qInfos" }]
            },
            "Resume": {
                "In": [],
                "Out": []
            },
            "AbortModal": {
                "In": [{ "Name": "qAccept","DefaultValue": false }],
                "Out": []
            },
            "Publish": {
                "In": [{ "Name": "qStreamId","DefaultValue": "" }, { "Name": "qName","DefaultValue": "", "Optional": true }],
                "Out": []
            },
            "UnPublish": {
                "In": [],
                "Out": []
            },
            "GetMatchingFields": {
                "In": [{ "Name": "qTags","DefaultValue": [""] }, { "Name": "qMatchingFieldMode","DefaultValue": 0, "Optional": true }],
                "Out": [{ "Name": "qFieldNames" }]
            },
            "FindMatchingFields": {
                "In": [{ "Name": "qFieldName","DefaultValue": "" }, { "Name": "qTags","DefaultValue": [""] }],
                "Out": [{ "Name": "qFieldNames" }]
            },
            "SaveObjects": {
                "In": [],
                "Out": []
            },
            "GetAssociationScores": {
                "In": [{ "Name": "qTable1","DefaultValue": "" }, { "Name": "qTable2","DefaultValue": "" }],
                "Out": [{ "Name": "qScore" }]
            },
            "GetMediaList": {
                "In": [],
                "Out": [{ "Name": "qList" }]
            },
            "GetContentLibraries": {
                "In": [],
                "Out": [{ "Name": "qList" }]
            },
            "GetLibraryContent": {
                "In": [{ "Name": "qName","DefaultValue": "" }],
                "Out": [{ "Name": "qList" }]
            },
            "DoReloadEx": {
                "In": [{ "Name": "qParams","DefaultValue": {"qMode": 0, "qPartial": false, "qDebug": false}, "Optional": true }],
                "Out": [{ "Name": "qResult" }]
            },
            "BackCount": {
                "In": [],
                "Out": []
            },
            "ForwardCount": {
                "In": [],
                "Out": []
            },
            "SetScript": {
                "In": [{ "Name": "qScript","DefaultValue": "" }],
                "Out": []
            },
            "CheckScriptSyntax": {
                "In": [],
                "Out": [{ "Name": "qErrors" }]
            },
            "GetFavoriteVariables": {
                "In": [],
                "Out": [{ "Name": "qNames" }]
            },
            "SetFavoriteVariables": {
                "In": [{ "Name": "qNames","DefaultValue": [""] }],
                "Out": []
            },
            "GetIncludeFileContent": {
                "In": [{ "Name": "qPath","DefaultValue": "" }],
                "Out": [{ "Name": "qContent" }]
            },
            "CreateConnection": {
                "In": [{ "Name": "qConnection","DefaultValue": {"qId": "", "qName": "", "qConnectionString": "", "qType": "", "qUserName": "", "qPassword": "", "qModifiedDate": "", "qMeta": {"qName": ""}} }],
                "Out": [{ "Name": "qConnectionId" }]
            },
            "ModifyConnection": {
                "In": [{ "Name": "qConnectionId","DefaultValue": "" }, { "Name": "qConnection","DefaultValue": {"qId": "", "qName": "", "qConnectionString": "", "qType": "", "qUserName": "", "qPassword": "", "qModifiedDate": "", "qMeta": {"qName": ""}} }, { "Name": "qOverrideCredentials","DefaultValue": false, "Optional": true }],
                "Out": []
            },
            "DeleteConnection": {
                "In": [{ "Name": "qConnectionId","DefaultValue": "" }],
                "Out": []
            },
            "GetConnection": {
                "In": [{ "Name": "qConnectionId","DefaultValue": "" }],
                "Out": [{ "Name": "qConnection" }]
            },
            "GetConnections": {
                "In": [],
                "Out": [{ "Name": "qConnections" }]
            },
            "GetDatabaseInfo": {
                "In": [{ "Name": "qConnectionId","DefaultValue": "" }],
                "Out": [{ "Name": "qInfo" }]
            },
            "GetDatabases": {
                "In": [{ "Name": "qConnectionId","DefaultValue": "" }],
                "Out": [{ "Name": "qDatabases" }]
            },
            "GetDatabaseOwners": {
                "In": [{ "Name": "qConnectionId","DefaultValue": "" }, { "Name": "qDatabase","DefaultValue": "", "Optional": true }],
                "Out": [{ "Name": "qOwners" }]
            },
            "GetDatabaseTables": {
                "In": [{ "Name": "qConnectionId","DefaultValue": "" }, { "Name": "qDatabase","DefaultValue": "", "Optional": true }, { "Name": "qOwner","DefaultValue": "", "Optional": true }],
                "Out": [{ "Name": "qTables" }]
            },
            "GetDatabaseTableFields": {
                "In": [{ "Name": "qConnectionId","DefaultValue": "" }, { "Name": "qDatabase","DefaultValue": "", "Optional": true }, { "Name": "qOwner","DefaultValue": "", "Optional": true }, { "Name": "qTable","DefaultValue": "" }],
                "Out": [{ "Name": "qFields" }]
            },
            "GetDatabaseTablePreview": {
                "In": [{ "Name": "qConnectionId","DefaultValue": "" }, { "Name": "qDatabase","DefaultValue": "", "Optional": true }, { "Name": "qOwner","DefaultValue": "", "Optional": true }, { "Name": "qTable","DefaultValue": "" }],
                "Out": [{ "Name": "qPreview" }]
            },
            "GetFolderItemsForConnection": {
                "In": [{ "Name": "qConnectionId","DefaultValue": "" }, { "Name": "qRelativePath","DefaultValue": "", "Optional": true }],
                "Out": [{ "Name": "qFolderItems" }]
            },
            "GuessFileType": {
                "In": [{ "Name": "qConnectionId","DefaultValue": "" }, { "Name": "qRelativePath","DefaultValue": "", "Optional": true }],
                "Out": [{ "Name": "qDataFormat" }]
            },
            "GetFileTables": {
                "In": [{ "Name": "qConnectionId","DefaultValue": "" }, { "Name": "qRelativePath","DefaultValue": "", "Optional": true }, { "Name": "qDataFormat","DefaultValue": {"qType": 0, "qLabel": "", "qQuote": "", "qComment": "", "qDelimiter": {"qName": "", "qScriptCode": "", "qNumber": 0, "qIsMultiple": false}, "qCodePage": 0, "qHeaderSize": 0, "qRecordSize": 0, "qTabSize": 0, "qIgnoreEOF": false, "qFixedWidthDelimiters": ""} }],
                "Out": [{ "Name": "qTables" }]
            },
            "GetFileTableFields": {
                "In": [{ "Name": "qConnectionId","DefaultValue": "" }, { "Name": "qRelativePath","DefaultValue": "", "Optional": true }, { "Name": "qDataFormat","DefaultValue": {"qType": 0, "qLabel": "", "qQuote": "", "qComment": "", "qDelimiter": {"qName": "", "qScriptCode": "", "qNumber": 0, "qIsMultiple": false}, "qCodePage": 0, "qHeaderSize": 0, "qRecordSize": 0, "qTabSize": 0, "qIgnoreEOF": false, "qFixedWidthDelimiters": ""} }, { "Name": "qTable","DefaultValue": "" }],
                "Out": [{ "Name": "qFields" }, { "Name": "qFormatSpec" }]
            },
            "GetFileTablePreview": {
                "In": [{ "Name": "qConnectionId","DefaultValue": "" }, { "Name": "qRelativePath","DefaultValue": "", "Optional": true }, { "Name": "qDataFormat","DefaultValue": {"qType": 0, "qLabel": "", "qQuote": "", "qComment": "", "qDelimiter": {"qName": "", "qScriptCode": "", "qNumber": 0, "qIsMultiple": false}, "qCodePage": 0, "qHeaderSize": 0, "qRecordSize": 0, "qTabSize": 0, "qIgnoreEOF": false, "qFixedWidthDelimiters": ""} }, { "Name": "qTable","DefaultValue": "" }],
                "Out": [{ "Name": "qPreview" }, { "Name": "qFormatSpec" }]
            },
            "GetFileTablesEx": {
                "In": [{ "Name": "qConnectionId","DefaultValue": "" }, { "Name": "qRelativePath","DefaultValue": "", "Optional": true }, { "Name": "qDataFormat","DefaultValue": {"qType": 0, "qLabel": "", "qQuote": "", "qComment": "", "qDelimiter": {"qName": "", "qScriptCode": "", "qNumber": 0, "qIsMultiple": false}, "qCodePage": 0, "qHeaderSize": 0, "qRecordSize": 0, "qTabSize": 0, "qIgnoreEOF": false, "qFixedWidthDelimiters": ""} }],
                "Out": [{ "Name": "qTables" }]
            },
            "SendGenericCommandToCustomConnector": {
                "In": [{ "Name": "qProvider","DefaultValue": "" }, { "Name": "qCommand","DefaultValue": "" }, { "Name": "qMethod","DefaultValue": "" }, { "Name": "qParameters","DefaultValue": [""] }, { "Name": "qAppendConnection","DefaultValue": "" }],
                "Out": [{ "Name": "qResult" }]
            },
            "SearchSuggest": {
                "In": [{ "Name": "qOptions","DefaultValue": {"qSearchFields": [""], "qContext": 0} }, { "Name": "qTerms","DefaultValue": [""] }],
                "Out": [{ "Name": "qResult" }]
            },
            "SearchAssociations": {
                "In": [{ "Name": "qOptions","DefaultValue": {"qSearchFields": [""], "qContext": 0} }, { "Name": "qTerms","DefaultValue": [""] }, { "Name": "qPage","DefaultValue": {"qOffset": 0, "qCount": 0, "qMaxNbrFieldMatches": 0, "qGroupOptions": [{"qGroupType": 0, "qOffset": 0, "qCount": 0}], "qGroupItemOptions": [{"qGroupItemType": 0, "qOffset": 0, "qCount": 0}]} }],
                "Out": [{ "Name": "qResults" }]
            },
            "SelectAssociations": {
                "In": [{ "Name": "qOptions","DefaultValue": {"qSearchFields": [""], "qContext": 0} }, { "Name": "qTerms","DefaultValue": [""] }, { "Name": "qMatchIx","DefaultValue": 0 }, { "Name": "qSoftLock","DefaultValue": null, "Optional": true }],
                "Out": []
            },
            "SearchResults": {
                "In": [{ "Name": "qOptions","DefaultValue": {"qSearchFields": [""], "qContext": 0} }, { "Name": "qTerms","DefaultValue": [""] }, { "Name": "qPage","DefaultValue": {"qOffset": 0, "qCount": 0, "qMaxNbrFieldMatches": 0, "qGroupOptions": [{"qGroupType": 0, "qOffset": 0, "qCount": 0}], "qGroupItemOptions": [{"qGroupItemType": 0, "qOffset": 0, "qCount": 0}]} }],
                "Out": [{ "Name": "qResult" }]
            }
        },
        "Global":{
            "AbortRequest": {
                "In": [{ "Name": "qRequestId","DefaultValue": 0 }],
                "Out": []
            },
            "AbortAll": {
                "In": [],
                "Out": []
            },
            "GetProgress": {
                "In": [{ "Name": "qRequestId","DefaultValue": 0 }],
                "Out": [{ "Name": "qProgressData" }]
            },
            "QvVersion": {
                "In": [],
                "Out": []
            },
            "OSVersion": {
                "In": [],
                "Out": []
            },
            "OSName": {
                "In": [],
                "Out": []
            },
            "QTProduct": {
                "In": [],
                "Out": []
            },
            "GetDocList": {
                "In": [],
                "Out": [{ "Name": "qDocList" }]
            },
            "GetInteract": {
                "In": [{ "Name": "qRequestId","DefaultValue": 0 }],
                "Out": [{ "Name": "qDef" }]
            },
            "InteractDone": {
                "In": [{ "Name": "qRequestId","DefaultValue": 0 }, { "Name": "qDef","DefaultValue": {"qType": 0, "qTitle": "", "qMsg": "", "qButtons": 0, "qLine": "", "qOldLineNr": 0, "qNewLineNr": 0, "qPath": "", "qHidden": false, "qResult": 0, "qInput": ""} }],
                "Out": []
            },
            "GetAuthenticatedUser": {
                "In": [],
                "Out": []
            },
            "GetStreamList": {
                "In": [],
                "Out": [{ "Name": "qStreamList" }]
            },
            "CreateDocEx": {
                "In": [{ "Name": "qDocName","DefaultValue": "" }, { "Name": "qUserName","DefaultValue": "", "Optional": true }, { "Name": "qPassword","DefaultValue": "", "Optional": true }, { "Name": "qSerial","DefaultValue": "", "Optional": true }, { "Name": "qLocalizedScriptMainSection","DefaultValue": "", "Optional": true }],
                "Out": [{ "Name": "qDocId" }]
            },
            "GetActiveDoc": {
                "In": [],
                "Out": []
            },
            "AllowCreateApp": {
                "In": [],
                "Out": []
            },
            "CreateApp": {
                "In": [{ "Name": "qAppName","DefaultValue": "" }, { "Name": "qLocalizedScriptMainSection","DefaultValue": "", "Optional": true }],
                "Out": [{ "Name": "qSuccess" }, { "Name": "qAppId" }]
            },
            "DeleteApp": {
                "In": [{ "Name": "qAppId","DefaultValue": "" }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "IsDesktopMode": {
                "In": [],
                "Out": []
            },
            "GetConfiguration": {
                "In": [],
                "Out": [{ "Name": "qConfig" }]
            },
            "CancelRequest": {
                "In": [{ "Name": "qRequestId","DefaultValue": 0 }],
                "Out": []
            },
            "GetInternalTest": {
                "In": [{ "Name": "qKey","DefaultValue": "" }],
                "Out": []
            },
            "ShutdownProcess": {
                "In": [],
                "Out": []
            },
            "ReloadExtensionList": {
                "In": [],
                "Out": []
            },
            "ReplaceAppFromID": {
                "In": [{ "Name": "qTargetAppId","DefaultValue": "" }, { "Name": "qSrcAppID","DefaultValue": "" }, { "Name": "qIds","DefaultValue": [""] }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "CopyApp": {
                "In": [{ "Name": "qTargetAppId","DefaultValue": "" }, { "Name": "qSrcAppId","DefaultValue": "" }, { "Name": "qIds","DefaultValue": [""] }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "ImportApp": {
                "In": [{ "Name": "qAppId","DefaultValue": "" }, { "Name": "qSrcPath","DefaultValue": "" }, { "Name": "qIds","DefaultValue": [""] }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "ImportAppEx": {
                "In": [{ "Name": "qAppId","DefaultValue": "" }, { "Name": "qSrcPath","DefaultValue": "" }, { "Name": "qIds","DefaultValue": [""] }, { "Name": "qExcludeConnections","DefaultValue": false }],
                "Out": []
            },
            "ExportApp": {
                "In": [{ "Name": "qTargetPath","DefaultValue": "" }, { "Name": "qSrcAppId","DefaultValue": "" }, { "Name": "qIds","DefaultValue": [""] }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "PublishApp": {
                "In": [{ "Name": "qAppId","DefaultValue": "" }, { "Name": "qStreamId","DefaultValue": "" }, { "Name": "qCopy","DefaultValue": false }, { "Name": "qReplaceId","DefaultValue": "", "Optional": true }],
                "Out": [{ "Name": "qSuccess" }]
            },
            "IsPersonalMode": {
                "In": [],
                "Out": []
            },
            "GetUniqueID": {
                "In": [],
                "Out": [{ "Name": "qUniqueID" }]
            },
            "OpenDoc": {
                "In": [{ "Name": "qDocName","DefaultValue": "" }, { "Name": "qUserName","DefaultValue": "", "Optional": true }, { "Name": "qPassword","DefaultValue": "", "Optional": true }, { "Name": "qSerial","DefaultValue": "", "Optional": true }, { "Name": "qNoData","DefaultValue": false, "Optional": true }],
                "Out": []
            },
            "CreateSessionApp": {
                "In": [],
                "Out": [{ "Name": "qSessionAppId" }]
            },
            "CreateSessionAppFromApp": {
                "In": [{ "Name": "qSrcAppId","DefaultValue": "" }],
                "Out": [{ "Name": "qSessionAppId" }]
            },
            "ProductVersion": {
                "In": [],
                "Out": []
            },
            "GetAppEntry": {
                "In": [{ "Name": "qAppID","DefaultValue": "" }],
                "Out": [{ "Name": "qEntry" }]
            },
            "ConfigureReload": {
                "In": [{ "Name": "qCancelOnScriptError","DefaultValue": false }, { "Name": "qUseErrorData","DefaultValue": false }, { "Name": "qInteractOnError","DefaultValue": false }],
                "Out": []
            },
            "CancelReload": {
                "In": [],
                "Out": []
            },
            "GetBNF": {
                "In": [{ "Name": "qBnfType","DefaultValue": 0 }],
                "Out": [{ "Name": "qBnfDefs" }]
            },
            "GetFunctions": {
                "In": [{ "Name": "qGroup","DefaultValue": 0, "Optional": true }],
                "Out": [{ "Name": "qFunctions" }]
            },
            "GetOdbcDsns": {
                "In": [],
                "Out": [{ "Name": "qOdbcDsns" }]
            },
            "GetOleDbProviders": {
                "In": [],
                "Out": [{ "Name": "qOleDbProviders" }]
            },
            "GetDatabasesFromConnectionString": {
                "In": [{ "Name": "qConnection","DefaultValue": {"qId": "", "qName": "", "qConnectionString": "", "qType": "", "qUserName": "", "qPassword": "", "qModifiedDate": "", "qMeta": {"qName": ""}} }],
                "Out": [{ "Name": "qDatabases" }]
            },
            "IsValidConnectionString": {
                "In": [{ "Name": "qConnection","DefaultValue": {"qId": "", "qName": "", "qConnectionString": "", "qType": "", "qUserName": "", "qPassword": "", "qModifiedDate": "", "qMeta": {"qName": ""}} }],
                "Out": []
            },
            "GetDefaultAppFolder": {
                "In": [],
                "Out": [{ "Name": "qPath" }]
            },
            "GetMyDocumentsFolder": {
                "In": [],
                "Out": [{ "Name": "qFolder" }]
            },
            "GetLogicalDriveStrings": {
                "In": [],
                "Out": [{ "Name": "qDrives" }]
            },
            "GetFolderItemsForPath": {
                "In": [{ "Name": "qPath","DefaultValue": "" }],
                "Out": [{ "Name": "qFolderItems" }]
            },
            "GetSupportedCodePages": {
                "In": [],
                "Out": [{ "Name": "qCodePages" }]
            },
            "GetCustomConnectors": {
                "In": [{ "Name": "qReloadList","DefaultValue": false, "Optional": true }],
                "Out": [{ "Name": "qConnectors" }]
            }
        }
    },
    "enums": {
        "LocalizedMessageCode": {
            "LOCMSG_SCRIPTEDITOR_EMPTY_MESSAGE": 0,
            "LOCMSG_SCRIPTEDITOR_PROGRESS_SAVING_STARTED": 1,
            "LOCMSG_SCRIPTEDITOR_PROGRESS_BYTES_LEFT": 2,
            "LOCMSG_SCRIPTEDITOR_PROGRESS_STORING_TABLES": 3,
            "LOCMSG_SCRIPTEDITOR_PROGRESS_QVD_ROWS_SO_FAR": 4,
            "LOCMSG_SCRIPTEDITOR_PROGRESS_CONNECTED": 5,
            "LOCMSG_SCRIPTEDITOR_PROGRESS_CONNECTING_TO": 6,
            "LOCMSG_SCRIPTEDITOR_PROGRESS_CONNECT_FAILED": 7,
            "LOCMSG_SCRIPTEDITOR_PROGRESS_QVD_ROWISH": 8,
            "LOCMSG_SCRIPTEDITOR_PROGRESS_QVD_COLUMNAR": 9,
            "LOCMSG_SCRIPTEDITOR_ERROR": 10,
            "LOCMSG_SCRIPTEDITOR_DONE": 11,
            "LOCMSG_SCRIPTEDITOR_LOAD_EXTERNAL_DATA": 12,
            "LOCMSG_SCRIPTEDITOR_PROGRESS_OLD_QVD_ISLOADING": 13,
            "LOCMSG_SCRIPTEDITOR_PROGRESS_QVC_LOADING": 14,
            "LOCMSG_SCRIPTEDITOR_PROGRESS_QVD_BUFFERED": 15,
            "LOCMSG_SCRIPTEDITOR_PROGRESS_QVC_PREPARING": 16,
            "LOCMSG_SCRIPTEDITOR_PROGRESS_QVC_APPENDING": 17,
            "LOCMSG_SCRIPTEDITOR_REMOVE_SYNTHETIC": 18,
            "LOCMSG_SCRIPTEDITOR_PENDING_LINKEDTABLE_FETCHING": 19,
            "LOCMSG_SCRIPTEDITOR_RELOAD": 20,
            "LOCMSG_SCRIPTEDITOR_LINES_FETCHED": 21
        },
        "QrsChangeType": {
            "QRS_CHANGE_UNDEFINED": 0,
            "QRS_CHANGE_ADD": 1,
            "QRS_CHANGE_UPDATE": 2,
            "QRS_CHANGE_DELETE": 3
        },
        "LocalizedErrorCode": {
            "LOCERR_INTERNAL_ERROR": -128,
            "LOCERR_GENERIC_UNKNOWN": -1,
            "LOCERR_GENERIC_OK": 0,
            "LOCERR_GENERIC_NOT_SET": 1,
            "LOCERR_GENERIC_NOT_FOUND": 2,
            "LOCERR_GENERIC_ALREADY_EXISTS": 3,
            "LOCERR_GENERIC_INVALID_PATH": 4,
            "LOCERR_GENERIC_ACCESS_DENIED": 5,
            "LOCERR_GENERIC_OUT_OF_MEMORY": 6,
            "LOCERR_GENERIC_NOT_INITIALIZED": 7,
            "LOCERR_GENERIC_INVALID_PARAMETERS": 8,
            "LOCERR_GENERIC_EMPTY_PARAMETERS": 9,
            "LOCERR_GENERIC_INTERNAL_ERROR": 10,
            "LOCERR_GENERIC_CORRUPT_DATA": 11,
            "LOCERR_GENERIC_MEMORY_INCONSISTENCY": 12,
            "LOCERR_GENERIC_INVISIBLE_OWNER_ABORT": 13,
            "LOCERR_GENERIC_PROHIBIT_VALIDATE": 14,
            "LOCERR_GENERIC_ABORTED": 15,
            "LOCERR_GENERIC_CONNECTION_LOST": 16,
            "LOCERR_GENERIC_UNSUPPORTED_IN_PRODUCT_VERSION": 17,
            "LOCERR_GENERIC_REST_CONNECTION_FAILURE": 18,
            "LOCERR_HTTP_400": 400,
            "LOCERR_HTTP_401": 401,
            "LOCERR_HTTP_402": 402,
            "LOCERR_HTTP_403": 403,
            "LOCERR_HTTP_404": 404,
            "LOCERR_HTTP_405": 405,
            "LOCERR_HTTP_406": 406,
            "LOCERR_HTTP_407": 407,
            "LOCERR_HTTP_408": 408,
            "LOCERR_HTTP_409": 409,
            "LOCERR_HTTP_410": 410,
            "LOCERR_HTTP_411": 411,
            "LOCERR_HTTP_412": 412,
            "LOCERR_HTTP_413": 413,
            "LOCERR_HTTP_414": 414,
            "LOCERR_HTTP_415": 415,
            "LOCERR_HTTP_416": 416,
            "LOCERR_HTTP_417": 417,
            "LOCERR_HTTP_500": 500,
            "LOCERR_HTTP_501": 501,
            "LOCERR_HTTP_502": 502,
            "LOCERR_HTTP_503": 503,
            "LOCERR_HTTP_504": 504,
            "LOCERR_HTTP_505": 505,
            "LOCERR_HTTP_509": 509,
            "LOCERR_APP_ALREADY_EXISTS": 1000,
            "LOCERR_APP_INVALID_NAME": 1001,
            "LOCERR_APP_ALREADY_OPEN": 1002,
            "LOCERR_APP_NOT_FOUND": 1003,
            "LOCERR_APP_IMPORT_FAILED": 1004,
            "LOCERR_APP_SAVE_FAILED": 1005,
            "LOCERR_APP_CREATE_FAILED": 1006,
            "LOCERR_APP_INVALID": 1007,
            "LOCERR_APP_CONNECT_FAILED": 1008,
            "LOCERR_APP_ALREADY_OPEN_IN_DIFFERENT_MODE": 1009,
            "LOCERR_APP_MIGRATION_COULD_NOT_CONTACT_MIGRATION_SERVICE": 1010,
            "LOCERR_APP_MIGRATION_COULD_NOT_START_MIGRATION": 1011,
            "LOCERR_APP_MIGRATION_FAILURE": 1012,
            "LOCERR_APP_SCRIPT_MISSING": 1013,
            "LOCERR_CONNECTION_ALREADY_EXISTS": 2000,
            "LOCERR_CONNECTION_NOT_FOUND": 2001,
            "LOCERR_CONNECTION_FAILED_TO_LOAD": 2002,
            "LOCERR_CONNECTION_FAILED_TO_IMPORT": 2003,
            "LOCERR_CONNECTION_NAME_IS_INVALID": 2004,
            "LOCERR_FILE_ACCESS_DENIED": 3000,
            "LOCERR_FILE_NAME_INVALID": 3001,
            "LOCERR_FILE_CORRUPT": 3002,
            "LOCERR_FILE_NOT_FOUND": 3003,
            "LOCERR_FILE_FORMAT_UNSUPPORTED": 3004,
            "LOCERR_FILE_OPENED_IN_UNSUPPORTED_MODE": 3005,
            "LOCERR_USER_ACCESS_DENIED": 4000,
            "LOCERR_USER_IMPERSONATION_FAILED": 4001,
            "LOCERR_SERVER_OUT_OF_SESSION_AND_USER_CALS": 5000,
            "LOCERR_SERVER_OUT_OF_SESSION_CALS": 5001,
            "LOCERR_SERVER_OUT_OF_USAGE_CALS": 5002,
            "LOCERR_SERVER_OUT_OF_CALS": 5003,
            "LOCERR_SERVER_OUT_OF_NAMED_CALS": 5004,
            "LOCERR_SERVER_OFF_DUTY": 5005,
            "LOCERR_SERVER_BUSY": 5006,
            "LOCERR_SERVER_LICENSE_EXPIRED": 5007,
            "LOCERR_SERVER_AJAX_DISABLED": 5008,
            "LOCERR_HC_INVALID_OBJECT": 6000,
            "LOCERR_HC_RESULT_TOO_LARGE": 6001,
            "LOCERR_HC_INVALID_OBJECT_STATE": 6002,
            "LOCERR_HC_MODAL_OBJECT_ERROR": 6003,
            "LOCERR_CALC_INVALID_DEF": 7000,
            "LOCERR_CALC_NOT_IN_LIB": 7001,
            "LOCERR_CALC_HEAP_ERROR": 7002,
            "LOCERR_CALC_TOO_LARGE": 7003,
            "LOCERR_CALC_TIMEOUT": 7004,
            "LOCERR_CALC_EVAL_CONDITION_FAILED": 7005,
            "LOCERR_CALC_MIXED_LINKED_AGGREGATION": 7006,
            "LOCERR_CALC_MISSING_LINKED": 7007,
            "LOCERR_CALC_INVALID_COL_SORT": 7008,
            "LOCERR_CALC_PAGES_TOO_LARGE": 7009,
            "LOCERR_CALC_SEMANTIC_FIELD_NOT_ALLOWED": 7010,
            "LOCERR_CALC_VALIDATION_STATE_INVALID": 7011,
            "LOCERR_CALC_PIVOT_DIMENSIONS_ALREADY_EXISTS": 7012,
            "LOCERR_CALC_MISSING_LINKED_FIELD": 7013,
            "LOCERR_LAYOUT_EXTENDS_INVALID_ID": 8000,
            "LOCERR_LAYOUT_LINKED_OBJECT_NOT_FOUND": 8001,
            "LOCERR_LAYOUT_LINKED_OBJECT_INVALID": 8002,
            "LOCERR_PERSISTENCE_WRITE_FAILED": 9000,
            "LOCERR_PERSISTENCE_READ_FAILED": 9001,
            "LOCERR_PERSISTENCE_DELETE_FAILED": 9002,
            "LOCERR_PERSISTENCE_NOT_FOUND": 9003,
            "LOCERR_PERSISTENCE_UNSUPPORTED_VERSION": 9004,
            "LOCERR_PERSISTENCE_MIGRATION_FAILED_READ_ONLY": 9005,
            "LOCERR_PERSISTENCE_MIGRATION_CANCELLED": 9006,
            "LOCERR_PERSISTENCE_MIGRATION_BACKUP_FAILED": 9007,
            "LOCERR_PERSISTENCE_DISK_FULL": 9008,
            "LOCERR_PERSISTENCE_NOT_SUPPORTED_FOR_SESSION_APP": 9009,
            "LOCERR_PERSISTENCE_SYNC_SET_CHUNK_INVALID_PARAMETERS": 9510,
            "LOCERR_PERSISTENCE_SYNC_GET_CHUNK_INVALID_PARAMETERS": 9511,
            "LOCERR_SCRIPT_DATASOURCE_ACCESS_DENIED": 10000,
            "LOCERR_RELOAD_IN_PROGRESS": 11000,
            "LOCERR_PERSONAL_NEW_VERSION_AVAILABLE": 12000,
            "LOCERR_PERSONAL_VERSION_EXPIRED": 12001,
            "LOCERR_PERSONAL_SECTION_ACCESS_DETECTED": 12002,
            "LOCERR_PERSONAL_APP_DELETION_FAILED": 12003,
            "LOCERR_EXPORT_OUT_OF_MEMORY": 13000,
            "LOCERR_EXPORT_NO_DATA": 13001,
            "LOCERR_SYNC_INVALID_OFFSET": 14000,
            "LOCERR_SEARCH_TIMEOUT": 15000,
            "LOCERR_DIRECT_DISCOVERY_LINKED_EXPRESSION_FAIL": 16000,
            "LOCERR_DIRECT_DISCOVERY_ROWCOUNT_OVERFLOW": 16001,
            "LOCERR_DIRECT_DISCOVERY_EMPTY_RESULT": 16002,
            "LOCERR_DIRECT_DISCOVERY_DB_CONNECTION_FAILED": 16003,
            "LOCERR_DIRECT_DISCOVERY_MEASURE_NOT_ALLOWED": 16004,
            "LOCERR_DIRECT_DISCOVERY_DETAIL_NOT_ALLOWED": 16005,
            "LOCERR_DIRECT_DISCOVERY_NOT_SYNTH_CIRCULAR_ALLOWED": 16006,
            "LOCERR_DIRECT_DISCOVERY_ONLY_ONE_DD_TABLE_ALLOWED": 16007,
            "LOCERR_SMART_LOAD_TABLE_NOT_FOUND": 17000,
            "LOCERR_SMART_LOAD_TABLE_DUPLICATED": 17001,
            "LOCERR_VARIABLE_NO_NAME": 18000,
            "LOCERR_VARIABLE_DUPLICATE_NAME": 18001,
            "LOCERR_VARIABLE_INCONSISTENCY": 18002,
            "LOCERR_MEDIA_LIBRARY_LIST_FAILED": 19000,
            "LOCERR_MEDIA_LIBRARY_CONTENT_FAILED": 19001,
            "LOCERR_MEDIA_BUNDLING_FAILED": 19002,
            "LOCERR_MEDIA_UNBUNDLING_FAILED": 19003,
            "LOCERR_MEDIA_LIBRARY_NOT_FOUND": 19004,
            "LOCERR_JSON_RPC_INVALID_REQUEST": -32600,
            "LOCERR_JSON_RPC_METHOD_NOT_FOUND": -32601,
            "LOCERR_JSON_RPC_INVALID_PARAMETERS": -32602,
            "LOCERR_JSON_RPC_INTERNAL_ERROR": -32603,
            "LOCERR_JSON_RPC_PARSE_ERROR": -32700
        },
        "LocalizedWarningCode": {
            "LOCWARN_PERSONAL_RELOAD_REQUIRED": 0,
            "LOCWARN_PERSONAL_VERSION_EXPIRES_SOON": 1,
            "LOCWARN_EXPORT_DATA_TRUNCATED": 1000,
            "LOCWARN_COULD_NOT_OPEN_ALL_OBJECTS": 2000
        },
        "GrpType": {
            "GRP_NX_NONE": 0,
            "GRP_NX_HIEARCHY": 1,
            "GRP_NX_COLLECTION": 2
        },
        "ExportFileType": {
            "EXPORT_CSV_C": 0,
            "EXPORT_CSV_T": 1,
            "EXPORT_OOXML": 2
        },
        "ExportState": {
            "EXPORT_POSSIBLE": 0,
            "EXPORT_ALL": 1
        },
        "DimCellType": {
            "NX_DIM_CELL_VALUE": 0,
            "NX_DIM_CELL_EMPTY": 1,
            "NX_DIM_CELL_NORMAL": 2,
            "NX_DIM_CELL_TOTAL": 3,
            "NX_DIM_CELL_OTHER": 4,
            "NX_DIM_CELL_AGGR": 5,
            "NX_DIM_CELL_PSEUDO": 6,
            "NX_DIM_CELL_ROOT": 7,
            "NX_DIM_CELL_NULL": 8
        },
        "StackElemType": {
            "NX_STACK_CELL_NORMAL": 0,
            "NX_STACK_CELL_TOTAL": 1,
            "NX_STACK_CELL_OTHER": 2,
            "NX_STACK_CELL_SUM": 3,
            "NX_STACK_CELL_VALUE": 4,
            "NX_STACK_CELL_PSEUDO": 5
        },
        "SortIndicatorType": {
            "NX_SORT_INDICATE_NONE": 0,
            "NX_SORT_INDICATE_ASC": 1,
            "NX_SORT_INDICATE_DESC": 2
        },
        "DimensionType": {
            "NX_DIMENSION_TYPE_DISCRETE": 0,
            "NX_DIMENSION_TYPE_NUMERIC": 1,
            "NX_DIMENSION_TYPE_TIME": 2
        },
        "FieldSelectionMode": {
            "SELECTION_MODE_NORMAL": 0,
            "SELECTION_MODE_AND": 1,
            "SELECTION_MODE_NOT": 2
        },
        "FrequencyMode": {
            "NX_FREQUENCY_NONE": 0,
            "NX_FREQUENCY_VALUE": 1,
            "NX_FREQUENCY_PERCENT": 2,
            "NX_FREQUENCY_RELATIVE": 3
        },
        "DataReductionMode": {
            "DATA_REDUCTION_NONE": 0,
            "DATA_REDUCTION_ONEDIM": 1,
            "DATA_REDUCTION_SCATTERED": 2,
            "DATA_REDUCTION_CLUSTERED": 3,
            "DATA_REDUCTION_STACKED": 4
        },
        "HypercubeMode": {
            "DATA_MODE_STRAIGHT": 0,
            "DATA_MODE_PIVOT": 1,
            "DATA_MODE_PIVOT_STACK": 2
        },
        "PatchOperationType": {
            "Add": 0,
            "Remove": 1,
            "Replace": 2
        },
        "SelectionCellType": {
            "NX_CELL_DATA": 0,
            "NX_CELL_TOP": 1,
            "NX_CELL_LEFT": 2
        },
        "MatchingFieldMode": {
            "MATCHINGFIELDMODE_MATCH_ALL": 0,
            "MATCHINGFIELDMODE_MATCH_ONE": 1
        }
    }
}