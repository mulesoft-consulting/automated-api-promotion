const yaml = require('js-yaml');
const fs = require('fs');
const Arm = require('./arm_api_wrapper');

const CONFIG_FILE = "config/promotion_config.yml";
const TYPE_SERVER_CONST = "SERVER";
const TYPE_CLUSTER_CONST = "CLUSTER";

const SOURCE_ENV_ID = "SOURCE_ENV_ID";
const TARGET_ENV_ID = "TARGET_ENV_ID";

function loadConfiguration() {
	try {
    	const config = yaml.safeLoad(fs.readFileSync(CONFIG_FILE, 'utf8'));
    	const indentedJson = JSON.stringify(config, null, 4);
    	console.log(indentedJson);
    	return JSON.parse(indentedJson);
	} catch (e) {
    	console.log("Problem to load configuration file: " + e);
    	process.exit(-1);
	}
}

/*
 * Build array of promises used to obtain source runtime ID and target runtime ID
 */
function definePromisesToGetTargetAndSourceRuntime(token, orgId, 
	targetType, targetName, targetId, sourceType, sourcneName, sourceId) {

    var promiseArray = [];
    if(targetType == TYPE_SERVER_CONST && sourceType == TYPE_SERVER_CONST) {
    	promiseArray = [Arm.getServer(token, orgId, targetId, targetName), Arm.getServer(token, orgId, sourceId, sourcneName)];
    } else if(targetType == TYPE_CLUSTER_CONST && sourceType == TYPE_CLUSTER_CONST) {
    	promiseArray = [Arm.getCluster(token, orgId, targetId, targetName), Arm.getCluster(token, orgId, sourceId, sourcneName)];
    } else if (targetType == TYPE_SERVER_CONST && sourceType == TYPE_CLUSTER_CONST) {
    	promiseArray = [Arm.getServer(token, orgId, targetId, targetName), Arm.getCluster(token, orgId, sourceId, sourcneName)];
    } else if(targetType == TYPE_CLUSTER_CONST && sourceType == TYPE_SERVER_CONST) {
    	promiseArray = [Arm.getCluster(token, orgId, targetId, targetName), Arm.getServer(token, orgId, sourceId, sourcneName)];
	} else {
	    	console.log("Error: Unsupported target or source type provided!");
    	process.exit(-1);
    }

    return promiseArray;
}

/*
 * Validate input argument and return its value
 */
function getArgument() {
    if (process.argv.length <= 2) {
        console.log("Invalid argument: " +
            "please pass one of the valid arugments: \'api\' or \'app\'" );
        process.exit(-1);
    }
 
    var param = process.argv[2];

    if(param != "api" && param != "app") {
        console.log("Invalid argument: " +
            "please pass one of the valid arugments: \'api\' or \'app\'" );
        process.exit(-1);
    }

    return param;
}

/*
 * Function generates properties file for each promoted API instance to enable application
 * registration with API Instance on API Manager. Properties file contains configuration of API Version
 * for autodiscovery purposes. Application must be configured to see this configuration file 
 * (https://docs.mulesoft.com/mule-user-guide/v/3.9/deploying-to-multiple-environments) and properties file 
 * must be copied to MULE_HOME/conf folder.
 */
function generateConfigFilesForApplications(promotedApis, targetEnvName) {
    //create directory if doesn't exist
    var dir = './generated_proper';
    if(!fs.existsSync(dir)) {
       fs.mkdirSync(dir); 
    }

    //generate properties files
    promotedApis.forEach(function(apiInstance) {
        //example of the naming convention: 'prod-ir-s-customer-v1-instance-conf.properties'
        var fileName = targetEnvName.toLowerCase() + "-" + apiInstance.apiAssetId + "-"
            + apiInstance.productVersion + "-instance-conf.properties";
        var fileContent = "api.version="+apiInstance.apiVersion;
        fs.writeFile(dir+"/"+fileName, fileContent, function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("API properties file generated: " + fileName);
        });
    }); 
}

/*
 * Functionality exported by this module
 */
module.exports.SOURCE_ENV_ID                                = SOURCE_ENV_ID;
module.exports.TARGET_ENV_ID                                = TARGET_ENV_ID;
module.exports.getArgument                                  = getArgument;
module.exports.loadConfiguration 							= loadConfiguration;
module.exports.definePromisesToGetTargetAndSourceRuntime 	= definePromisesToGetTargetAndSourceRuntime;
module.exports.generateConfigFilesForApplications           = generateConfigFilesForApplications;