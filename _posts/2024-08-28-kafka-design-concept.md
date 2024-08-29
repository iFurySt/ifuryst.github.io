---
layout: post
title: Kafka Design Concept 📝
date: 2024-08-29T22:18:27+08:00
description: 从Kafka Paper中感受其设计思想
tags: distributed-systems
categories: distributed-systems
giscus_comments: true
tabs: true
pretty_table: true
---

[https://notes.stephenholiday.com/Kafka.pdf](https://notes.stephenholiday.com/Kafka.pdf)

依然建议点开这个链接，先读一下原始信息，读完后仍然感觉有必要的情况下再来阅读本文，避免被我提供的信息先入为主影响你的思考。
当然你反过来阅读也可以，可以先通俗阅读后去原文里印证一下想法，也是一种方式。Whatever you prefer.

## 背景

Kafka是2011年LinkedIn开源的，后来捐给ASF了，现今到一定规模的企业基本没有不涉及到使用Kafka的可能，这是一个很重要的基础设施。

Kafka诞生的初衷是因为传统的日志处理、聚合和消息系统在某些程度上都不满足一些场景下的需求，包括：

1. 过度递送保证了，比如强事务、强ACK等，这个在某种程度上会牺牲能处理的量级，并且在某些场景并不是完完全全关心这个保证，比如某些日志丢失一两条可能并没有什么问题。
2. 大多数系统并不是以吞吐量优先的原则进行设计的，比如里面提到的JMS甚至不支持批量发送消息，这会导致每个消息都需要一个完整的网络请求来回时间（Roundtrip）
3. 对于分布式支持较弱
4. 大多数消息系统都假设下游接近实时消费，堆积量很小。这个在大量堆积的场景会引发很严重的性能问题（某些采用push给下游的，还可能导致更严重的问题）

所以我个人感觉，Kafka其实是技术或者说行业量级发展到一定程度必然会产生的一个产物，因为在数据量级日益增长的情况下，必然需要这样一个基础设施、
中间件、消息队列来持续以高吞吐可靠的处理高量级（High Volume）的数据，并且能有分布式的支持来应对灾难， 其他的就是一些相应的feature了，
比如可靠性、可堆积、可重复消费、PULL代替PUSH等

## 设计理念

基于前面的背景，大概也能知道Kafka会是什么样子的，以下是一些基础的概念、术语：

1. Message：经过的数据都叫消息
2. Topic：特定的消息流被定义在topic里
3. Producer：可以发布消息到topic
4. Broker：实际保存数据的服务器
5. Consumer：可以从一个或多个topic里订阅读取消息（PULL）
6. Partition：基于topic下的逻辑分区

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2024-08-28-kafka-design-concept/kafka_architecture.2024-08-28_13-44-48.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
<div class="caption mt-0">
    Git History
</div>

### 简单存储

日志被分成固定大小的文件（Segment file），比如1G。为了提高性能，每次收到消息后会换存在内存，等到一定消息量或经过一定时间后，
才会被写到（flush）磁盘，只有在写到磁盘后才可以被消费者消费

Kafka的消息并没有message id，而是以逻辑偏移（logical offset）来定位。这能避免寻址的开销，如随机访问等。kafka的id是递增的但是不连续，
因为下一个消息的偏移需要用当前的消息id+消息长度

### 传输效率

利用了底层操作系统的页缓存（page cache），这样的好处是Kafka自己不需要管理这些内存了，操作系统自己管就行了，没有命中的页再去磁盘load进来，
操作系统自己有一套完备的内存页管理机制；另外就是减少了GC的开销了，不需要对这部分数据的GC头疼了。这种情况下可以支持TB级别的数据消费

另外就是利用了系统调用（system cal）来减少数据在内核和用户空间拷贝的开销，这个也是很聪明的一个设计，
按照常规从磁盘读数据通过网络发送的应用来说，大体是这样一个过程：

1. 从磁盘读取数据到操作系统页缓存，此时数据在内核态
2. 从内核拷贝数据到用户空间的缓存里
3. 然后要通过网络发出去的话，从用户空间的应用缓存里再拷贝到内核缓存空间
4. 从内核缓存空间发给socket

前后经过4次数据拷贝，2次系统调用。在这种情况下Kafka通过系统调用（如linux里的sendfile）可以直接把数据从磁盘给到socket，
可以减少步骤2、3的操作了，等于简化到2次数据拷贝，1次系统调用（也有的地方会称为0拷贝，我觉得这个说法应该是针对0次拷贝到用户空间的说法）

### 无状态Broker

broker不知道消费者的任务信息，都有消费者自己管理，因此broker极度简化，但是这也带来一个问题，就是broker不知道什么时候才能删掉消息，
所以Kafka采用了通过以时间为基准的SLA保留策略，比如7d、30d、90d这种，在实际生产环境中是完全可行的，正常下游不会不可用或者lag到这么久，
这个设计的另外一个好处是，消费者可以自主回滚offset或者重新拉取之前的消息，在某些故障场景下，
可以很好的结合一些诸如checkpoint机制来保障下游数据的可靠性。

当然这个设计是违背常规队列的设计的。这也是一个很不错的点，就好比人人都和你说队列就应该这样设计，如果你一直遵从这种思维，
你设计的消息队列就有可能先入为主的沿着这个方向去思考，所以有时候能打破旧有的标准，敢于挑战权威是一种勇气也是一种能力

### 分布式协调

抛弃主节点的设计，结合了Zookeeper做Consumer的协调，主要针对topic和partition以及offset，具体涉及了4个注册表（registry）：

1. Broker Registry(ephemeral)：存放broker注册信息，启动时会注册
2. Consumer Registry(ephemeral)：消费者加入consumer group的时候会创建注册
3. Ownership Registry(ephemeral)：当一个消费者声明自己负责某个partition的时候，会创建表明所有权
4. Offset Registry(Persistent)：存储消费者消费到的偏移量，每个partition一个节点，值表示最新已提交的消息偏移量

### 递送保证

Kafka只支持至少一次，并不支持准确一次。但后面的迭代中还是加入了ACK等机制，只是最初设计是还没有做这个。

## 结论

整体从最初的设计理念可以看出，Kafka对于非常重要的数据的保障并没有做到最好，也就是跟传统的日志服务不同，更注重低时延高吞吐。
比如一开始并没有ACK机制，Broker也不支持数据副本，这些也在后续陆续被支持。Kafka后续也迭代增加了很多Feature，甚至现在都用KRaft取代了ZK，
单看一篇最初始的Paper并不能了解所有，只能窥探最初的设计理念，但是后面演进过程中也有很多的有趣、很棒的设计，
具体可以看相关的[KIP（Kafka Improvement Proposal）](https://cwiki.apache.org/confluence/display/KAFKA/Kafka+Improvement+Proposals)

PULL vs PUSH模型也是一个很有意思的选择，Prometheus和Kafka在他们的场景都采用了PULL，是从一定的出发点、设计理念和背景下做出的这个选择。
进一步可以说明并没有什么银弹，很多时候是在一定的背景和场景之下去选择合适的方案，是一种能力也是一种智慧。

## Appendix 1

以下内容基于Kafka 2.4.1

| ZK路径                               | 内容示例                                                                                                                                                                                                                                                                        | 作用                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| /admin                               |                                                                                                                                                                                                                                                                                 | Kafka管理任务的信息                                            |
| /admin/delete_topics                 |                                                                                                                                                                                                                                                                                 | 删除topic操作信息存在这里                                      |
| /brokers                             |                                                                                                                                                                                                                                                                                 | broker信息                                                     |
| /brokers/ids/<broker_id>             | {<br> "listener_security_protocol_map":<br> {<br> "PLAINTEXT": "PLAINTEXT"<br> },<br> "endpoints":<br> [<br> "PLAINTEXT://10.123.123.1:9092"<br> ],<br> "jmx_port": 9989,<br> "host": "10.123.123.1",<br> "timestamp": "1722923239941",<br> "port": 9092,<br> "version": 4<br>} | 具体的broker信息，ID，端口，注册时间等                         |
| /brokers/seqid                       |                                                                                                                                                                                                                                                                                 |                                                                |
| /brokers/topics                      |                                                                                                                                                                                                                                                                                 |                                                                |
| /cluster                             |                                                                                                                                                                                                                                                                                 | 集群信息                                                       |
| /cluster/id                          | {<br> "version": "1",<br> "id": "tsc3VC-yQeeCkti2jdaX-Q"<br>}                                                                                                                                                                                                                   |                                                                |
| /config                              |                                                                                                                                                                                                                                                                                 | 配置相关，如topic或客户端相关的配置                            |
| /config/brokers/<broker_id>          | {<br> "version": 1,<br> "config": {}<br>}                                                                                                                                                                                                                                       |                                                                |
| /config/changes/config*change*<nums> | {<br> "version": 2,<br> "entity_path": "topics/xxxxxx"<br>}                                                                                                                                                                                                                     | 记录所有配置变更                                               |
| /config/clients                      |                                                                                                                                                                                                                                                                                 |                                                                |
| /config/topics/\_\_consumer_offsets  | {<br> "version": 1,<br> "config":<br> {<br> "segment.bytes": "104857600",<br> "compression.type": "producer",<br> "cleanup.policy": "compact"<br> }<br>}                                                                                                                        |                                                                |
| /config/topics/<topic_name>          | {"version":1,"config":{}}                                                                                                                                                                                                                                                       | topic配置                                                      |
| /config/users                        |                                                                                                                                                                                                                                                                                 |                                                                |
| /consumers                           |                                                                                                                                                                                                                                                                                 | 消费组信息                                                     |
| /controller                          | {<br> "version": 1,<br> "brokerid": 2,<br> "timestamp": "1722923238927"<br>}                                                                                                                                                                                                    | 集群中controller的信息（特殊的broker，负责协调选举等控制任务） |
| /controller_epoch                    | 37                                                                                                                                                                                                                                                                              | 记录epoch，每次选举后增加                                      |
| /isr_change_notification             |                                                                                                                                                                                                                                                                                 | 临时节点，用于通知ISR中的变更                                  |
| /latest_producer_id_block            | {<br> "version": 1,<br> "broker": 1,<br> "block_start": "54000",<br> "block_end": "54999"<br>}                                                                                                                                                                                  | 存储producer的id范围最新状态                                   |
| log_dir_event_notification           |                                                                                                                                                                                                                                                                                 | 用于触发和管理日志目录变更的通知机制                           |
