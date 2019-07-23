({
    searchHelper : function(component,event,getInputkeyWord) {
        // call the apex class method 
        var action = component.get("c.fetchLookUpValues");
        // set param to method  
        action.setParams({
            'searchKeyWord': getInputkeyWord,
            'ObjectName' : component.get("v.objectAPIName")
        });
        // set a callBack    
        action.setCallback(this, function(response) {
            $A.util.removeClass(component.find("mySpinner"), "slds-show");
            var state = response.getState();
            if (state === "SUCCESS") {
                var storeResponse = response.getReturnValue();
                // if storeResponse size is equal 0 ,display No Result Found... message on screen.                }
                if (storeResponse.length == 0) {
                    component.set("v.Message", 'No Result Found...');
                } else {
                    component.set("v.Message", '');
                }
                // set searchResult list with return value from server.
                if(component.get("v.objectAPIName")=='contact'){
                    storeResponse.push({'Id':undefined,'Name':'','FirstName':'','LastName':''});
                }
                component.set("v.listOfSearchRecords", storeResponse);
            }
            
        });
        // enqueue the Action  
        $A.enqueueAction(action);
        
    },
    FireRecordChangeEvent : function(component,event,helper){
        if(component.get("v.objectAPIName")=='contact'){
            // call the event   
            var compEvent = component.getEvent("LEX_RecordChangeEvent");
            // set the Selected sObject Record to the event attribute.  
            compEvent.setParams({
                "recordByEvent" : component.get("v.selectedRecord"), 
                "index" : component.get("v.indexVar")
            });  
            // fire the event  
            compEvent.fire();
        }
        
    }
})