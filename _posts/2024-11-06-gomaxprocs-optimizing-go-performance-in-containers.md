---
layout: post
title: "GOMAXPROCS: Limiting CPU Cores in Go and Performance Optimization in Containerized Environments"
date: 2024-11-06T21:08:27+08:00
tags: Go
categories: Coding
giscus_comments: true
tabs: true
toc:
  sidebar: left
pretty_table: true
---

I've met an interesting problem recently. When limiting CPU resources in Cgroups, setting the number of available cores may cause some performance differences. Therefore, I explored this issue.

## What's GOMAXPROCS?

GOAMXPROCS is a method in the runtime package. Let's see the official introduction:

```go
// GOMAXPROCS sets the maximum number of CPUs that can be executing
// simultaneously and returns the previous setting. It defaults to
// the value of [runtime.NumCPU]. If n < 1, it does not change the current setting.
// This call will go away when the scheduler improves.
func GOMAXPROCS(n int) int {}
```

In simple terms, it is used to set the number of CPU cores that Go programs can use. By default, the program uses all cores (the value obtained by `runtime.NumCPU`).

## What's the Use of GOMAXPROCS?

In actual use, `runtime.GOMAXPROCS` is mostly used to control the concurrency of the entire program (or resource consumption). When set to a large value, the program can naturally run more goroutines, and vice versa will limit the number of goroutines at the same time.

Through this, we can control resource consumption in some scenarios, such as some sensitive devices or small instances. Especially for containerized scenarios dominated by Kubernetes, we usually control the resources of a single instance and then cooperate with multiple instances to achieve the purpose of cutting computing power or disaster recovery.

## Specific Problems

In general, you may not encounter significant problems (or may not notice this problem), but in some scenarios such as high concurrency, focusing on latency (P50, P99, etc.), throughput scenarios, it is very likely to be affected.

The specific problem is that when limiting the CPU through Cgroups, there may be this problem. Especially now that many services are started through Kubernetes and Docker, in the container environment, the external may limit the maximum CPU and memory. In this case, it may be possible to achieve lower actual efficiency than doing appropriate restrictions when the resources are fully utilized.

Let's take a look step by step. We pull a container first:

```go
docker run -it --rm --cpus="2" -m 512m golang:1.23-bullseye bash
```

You can see that we limit the usage to 2 cores and 512M. Let's go into the container to see:

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2024-11-06-gomaxprocs-optimizing-go-performance-in-containers/cpu_in_container.2024-11-06_16-34-04.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
<div class="caption mt-0">
    CPU and Memory in Container
</div>

You can see that the CPU and memory are still read from the actual size of the host. At the same time, let's take a look at Cgroups:

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2024-11-06-gomaxprocs-optimizing-go-performance-in-containers/cgroups_in_container.2024-11-06_16-40-12.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
<div class="caption mt-0">
    Cgroups in Container
</div>

You can see that Cgroups are indeed set. In this case, 200000/100000=2 cores.

Let's run a Go program to see:

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2024-11-06-gomaxprocs-optimizing-go-performance-in-containers/gomaxprocs_demo.2024-11-06_16-37-08.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
<div class="caption mt-0">
    GOMAXPROCS Demo
</div>

You can see that the actual number of cores obtained is 12. In this case, if we set the maximum available to 12, the actual performance will be lower than if we set it to 2.

## The Solution

The most direct solution is to unify with the corresponding external restrictions, which can be done directly through configuration, which may be too rigid, not suitable, or not flexible in some cases.

If it is a Cgroups-like situation that needs to be read dynamically, you need to read the Cgroups configuration. Cgroups v1 and v2 have some differences. Fortunately, there are corresponding solutions. Uber's [automaxprocs](https://github.com/uber-go/automaxprocs) has adapted to read Cgroups v1 and v2 configurations. It only supports Linux. (I will talk about Cgroups in the future, and I won't go into it here.)

It is worth mentioning that Uber open-sourced this simple tool because they encountered this problem in the production environment, affecting P50, P99, etc.

## Walkthrough

Next, let's observe the whole phenomenon through code.

I made a demo to demonstrate this result. For specific code, see: [GoMaxProcsBench](https://github.com/iFurySt/GoMaxProcsBench)

Let's take a look at `cmd/bench/main.go`. The complete code is as follows:

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

The overall logic is simple. Let's look at it from top to bottom.

We use a Fibonacci to simulate a time-consuming calculation task:

```go
func fib(n int) int {
	if n <= 1 {
		return n
	}
	return fib(n-1) + fib(n-2)
}
```

We define several parameters:

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

We use `flag` to parse the parameters. We have three parameters: `mode` to specify whether to use `runtime.GOMAXPROCS` or `automaxprocs/maxprocs`.

```go
	Printf("mode: %d, ts: %s\n", mode, ts)

	if mode == 1 {
		runtime.GOMAXPROCS(runtime.NumCPU())
		Printf("GOMAXPROCS: %d\n", runtime.GOMAXPROCS(0))
	} else {
		_, _ = maxprocs.Set(maxprocs.Logger(Printf))
	}
```

If `mode` is 1, we use `runtime.GOMAXPROCS` to set the number of cores to the number of CPUs. If `mode` is 0, we use `maxprocs.Set` to set the number of cores.

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

We set up a signal channel to listen for signals. When no time is specified, you can use Ctrl+C to stop the program.

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

We start a goroutine to run the Fibonacci calculation. We use `count` to count the number of calculations. We use `time.Since` to calculate the time and print the QPS.

Let's run it to see. You can directly bring up a container through the `docker-compose.yml` in the repo to test. It is already configured.

```shell
docker compose up -d
docker compose exec golang bash
```

We run the two modes separately for 5 seconds:

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

As we can see, as analyzed earlier, one uses 2 cores and the other uses 12 cores to run. The program will print the number of times the Fibonacci is run and the total time consumed, and then print the QPS. A single run cannot represent the overall situation. I added a tool to run multiple times to calculate the result. We can run the result through `cmd/stats/main.go`:

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

We can run it to see the result(10 times here):

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

You can see the difference in QPS between the two modes. In this case, there is an estimated loss of about 20%.

At this time, if you look at the CPU usage of the container, you can see that the CPU usage limited to 2 cores is less, about 180%, while the CPU usage limited to 12 cores is higher, about 200%-210%.

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

## Conclusion

We may not notice this problem in normal development. Like me, I often think that it is very safe to set the restrictions through Cgroups at the container level, and I think it is very safe. From a certain perspective, it is not wrong. It is just that I did not notice that under high CPU usage, it may cause performance degradation due to incorrect configuration.

An interesting exploration. In the usual R&D process, many issues go unnoticed. It’s only when we pursue extreme conditions and dig into performance losses that we begin to recognize these problems. But it’s often these very issues that become the greatest boosters on the road to progress. Ironically, without continuous learning and growth, ten years of coding could end up feeling like the same year repeated ten times—only to be outpaced by an LLM in seconds. 🤖

## References

- [https://github.com/uber-go/automaxprocs](https://github.com/uber-go/automaxprocs)
- [https://github.com/iFurySt/GoMaxProcsBench](https://github.com/iFurySt/GoMaxProcsBench)
