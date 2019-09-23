# hello-kube

An example application for learning basics of Kubernetes.

## Prerequisites

- Docker
- Docker Hub account (or other Docker registry)
- Kubernetes
- NodeJS, if you want to run the app locally

# Development

To start the application using `nodemon` run:

```
npm start dev
```

# Building the image

From the root folder, run:

```
docker build -t hello-kube .
```

# Run the application

To run the application on a host machine:

```
npm install && npm start
```

To run the application using Docker, after you've built the image:

```
docker run -it -p 3000:3000 hello-kube 
```
