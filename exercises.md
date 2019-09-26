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

