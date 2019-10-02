# Handling Failures

You need full Istio installation that includes Grafana, Jaeger and Kiali to use the dashboard. Note that you can still do the exercies and use `curl` to observe the errors/timeouts/retries.

## Upgrading to full Istio installation

1. This command enables tracing and installs Jaeger, Grafana, and Kiali:

```bash
helm upgrade istio install/kubernetes/helm/istio --set tracing.enabled=true --set tracing.ingress.enabled=true --set pilot.traceSampling=100 --set grafana.enabled=true --set prometheus.enabled=true --set kiali.enabled=true --set "kiali.dashboard.jaegerURL=http://localhost:16686/jaeger" --set "kiali.dashboard.grafanaURL=http://localhost:3000"
```

1. Install Jaeger only:

```bash
helm upgrade istio install/kubernetes/helm/istio --set tracing.enabled=true --set tracing.ingress.enabled=true --set pilot.traceSampling=100
```

1. Install Grafana only:

```bash
helm upgrade istio install/kubernetes/helm/istio --set grafana.enabled=true --set prometheus.enabled=true
```

1. Install Kiali only:

```bash
helm upgrade istio install/kubernetes/helm/istio --set kiali.enabled=true
```

## Looking at the dashboard

1. Open Grafana (http://localhost:3000) and look around the dashboards:

```bash
kubectl -n istio-system port-forward $(kubectl -n istio-system get pod -l app=grafana -o jsonpath='{.items[0].metadata.name}') 3000:3000 &
```

1. Open Jaeger (http://localhost:16686) and look around:

```bash
kubectl port-forward -n istio-system $(kubectl get pod -n istio-system -l app=jaeger -o jsonpath='{.items[0].metadata.name}') 16686:16686 &
```

1. Open Kiali (http://localhost:20001/kiali/console) and look around:

```
kubectl -n istio-system port-forward $(kubectl -n istio-system get pod -l app=kiali -o jsonpath='{.items[0].metadata.name}') 20001:20001 &
```

## Slowing Services Down

1. Inject a 2 second delay to the greeter service for 50% and observe how this affects the dashboards in Grafana. Can you find the traces in Jaeger? Increase the delay to 6 second - do you see any changes in Grafana dashboards/Jaeger?

**Hint**
Use the snippet below from the Virtual Service to inject failures:

```yaml
fault:
    delay:
        percent: 5
        fixedDelay: 10s
```

## Breaking the Services

1. Update the Greeter service to respond with 501 HTTP status code in 70% of the cases. Can you find the dashboards that are being affected by this change? How does the 501 manifest itself in the dashboards and traces?

**Hint**

```yaml
fault:
    abort:
        percent: 10
        httpStatus: 404
```

## Getting Advanced

1. Update the Greeter service, so it sends 404 in 30% of the time and a 4 second delay for 20% of the time. Look at the graphs and try to see where these changes are manifested.

1. Return 501 HTTP status code for 50% of the requests that are coming from the iPhones, all other traffic should be unaffected.
