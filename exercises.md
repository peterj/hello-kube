

## First depoyment

1. Go to [Docker Hub](https://hub.docker.com) and create your Docker Hub account.

1. Login to Docker Hub:

```
docker login [username]
```

1. Open `routes/index.js` and change the `firstName` variable value to your name.


1. Build the Docker image:

```
docker build -t [username]/hello-kube:0.1.0 .
```

1. Run the Docker image on your machine to make sure changes work:

```
docker run -it -p 3000:3000 [username]/hello-kube:0.1.0 
```

1. Push the image to the Docker hub:

```
docker push [username]/hello-kube:0.1.0
```

1. Update `deploy/deployment.yaml` to use the image name you pushed.

1. Using `kubectl` create the Kubernetes deployment and service:

```
kubectl apply -f deploy/deployment.yaml
kubectl apply -f deploy/service.yaml
```

1. Open http://localhost to see the application running.


## Using config maps

Instead of hardcoding the first name in the code, we need to implement the following: 

1. Create a Kubernetes config map resource to store the firstName value. The quickest way to create a config map is using `kubectl`

```
kubectl create configmap hello-kube-config --from-literal=firstName=Peter
```

To see the YAML file that was created, use the following command:
```
$ kubectl get cm hello-kube-config -o yaml
apiVersion: v1
data:
  firstName: Peter
kind: ConfigMap
metadata:
  name: hello-kube-config
  namespace: default
```

1. Mount the config map and the value as an environment variable in `deployment.yaml`. You can mount the config map and it's values under the `env` key, like this:

```yaml
...
containers:
    - name: web
      ...
      env:
        - name: MY_ENVIRONMENT_VARIABLE
          valueFrom:
            configMapKeyRef:
                name: hello-kube-config
                key: firstName
       ...
```


1. Modify the code to read the firstName from an environment variable.

> Note: to read environment values in NodeJs, you can write `const firstName = process.env.MY_VARIABLE_NAME`

1. Rebuild the Docker image using tag `0.1.1` and push it to the Docker registry.
1. Apply the updated `deployment.yaml` file (one with environment variable from the config map and updated image name).
