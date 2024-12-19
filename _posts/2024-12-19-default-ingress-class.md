---
layout: post
title: "Default Ingress Class"
date: 2024-12-19T22:47:27+08:00
tags: Kubernetes
categories: Kubernetes
giscus_comments: true
tabs: true
toc:
  sidebar: left
pretty_table: true
---

最近遇到一个问题，就是Ingress配置错误问题导致了到Ingress的流量始终无法流到对应的Service

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: playground
spec:
  rules:
    - host: api-test.ifuryst.com
      http:
        paths:
          - backend:
              serviceName: playground
              servicePort: 2112
            path: /metrics
            pathType: ImplementationSpecific
  tls:
    - hosts:
        - api-test.ifuryst.com
      secretName: api
```

问题是这样一个Ingress配置，看起来没有问题，但是一直没生效，从Service走是OK的，这期间其实反复确认并重做了好几次，也有在rancher上做，最后才排查定位到是少了这个，其实根本原因是因为集群没有配置默认的IngressClass，所以在不配置的情况之下是不会走到Ingress的

问题我觉得是个小问题，但是我还是去翻看了一下kube-apiserver和ingress-nginx的代码，这边通过minikube直接本地拉一个集群观测，这样有需要的可以根据命令自己跑测一下。

另外为了对比，我增加安装了traefik。

初始化相关命令

```yaml
# start k8s cluster
minikube start
# install ingres-nginx
helm upgrade --install ingress-nginx ingress-nginx \
  --repo https://kubernetes.github.io/ingress-nginx \
  --namespace ingress-nginx --create-namespace
# install trafik
helm repo add traefik https://traefik.github.io/charts
helm repo update
helm install traefik traefik/traefik --namespace traefik --create-namespace
```

通过`kubectl get ingressclasses -o yaml` 可以看到ingrss-nginx的配置

```yaml
apiVersion: v1
items:
  - apiVersion: networking.k8s.io/v1
    kind: IngressClass
    metadata:
      annotations:
        meta.helm.sh/release-name: ingress-nginx
        meta.helm.sh/release-namespace: ingress-nginx
      creationTimestamp: "2024-12-04T03:35:34Z"
      generation: 1
      labels:
        app.kubernetes.io/component: controller
        app.kubernetes.io/instance: ingress-nginx
        app.kubernetes.io/managed-by: Helm
        app.kubernetes.io/name: ingress-nginx
        app.kubernetes.io/part-of: ingress-nginx
        app.kubernetes.io/version: 1.11.3
        helm.sh/chart: ingress-nginx-4.11.3
      name: nginx
      resourceVersion: "969"
      uid: 158fe0a7-0701-45eb-a7f9-e37a5e026afe
    spec:
      controller: k8s.io/ingress-nginx
  - apiVersion: networking.k8s.io/v1
    kind: IngressClass
    metadata:
      annotations:
        ingressclass.kubernetes.io/is-default-class: "true"
        meta.helm.sh/release-name: traefik
        meta.helm.sh/release-namespace: traefik
      creationTimestamp: "2024-12-04T03:37:14Z"
      generation: 1
      labels:
        app.kubernetes.io/instance: traefik-traefik
        app.kubernetes.io/managed-by: Helm
        app.kubernetes.io/name: traefik
        helm.sh/chart: traefik-33.0.0
      name: traefik
      resourceVersion: "1226"
      uid: 98b32f2f-d8a9-47d1-b5f6-bd63e1a01fac
    spec:
      controller: traefik.io/ingress-controller
kind: List
metadata:
  resourceVersion: ""
```

这边从`ingressclass.kubernetes.io/is-default-class: "true"`其实可以看出来，ingress-nginx默认是没有将自己提升为默认的IngressClass，而traefik却有，我们到kube-apiserver里看一下

在`staging/src/k8s.io/api/networking/v1/well_known_annotations.go` 和`staging/src/k8s.io/api/networking/v1beta1/well_known_annotations.go` 出现了这个配置，这边我们关注一下v1

```go
package v1

