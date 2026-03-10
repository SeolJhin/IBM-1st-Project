pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    parameters {
        booleanParam(name: 'PUSH_IMAGE', defaultValue: false, description: 'Push built image to registry')
        string(name: 'IMAGE_TAG', defaultValue: '', description: 'Override image tag (default: jenkins-BUILD_NUMBER)')
    }

    environment {
        SERVICE_DIR = '.'
        DOCKERFILE = 'Dockerfile'
        REGISTRY = 'ghcr.io'
        IMAGE_NAME = 'uniplace-ai'
        GHCR_OWNER = "${env.GHCR_OWNER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Smoke Test') {
            steps {
                dir("${SERVICE_DIR}") {
                    sh '''
                        python3 -m pip install --upgrade pip
                        pip3 install fastapi==0.116.1 uvicorn[standard]==0.35.0 pydantic==2.11.7 pydantic-settings==2.10.1 httpx==0.28.1
                        python3 -m unittest discover -s tests -p "test_ai_rest_smoke.py" -v
                    '''
                }
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    def owner = (env.GHCR_OWNER ?: '').trim().toLowerCase()
                    def tag = (params.IMAGE_TAG ?: '').trim()
                    if (!tag) {
                        tag = "jenkins-${env.BUILD_NUMBER}"
                    }
                    env.FULL_IMAGE = owner ? "${env.REGISTRY}/${owner}/${env.IMAGE_NAME}:${tag}" : "${env.IMAGE_NAME}:${tag}"
                }
                sh 'docker build -f "${DOCKERFILE}" -t "${FULL_IMAGE}" "${SERVICE_DIR}"'
            }
        }

        stage('Docker Push') {
            when {
                expression { return params.PUSH_IMAGE && (env.GHCR_OWNER ?: '').trim() }
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'ghcr-credentials', usernameVariable: 'REG_USER', passwordVariable: 'REG_TOKEN')]) {
                    sh '''
                        echo "$REG_TOKEN" | docker login ghcr.io -u "$REG_USER" --password-stdin
                        docker push "$FULL_IMAGE"
                    '''
                }
            }
        }
    }

    post {
        always {
            cleanWs(deleteDirs: true, notFailBuild: true)
        }
    }
}
