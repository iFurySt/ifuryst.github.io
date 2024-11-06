---
layout: post
title: "GOMAXPROCS：Go的CPU核心数限制与容器化环境中的性能优化"
date: 2024-11-06T21:08:27+08:00
tags: Go
categories: Coding
giscus_comments: true
tabs: true
toc:
  sidebar: left
pretty_table: true
---

最近遇到一个有趣的问题，关于在Cgroups限制CPU资源的情况之下，设置可用核心数的时候会导致一些性能差异，因此就这个问题探究了一下

## GOMAXPROCS是什么

GOMAXPROCS是runtime里的一个方法，看下官方的介绍

```go
// GOMAXPROCS sets the maximum number of CPUs that can be executing
// simultaneously and returns the previous setting. It defaults to
// the value of [runtime.NumCPU]. If n < 1, it does not change the current setting.
// This call will go away when the scheduler improves.
func GOMAXPROCS(n int) int {}
```

简单的说，就是用于设置Go程序能用的CPU核心数，默认的话情况是使用所有核心（也就是runtime.NumCPU获取到的值）

## GOMAXPROCS有什么用

在实际使用中，runtime.GOMAXPROCS多用来控制整个程序的并发量（或者说资源消耗），当设置大了，程序自然就能跑更多的协程，反之会限制同一时间的协程数量。

通过这个我们可以在一些场景下控制资源消耗，比如有一些资源比较敏感的设备，或者小实例的场景，尤其针对以Kubernetes为主的容器化场景，通常我们会控单实例的资源，然后配合多实例实现算力切割或者容灾等目的。

## 具体问题

通常情况下，可能不会遇到太大问题（或者不会注意到这个问题），但是在一些场景诸如高并发，关注时延（P50，P99等）、吞吐的场景，就很有可能会被影响到。

具体的问题是，当通过Cgroups限制CPU的话，可能就会有这个问题，尤其是现在很多服务是通过Kubernetes、Docker拉起的，在容器环境里，外部可能会限制CPU、内存的最大值，这种情况在资源跑满的情况下有可能会导致实际效率比做了合适的限制来得更低的情况

一步一步来看，可能会更加容易理解，我们拉一个容器

```go
docker run -it --rm --cpus="2" -m 512m golang:1.23-bullseye bash
```

可以看到，这边我们限制了2核，512M的使用率限制，进到容器看看

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2024-11-06-gomaxprocs-optimizing-go-performance-in-containers/cpu_in_container.2024-11-06_16-34-04.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
<div class="caption mt-0">
    CPU and Memory in Container
</div>

可以看到，CPU和内存还是读取到了宿主机的实际大小，同时我们看看Cgroups

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2024-11-06-gomaxprocs-optimizing-go-performance-in-containers/cgroups_in_container.2024-11-06_16-40-12.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
<div class="caption mt-0">
    Cgroups in Container
</div>

可以看到Cgroups确实是有设置的，这边200000/100000=2核

我们跑个Go程序看看

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2024-11-06-gomaxprocs-optimizing-go-performance-in-containers/gomaxprocs_demo.2024-11-06_16-37-08.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
<div class="caption mt-0">
    GOMAXPROCS Demo
</div>

可以看到，这边实际上获取到的也是12核，这种情况下，如果用默认的runtime.GOMAXPROCS(0)就会将最大的核心数设置成12，但是因为我们通过Cgroups限制的是2个核心，所以在2核跑满的情况之下就会出现前面提到的问题，表现为：

**如果我们设置最大可用为12的情况下获得的性能是不如我们设置为2**

## 解决方案

先说结论，方便下面的全流程展示。

最直接的解决方案就是和对应的外部限制统一，可以直接通过配置传递来做，不够会比较刻板，某些情况不适应或者不灵活。