const (
	// AnnotationIsDefaultIngressClass can be used to indicate that an
	// IngressClass should be considered default. When a single IngressClass
	// resource has this annotation set to true, new Ingress resources without a
	// class specified will be assigned this default class.
	AnnotationIsDefaultIngressClass = "ingressclass.kubernetes.io/is-default-class"
)
```

可以看下调用方，主要是`plugin/pkg/admission/network/defaultingressclass/admission.go` 在调用

```go
// getDefaultClass returns the default IngressClass from the store, or nil.
func getDefaultClass(lister networkingv1listers.IngressClassLister) (*networkingv1.IngressClass, error) {
	list, err := lister.List(labels.Everything())
	if err != nil {
		return nil, err
	}

	defaultClasses := []*networkingv1.IngressClass{}
	for _, class := range list {
		if class.Annotations[networkingv1.AnnotationIsDefaultIngressClass] == "true" {
			defaultClasses = append(defaultClasses, class)
		}
	}

	if len(defaultClasses) == 0 {
		return nil, nil
	}
	sort.Slice(defaultClasses, func(i, j int) bool {
		if defaultClasses[i].CreationTimestamp.UnixNano() == defaultClasses[j].CreationTimestamp.UnixNano() {
			return defaultClasses[i].Name < defaultClasses[j].Name
		}
		return defaultClasses[i].CreationTimestamp.UnixNano() > defaultClasses[j].CreationTimestamp.UnixNano()
	})
	if len(defaultClasses) > 1 {
		klog.V(4).Infof("%d default IngressClasses were found, choosing the newest: %s", len(defaultClasses), defaultClasses[0].Name)
	}

	return defaultClasses[0], nil
}
```

通过lister拿到所有的IngressClass，判断是否设置了`ingressclass.kubernetes.io/is-default-class: "true"` ，如果有多个就根据创建时间和名称排序，后面添加的默认IngressClass会命中，再往上爬一下

```go
// Admit sets the default value of a Ingress's class if the user did not specify
// a class.
func (a *classDefaulterPlugin) Admit(ctx context.Context, attr admission.Attributes, o admission.ObjectInterfaces) error {
	if attr.GetResource().GroupResource() != networkingv1.Resource("ingresses") {
		return nil
	}

	if len(attr.GetSubresource()) != 0 {
		return nil
	}

	ingress, ok := attr.GetObject().(*networking.Ingress)
	// if we can't convert then we don't handle this object so just return
	if !ok {
		klog.V(3).Infof("Expected Ingress resource, got: %v", attr.GetKind())
		return errors.NewInternalError(fmt.Errorf("Expected Ingress resource, got: %v", attr.GetKind()))
	}

	// IngressClassName field has been set, no need to set a default value.
	if ingress.Spec.IngressClassName != nil {
		return nil
	}

	// Ingress class annotation has been set, no need to set a default value.
	if _, ok := ingress.Annotations[networkingv1beta1.AnnotationIngressClass]; ok {
		return nil
	}

	klog.V(4).Infof("No class specified on Ingress %s", ingress.Name)

	defaultClass, err := getDefaultClass(a.lister)
	if err != nil {
		return admission.NewForbidden(attr, err)
	}

	// No default class specified, no need to set a default value.
	if defaultClass == nil {
		return nil
	}

	klog.V(4).Infof("Defaulting class for Ingress %s to %s", ingress.Name, defaultClass.Name)
	ingress.Spec.IngressClassName = &defaultClass.Name
	return nil
}
```

可以看到，捞到了默认的IngressClass的话，就把Ingress配置里的`Spec.IngressClassName`设置为默认的IngressClass名称

然后我们到ingress-nginx看看，入口是`cmd/nginx` ，main里主要做了以下这些操作：

1. 初始化并和kube-apiserver建立连接
2. 做一些版本校验、权限检查
3. 初始化自监控（prometheus）采集器
4. 初始化nginx控制器controller，重点是这部分
5. 启动HTTP服务，自监控和健康检查
6. 启动nginx控制器

nginx controller主要做了以下的操作：

1. 初始化并启动同步缓存模块（store）
2. 初始化内存队列用来处理配置变更
3. 监听本地文件变化，nginx配置和geoip文件
4. 确认是否需要选举主
5. 拉起nginx（单独进程组）

这里的store会通过多个infomer和lister（k8s.io/client-go）去和kube-apiserver同步信息并在本地做一个缓存，比如感知到对应的ingerss应用的配置更新就可以去刷对应的nginx配置并重新加载

在`internal/ingress/controller/store/store.go:429` 可以看到

```go
		AddFunc: func(obj interface{}) {
			ing, _ := toIngress(obj)

			if !watchedNamespace(ing.Namespace) {
				return
			}

			ic, err := store.GetIngressClass(ing, icConfig)
			if err != nil {
				klog.InfoS("Ignoring ingress because of error while validating ingress class", "ingress", klog.KObj(ing), "error", err)
				return
			}

			klog.InfoS("Found valid IngressClass", "ingress", klog.KObj(ing), "ingressclass", ic)

			if deepInspector {
				if err := inspector.DeepInspect(ing); err != nil {
					klog.ErrorS(err, "received invalid ingress", "ingress", klog.KObj(ing))
					return
				}
			}
			if hasCatchAllIngressRule(ing.Spec) && disableCatchAll {
				klog.InfoS("Ignoring add for catch-all ingress because of --disable-catch-all", "ingress", klog.KObj(ing))
				return
			}

			recorder.Eventf(ing, corev1.EventTypeNormal, "Sync", "Scheduled for sync")

			store.syncIngress(ing)
			store.updateSecretIngressMap(ing)
			store.syncSecrets(ing)

			updateCh.In() <- Event{
				Type: CreateEvent,
				Obj:  obj,
			}
		},
