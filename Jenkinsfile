pipeline {
    agent any

    environment {
        anypoint_username     = credentials('anypoint_username')
        anypoint_password     = credentials('anypoint_password')
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