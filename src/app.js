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

//config
const CONFIG = Utility.loadConfiguration();
const SOURCE_ENV_NAME = CONFIG.Config.SourceEnvName;
const TARGET_ENV_NAME = CONFIG.Config.TargetEnvName;
const TARGET_TYPE = CONFIG.Config.TargetServerType;
const SOURCE_TYPE = CONFIG.Config.SourceServerType;
const TARGET_NAME = CONFIG.Config.TargetServerName;
const SOURCE_NAME = CONFIG.Config.SourceServerName;
const APPLICATIONS = CONFIG.Config.Applications; //applications to be promoted

//access environment variable
console.log('User: "' + process.env.ANYPOINT_USER + '" is connecting to anypoint');

//main function
runPromotion();

/*
 * Triggers application promotion logic. Implements the whole integration flow.
 */
function runPromotion() {
	var token = "";
	var orgId = "";
	var envSourceID = "";	
	var envTargetID = "";
	var runtimeTargetIdForDeployment= "";

	Arm.login()
	.then((resToken) => {
		token = resToken;
		return Arm.getOrgId(token);
	})
	.then((resOrgId) => {
		orgId = resOrgId; //save for use by other calls
		return Arm.getEnvironments(token, orgId, TARGET_ENV_NAME, SOURCE_ENV_NAME);
	})
	.then((envs) => {
		envSourceID = envs[0][Arm.SOURCE_ENV_ID]; //save for use by other calls
		envTargetID = envs[1][Arm.TARGET_ENV_ID]; //save for use by other calls
		var promiseArray = Utility.definePromisesToGetTargetAndSourceRuntime(token, orgId, 
			TARGET_TYPE, TARGET_NAME, envTargetID, SOURCE_TYPE, SOURCE_NAME, envSourceID);

		return Promise.all(promiseArray);
	})
	.then(([runtimeTargetId, runtimeSourceId]) => {
    		console.log("Runtime Source ID: " + runtimeSourceId + "\nRuntime Target ID: " + runtimeTargetId);
    		runtimeTargetIdForDeployment = runtimeTargetId;
    		return Arm.getApplications(token, orgId, envSourceID, APPLICATIONS);
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

    		//undeploy app if it exists and deploy a version from server marked as source        		
    		return Arm.redeployApplication(token, orgId, envTargetID, runtimeTargetIdForDeployment, appName, application[key]);
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