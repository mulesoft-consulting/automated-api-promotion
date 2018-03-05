// ===================================================================================
// === Author: Igor Repka @ MuleSoft                                               ===
// === Email: igor.repka@mulesoft.com                                              ===
// === version: 1.0					                                               ===
// === Description: 					                                           ===
//     Script manages promotion of configured applications from source environment ===
//     to target environment. E.g. from TEST to PROD 	 				   		   ===	
// ===================================================================================
console.log('------ Application has started ------');

//used libs
const Utility = require('./utility');
const Arm = require('./arm_api_wrapper');
const Manager = require('./manager_api_wrapper');
const Common = require('./common_api_wrapper');

//config
const CONFIG = Utility.loadConfiguration();
const SOURCE_ENV_NAME = CONFIG.Config.SourceEnvName;
const TARGET_ENV_NAME = CONFIG.Config.TargetEnvName;
const TARGET_TYPE = CONFIG.Config.TargetServerType;
const SOURCE_TYPE = CONFIG.Config.SourceServerType;
const TARGET_NAME = CONFIG.Config.TargetServerName;
const SOURCE_NAME = CONFIG.Config.SourceServerName;
const APPLICATIONS = CONFIG.Config.Applications; //applications to be promoted (ARM)
const APIS = CONFIG.Config.Apis; //apis to be promoted (API Manager)

var anypointInfo = {};

var arg = Utility.getArgument(); //validate argument

//access environment variable
console.log('User: "' + process.env.ANYPOINT_USER + '" is connecting to anypoint');

//main logic
if(arg === "api") {
	runApiPromotion();
} else if("app") {
	runApplicationPromotion();
}
//end of main logic

/*
 * Triggers API promotion logic. Implements the whole integration flow.
 */
function runApiPromotion() {

	Common.getAnypointInfo(TARGET_ENV_NAME, SOURCE_ENV_NAME, SOURCE_TYPE, SOURCE_NAME, 
		TARGET_TYPE, TARGET_NAME, APPLICATIONS)	
	.then((anyInfo) => {
		anypointInfo = anyInfo;
		return Manager.promoteApis(APIS, anypointInfo);
	})
	.then((apiInstances) => {
		console.log("Promoted API Instances: " + JSON.stringify(apiInstances));
		Utility.generateConfigFilesForApplications(apiInstances, TARGET_ENV_NAME);
		console.log("------ API Promotion finalized ------");
	}) 
	.catch(err => {
		console.log("Error: " + err);
		process.exit(-1);
	});

}

/*
 * Triggers application promotion logic. Implements the whole integration flow.
 */
function runApplicationPromotion() {

	Common.getAnypointInfo(TARGET_ENV_NAME, SOURCE_ENV_NAME, SOURCE_TYPE, SOURCE_NAME, 
		TARGET_TYPE, TARGET_NAME, APPLICATIONS)	
	.then((anyInfo) => {
		anypointInfo = anyInfo;
		return Arm.getApplications(anypointInfo.token, anypointInfo.orgId, anypointInfo.sourceEnvId, APPLICATIONS);
	})
	.then((applications) => {
		console.log("Applications to be promoted: " + JSON.stringify(applications));

		//deploy all the applications
		return Promise.all(applications.map((application) => {
			console.log("Application: " + JSON.stringify(application));
			var appName = "";
			for(var key in application){
        		appName = key;
    		}

    		return Arm.redeployApplication(anypointInfo.token, anypointInfo.orgId, 
    			anypointInfo.targetEnvId, anypointInfo.runtimeTargetId, 
    			appName, application[key]);

		}));
	})
	.then((result) => {
		console.log("------ Deployment Finalized! Find responses below: ------ \n" + JSON.stringify(result));
	})
	.catch(err => {
		console.log("Error: " + err);
		process.exit(-1);
	});
}