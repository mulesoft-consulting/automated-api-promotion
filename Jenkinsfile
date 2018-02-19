pipeline {
    agent any

    environment {
        ANYPOINT_USERNAME     = credentials('anypoint_username')
        ANYPOINT_PASSWORD     = credentials('anypoint_password')
    } 

    stages {
    
    	stage('Promote APIs') {
            steps { 
                sh 'npm install'
                sh 'npm start' 
            }
        }
    	
    }

    post {
        always {
            cleanWs()
        }
    }
}