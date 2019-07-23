@isTest
public class OpportunityContactRoleComponentTest {
    @testSetup 
    static void createTestSetup(){
        Contact con = new Contact(LastName = 'Test Con');
        insert con;
        Account acc = new Account(Name = 'Test Acc');
        insert acc;
        Messaging.SingleEmailMessage mail = 
                  new Messaging.SingleEmailMessage();
        Opportunity opp = new Opportunity(Name = 'Test Opp',
                                          CloseDate = System.today(),
                                          StageName = 'Open',
                                          AccountId = acc.Id
                                          );
        insert opp;
        OpportunityContactRole ocr = new OpportunityContactRole(ContactId = con.Id,
                                                                IsPrimary =  true,
                                                                OpportunityId = opp.Id,
                                                                Role = 'Other');
        insert ocr;
    }
    
    @isTest
    static void test_OpportunityContactRoleComponentTest(){
        Test.setMock(HttpCalloutMock.class, new OCRMockHttpResponseGenerator());
        OpportunityContactRoleCmp_LEXCtrl.fetchLookUpValues('Test','Contact');
        Opportunity opp = [select id,name from opportunity limit 1];
        OpportunityContactRoleCmp_LEXCtrl.OnLoadWrapper loadWrapper= new OpportunityContactRoleCmp_LEXCtrl.OnLoadWrapper();
        Map<String,Schema.FieldSet>   fieldSetMap=    SObjectType.Contact.FieldSets.getMap();
        if(!fieldSetMap.isEmpty()){
            for(String FS:fieldSetMap.keySet()){
                loadWrapper  = OpportunityContactRoleCmp_LEXCtrl.getopportunityContactRoles(opp.Id);
                break;
            }
        }
       
        List<OpportunityContactRoleCmp_LEXCtrl.contactRoleWrapper> contactRoles = loadWrapper.ContactRoles;
        String data = JSON.serialize(contactRoles);
        OpportunityContactRoleCmp_LEXCtrl.saveOpportunityContactRoles(opp.Id, data);
    }
    
    @isTest 
    static void testMetaDataCallouts(){
        Test.setMock(HttpCalloutMock.class, new OCRMockHttpResponseGenerator());
        test.startTest();
        OpportunityContactRoleCmp_LEXCtrl.getContactLayoutFields('');
        test.stopTest();
        
    }
}