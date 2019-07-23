({
    getContactRoleRecords : function(component, event, helper) {
        var action = component.get("c.getopportunityContactRoles");
        action.setParams({
            'recordId' : component.get("v.recordId"),
        });
        action.setCallback(this,function(response) {
            var state = response.getState();
            if (state === "SUCCESS"){
                var response = response.getReturnValue();
                var PrimaryIndex=[];
                var ExistingContactRoleCoun=0;
                for(var key in response.ContactRoles){
                    if(response.ContactRoles[key].isPrimary)
                        PrimaryIndex.push(key);
                    if(response.ContactRoles[key].ContactRoleId)
                        ++ExistingContactRoleCoun;
                }
                
                component.set("v.ContactRoleRecords",response.ContactRoles);
                component.set("v.roleOptions",response.RolePicklistValues);
                component.set("v.PrimaryIndex",PrimaryIndex);
                component.set("v.NumberOfRecords",ExistingContactRoleCoun);
                component.set("v.OpportunityRecord",response.opportunity);
                component.set("v.ContactRecordTypes",response.ContactRecordTypes);
                component.set("v.onlyMasterContactRecordType",response.onlyMasterAvailable);
                component.set("v.showSpinner",false);
            } 
            else if (state === "ERROR") {
                var errors = response.getError();
                component.set("v.showSpinner",false);
                alert(errors);
            }
        });	
        $A.enqueueAction(action);
        
    },
    getContactFieldLayout :function(component, event, helper){
        var selectedContactRecordType=component.get("v.selectedContactRecordType");
        var recordTypes=component.get("v.ContactRecordTypes");
        for(var key in recordTypes){
            if(recordTypes[key].value===selectedContactRecordType){
                component.set("v.selectedContactRecordTypeLabel",recordTypes[key].label);
                break;
            }
        }
        var action = component.get("c.getContactLayoutFields1");
        action.setParams({
            'recordTypeId' : component.get("v.onlyMasterContactRecordType")?'':selectedContactRecordType
        });
        action.setCallback(this,function(response) {
            var state = response.getState();
            if (state === "SUCCESS"){	
                var data=response.getReturnValue();
                var fields =JSON.parse(data.fields);
                var booleanFields=JSON.parse(data.BooleanFields);
                for(var section in fields['sections']){
                    if(fields['sections'][section].heading=='System Information'){
                        delete fields['sections'][section];
                        continue;
                    }
                    for(var row in fields['sections'][section]['layoutRows']){
                        for(var item in fields['sections'][section]['layoutRows'][row]['layoutItems']){
                            //console.log(section,row,item);
                            //console.log('item---',fields['sections'][section]['layoutRows'][row]['layoutItems'][item]['layoutComponents'][cmp].apiName);
                            for(var cmp in fields['sections'][section]['layoutRows'][row]['layoutItems'][item]['layoutComponents']){
                                if(booleanFields.hasOwnProperty(fields['sections'][section]['layoutRows'][row]['layoutItems'][item]['layoutComponents'][cmp].apiName)){
                                    fields['sections'][section]['layoutRows'][row]['layoutItems'][item]['layoutComponents'][cmp].IsBooleanValue=true;
                                    fields['sections'][section]['layoutRows'][row]['layoutItems'][item]['layoutComponents'][cmp].value=booleanFields[fields['sections'][section]['layoutRows'][row]['layoutItems'][item]['layoutComponents'][cmp].apiName];
                                }else{
                                    fields['sections'][section]['layoutRows'][row]['layoutItems'][item]['layoutComponents'][cmp].IsBooleanValue=false;
                                }
                                var contactFields='Salutation FirstName LastName';
                                if(contactFields.indexOf(fields['sections'][section]['layoutRows'][row]['layoutItems'][item]['layoutComponents'][cmp].apiName)!=-1){
                                    fields['sections'][section]['layoutRows'][row]['layoutItems'][item].CummulativeAPIname='contactName';
                                	//console.log('cmp---',fields['sections'][section]['layoutRows'][row]['layoutItems'][item]);
                                    break;
                                }else{
                                    fields['sections'][section]['layoutRows'][row]['layoutItems'][item].CummulativeAPIname='';
                                }
                                //console.log('cmp---',fields['sections'][section]['layoutRows'][row]['layoutItems'][item]);
                                
                                	
                            }
                        }
                    }
                }
                //console.log('fields---',fields);
                component.set("v.ContactFields",fields);
                component.set("v.selectContactRecordType",false);
                //console.log(component.get("v.ContactFields"));
                setTimeout(function(){ component.set("v.showSpinner",false)}, 3000);
            } else if (state === "ERROR") {
                var errors = response.getError();
               // console.log('error',errors);
                component.set('v.showSpinner', false);
            }
        });	
        $A.enqueueAction(action);
    }
})