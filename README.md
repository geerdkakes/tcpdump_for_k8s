# tcpdump for k8s

Sidecar containter to capture tcpdump pcap files. Tcpdump can be controlled using curl commands.

## add sidecar to pod

Example pod definition

```
---
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  labels:
    app: hellonode
  name: hellonode
spec:
  replicas: 1
  selector:
    matchLabels:
      app: hellonode
  strategy:
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
    type: RollingUpdate
  template:
    metadata:
      labels:
        app: hellonode
    spec:
      containers:
      - image: geerd/hellonode
        imagePullPolicy: IfNotPresent
        name: hellonode
        ports:
        - name: http
          protocol: TCP
          containerPort: 8080
        resources:
          limits:
            cpu: 200m
            memory: 200Mi
          requests:
            cpu: 200m
            memory: 200Mi
      - image: geerd/tcpdump
        imagePullPolicy: IfNotPresent
        name: tcpdump
        ports:
        - name: tcpdumpcontrol
          protocol: TCP
          containerPort: 3000
        resources:
          limits:
            cpu: 500m
            memory: 500Mi
          requests:
            cpu: 500m
            memory: 500Mi
        env:
          - name: PORT
            value: "3000"
          - name: ROOTDIR
            value: "/data/"
        volumeMounts:
        - name: data
          mountPath: /data
      volumes:
        - name: data
          emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  labels:
    app: hellonode
  name: hellonode
spec:
  ports:
  - name: http
    port: 8080
    protocol: TCP
    targetPort: 8080
  - name: tcpdumpcontrol
    port: 3000
    protocol: TCP
    targetPort: 3000
  selector:
    app: hellonode
  sessionAffinity: None
  type: ClusterIP
```

## control tcpdump

To control tcp dump first forward the controlport:
```
kubectl port-forward service/rabbitmq 3000:3000
```

Than you can start tcpdump:
```
curl localhost/start
```

You can stop tcpdump with:
```
curl localhost/stop
```

The pcap file can be downloaded using:
```
curl localhost/download > data.pcap
```
Next to tcpdump you can also get system statistics with iostat. You can use the endpoints: `startiostat`, `stopiostat` and `downloadiostat` for this.

