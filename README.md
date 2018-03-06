
# Documentation 

Use this script to easily promote your APIs and applications from one environment to the other. The script execution is fully configurable, so it can support all the environments and promote APIs and applications in any direction. 

The tool also solves the problem stated below:<p>
**How to make application aware of the new API Version for auto-discovery purposes without the need to update application itself and build a new package.**

Project also contains prebuild Jenkins pipeline for "one click" deployment to provide some idea on how this tool could be used in terms of CICD.

## Prerequisite

* Installed Node.js
* Set environment variables:
	* `ANYPOINT_USER` - user with permission to promote APIs (deployment user)
	* `ANYPOINT_PASSWORD` - user password

## Supported Anypoint Platform versions

* Crowd 2
* API: [ARM - Anypoint Runtime Manager 1.23](https://anypoint.mulesoft.com/apiplatform/anypoint-platform/#/portals/organizations/ae639f94-da46-42bc-9d51-180ec25cf994/apis/38784/versions/1490649/pages/182845)
* API: [API Manager v1](https://anypoint.mulesoft.com/exchange/portals/anypoint-platform-eng/f1e97bc6-315a-4490-82a7-23abe036327a.anypoint-platform/api-manager-api/api/v1/pages/Promoting%20an%20API/)
* Tested on Mule Runtime 3.9.0


## Configuration
<details><summary><b>Sample Config File</b></summary><p>
	
```
Config:
  SourceEnvName: "TEST" 		  //name of environment configure on ARM
  SourceServerName: "summer" 	//source runtime name - could be server or cluster
  SourceServerType: "SERVER" 	//supported types are SERVER or CLUSTER
  TargetEnvName: "PROD" 		  //name of environment configured on ARM
  TargetServerName: "joker" 	//target runtime name - could be server or cluster
  TargetServerType: "SERVER" 	//supported types are SERVER or CLUSTER
  Applications: 				      //all the applications running on source runtime that should be promoted to target runtime
    - hello-world-v1
    - hello-world-v2
  Apis:                       //API instances (in API Manager) that should be promoted to target environment
    - 9546857                 //API Instance ID of the source API Instance
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
3. Run script app.js to:
	1. Pormote API Instances
	```
	node src/app.js api
	```
	2. Promote Applications
	```
	node src/app.js app
	```

## APIs and Applications promotion and auto-discovery
Chapter describes how to enable auto-discovery for APIs and applications that have been promoted.

Auto-discovery requires API Version to be configured within the application `<api-platform-gw:api apiName="${apiName}" version="${apiVersion}" flowRef="proxy" />`. See documentation for more details [here](https://docs.mulesoft.com/api-manager/v/2.x/configure-auto-discovery-new-task). The API Version is generated as part of the API promotion process (once API Instance is created on specific environment), however application must be aware of the API Version in API Manager to register with API Manager.

The problem statement the solution solves is: **How to make application aware of the new API Version for auto-discovery purposes without the need to update application itself and build a new package.** - so an application can be easily promoted instead of doing standard deployment / redeployment.

### Preconditions
API Asset ID of API Specification published in Exchange must be equal to Maven artificat ID (and project name) of the application that implements API Specification.

The tool has been tested for Mule runtime 3.9.0. Please note, that there are some deviations from Mule runtime 4 auto-discovery configuration. More details could be found [here](https://docs.mulesoft.com/api-manager/v/2.x/api-auto-discovery-new-concept).

### Capturing API Version
How to capture API Version and make it available for application.

After running the command `node src/app.js api` the configuration file is generated for each API Instance that has been promoted. Configuration file contains attribute with API Version value in it, e.g. `api.version=v1:9547246` (for Mule 4 the API Instance ID is used instead, however it is NOT currently supported by the script).

Naming convetions of the generated properties file: 
```
{environmnet}-{apiAssetId}-{apiProductVersion}-instance-conf.properties
```
e.g. 
```
prod-ir-s-customer-v1-instance-conf.properties
```

<details><summary><b>Explanation</b></summary><p>
	
```
{environment}: Usually configured as environment variable to define runtime environment. e.g. mule.env=prod 
{apiAssetId}: Exchange Asset ID of API Specification (application Maven artefact ID must have the same value) 
{apiProductVersion}: API Version defined in RAML, also available on Exchange, e.g. v1. This is NOT API Version in API Manager that has the following format: apiProductVersion:apiInstanceId, e.g. v1:9547246 
```
</p></details><p></p>

Generated properties file must be copied to `$MULE_HOME/conf` folder, so it can be picked up by application once promoted.

### Project configuration
How to configure the project / application to use generated properties file.

**1. Step**: Configure auto-discovery

<details><summary><b>Sample</b></summary>
	
```xml
<api-platform-gw:api apiName="${api.name}" version="${api.version}" flowRef="api-main" create="true" apikitRef="api-config" doc:name="API Autodiscovery"/>
```
</details><p></p>

**2. Step**: Configure application to reference externally managed properties file (how the file is generated is described in previous [**section**](#capturing-api-version))

<details><summary><b>Sample</b></summary>
	
```xml
<secure-property-placeholder:config name="Secure_Property_Placeholder"  
      key="${sec.key}" 
      location="${mule.env}.properties,${mule.env}-${project.artifactId}-${api.build.version}-instance-conf.properties" doc:name="Secure Property Placeholder"/>
```
</details><p></p>

**3. Step**: Configure Maven to enable filtering of application directory. Add the following to your `pom.xml` for plugin `mule-app-maven-plugin`: `<copyToAppsDirectory>true</copyToAppsDirectory>`.

<details><summary><b>Sample - Maven plugin</b></summary>
	
```xml
<plugin>
  <groupId>org.mule.tools.maven</groupId>
  <artifactId>mule-app-maven-plugin</artifactId>
  <version>${mule.tools.version}</version>
  <extensions>true</extensions>
  <configuration>
    <copyToAppsDirectory>true</copyToAppsDirectory>
    <filterAppDirectory>true</filterAppDirectory>
  </configuration>
</plugin> 
```
</details><p></p>

Also, add a new Maven property `<api.build.version>v1</api.build.version>`. The value must match the API Specification version in RAML.

<details><summary><b>Sample - Maven property</b></summary>
	
```xml
  <properties>
    <api.build.version>v1</api.build.version>
    
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
    <mule.version>3.9.0</mule.version>
    <mule.tools.version>1.2</mule.tools.version>
    <maven.assembly.plugin.version>3.0.0</maven.assembly.plugin.version>
    <maven.release.plugin.version>2.5.3</maven.release.plugin.version>
    <munit.version>1.3.7</munit.version>
    <mule.munit.support.version>3.9.1</mule.munit.support.version>
  </properties>
```
</details><p></p>

How does the configuration described above work? <p></p>
Maven uses property `<api.build.version>v1</api.build.version>` and artifact ID `<artifactId>ir-s-customer</artifactId>` to filter application folder, which replaces variables in configuration of secure property placeholder: `${mule.env}-${project.artifactId}-${api.build.version}-instance-conf.properties`. For this specific example we would get: `${mule.env}-ir-s-customer-v1-instance-conf.properties`. Variable `${mule.env}` stays unchanged as it is environment variable.

## Continues Deployment
Project also contains `Jenkinsfile` with simple pipeline definition for easy integration with Jenkins. Pipeline implements "one click" deployment and is configured to be triggered manually.
The same environment variables as mentioned in [**Prerequisite**](#prerequisite) section must be configured on Jenkins server.

#### Pipeline consists of the following steps:

**1. Step**:  Promote APIs: runs command `node src/app.js api`

**2. Step**: Copy Generated Properties Files: **customisable** step that copies files generated as part of the [**auto-discovery configuration**](#capturing-api-version)

**3. Step**: Promote Applications: runs command `node src/app.js app`

Implementation of the **2. Step** depends on the operating system, security and other requirements that could influence copying files between the servers, hence it is recommended to build own custom script and call it from pipeline instead of reusing existing implementation of the step. The existing implementation is included just to provide overall picture on the solution.

## Roadmap

* API Manager: Promoting an API - IMPLEMENTED
* Promote to more than one target in parallel
* Cloudhub support
* Mule 4 support

## Not Supported Functionality
Deployment of external properties file is not supported. Properties file must be copied to server before this script runs.

Every API Instance promotion would create a new API Instance on target environment. Patching of API Instance is not supported.

## Notes
* New API Instance creation means that your client applications must request access for this new version (e.g. if Client ID enforcement policy has been applied).

* Impact on Analytics yet to be clarified.

* Difference between **API Instance ID** and **API Version** can be seen in API Manager as highlighted on the picture below:
![API Instance ID vs API Version](./images/api-manager.png)
