// Anypoint Runtime Manager API Wrapper
// Implements API calls required to promote application

const Req = require("request");
const Promise = require("promise");

const SOURCE_ENV_ID = "SOURCE_ENV_ID";
const TARGET_ENV_ID = "TARGET_ENV_ID";

/*
 * Login and return token.
 * Anypoint credentials must be stored as environment variables.
 */
function login() {
	return new Promise(function(resolve, reject) {
		Req.post({
		    "headers": { "content-type": "application/json" },
		    "url": "https://anypoint.mulesoft.com/accounts/login",
		    "body": JSON.stringify({
		        "username": process.env.ANYPOINT_USER,
		        "password": process.env.ANYPOINT_PASSWORD
		    })
		}, (error, response, body) => {
			if(error) {
				reject(error);
			} else {
				jsonBody = JSON.parse(body);

			    var token = jsonBody.token_type + " " + jsonBody.access_token;
			    console.log('Token has been retrieved: ' + token);
			    resolve(token);
			}

		});
	});
}

/*
 * Get Anypoint Organisation ID
 */
function getOrgId(token) {
	return new Promise(function(resolve, reject) {
		Req.get({
			"headers": {"Authorization": token}, 
			"url": "https://anypoint.mulesoft.com/accounts/api/me"
		}, (error, response, body) => {
		    if(error) {
		    	reject(error);
		    } else {
		    	jsonBody = JSON.parse(body);
		    	console.log('Organization ID has been retrieved: ' + jsonBody.user.organization.id);
		    	resolve(jsonBody.user.organization.id);
		    }
		});
	});
}

/*
 * Returns IDs of required environments
 */
function getEnvironments(token, orgId, targetEnvName, sourceEnvName) {
	return new Promise(function(resolve, reject) {
		Req.get({
			"headers": {"Authorization": token}, 
			"url": "https://anypoint.mulesoft.com/accounts/api/organizations/"+orgId+"/environments"
		}, (error, response, body) => {
		    if(error) {
		    	reject(error);
		    } else {
			    jsonBody = JSON.parse(body);

			    var target = jsonBody.data.find(function(item) {
		  			return item.name == targetEnvName;
				});
				var source = jsonBody.data.find(function(item) {
		  			return item.name == sourceEnvName;
				});
					 
			    console.log('Source environment ID: ' + source.id + '\nTarget environment ID: ' + target.id);
			    var envs = [];
			    envs.push({[SOURCE_ENV_ID] : source.id});
			    envs.push({[TARGET_ENV_ID] : target.id});
			    resolve(envs);
		    }
		});
	});
}

/*
 * Retrieves application IDs for provided environment and list of application from configuration
 */
function getApplications(token, orgId, envId, applicationsFromConfig) {
	return new Promise(function(resolve, reject) {

		Req.get({
			"headers": {"content-type": "application/json", "Authorization": token, "X-ANYPNT-ORG-ID": orgId, "X-ANYPNT-ENV-ID": envId}, 
			"url": "https://anypoint.mulesoft.com/hybrid/api/v1/applications"
		}, (error, response, body) => {
		    if(error) {
		    	reject(error);
		    } else {
			    var jsonBody = JSON.parse(body);

			    var applicationsToBePromoted = [];
			    applicationsFromConfig.forEach(function(app) {
					var application = jsonBody.data.find(function(item) {
		  				return item.name == app;
					});
					applicationsToBePromoted.push({[app] : application.id});
				});
			    
				resolve(applicationsToBePromoted);
		    }

		});

	});
}

/*
 * Retrieves server ID by server name for provided environment.
 * Promise is used to merge responses from asynchronous calls.
 */
function getServer(token, orgId, envId, serverName) {
	return new Promise(function(resolve, reject) {
		Req.get({
			"headers": {"Authorization": token, "X-ANYPNT-ORG-ID": orgId, "X-ANYPNT-ENV-ID": envId}, 
			"url": "https://anypoint.mulesoft.com/hybrid/api/v1/servers"
		}, (error, response, body) => {
		    if(error) {
		    	reject(error);
		    } else {
			    var jsonBody = JSON.parse(body);

			    var server = jsonBody.data.find(function(item) {
		  			return item.name == serverName;
				});

				resolve(server.id);
		    }

		});

	});
}

/*
 * Retrieves cluster ID by cluster name for provided environment.
 */
function getCluster(token, orgId, envId, clusterName) {
	return new Promise(function(resolve, reject) {
		Req.get({
			"headers": {"Authorization": token, "X-ANYPNT-ORG-ID": orgId, "X-ANYPNT-ENV-ID": envId}, 
			"url": "https://anypoint.mulesoft.com/hybrid/api/v1/clusters"
		}, (error, response, body) => {
		    if(error) {
		    	reject(error);
		    } else {
			    var jsonBody = JSON.parse(body);

			    var cluster = jsonBody.data.find(function(item) {
		  			return item.name == clusterName;
				});

				resolve(cluster.id);
		    }

		});

	});
}

