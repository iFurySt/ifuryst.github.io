---
layout: post
title: "Go语言基于benchstat做基准测试与性能跟踪"
date: 2024-10-27T20:56:27+08:00
tags: Go
categories: Coding
giscus_comments: true
tabs: true
toc:
  sidebar: left
pretty_table: true
---

# Benchmark

在开发过程中，我们会做一些基准测试（Benchmark），用于去评估一些函数之间的性能差异，比如常规情况我们可能会这样做：

```go
package slice

import (
	"sort"
	"testing"
)

func SortedIncludes(strArray []string, target string) bool {
	sort.Strings(strArray)
	index := sort.SearchStrings(strArray, target)
	if index < len(strArray) && strArray[index] == target {
		return true
	}
	return false
}

func Contains[T comparable](list []T, ele T) bool {
	for _, v := range list {
		if v == ele {
			return true
		}
	}
	return false
}

func BenchmarkSortedIncludes(b *testing.B) {
	for i := 0; i < b.N; i++ {
		SortedIncludes([]string{"a", "b", "c"}, "a")
	}
}

func BenchmarkContains(b *testing.B) {
	for i := 0; i < b.N; i++ {
		Contains([]string{"a", "b", "c"}, "a")
	}
}
```

我们跑测之后的结果如下：

```bash
# go test -bench=. -benchmem ./slice/slice_including_test.go
goos: darwin
goarch: arm64
cpu: Apple M3 Pro
BenchmarkSortedIncludes-12      60017379                21.56 ns/op            0 B/op          0 allocs/op
BenchmarkContains-12            653826099                1.877 ns/op           0 B/op          0 allocs/op
PASS
ok      command-line-arguments  3.856s
```

这种情况下我们是可以直接根据基准测试的结果很明确的知道`Contains`的效率是更好的。

但是在实际的实践中，上面这种方式只适合我们在开发的时候对比测试最后选用的这样一个情况，之后这个基准测试对我们几乎是没有用处了，我们也很难持续跟踪某个函数的性能变化情况。基于这个问题，benchstat在某种程度上是可以帮我们解决这个问题。

# Benchstat

