pipeline {
    agent any

    environment {
        ANYPOINT_USER     = credentials('anypoint_username')
        ANYPOINT_PASSWORD     = credentials('anypoint_password')
    } 

    stages {
        
        stage('Install Dependencies') {
            steps { 
                sh 'npm install'
            }
        }
    
    	stage('Promote APIs') {
            steps { 
                sh 'node src/app.js' 
            }
        }
    	
    }

    post {
        always {
            cleanWs()
        }
    }
}
