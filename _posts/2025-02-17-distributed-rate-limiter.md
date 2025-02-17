---
layout: post
title: "分布式限流算法"
date: 2025-02-17T23:28:27+08:00
tags: insights
categories: insights
giscus_comments: true
tabs: true
toc:
  sidebar: left
pretty_table: true
---

# 设计之初

遵循以下原则：

- 从需求出发进行方案的思考和设计
- 最小可满足方案开始思考
- 列出目前已有的中间件和外部服务

循环渐进的来思考，首先是回归需求本身：

1. 避免请求数过多把整个服务打挂
2. 当请求数超过阈值，可以适当对部分客户进行降级
3. 该接口属于客户端定时拉取更新接口，拉不到也会沿用上次的数据，所以适当的拒绝服务大概率对客户端没有明显影响（新环境新启动的才会因没有数据无法使用）
4. 需要针对租户级别进行限流，多租户间的限流是互相隔离的

目前的服务及配套情况：

- 服务本身在K8s，多副本
- 有Redis和MySQL

# 方案思考

因为是多副本+针对租户级别限流，所以需要走分布式限流方案的方向去设计了，我们暂定使用Redis来做

我们暂定用一分钟600次请求的目标来做

## 1. 固定窗口计数（Fixed Window Count）

这个最好实现了，直接对着租户ID自增，每次请求来就到redis自增获取，判断是否超阈值来决定

不过缺点也比较明显，就是会出现流量突刺，比如集中在1、2秒内把600次都打完了，这样我们没办法进行流量削峰，容易对服务造成冲击

## 2. 滑动窗口计数（Sliding Window Count）

为了让流量更加平滑一点，我们就把整分钟切割成多个相同大小的时间片段，比如5秒一个片段，这样就变成60/5=12个片段，600/12=50requests/5s，也就是流量峰值从600qps变成了50qps了，也就是降低了12倍。

可以利用Redis的有序集合ZSet来做，比如每次请求来就把当前时间戳当分数score，ZADD进去，然后删掉超过时间窗口的时间戳，判断剩余数量是否超过阈值

不过这个也有缺点：

1. 性能瓶颈：为了匀速，人为的切割很多个时间片段，但是这样会让请求没办法小范围突发（burst），天然限制了系统的处理能力了
2. 操作和存储也相对复杂

## 3. 令牌桶（Token Bucket）

我们希望能在一定范围内去突发，但是又不会太猛，令牌桶就是以固定的速率去生成令牌，消费的时候可以突发把现有的令牌都消耗掉，直到没有令牌可消费就会拒绝服务。流量表现会更加的平滑一点

这里令牌桶是可以满足整体的需求了，但是有个问题：令牌刷新投放。通常是某个副本起个线程去刷新，但是这样增加了复杂性和可靠性

为了简化实现，有几个思路和手段的转变：

1. 采取lua来进行获取和投放计算，这样在redis层面也能做到原子性操作
2. 把实时投放转变成获取令牌的时候计算时差来增量投放

这样可以实现投放和消费都在redis里完成了，复杂性降低

## Codes

