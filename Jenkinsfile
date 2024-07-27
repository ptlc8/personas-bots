pipeline {
    agent any

    parameters {
        string(name: 'deploy_dir', defaultValue: '/srv/personas-bots/', description: 'Directory to deploy the app')
    }

    environment {
        DEPLOY_DIR = '/srv/personas-bots/'
    }
    
    stages {
        stage('Build') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Test') {
            steps {
                sh 'npm run check-types'
            }
        }
        
        stage('Deploy') {
            steps {
                sh "mkdir -p ${params.deploy_dir}"
                sh "rsync -av --exclude='personas' --exclude='config.json' * ${params.deploy_dir}"
            }
        }

        stage('Restart') {
            steps {
                sh """
                    export JENKINS_NODE_COOKIE=dontKillMe
                    cd ${params.deploy_dir}
                    npm run screen:restart || npm run screen:start
                """
            }
        }
    }
}