如果是Cgroups这种情况需要动态读取的话，就需要去读取Cgroups的配置，Cgroups v1和v2有有些出入，所幸的是有对应的方案，Uber的[automaxprocs](https://github.com/uber-go/automaxprocs)，里面针对Cgroups v1和v2做了适配读取，只支持Linux。（关于Cgroups后续有机会再展开聊聊，这边不展开了）

值得一提的是Uber开源这个简单的工具也是因为他们在生产环境上遇到了P50、P99被这个问题影响

## 全流程

接下里我们一起通过代码来观测整个现象。

我弄了一个Demo来演示这个结果，具体代码参见：[GoMaxProcsBench](https://github.com/iFurySt/GoMaxProcsBench)

我们看下cmd/bench/main.go，完整代码如下

```go
package main

import (
	"context"
	"flag"
	"fmt"
	"go.uber.org/automaxprocs/maxprocs"
	"log"
	"os"
	"os/signal"
	"runtime"
	"sync/atomic"
	"syscall"
	"time"
)

func fib(n int) int {
	if n <= 1 {
		return n
	}
	return fib(n-1) + fib(n-2)
}

var (
	mode   int
	ts     time.Duration
	silent bool
)

func init() {
	flag.IntVar(&mode, "mode", 0, "0: auto, 1: runtime")
	flag.DurationVar(&ts, "ts", 0, "time to run")
	flag.BoolVar(&silent, "silent", false, "silent mode")
	flag.Parse()
}

func main() {
	Printf("mode: %d, ts: %s\n", mode, ts)

	if mode == 1 {
		runtime.GOMAXPROCS(runtime.NumCPU())
		Printf("GOMAXPROCS: %d\n", runtime.GOMAXPROCS(0))
	} else {
		_, _ = maxprocs.Set(maxprocs.Logger(Printf))
	}

	var (
		st     = time.Now()
		count  atomic.Int64
		sigs   = make(chan os.Signal, 1)
		ctx    context.Context
		cancel context.CancelFunc
	)

	if ts > 0 {
		ctx, cancel = context.WithTimeout(context.Background(), ts)
		defer cancel()
	} else {
		ctx = context.Background()
	}

	signal.Notify(sigs, syscall.SIGQUIT, syscall.SIGTERM, syscall.SIGINT, syscall.SIGKILL)
	defer func() {
		Printf("count: %d, time: %v, qps: %.0f\n", count.Load(), time.Since(st),
			float64(count.Load())/time.Since(st).Seconds())
		if silent {
			fmt.Printf("%.0f\n", float64(count.Load())/time.Since(st).Seconds())
		}
	}()

	for i := 0; ; i++ {
		select {
		case <-ctx.Done():
			return
		case <-sigs:
			return
		default:
			go func() {
				_ = fib(10)
				count.Add(1)
			}()
		}
	}
}

func Printf(format string, v ...interface{}) {
	if silent {
		return
	}
	log.Printf(format, v...)
}
```

整体逻辑很简单，我们从上到下看下

我们用一个fibonacci来模拟耗时的计算任务

```go
func fib(n int) int {
	if n <= 1 {
		return n
	}
	return fib(n-1) + fib(n-2)
}
```

我们定义几个参数

```go
var (
	mode   int
	ts     time.Duration
	silent bool
)

func init() {
	flag.IntVar(&mode, "mode", 0, "0: auto, 1: runtime")
	flag.DurationVar(&ts, "ts", 0, "time to run")
	flag.BoolVar(&silent, "silent", false, "silent mode")
	flag.Parse()
}
```

分别是mode来指定走runtime.GOMAXPROCS还是automaxprocs/maxprocs

```go
	Printf("mode: %d, ts: %s\n", mode, ts)

	if mode == 1 {
		runtime.GOMAXPROCS(runtime.NumCPU())
		Printf("GOMAXPROCS: %d\n", runtime.GOMAXPROCS(0))
	} else {
		_, _ = maxprocs.Set(maxprocs.Logger(Printf))
	}
```

如果有指定ts就是运行时长，我们就通过context来控制程序到达时间退出

```go
	var (
		st     = time.Now()
		count  atomic.Int64
		sigs   = make(chan os.Signal, 1)
		ctx    context.Context
		cancel context.CancelFunc
	)

	if ts > 0 {
		ctx, cancel = context.WithTimeout(context.Background(), ts)
		defer cancel()
	} else {
		ctx = context.Background()
	}
```

监听一下信号量，在没有指定时间的时候可以Ctrl+C来停止跑测的程序

```go
	signal.Notify(sigs, syscall.SIGQUIT, syscall.SIGTERM, syscall.SIGINT, syscall.SIGKILL)
	defer func() {
		Printf("count: %d, time: %v, qps: %.0f\n", count.Load(), time.Since(st),
			float64(count.Load())/time.Since(st).Seconds())
		if silent {
			fmt.Printf("%.0f\n", float64(count.Load())/time.Since(st).Seconds())
		}
	}()

	for i := 0; ; i++ {
		select {
		case <-ctx.Done():
			return
		case <-sigs:
			return
		default:
			go func() {
				_ = fib(10)
				count.Add(1)
			}()
		}
	}
```

通过for分别在context、信号量和程序之间循环，执行都是直接开个新的协程跑

我们跑一下看看。这边可以直接通过repo里的docker-compose.yml去拉起容器测试，已经配置好了

```shell
docker compose up -d
docker compose exec golang bash
```

我们分别跑测一下两种模式，分别跑5s

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2024-11-06-gomaxprocs-optimizing-go-performance-in-containers/bench.2024-11-06_17-33-16.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
<div class="caption mt-0">
    Bench for GOMAXPROCS and AUTOMAXPROCS
</div>

```shell
root@da9d799578df:/go/src/GoMaxProcsBench# go run cmd/bench/main.go --ts 5s --mode 0
2024/11/06 09:32:45 mode: 0, ts: 5s
2024/11/06 09:32:45 maxprocs: Updating GOMAXPROCS=2: determined from CPU quota
2024/11/06 09:32:50 count: 15323801, time: 5.000015461s, qps: 3064751
root@da9d799578df:/go/src/GoMaxProcsBench# go run cmd/bench/main.go --ts 5s --mode 1
2024/11/06 09:32:51 mode: 1, ts: 5s
2024/11/06 09:32:51 GOMAXPROCS: 12
2024/11/06 09:32:56 count: 8984694, time: 5.001722252s, qps: 1796320
```

可以看到和最早分析的一样，一个用了2核一个用了12核跑，程序会打印fib运行的次数和总耗时，然后打印QPS，这边单次无法代表整体情况，我加了一个工具，我们可以通过cmd/stats/main.go来跑多次算结果，代码如下：

```go
package main

import (
	"flag"
	"fmt"
	"log"
	"os/exec"
	"strconv"
	"strings"
	"time"
)

var (
	mode  int
	ts    time.Duration
	times int
)

func init() {
	flag.IntVar(&mode, "mode", 0, "0: auto, 1: runtime")
	flag.DurationVar(&ts, "ts", 0, "time to run")
	flag.IntVar(&times, "times", 1, "times to run")
	flag.Parse()
}

func main() {
	var total int64 = 0
	cnt := 0
	for range times {
		cmd := exec.Command("go", "run", "cmd/bench/main.go",
			"--silent", "-mode", fmt.Sprint(mode), "-ts", fmt.Sprint(ts.String()))

		output, err := cmd.CombinedOutput()
		if err != nil {
			log.Printf("Failed to execute command: %v\n", err)
			continue
		}
		qps, err := strconv.ParseInt(strings.TrimSpace(string(output)), 10, 64)
		if err != nil {
			log.Printf("Failed to parse output: %v\n", err)
			continue
		}
		total += qps
		cnt++
	}
	if cnt > 0 {
		log.Printf("Average QPS: %d\n", total/int64(cnt))
	} else {
		log.Printf("No valid result\n")
	}
}
```

我们分别跑个10次看看

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2024-11-06-gomaxprocs-optimizing-go-performance-in-containers/stats.2024-11-06_17-40-44.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
<div class="caption mt-0">
    Stats for GOMAXPROCS and AUTOMAXPROCS
</div>

```shell
root@da9d799578df:/go/src/GoMaxProcsBench# go run cmd/stats/main.go --ts 5s --mode 0 --times 10
2024/11/06 09:36:29 Average QPS: 3010903
root@da9d799578df:/go/src/GoMaxProcsBench# go run cmd/stats/main.go --ts 5s --mode 1 --times 10
2024/11/06 09:37:33 Average QPS: 2408036
root@da9d799578df:/go/src/GoMaxProcsBench# go run cmd/stats/main.go --ts 5s --mode 0 --times 10
2024/11/06 09:38:41 Average QPS: 2896338
root@da9d799578df:/go/src/GoMaxProcsBench# go run cmd/stats/main.go --ts 5s --mode 1 --times 10
2024/11/06 09:40:25 Average QPS: 2364868
```

可以看到QPS的差异了，这个case下粗略估计有20%的损耗

这个时候如果看容器的CPU使用率可以发现，限制在2核的使用率反而更少，大概在180%，而限制在12核的CPU使用率更高，大概200%-210%

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2024-11-06-gomaxprocs-optimizing-go-performance-in-containers/gomaxprocs_cpu_usage.2024-11-06_17-36-34.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
<div class="caption mt-0">
    GOMAXPROCS CPU Usage
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2024-11-06-gomaxprocs-optimizing-go-performance-in-containers/automaxprocs_cpu_usage.2024-11-06_17-37-06.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
<div class="caption mt-0">
    AUTOMAXPROCS CPU Usage
</div>

```shell
CONTAINER ID   NAME                       CPU %     MEM USAGE / LIMIT     MEM %     NET I/O           BLOCK I/O         PIDS
da9d799578df   gomaxprocsbench-golang-1   183.19%   113.3MiB / 200MiB     56.65%    69kB / 3.29kB     135MB / 195MB     53
da9d799578df   gomaxprocsbench-golang-1   210.74%   80.86MiB / 200MiB     40.43%    69kB / 3.29kB     135MB / 195MB     69
```

## 结论

以前没有留意到这个现象的情况之下，经常会觉得在容器层面通过Cgroups来做了限制做兜底，觉得非常保险，从某种角度来说也没错，就是没有发现在CPU高负载的情况之下，可能会因为错误的配置导致性能的下降。

很有趣的一次探索，在常规的研发过程中，很多问题不会凸显的，只有在追求一些极致的情况下，不断去抠性能损耗的情况才会开始关注这些问题，但是往往是这些东西才是前进路上最大的助推器，否则十年如一日的Coding，最后就是LLM帮你洗头。

## 参考

- [https://github.com/uber-go/automaxprocs](https://github.com/uber-go/automaxprocs)
- [https://github.com/iFurySt/GoMaxProcsBench](https://github.com/iFurySt/GoMaxProcsBench)