[https://github.com/iFurySt/go-benchstat-demo](https://github.com/iFurySt/go-benchstat-demo)

这一节相关的代码和命令我都整理在这个repo里了

> Benchstat computes statistical summaries and A/B comparisons of Go benchmarks.

简而言之，benchstat就是用来做基准测试对比的，可以是一次改动的前后对比，也可以是和历史的某次对比。这样其实是可以持续跟踪性能变化的

这里我们模拟了一个业务调用一个函数的逻辑：

```go
package main

import (
	"fmt"
	"github.com/ifuryst/go-benchstat-demo/pkg/util"
)

func main() {
	mockBiz()
}

func mockBiz() {
	ss := []string{"a", "b", "c"}
	s1 := "a"
	isInclude := util.Includes(ss, s1)
	fmt.Printf("Is %s in %v? %v\n", s1, ss, isInclude)
	s2 := "d"
	isInclude = util.Includes(ss, s2)
	fmt.Printf("Is %s in %v? %v\n", s2, ss, isInclude)
}

```

相关的函数：

```go
package util

import "sort"

func Includes(ss []string, s string) bool {
	sort.Strings(ss)
	index := sort.SearchStrings(ss, s)
	if index < len(ss) && ss[index] == s {
		return true
	}
	return false
}
```

就是一个简单的在列表里查找某个值是否存在，上面这个是v1.0.0的版本，到v2.0.0了这个方法被改进了

```go
package util

import "testing"

func BenchmarkInclude(b *testing.B) {
	for i := 0; i < b.N; i++ {
		Includes([]string{"a", "b", "c"}, "a")
	}
}
```

这种情况其实我们可能不知道性能整体是怎样变化的，因此我们分别对biz和Include增加一下benchmark

```go
package main

import (
	"os"
	"testing"
)

func BenchmarkBiz(b *testing.B) {
	old := os.Stdout
	devNull, _ := os.Open(os.DevNull)
	defer devNull.Close()
	os.Stdout = devNull
	defer func() { os.Stdout = old }()

	for i := 0; i < b.N; i++ {
		mockBiz()
	}
}
```

以及

```go
package util

import "testing"

func BenchmarkInclude(b *testing.B) {
	for i := 0; i < b.N; i++ {
		Includes([]string{"a", "b", "c"}, "a")
	}
}
```

这个时候我们是可以通过go test做基准测试的，这个时候我们可以在两个版本分别做一下

```bash
git checkout v1.0.0
go test -bench=. -benchmem -count=10 ./... > old-`git rev-parse HEAD`.txt
git checkout v2.0.0
go test -bench=. -benchmem -count=10 ./... > new-`git rev-parse HEAD`.txt
```

这个命令就是做benchmark，同时也统计内存的情况，跑10次基准测试是为了减少一些误差，将结果分别输出到两个文件，然后我们就可以用benchstat对比这两个文件

```bash
benchstat old-*.txt new-*.txt
```

输出结果如下：

```bash
goos: darwin
goarch: arm64
pkg: github.com/ifuryst/go-benchstat-demo
cpu: Apple M3 Pro
       │ old-3d43a88772ed24c341f60e41122828fe38594870.txt │ new-a7d9ff564525bee68aedcb03a1bf9ef5f53b3a79.txt │
       │                      sec/op                      │          sec/op            vs base               │
Biz-12                                        914.4n ± 2%                 881.4n ± 4%  -3.61% (p=0.007 n=10)

       │ old-3d43a88772ed24c341f60e41122828fe38594870.txt │ new-a7d9ff564525bee68aedcb03a1bf9ef5f53b3a79.txt │
       │                       B/op                       │             B/op              vs base            │
Biz-12                                         320.0 ± 0%                     320.0 ± 0%  ~ (p=1.000 n=10) ¹
¹ all samples are equal

       │ old-3d43a88772ed24c341f60e41122828fe38594870.txt │ new-a7d9ff564525bee68aedcb03a1bf9ef5f53b3a79.txt │
       │                    allocs/op                     │          allocs/op            vs base            │
Biz-12                                         13.00 ± 0%                     13.00 ± 0%  ~ (p=1.000 n=10) ¹
¹ all samples are equal

pkg: github.com/ifuryst/go-benchstat-demo/pkg/util
           │ old-3d43a88772ed24c341f60e41122828fe38594870.txt │ new-a7d9ff564525bee68aedcb03a1bf9ef5f53b3a79.txt │
           │                      sec/op                      │          sec/op           vs base                │
Include-12                                       20.095n ± 2%                1.881n ± 1%  -90.64% (p=0.000 n=10)

           │ old-3d43a88772ed24c341f60e41122828fe38594870.txt │ new-a7d9ff564525bee68aedcb03a1bf9ef5f53b3a79.txt │
           │                       B/op                       │             B/op              vs base            │
Include-12                                         0.000 ± 0%                     0.000 ± 0%  ~ (p=1.000 n=10) ¹
¹ all samples are equal

           │ old-3d43a88772ed24c341f60e41122828fe38594870.txt │ new-a7d9ff564525bee68aedcb03a1bf9ef5f53b3a79.txt │
           │                    allocs/op                     │          allocs/op            vs base            │
Include-12                                         0.000 ± 0%                     0.000 ± 0%  ~ (p=1.000 n=10) ¹
¹ all samples are equal

```

让ChatGPT🤖帮我们组织美化成表格可能更好看：

Package: `github.com/ifuryst/go-benchstat-demo`

CPU: Apple M3 Pro (`goos: darwin`, `goarch: arm64`)

| Test   | Metric    | Old (sec/op) | New (sec/op) | Change        | P-Value | Samples |
| ------ | --------- | ------------ | ------------ | ------------- | ------- | ------- |
| Biz-12 | sec/op    | 914.4n ± 2%  | 881.4n ± 4%  | -3.61%        | p=0.007 | n=10    |
| Biz-12 | B/op      | 320.0 ± 0%   | 320.0 ± 0%   | ~ (no change) | p=1.000 | n=10    |
| Biz-12 | allocs/op | 13.00 ± 0%   | 13.00 ± 0%   | ~ (no change) | p=1.000 | n=10    |

Package: `github.com/ifuryst/go-benchstat-demo/pkg/util`

| Test       | Metric    | Old (sec/op) | New (sec/op) | Change        | P-Value | Samples |
| ---------- | --------- | ------------ | ------------ | ------------- | ------- | ------- |
| Include-12 | sec/op    | 20.095n ± 2% | 1.881n ± 1%  | -90.64%       | p=0.000 | n=10    |
| Include-12 | B/op      | 0.000 ± 0%   | 0.000 ± 0%   | ~ (no change) | p=1.000 | n=10    |
| Include-12 | allocs/op | 0.000 ± 0%   | 0.000 ± 0%   | ~ (no change) | p=1.000 | n=10    |

解释一下这几个列的含义：

- Test：对应的基准测试的名称
- Metric：测量的指标：
  - sec/op：每个操作花费的秒数，用来衡量函数执行一个操作所需的时间，越低越好。
  - B/op：每个操作分配的字节数，用来衡量函数执行时内存分配的大小，越少越好。
  - allocs/op: 每个操作的内存分配次数，用来衡量函数执行时发生了多少次内存分配，越少越好。
- Old (sec/op)：旧版本的基准测试结果平均花费时间和误差范围
- New (sec/op):：新版本的基准测试结果
- Change：新旧版本性能的变化百分比，负值表示性能提升
- P-Value：统计学中的P值，用来衡量结果的显著性，一般来说小于0.05就是效果显著，1就是差异不明显
- Samples：基准测试的样本数量，表示每个基准测试的运行次数

我们可以很直观的从表格里看出，v2的时候Include的执行时间提升了90%，但是我们同时可以看到对于Biz来说整体其实是没怎么提升的，这里应该是打印日志把整体的性能都拉低了，导致压不出来

有了benchstat，我们其实是可以在CI环节就可以针对PR对比前后的性能变化，也可以按照发布的版本在每次发版前跟踪版本间的性能差异

# References

- [https://pkg.go.dev/golang.org/x/perf/cmd/benchstat](https://pkg.go.dev/golang.org/x/perf/cmd/benchstat)
- [https://github.com/iFurySt/go-benchstat-demo](https://github.com/iFurySt/go-benchstat-demo)
