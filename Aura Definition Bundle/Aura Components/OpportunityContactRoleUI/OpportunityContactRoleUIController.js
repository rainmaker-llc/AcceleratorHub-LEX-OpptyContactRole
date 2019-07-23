({ 
    //Intializations On loading.
    init : function(component, event, helper) {
        helper.getContactRoleRecords(component, event, helper);	
    },
    
    //function for Edit Contact Roles button.
    EditContactRoles : function(component, event, helper) {
        component.set("v.showSpinner",true);
        component.set("v.ContactRoleRecordsForEdit",JSON.parse(JSON.stringify(component.get("v.ContactRoleRecords"))));
   		
        component.set("v.isEditable",true);
        component.set("v.showSpinner",false);
    },
    
    // Go back from from Edit Contact Roles Modal
    Cancel : function(component, event, helper) {
        component.set("v.isEditable",false);
    },
    
    // Cancel creating new Contact Record
    CancelNewRecord : function(component, event, helper) {
        component.set("v.showSpinner",true);
        component.set("v.NewRecord",false);
        component.set("v.showSpinner",false);
    },
    
    // Add new Blank Contact Role
    addRow : function(component, event, helper) {
        var ContactRoleRecords=component.get("v.ContactRoleRecordsForEdit");
        ContactRoleRecords.push({"contactRecord":undefined,"AccountRecord":{},"Role":"","isPrimary":false,"ContactRoleId":"","toBeDeleted":false});
        component.set("v.ContactRoleRecordsForEdit",ContactRoleRecords);
    },
    
    // Automatically deselect the Primary checkbox on the prior primary record as soon 
    // as the user selects any other contact as primary.
    disableAllCBWhenOnePrimary : function(component, event, helper) {
        var ContactRoleRecords=component.get("v.ContactRoleRecordsForEdit");
        var PrimaryIndex =component.get("v.PrimaryIndex");
        var newPrimaryIndex=[]; 
        for(var key in ContactRoleRecords){
            if(ContactRoleRecords[key].isPrimary && PrimaryIndex.indexOf(key)!=-1){
                ContactRoleRecords[key].isPrimary=false;
            }else if(ContactRoleRecords[key].isPrimary && key!=PrimaryIndex){
                newPrimaryIndex.push(key);
            }else{
                ContactRoleRecords[key].isPrimary=false;
            }
        }
        component.set("v.PrimaryIndex",newPrimaryIndex);
        component.set("v.ContactRoleRecordsForEdit",ContactRoleRecords);
        
    },
    handleRecordChangeEvent : function(component, event, helper) {
        var index = event.getParam("index");
        var ContactRoleRecordsForEdit= component.get("v.ContactRoleRecordsForEdit");
        var contactId='';
        for(var key in ContactRoleRecordsForEdit){
            if(key==index){
                if(ContactRoleRecordsForEdit[key].contactRecord==undefined ){
                    ContactRoleRecordsForEdit[key].AccountRecord.Name='';
                    ContactRoleRecordsForEdit[key].AccountRecord.Id='';
                    
                }else if(ContactRoleRecordsForEdit[key].contactRecord.Id){
                    ContactRoleRecordsForEdit[key].AccountRecord=ContactRoleRecordsForEdit[key].contactRecord.Account;                   
                }else if(ContactRoleRecordsForEdit[key].contactRecord.Id==null || ContactRoleRecordsForEdit[key].contactRecord.Id==undefined || ContactRoleRecordsForEdit[key].contactRecord.Id==''){
                    component.set("v.showSpinner",true);
                    
                    var contactRecordTypes=component.get("v.ContactRecordTypes");
                    if(contactRecordTypes.length>0)
                        component.set("v.selectedContactRecordType",contactRecordTypes[0].value);
                    if(contactRecordTypes.length>1){
                        component.set("v.selectContactRecordType",true);
                    }
                    else{
                        helper.getContactFieldLayout(component,event,helper);
                    }    
                    component.set("v.NewRecord",true);
                    component.set("v.singleContactRecord",ContactRoleRecordsForEdit[key].contactRecord);
                    component.set("v.NewContactRecordIndex",index);
                    component.set("v.showSpinner",false);
                }
            }
            
        }
        component.set("v.ContactRoleRecordsForEdit",ContactRoleRecordsForEdit);
    },
    saveContactRoles : function(component, event, helper) {
        component.set("v.showSpinner",true);
        var contactRoles=component.get('v.ContactRoleRecordsForEdit');
        var contactRolesForUpsert=[];
        for(var key in contactRoles){
            if(contactRoles[key].contactRecord &&  contactRoles[key].Role)
                contactRolesForUpsert.push(contactRoles[key]); 
            else if(contactRoles[key].contactRecord && contactRoles[key].ContactRoleId){
                contactRoles[key].toBeDeleted = true;
                contactRolesForUpsert.push(contactRoles[key]);    
            }
        }
        
        component.set("v.isEditable",false);
        var action = component.get("c.saveOpportunityContactRoles");
        action.setParams({
            'recordId' : component.get("v.recordId"), 
            'ContactRolesString':JSON.stringify(contactRolesForUpsert)
        });
        action.setCallback(this,function(response) {
            var state = response.getState();
            if (state === "SUCCESS"){	
                helper.getContactRoleRecords(component, event, helper);
            } else if (state === "ERROR") {
                var errors = response.getError();
                component.set("v.showSpinner",false);
            }
        });	
        $A.enqueueAction(action);
    },
    DeleteRecord : function(component, event, helper) {
        var index=Number(event.currentTarget.dataset.record);
        var ContactRoleRecordsForEdit= component.get("v.ContactRoleRecordsForEdit");
        if(ContactRoleRecordsForEdit[index].ContactRoleId==null || ContactRoleRecordsForEdit[index].ContactRoleId==''){
            ContactRoleRecordsForEdit.splice(index,1);
        }else{
            ContactRoleRecordsForEdit[index].toBeDeleted=true;
        }
        component.set("v.ContactRoleRecordsForEdit",ContactRoleRecordsForEdit);
    },
    SelectRecordTypeHandler : function(component, event, helper) {
        component.set("v.showSpinner",true);
        helper.getContactFieldLayout(component,event,helper);
    },
    handleLoad: function(component, event, helper) {
        component.set('v.showSpinner', false);
    },

    handleSubmit: function(component, event, helper) {
        component.set('v.showSpinner', true);
        component.find('myRecordForm').submit();
    },

    handleError: function(component, event, helper) {
        // errors are handled by lightning:inputField and lightning:messages
        // so this just hides the spinner
        var error = event.getParam("error");
        /*console.log(error.message); // main error message
		console.log('param',JSON.stringify(event.getParam("output")));
        console.log('error',JSON.stringify(event.getParam("error")));
        console.log('message',JSON.stringify(event.getParam("message")));
        console.log('detail',JSON.stringify(event.getParam("detail")));*/
         component.set('v.showSpinner', false);
    },

    handleSuccess: function(component, event, helper) {
        var params = event.getParams();
        var contactRecordId = params.response.id;
        var index=component.get("v.NewContactRecordIndex");
        var contactRoles=component.get('v.ContactRoleRecordsForEdit');
        var action = component.get("c.getSingleContactDetails");
        //console.log('Success---',contactRecordId);
        action.setParams({
            'contactRecordId' : contactRecordId
        });
        action.setCallback(this,function(response) {
            var state = response.getState();
            if (state === "SUCCESS"){	
               	var contact= response.getReturnValue();
                var Account= contact.Account;
                contactRoles[index].contactRecord=contact;
                contactRoles[index].AccountRecord=Account;
                component.set("v.ContactRoleRecordsForEdit",contactRoles);
        		component.set('v.NewRecord', false);
                component.set('v.showSpinner', false);
            } else if (state === "ERROR") {
                var errors = response.getError();
                component.set('v.showSpinner', false);
            }
        });	
        $A.enqueueAction(action);
        
    }
    
    
    
})