/*
 * Deployes a fresh application or if application already exists undeployes it and deployes a new version
 * from environment configure as source
 */
function redeployApplication(token, orgId, envId, runtimeId, appName, appId) {
	return getApplicationId(token, orgId, envId, appName).then(targetAppId => {
		if(targetAppId != null) {
			console.log("Application with name '" + appName + "' and ID: '" + targetAppId + "' is being redeployed.");
			//return undeployApplication(token, orgId, envId, appId);
			return updateAppOnTarget(token, orgId, envId, targetAppId, appId);
		} else {
			console.log("Application with name '" + appName + "' is being deployed.");
			return deployToTarget(token, orgId, envId, appId, runtimeId, appName);
		}
	})
	/*.then(result => {
		console.log("Application with name '" + appName + "' is being deployed.");
		return deployToTarget(token, orgId, envId, appId, runtimeId, appName);
	})*/
	.catch(err => {
		console.log("Error: " + err);
		process.exit(-1);
	});
}

/*
 * Returns application ID if application exists on the environment, otherwise returns null
 */
function getApplicationId(token, orgId, envId, appName) {
	return new Promise(function(resolve, reject) {
		Req.get({
			"headers": {"content-type": "application/json", "Authorization": token, "X-ANYPNT-ORG-ID": orgId, "X-ANYPNT-ENV-ID": envId}, 
			"url": "https://anypoint.mulesoft.com/hybrid/api/v1/applications"
		}, (error, response, body) => {
		    if(error) {
		    	reject(error);
		    } else {
			    var jsonBody = JSON.parse(body);			    
				var application = jsonBody.data.find(function(item) {
	  				return item.name == appName;
				});
				
				if(application) {
					console.log("Application with name: '" + appName + "' already exists on the server. Application will be patched.");
					resolve(application.id);
				} else {
					console.log("Application with name: '" + appName + "' not found. Fresh deployment will be triggered.");
					resolve(null);
				}							    				
		    }
		});

	});
}

/*
 * Updates the application if it already exists on the target runtime.
 */
function updateAppOnTarget(token, orgId, envId, appIdToBeUpdated, sourceAppId) {
	return new Promise(function(resolve, reject) {
		Req.patch({
		    "headers": { "content-type": "application/json", "Authorization": token, 
		    	"X-ANYPNT-ORG-ID": orgId, "X-ANYPNT-ENV-ID": envId
			},
		    "url": "https://anypoint.mulesoft.com/hybrid/api/v1/applications/"+appIdToBeUpdated+"/artifact",
		    "body": JSON.stringify({"applicationSource":{"id":sourceAppId,"source":"HYBRID"}})
		}, (error, response, body) => {
			if(error) {
				reject(error);
			} else {
				jsonBody = JSON.parse(body);
				console.log("Application deployed: " + appIdToBeUpdated);
				resolve(jsonBody);
			}
		});
	});
}

/*
 * Deployes defined application to target environment and server, e.g. PROD
 */
function deployToTarget(token, orgId, envId, appId, targetId, appName) {
	return new Promise(function(resolve, reject) {
		Req.post({
		    "headers": { "content-type": "application/json", "Authorization": token, 
		    	"X-ANYPNT-ORG-ID": orgId, "X-ANYPNT-ENV-ID": envId
			},
		    "url": "https://anypoint.mulesoft.com/hybrid/api/v1/applications",
		    "body": JSON.stringify({
		        "applicationSource": {"source": "HYBRID", "id": appId},
		        "targetId": targetId,
		        "artifactName": appName
		    })
		}, (error, response, body) => {
			if(error) {
				reject(error);
			} else {
				jsonBody = JSON.parse(body);
				console.log("Application deployed: " + appName);
				resolve(jsonBody);
			}
		});
	});
}

/*
 * Undeployes application
 */
function undeployApplication(token, orgId, envId, appId) {
	return new Promise(function(resolve, reject) {

		Req.delete({
			"headers": {"content-type": "application/json", "Authorization": token, "X-ANYPNT-ORG-ID": orgId, "X-ANYPNT-ENV-ID": envId}, 
			"url": "https://anypoint.mulesoft.com/hybrid/api/v1/applications/"+appId
		}, (error, response, body) => {
		    if(error) {
		    	reject(error);
		    } else {
		    	// there is no body as this is delete http method
				resolve("undeployed");									    				
		    }
		});

	});
}

module.exports.SOURCE_ENV_ID 						= SOURCE_ENV_ID;
module.exports.TARGET_ENV_ID 						= TARGET_ENV_ID;
module.exports.login 							 	= login;
module.exports.getOrgId 							= getOrgId;
module.exports.getApplications 						= getApplications;
module.exports.getEnvironments 						= getEnvironments;
module.exports.getServer 							= getServer;
module.exports.getCluster 							= getCluster;
module.exports.redeployApplication 					= redeployApplication;