pipeline {
    agent any

    environment {
        IMAGE_NAME = 'chalsfptu/image-storage-service' // Thay bằng tên image của bạn, ví dụ: chalsfptu/image-storage-service
    }

    stages {
        stage('Packaging') {
            steps {
                // Build Docker image từ Dockerfile
                sh 'docker build --pull --rm -f Dockerfile -t ${IMAGE_NAME}:latest .'
            }
        }

        stage('Push to DockerHub') {
            steps {
                // Đăng nhập vào DockerHub và push image
                withDockerRegistry(credentialsId: 'dockerhub', url: 'https://index.docker.io/v1/') {
                    sh 'docker tag ${IMAGE_NAME}:latest ${IMAGE_NAME}:latest'
                    sh 'docker push ${IMAGE_NAME}:latest'
                }
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying'
                // Dừng container cũ nếu tồn tại
                sh 'docker container stop image-storage-service || echo "this container does not exist"'
                // Dọn dẹp hệ thống Docker (container, network, volume không sử dụng)
                sh 'echo y | docker system prune'
                // Chạy container mới với volume mapping
                sh '''
                    docker container run -d --name image-storage-service -p 3003:3003 \
                    -v /uploads:/app/uploads -v /data:/app/data ${IMAGE_NAME}:latest
                '''
            }
        }

        stage('Cleanup Images') {
            steps {
                echo 'Cleaning up unused images'
                // Dọn dẹp các image thừa (dangling images)
                sh 'echo y | docker system prune'
            }
        }
    }

    post {
        always {
            // Dọn dẹp workspace sau khi hoàn thành
            cleanWs()
        }
    }
}