```

这部分代码是在Ingress资源增加的时候会回调的函数，可以看到

```go
ic, err := store.GetIngressClass(ing, icConfig)
if err != nil {
	klog.InfoS("Ignoring ingress because of error while validating ingress class", "ingress", klog.KObj(ing), "error", err)
	return
}
```

这里调用了`store.GetIngressClass`验证对应的IngressClass和自身是否符合

```go

func (s *k8sStore) GetIngressClass(ing *networkingv1.Ingress, icConfig *ingressclass.Configuration) (string, error) {
	// First we try ingressClassName
	if !icConfig.IgnoreIngressClass && ing.Spec.IngressClassName != nil {
		iclass, err := s.listers.IngressClass.ByKey(*ing.Spec.IngressClassName)
		if err != nil {
			return "", err
		}
		return iclass.Name, nil
	}

	// Then we try annotation
	if class, ok := ing.GetAnnotations()[ingressclass.IngressKey]; ok {
		if class != icConfig.AnnotationValue {
			return "", fmt.Errorf("ingress class annotation is not equal to the expected by Ingress Controller")
		}
		return class, nil
	}

	// Then we accept if the WithoutClass is enabled
	if icConfig.WatchWithoutClass {
		// Reserving "_" as a "wildcard" name
		return "_", nil
	}
	return "", fmt.Errorf("ingress does not contain a valid IngressClass")
}
// ...
const (
	// IngressKey picks a specific "class" for the Ingress.
	// The controller only processes Ingresses with this annotation either
	// unset, or set to either the configured value or the empty string.
	IngressKey = "kubernetes.io/ingress.class"

	// DefaultControllerName defines the default controller name for Ingress NGINX
	DefaultControllerName = "k8s.io/ingress-nginx"

	// DefaultAnnotationValue defines the default annotation value for the ingress-nginx controller
	DefaultAnnotationValue = "nginx"
)
```

这边可以看到，根据这样的顺序获取IngressClass Name：

1. 先从spec.ingressClassName获取
2. 再从annotations的kubernetes.io/ingress.class获取

所在在都没有指定的情况下，就匹配不到，就不会处理这个Ingress资源对象了，这里IngressClassName是1.18引入的，应该优先使用这个，然后annotations是为了兼容旧的，所以理论上如果k8s是1.18之后的版本，还是应该采用IngressClassName。

结合前面kube-apiserver的代码，以及traefik是默认的IngressClass，我们可以知道其实这边spec.ingressClassName会被填充为traefik，我们看下ingres-nginx容器的日志

```go
I1204 09:51:54.338921       7 store.go:436] "Ignoring ingress because of error while validating ingress class" ingress="default/nginx-ingress" error="no object matching key \"traefik\" in local store"
```

可以看到，匹配到traefik，符合预期。

当我们没有traefik的情况下，又没有配置默认的IngressClass，在Ingress提交的时候又没有指定spec.ingressClassName和annotations的情况下，也是无法命中

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2024-12-19-default-ingress-class/no-default-ingress-class.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
<div class="caption mt-0">
    无默认IngressClass
</div>

[官方文档](https://kubernetes.io/docs/concepts/services-networking/ingress/#the-ingress-resource)也有说明这个，k8s本身是不会指定默认的IngressClass，也可以理解，k8s本身并没有内置IngressClass。

ingress-nginx可以这样配置成默认的IngressClass

```yaml
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  labels:
    app.kubernetes.io/component: controller
  name: nginx-example
  annotations:
    ingressclass.kubernetes.io/is-default-class: "true"
spec:
  controller: k8s.io/ingress-nginx
```