```go
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/go-redis/redis/v8"
	"github.com/gorilla/mux"
)

var ctx = context.Background()

// 初始化 Redis 客户端
func initRedisClient() *redis.Client {
	client := redis.NewClient(&redis.Options{
		Addr: "localhost:6379", // Redis 地址
		DB:   3,                // 使用默认数据库
	})
	return client
}

// 限流的 Lua 脚本
var luaScript = `
  -- 定义返回值，是个数组，包含：是否触发限流（1限流 0通过）、当前桶中的令牌数
  local ret = {0, 0}
  local cl_key = KEYS[1]
  local lock_key = cl_key .. '-lock'
  local lock_val = redis.call('get', lock_key)
  if lock_val == '1' then
    ret[1] = 1
    ret[2] = -1
    return ret
  end

  -- 获取桶容量和其他配置
  local capacity = tonumber(ARGV[1])
  local amount = tonumber(ARGV[2])
  local inflow_unit = tonumber(ARGV[3])
  local inflow_quantity_per_unit = tonumber(ARGV[4])
  local key_expire_time = tonumber(ARGV[5])
  local lock_seconds = tonumber(ARGV[6])
  local current_time = tonumber(redis.call('time')[1])
  local st_key = cl_key .. '-st'

  -- 获取[上次向桶中投放令牌的时间]，如果没有设置过这个投放时间，则令牌桶也不存在
  local last_time = redis.call('get', st_key)
  if not last_time then
    local bucket_amount = capacity - amount
    redis.call('set', KEYS[1], bucket_amount, 'PX', key_expire_time)
    redis.call('set', st_key, current_time, 'PX', key_expire_time)
    ret[2] = bucket_amount
    return ret
  end

  -- 令牌桶存在，获取令牌桶中的当前令牌数
  local current_value = tonumber(redis.call('get', KEYS[1]))

  -- 判断是否需要投放令牌：当前时间 - 上次投放时间 >= 投放时间间隔
  local past_time = current_time - tonumber(last_time)
  local past_inflow_unit_quantity = math.floor(past_time / inflow_unit)

  local bucket_amount = current_value + past_inflow_unit_quantity * inflow_quantity_per_unit - amount
  -- 确保 bucket_amount 不会超过容量
  bucket_amount = math.min(bucket_amount, capacity - amount)

  local last_time_changed = 0

  if past_inflow_unit_quantity > 0 then
    last_time = current_time - (past_time % inflow_unit)
    redis.call('set', st_key, last_time, 'PX', key_expire_time)
    last_time_changed = 1
  end

  if bucket_amount < 0 then
    if lock_seconds > 0 then
      redis.call('set', lock_key, '1', 'EX', lock_seconds, 'NX')
    end
    ret[1] = 1
    ret[2] = -1
  else
    redis.call('set', KEYS[1], bucket_amount, 'PX', key_expire_time)
    ret[2] = bucket_amount
  end

  return ret
`

// 限流 API 处理函数
func rateLimitHandler(w http.ResponseWriter, r *http.Request) {
	client := initRedisClient()
	defer client.Close()

	// 请求参数
	keys := []string{"my-rate-limit-key"}
	argv := []interface{}{
		10,    // 桶容量
		1,     // 每次消耗的令牌数
		5,     // 投放令牌的时间间隔（秒）
		2,     // 每次投放的令牌数
		60000, // 键的过期时间（毫秒）
		0,     // 限流惩罚锁定时间（秒）
	}

	// 执行 Lua 脚本
	result, err := client.Eval(ctx, luaScript, keys, argv...).Result()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error executing Lua script: %v", err), http.StatusInternalServerError)
		return
	}

	// 处理返回的结果
	ret := result.([]interface{})
	if ret[0].(int64) == 1 {
		// 触发限流
		http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
		return
	}

	// 返回当前桶中的令牌数
	_, _ = fmt.Fprintf(w, "Tokens left: %v", ret[1].(int64))
}

func main() {
	// 创建路由
	r := mux.NewRouter()

	// 注册 API 路由
	r.HandleFunc("/rate-limit", rateLimitHandler).Methods("GET")

	// 启动 HTTP 服务器
	log.Println("Server started on :8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}

```

这边有个简单的Go写的Demo，这样我们就完成了一个基于Redis的分布式令牌桶限流方案的设计和PoC了，接下去要做的仅仅只是集成到对应的服务里面去，再结合业务做一定的适配即可，effort不会特别大。

网上有很多的架构设计或者方案设计的文章，但是很多上来就是给你说1、2、3方案，优缺点罗列，然后跟你说什么是最好的，我觉得这个对于老司机来说没毛病，但是对于一些正在发展期的人，有时候会比较直，我觉得最好的还是循环渐进，所以当自己不知道方案设计要到什么程度的时候，我会考虑使用满足即可的原则，也就是从最小的方案或者最垃圾的方案开始做，哪里不满足，再往上去找更有效的方案，这样爬楼梯一样，最终爬到哪一级，方案就出来了。
