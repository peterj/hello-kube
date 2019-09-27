## 1. First depoyment

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


## 2. Using config maps

Instead of hardcoding the first name in the code, we want to read the first name value from a config map called `hello-kube-config`.

1. Create a Kubernetes config map resource to store the `firstName` value. The quickest way to create a config map is using `kubectl`

    ```
    kubectl create configmap hello-kube-config --from-literal=firstName=Peter
    ```

    To see the YAML file that was created, use the following command:
    ```
    $ kubectl get cm hello-kube-config -o yaml
    apiVersion: v1
    kind: ConfigMap
    metadata:
        name: hello-kube-config
        namespace: default
    data:
        firstName: Peter
    ```

1. Mount the config map and the value as an environment variable in the deployment file. Make copy of the existing `deployment.yaml` file (you can name it `deployment-configmaps.yaml` and update it to mount the config map and it's values under the `env` key, like this:

    ```yaml
    ...
    containers:
        - name: web
        ...
          env:
            - name: FIRST_NAME_VARIABLE
              valueFrom:
                configMapKeyRef:
                    name: hello-kube-config
                    key: firstName
        ...
    ```

>Note: make sure you indent the YAML correctly, otherwise you will get errors deploying the YAML.

1. Modify the code to read the `firstName` from an environment variable.

    > Note: to read environment values in NodeJs, you can write `const firstName = process.env.MY_VARIABLE_NAME`

1. Rebuild the Docker image using tag `0.1.1` and push it to the Docker registry.
1. Apply the updated `deployment.yaml` file (one with environment variable from the config map and updated image name). You can use `kubectl apply -f deploy/[deployment.yaml]`.

## 3. Using secrets

The application reads all file names from the `app/my-secrets` folder and displays them on the web page. Let's create a Secret with a couple of files and mount it as a volume in the deployment.

1. Create a couple of files (the contents are not really important):

    ```
    echo "Hello World" >> hello.txt
    echo "secretpassword" >> passwd
    echo "some=config" >> config.env 
    ```

1. Create a Secret using `kubectl` command:

    ```
    kubectl create secret generic hello-kube-secret --from-file=./hello.txt --from-file=./passwd --from-file=config.env
    ```

1. You can use the `describe` command to look at the secret details:

    ```
    kubectl describe secret hello-kube-secret
    ```

1. Update your deployment file (you can either create a copy of the previous file or update the existing one) and mount the created secret into the pod:

    ```yaml
    ...
    spec:
        containers:
        - name: web
          ...
          volumeMounts:
          - name: my-secret-volume
            mountPath: "/app/my-secrets"
            readOnly: true
        volumes:
        - name: my-secret-volume
          secret:
            secretName: hello-kube-secret
        ...
    ```

1. Apply the updated deployment YAML file. Note that we didn't have to rebuild the Docker image as there were no changes to the code.


## 4. Health checks: liveness, readiness and startup probes

Application has the following three endpoints implemented that can be used to learn how health and readiness probes work. 

### Endpoints

#### `/healthy` 
Returns an HTTP 200. If `HEALTHY_SLEEP` environment variable is set, it will sleep for the amount of millisecond defined in the variable. For example if `HEALTHY_SLEEP=5000` the endpoint will wait for 5 seconds before returning HTTP 200.

#### `/healthz`
The endpoint returns HTTP 200 for the first 10 seconds. After that it starts returning an HTTP 500.

#### `/ready` 
Functionally equivalent to the `/healthy` endpoint (returns HTTP 200). Uses `READY_SLEEP` environment variable to sleep for the amount of millisecond defined in the variable. 

#### `/readyz`
The endpoint returns HTTP 500 for the first 10 seconds. After that it starts returning an HTTP 200.

#### `/fail`
Returns an HTTP 500 error. Uses `FAIL_SLEEP` environment variable to sleep for the amount of miliseconds defined in the variable before returning.


### Liveness probe

1. Make a copy of the `deployment.yaml` file or use the one from the previous exercise.
1. Add the following snippet to the container spec:

    ```yaml
    ...
    - name: web
        ...
      livenessProbe:
        httpGet:
          path: /healthz
          port: 3000
        initialDelaySeconds: 3
        periodSeconds: 3
    ```

1. Deploy the YAML file.

    ```
    kubectl apply -f deploy/deployment.yaml
    ```
1. Use the describe command to observe how the pod gets restarted after the probe starts to fail. 
    ```
    # Get the pod name first
    kubectl get pods 

    kubectl describe po [pod_name]
    ```

The first health check happens 3 seconds after the container starts (`initialDelaySeconds`) and it's repeated every 3 seconds (`periodSeconds`). As soon as the health check fails, container gets restarted and the whole process repeats.

### Readiness probe

Readiness has very similar format as the liveness probe, the only difference is the field name (`readinessProbe` instead of `livenessProbe`). You would use a readiness probe when your service might need more time to start up, yet you don't want the liveness probe to kick in and restart the container. If the readiness probe determines that the service is not ready, no traffic will be sent to it.

Let's use the `/readyz` endpoint - this endpoint returns HTTP 500 for the first 10 seconds and then starts returning HTTP 200.

1. Edit the `deployment.yaml` and add the `readinessProbe` as well as the environment variable:

    ```yaml
    ...
    - name: web
      ...
      readinessProbe:
        httpGet:
          path: /readyz
          port: 3000
        initialDelaySeconds: 3
        periodSeconds: 3
    ```

1. Deploy the YAML file:

    ```
    kubectl apply -f deployment.yaml
    ```

1. Try making requests to the `http://localhost`. You will notice that you won't be able to get any responses through, and after 10 second the pod will be ready and you will be able to make responses.

Another difference between the readiness probe when compared to the liveness probe is that if readiness probe fails, it won't restart the container.

## 5. Resource quotas 

With resource quotas you can limit the resource consumption per every Kubernetes namespace. For example, you can limit the quantity of resource types that can be created in a namespace as well as by total amount of resources that are consumed (e.g. CPU, memory).

Using a `ResourceQuota` resource we can set the limits. If users try to create or update resources in a way that violates this quota, the request will fail with HTTP 403 (forbidden).


1. Deploy a resource quota that limits the number of pods to 5:

```
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ResourceQuota
metadata:
  name: pods-limit
spec:
  hard:
    pods: "5"
EOF
```

1. Deploy the `hello-kube` deployment (if not already deployed) and try to scale it to 10:

    ```
    kubectl scale deploy hello-kube-deployment --replicas=10
    ```

1. Get the list of pods and you will notice only 5 replicas are created, meaning we are hitting the limit.
    ```
    kubectl get pods
    ```

1. Let's try to create another, one off pod using image `radial/busyboxplus:curl`:

    ```
    kubectl run extra-pod --image=radial/busyboxplus:curl --generator=run-pod/v1
    ```

1. You will notice that this time, we get an actual error:

    ```
    Error from server (Forbidden): pods "extra-pod" is forbidden: exceeded quota: pods-limit, requested: pods=1, used: pods=5, limited: pods=5
    ```

