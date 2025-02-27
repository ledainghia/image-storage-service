pipeline {
    agent any

    environment {
        IMAGE_NAME = 'chalsfptu/image-storage-service'
        CONTAINER_NAME = 'image-storage-service'
        HOSTNAME = 'image-storage'
        NETWORK_NAME = 'image-storage-network'
    }

    stages {
        stage('Packaging') {
            steps {
                sh 'docker build --pull --rm -f Dockerfile -t ${IMAGE_NAME}:latest .'
            }
        }

        stage('Push to DockerHub') {
            steps {
                withDockerRegistry(credentialsId: 'dockerhub', url: 'https://index.docker.io/v1/') {
                    sh 'docker tag ${IMAGE_NAME}:latest ${IMAGE_NAME}:latest'
                    sh 'docker push ${IMAGE_NAME}:latest'
                }
            }
        }

        stage('Deploy') {
            steps {
                echo 'Creating Docker network if not exists'
                sh '''
                    if ! docker network ls | grep -w ${NETWORK_NAME}; then
                        docker network create ${NETWORK_NAME}
                    fi
                '''

                echo 'Stopping old container if exists'
                sh 'docker container stop ${CONTAINER_NAME} || echo "this container does not exist"'
   

                echo 'Deploying new container'
                sh '''
                    docker container run -d --name ${CONTAINER_NAME} --network ${NETWORK_NAME} --hostname ${HOSTNAME} \
                    -p 3003:3003 -v /uploads:/app/uploads -v /data:/app/data ${IMAGE_NAME}:latest
                '''
            }
        }

        stage('Cleanup Images') {
            steps {
                echo 'Cleaning up unused images'
                sh 'echo y | docker system prune'
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
