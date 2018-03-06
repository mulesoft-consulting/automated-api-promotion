# Script copies generated properties files to Mule target runtime.
# This script can be customized to fit requirements, e.g. could be replaced by Windows shell script.
# Script is triggered from deployment pipeline after APIs are promoted, but before Applications promotion starts. 
# scp is used to copy files between servers.

#!/bin/bash

MULE_HOME=/opt/mule-enterprise-standalone-3.9.0
MULE_HOME_CONF=$MULE_HOME/conf
TARGET_IP=172.17.0.5
TARGET_USER=deployer
GENERATED_PROP_FOLDER=./generated_proper

echo Copying properties files to ${MULE_HOME_CONF}

scp -i ~/.ssh/mule_deployment_id_rsa -r ${GENERATED_PROP_FOLDER}/* ${TARGET_USER}@${TARGET_IP}:${MULE_HOME_CONF}
