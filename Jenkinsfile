pipeline {
    agent any

    environment {
        ANYPOINT_USER     = credentials('anypoint_username')
        ANYPOINT_PASSWORD     = credentials('anypoint_password')
    } 

    stages {
    
    	stage('Promote APIs') {
            steps { 
                sh 'npm install'
                sh 'node src/app.js api' 
            }
        }

        stage('Copy Generated Properties Files') {
            steps {
                sh 'chmod 0700 .bin/copy-generated-properties-files.sh' 
                sh '.bin/copy-generated-properties-files.sh' 
            }
        }

        stage('Promote Applications') {
            steps { 
                sh 'node src/app.js app' 
            }
        }
    	
    }

    post {
        always {
            cleanWs()
        }
    }
}