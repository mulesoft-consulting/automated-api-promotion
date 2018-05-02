pipeline {
    agent any

    parameters {
        booleanParam(name: 'Promote-Application-Only',
            defaultValue: false,
            description: 'Enable if you would like to promote only applications - no API instance will be promoted.'
        )
    }

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
    
    	stage('Promote APIs and Applications') {
            when {
                expression {
                    return params.Promote-Application-Only == false
                }
            }
            steps { 
                sh 'node src/app.js' 
            }
        }

        stage('Promote Applications only') {
            when {
                expression {
                    return params.Promote-Application-Only == true
                }
            }
            steps { 
                sh 'node src/app.js app-only' 
            }
        }
    	
    }

    post {
        always {
            cleanWs()
        }
    }
}
