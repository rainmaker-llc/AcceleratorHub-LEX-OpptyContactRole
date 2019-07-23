global without sharing class OpportunityContactRoleCmp_LEXCtrl {
    // Get Records of a Sobject for LookUp field
    @AuraEnabled
    public static List < sObject > fetchLookUpValues(String searchKeyWord, String ObjectName) {
        system.debug('ObjectName-->' + ObjectName);
        String searchKey = searchKeyWord + '%';
        List < sObject > returnList = new List < sObject > ();
        // Create a Dynamic SOQL Query For Fetch Record List with LIMIT 4   
        String sQuery =  (ObjectName=='Contact'?'select id, Name, Account.Id, Account.Name from ':'select id, Name from ') +ObjectName + ' where Name LIKE: searchKey order by createdDate DESC limit 4';
        List < sObject > lstOfRecords = Database.query(sQuery);
        
        for (sObject obj: lstOfRecords) {
            returnList.add(obj);
        }
        return returnList;
    }
    
    //get existing contact role records under the opportunity 
    @AuraEnabled
    public static OnLoadWrapper getopportunityContactRoles(String recordId){
        OnLoadWrapper OnLoadWrap =new OnLoadWrapper();
        set<Id> contactIds=new set<Id>();
        for(OpportunityContactRole role : [SELECT Id, Contact.Id, Contact.Name, Contact.Account.Id, Contact.Account.Name, IsPrimary, Role
                                           FROM opportunityContactRole 
                                           WHERE opportunityId=:recordId]){
                                               OnLoadWrap.ContactRoles.add(new contactRoleWrapper(role));
                                               contactIds.add(role.ContactId);
                                           }
        
        OnLoadWrap.opportunity=[SELECT Id,AccountId FROM opportunity WHERE Id=:recordId];
        for(Contact con :[SELECT Id,Name,Account.Id,Account.Name 
                          FROM Contact 
                          WHERE AccountId=:OnLoadWrap.opportunity.AccountId AND Id NOT IN :contactIds]){
                              OnLoadWrap.ContactRoles.add(new contactRoleWrapper(con));
                          }
        OnLoadWrap.RolePicklistValues=getselectOptions(new OpportunityContactRole(),'Role');
        return OnLoadWrap;
    }
    
    //get details about the single contact record
    @AuraEnabled
    public static Contact getSingleContactDetails(String contactRecordId){
        return [Select Id,Name,Account.Id,Account.Name from Contact where Id = :contactRecordId];
    } 
    
    // Save all the modifications in contact Roles.
    @AuraEnabled
    public static void saveOpportunityContactRoles(String recordId,String ContactRolesString){
        List<contactRoleWrapper> ContactRoles =(List<contactRoleWrapper>)JSON.deserialize(ContactRolesString, List<contactRoleWrapper>.class);
        List<opportunityContactRole> OCRList =new List<opportunityContactRole>();
        List<opportunityContactRole> ContactRolesForDeletion =new List<opportunityContactRole>();
        
        Map<Integer,contact> contactMap=new Map<Integer,contact>();
        for(Integer i=0; i<ContactRoles.size();i++){
            if(!ContactRoles[i].toBeDeleted){
                OCRList.add(new OpportunityContactRole(ContactId=ContactRoles[i].contactRecord.Id,
                                                       Role=ContactRoles[i].Role,
                                                       OpportunityId=recordId,
                                                       isPrimary=ContactRoles[i].isPrimary,
                                                       Id=String.isBlank(ContactRoles[i].ContactRoleId)?null:ContactRoles[i].ContactRoleId
                                                      )); 
                
            }else{
                ContactRolesForDeletion.add(new OpportunityContactRole(Id=ContactRoles[i].ContactRoleId));
            }
        }
        if(!ContactRolesForDeletion.isEmpty()){
            delete ContactRolesForDeletion;
        }
        if(!OCRList.isEmpty()){
            upsert OCRList;
        }
    }
    
    //get select options for a picklist
    private static List <Map<String,String>> getselectOptions(sObject objObject, string fld) {
        system.debug('objObject --->' + objObject);
        system.debug('fld --->' + fld);
        List <Map<String,String>> allOpts = new list <Map<String,String>> ();
        // Get the object type of the SObject.
        Schema.sObjectType objType = objObject.getSObjectType();
        
        // Describe the SObject using its object type.
        Schema.DescribeSObjectResult objDescribe = objType.getDescribe();
        
        // Get a map of fields for the SObject
        map < String, Schema.SObjectField > fieldMap = objDescribe.fields.getMap();
        
        // Get the list of picklist values for this field.
        list < Schema.PicklistEntry > values =
            fieldMap.get(fld).getDescribe().getPickListValues();
        
        // Add these values to the selectoption list.
        for (Schema.PicklistEntry a: values) {
            Map<String,String> entry =new Map<String,String>();
            entry.put('value', a.getValue());
            entry.put('label', a.getLabel());
            allOpts.add(entry);
        }
        Map<String,String> entry =new Map<String,String>();
        entry.put('value', '');
        entry.put('label', '--None--');
        if(allOpts.isEmpty())
            allOpts.add(entry);
        else
            allOpts.add(0, entry);
        system.debug('allOpts ---->' + allOpts);
        // allOpts.sort();
        return allOpts;
    }
  
    //Wrapper for an opportunity contact role
    public class contactRoleWrapper{
        @auraEnabled public contact contactRecord{get;set;}
        @AuraEnabled public Account AccountRecord{get;set;}
        @AuraEnabled public String ContactRoleId{get;set;}
        @AuraEnabled public String Role{get;set;}
        @AuraEnabled public Boolean isPrimary{get;set;}
        @AuraEnabled public Boolean toBeDeleted{get;set;}
        
        public contactRoleWrapper(opportunityContactRole role){
            this.contactRecord=role.Contact;
            this.AccountRecord=role.contact.Account;
            this.Role=role.Role;
            this.ContactRoleId=role.Id;
            this.isPrimary=role.IsPrimary;
            this.toBeDeleted=false;
        }
        public contactRoleWrapper(Contact contact){
            this.contactRecord=contact;
            this.AccountRecord=contact.Account;
            this.Role='';
            this.ContactRoleId='';
            this.isPrimary=false;
            this.toBeDeleted=false;
        }
    }
    
    // on Load Wrapper for the intializations
    public class OnLoadWrapper{
        @AuraEnabled public List<contactRoleWrapper> ContactRoles{get;set;}
        @AuraEnabled public List<Map<String,String>> RolePicklistValues{get;set;}
        @AuraEnabled public Opportunity opportunity{get;set;}
        @AuraEnabled public List<Map<String,String>> ContactRecordTypes{get; set;}
        @AuraEnabled public Boolean onlyMasterAvailable{get;set;}
        
        public OnLoadWrapper(){
            onlyMasterAvailable=false;
            this.ContactRoles=new List<contactRoleWrapper>();
            this.opportunity=new opportunity();
            this.RolePicklistValues=new List<Map<String,String>>();
            this.ContactRecordTypes=new List<Map<String,String>>();
            List<RecordTypeInfo> recordTypes =Contact.SObjectType.getDescribe().getRecordTypeInfos();
            if(recordTypes.size()>1){
                for(RecordTypeInfo info: recordTypes ) {
                    if(!info.isMaster() && info.isAvailable() && info.isActive())
                        ContactRecordTypes.add(new Map<String,String>{'label'=>info.getName(),'value'=>info.getRecordTypeId()});
                }
            }else{
                ContactRecordTypes.add(new Map<String,String>{'label'=>recordTypes[0].getName(),'value'=>recordTypes[0].getRecordTypeId()});
                onlyMasterAvailable=true;
            }
        }
        
    }
    
    
    
    @AuraEnabled
    public static Map<String,String> getContactLayoutFields1(String recordTypeId){
        PageReference visualforcePage = Page.SessionPage;
        String content = Test.isRunningTest()?'Start_Of_Session_Id'+'xxxx'+'End_Of_Session_Id':visualforcePage.getContent().toString();
        Integer s = content.indexOf('Start_Of_Session_Id') + 'Start_Of_Session_Id'.length();
        Integer e = content.indexOf('End_Of_Session_Id');
        String baseURL = URL.getSalesforceBaseUrl().toExternalForm();
        baseURL+='/services/data/v41.0/ui-api/layout/contact?mode=create';
        baseURL+=String.isBlank(recordTypeId)?'':'&recordTypeId='+recordTypeId;
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        request.setHeader('Authorization', 'Bearer ' + content.substring(s, e));
        system.debug('Bearer----'+request.getHeader('Authorization'));
        request.setTimeout(60000);
        request.setEndpoint(baseURL);
        request.setMethod('GET');
        HttpResponse response = new HttpResponse();
        response=http.send(request);
        system.debug('response'+response.getBody());
        SObjectType accountType = Schema.getGlobalDescribe().get('Contact');
        Map<String,Boolean> BooleanFields=new Map<String,Boolean>();
        Map<String,Schema.SObjectField> mfields = accountType.getDescribe().fields.getMap();
        for(String field : mfields.keySet()){
            if(String.valueOf(mfields.get(field).getDescribe().getType())=='BOOLEAN'){
                BooleanFields.put(mfields.get(field).getDescribe().getName(),(Boolean)mfields.get(field).getDescribe().getDefaultValue());
            }
        }
        return new Map<String,String>{'BooleanFields'=>JSON.serialize(BooleanFields),'fields'=>response.getBody()};
        
    }
}