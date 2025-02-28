pipeline {
    agent any

    parameters {
        string(name: 'DATA_DIR', defaultValue: '/srv/personas-bots/data', description: 'Directory where app data are stored (config and personas descriptions)')
    }

    stages {
        stage('Build') {
            steps {
                sh 'echo Data directory is: $DATA_DIR'
                sh 'docker compose build'
            }
        }

        stage('Test') {
            steps {
                sh 'docker compose run --rm personas-bots npm run check-types'
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker compose up -d'
            }
        }
    }
}
