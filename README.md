
# Documentation 

Use this script to easily promote your APIs from one environment to the other. The script execution is fully configurable, so it can support all the environments and promote APIs in any direction. 

Project also contains prebuild Jenkins pipeline for "one click" deployment.

## Prerequisite

* Installed Node.js
* Set environment variables:
	* `ANYPOINT_USER` - user with permission to promote APIs (deployment user)
	* `ANYPOINT_PASSWORD` - user password

## Supported Anypoint Platform versions

* Crowd 2
* API: ARM - Anypoint Runtime Manager 1.23


## Configuration
<details><summary><b>Sample Config File</b></summary><p>
	
```
Config:
  SourceEnvName: "TEST" 		//name of environment configure on ARM
  SourceServerName: "summer" 	//source runtime name - could be server or cluster
  SourceServerType: "SERVER" 	//supported types are SERVER or CLUSTER
  TargetEnvName: "PROD" 		//name of environment configured on ARM
  TargetServerName: "joker" 	//target runtime name - could be server or cluster
  TargetServerType: "SERVER" 	//supported types are SERVER or CLUSTER
  Applications: 				//all the applications running on source runtime that should be promoted to target runtime
    - hello-world-v1
    - hello-world-v2
```
</p></details>

## How to run
1. Update configuration file as per your requirements
```
config/promotion_config.yml
```
2. Use npm to install project dependencies
```
npm install
```
3. Run script app.js or use npm to run script
```
node src/app.js
```
or
```
npm start
```

## Continues Deployment
Project also contains `Jenkinsfile` with simple pipeline definition for easy integration with Jenkins. Pipeline implements "one click" deployment and must be triggered manually.
The same environment variables as mentioned in **Prerequisite** section must be configured on Jenkins server.

## Roadmap

* API Manager: Promoting an API

## Not Supported Functionality
Deployment of external properties file is not supported. Properties file must be copied to server before this script runs.