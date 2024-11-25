---
layout: post
title: "15s→1s慢查询优化小记"
date: 2024-11-22T21:41:27+08:00
tags: SQL-OPTIMIZATION
categories: DB
giscus_comments: true
tabs: true
toc:
  sidebar: left
pretty_table: true
---

SQL慢查询是老生常谈的问题了，似乎好像不会做点优化都不行。慢查询优化其实有很多手段，并且也根据应用场景和需求而异，我觉得比较重要的还是了解底层原理，这样上层应用层怎么变化都能比较快的找到优化的点。借着这个机会小谈一下SQL优化中的一些过程和想法。

另外有点标题党了，我觉得能有较大收益的情况很有可能是因为底子太差了，就像这次帮人看的这个项目，才能简单的做出这么大的优化。不过世界是个草台班子，到哪都可能遇到因肝需求而留下的技术债，这种地方如果没有做好顶层设计和代码质量把控的话，极其容易出现这个问题，堆需求，然后出问题再来反向优化解决的情况。

## 准备阶段

开始处理慢查询问题前，有几个东西需要提前准备好：

1. 具体产生位置
2. 数据组装
3. 定基准点

### 具体产生位置

这里主要是定位问题产生点，很多时候我们有慢查询的统计SQL，就能进一步根据语句到代码反差，这部分通常比较容易的就可以做好定位。

通常我们会基于产生位置反向摸排，确定调用方，这样可以进一步确定影响范围，减少后续改动对外部的影响

### 数据组装

需要进行各类数据或者参数的组装，用于复现实际问题。

通常情况下，我们希望最大化负载，也就是以业务范围内较糟糕的情况来组装数据进行复现，能有压测条件是更好的。这样我们可以最大化各个关键环节和节点的消耗情况，可以进一步研判优化位置

### 定基准点

我们通常会以前面确定的较坏的情况做基准，后续以此为基准去做优化，这样能给我们优化提供方向和结果的量化。另外有些情况下我们还会有明确的目标阈值指导我们持续优化到目标

## 优化过程

对于慢查询的优化有非常多的方法，这里我们主要沿着此次遇到的问题提取关键优化点做一定的分析和发散。

因为问题比较明确，这边我们在组装完所需的配套数据和参数之后，就直接到关键的SQL部分去做分阶段的打印，因为涉及的SQL操作比较多，所以我们希望能明确各阶段的消耗。这边我在代码里一些关键点埋了一下打印。跑测后，我们得到分阶段的消耗统计

```bash
Stage 1: ===> 428ms
Stage 2: ===> 138ms
Stage 3: ===> 7ms
Stage 4: ===> 617ms
Stage 5: ===> 13898ms
```

此时我们可以明确问题出现阶段5，消耗了13s的查询时间，我们先着重处理这个位置

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2024-11-22-optimizing-slow-queries-from-15s-to-1s/origin_code.2024-11-22_15-51-28.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
<div class="caption mt-0">
    原始代码
</div>

首先观察到有3个数据库查询的调用，后两个还好点，通过IN的方式走，第一个是大量LIKE的方式，我们优先解决这个，这里就产生了第一个优化点：LIKE的使用

### LIKE的使用

通常情况下我们会尽量不使用或者减少使用LIKE子句，MySQL中LIKE只有在前缀匹配的时候才会走索引，也就是

```bash
# 精准匹配或者字符串开头的，可以走索引
SELECT * FROM table WHERE column LIKE 'abc%';
SELECT * FROM table WHERE column LIKE 'abc';
# 通配符开头的，不走索引
SELECT * FROM table WHERE column LIKE '%abc';
SELECT * FROM table WHERE column LIKE '%abc%';
```

对于大数据集来说，这种模糊匹配性能很低，尽可能应该避免，或者采用ES之类的专用全文搜索引擎。

通过对外部所有调用方的入参情况确认，我们可以分析出这里并不需要使用LIKE，因为传入的orgIdList其实已经包含了父子orgId的完整合集了，因此我们直接去掉LIKE部分的检索

我们跑测一下，可以看到，已经从13s将为3s了

```bash
Stage 1: ===> 279ms
Stage 2: ===> 160ms
Stage 3: ===> 2ms
Stage 4: ===> 601ms
Stage 5: ===> 3202ms
```

此时我们进一步来看看剩下的两个查询操作，可以看到取出来的数据只是期望得到其中某一列的数据，这种情况我们就来到了第二个优化点：只查询必要的列

### 只查询必要的列

尤其对于一些数据量大，或者列多的大宽表来说，如果能显式指定列的话，可以提升查询和数据返回过程中的消耗，这边我们收敛一下，并且把代码结构简单调整一下使得代码更加直观

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2024-11-22-optimizing-slow-queries-from-15s-to-1s/specify_cols.2024-11-22_15-57-36.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
<div class="caption mt-0">
    指定列查询
</div>

这边我们显式指定了`.select(XXXRel::getOrgPersonId)` 和`.select(XXXUser::getAccountId)` ，这样SELECT语句只会查询该列

```bash
Stage 1: ===> 260ms
Stage 2: ===> 140ms
Stage 3: ===> 2ms
Stage 4: ===> 614ms
Stage 5: ===> 1635ms
```

跑测后可以看到，这个环节已经被优化到1.6s了

此时从代码层面我们已经看不出太多的优化点了，但是此时我们还是可以深挖一下具体的SQL，因为以我们的经验来说，两个SELECT … IN查询不至于需要1.6s，况且数据集也没有达到大几百万或者千万级别，所以我们有理由猜测可能在SQL层面还存在什么问题，我们进一步挖一下

### SQL分析

这边我们拉出两条语句

```sql
SELECT org_person_id FROM db_a.xxx_rel WHERE (status_cd = '1' AND org_id IN (3, 5, 7, ..., 11))

SELECT account_id FROM db_b.xxx_user WHERE (status_cd = '1' AND tenant_id = 'abc123' AND org_user_id IN (1, 3, 5, 7, ..., 9))
```

这里内容过长，我裁剪了大部分的ID，主要结构就是这样，IN了大量的ID，我们用`EXPLAIN`来分析一下语句的执行计划（Execution Plan），虽然不是实际的执行，但是通过预测执行计划的分析，可以帮助我们理解查询性能并发现优化点

```sql
EXPLAIN SELECT org_person_id FROM db_a.xxx_rel WHERE (status_cd = '1' AND org_id IN (3, 5, 7, ..., 11))

EXPLAIN SELECT account_id FROM db_b.xxx_user WHERE (status_cd = '1' AND tenant_id = 'abc123' AND org_user_id IN (1, 3, 5, 7, ..., 9))
```

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2024-11-22-optimizing-slow-queries-from-15s-to-1s/origin_ref_query.2024-11-19_20-03-55.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2024-11-22-optimizing-slow-queries-from-15s-to-1s/origin_all_query.2024-11-19_20-04-14.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
<div class="caption mt-0">
    原始查询走索引情况
</div>

对应的列可以参考官方的[文档释义](https://dev.mysql.com/doc/refman/5.7/en/explain-output.html)：

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2024-11-22-optimizing-slow-queries-from-15s-to-1s/explain_output_cols.2024-11-19_20-03-06.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
<div class="caption mt-0">
    EXPLAIN列含义
</div>

这边我们关注一下type这列，这边列出主要的类型，完整的可以参考[官方文档](https://dev.mysql.com/doc/refman/5.7/en/explain-output.html#explain-join-types)：

- ALL（全表扫描）：对所有行扫描，效率最低下
- index（索引扫描），走索引并且不回表
- range（索引范围扫描），走索引扫描一部分数据（范围数据）
- ref（索引引用），走非唯一索引（或唯一索引的前缀部分），通常需要回表

这里我们可以看到第一个语句type走了ref，也就是索引引用，这边我们就先不管了（理论上这里可以用联合索引增加索引级别，不过我们可以先不考虑做这个优化）

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2024-11-22-optimizing-slow-queries-from-15s-to-1s/ref_index.2024-11-19_20-02-52.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
<div class="caption mt-0">
    索引情况
</div>

第二句就很奇怪，直接走ALL全表了，我们看一下索引，发现status_cd，tenant_id和org_user_id都没有任何索引

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2024-11-22-optimizing-slow-queries-from-15s-to-1s/all_index.2024-11-22_16-04-24.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
<div class="caption mt-0">
    索引情况
</div>

这边我们直接做一个联合索引

```sql
ALTER TABLE db_b.xxx_user
ADD INDEX idx_status_tenant_orguser (tenant_id, status_cd, org_user_id);
```

跑测一下看看，出乎意料的，竟然没有多少提升

```sql
Stage 1: ===> 261ms
Stage 2: ===> 135ms
Stage 3: ===> 3ms
Stage 4: ===> 604ms
Stage 5: ===> 1599ms
```

我们也明确的看到了语句是走索引的

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2024-11-22-optimizing-slow-queries-from-15s-to-1s/add_index.2024-11-19_20-23-08.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
<div class="caption mt-0">
    增加索引
</div>

经过分析，是因为该表本身的量级不大，所以走ALL和索引的情况下，查询时间差不多。另外进一部分分析了两条SQL的执行时间，基本都是在ms级别的（分别0.12629075和0.0343075），大体是几十ms到100ms+这样的水平，实际上这边的时间分别消耗在：

1. MySQL查询引擎本身，单条单次100ms来计算，按照总300ms
2. 网络耗时，来回的Roundtrip大概需要200ms（具体因链路情况而定），这边2次按照400ms算
3. 其他的都是消耗在系统层和应用层做数据拆解包、复制和解析这部分的消耗

这边我们根据实际观测可以得出的结论是大部分时间都消耗在2、3阶段了，因此我们要继续做一个优化动作：合并数据库查询操作

### 合并数据库查询操作

这边我们可以看到实际上前一次查询的结果实际上是为了给后一次使用，且没有任何其他用途了，因此我们应该减少这次的网络传输和相应的应用层处理的时间，直接交给数据库引擎处理，这个在大数据集的情况下尤其有效，并且也是DB的一个能力之一。

这边我们增加一个嵌套查询，大体为：

```sql
SELECT
    distinct u.account_id
FROM
    db_b.xxx_user u
INNER JOIN db_a.tf_org_person_rel r
ON
    u.org_user_id = r.org_person_id
WHERE
    r.status_cd = '1'
    AND r.org_id IN (429763, 429764, 2361116, ..., 2558342)
    AND u.status_cd = '1'
    AND u.tenant_id = 'abc123'
```

然后我们增加3个子阶段的时间度量（其中1和2为之前剩余的2次查询，3为1和2合并的查询），跑测一下

```sql
Stage 1: ===> 255ms
Stage 2: ===> 137ms
Stage 3: ===> 1ms
Stage 4: ===> 483ms
Sub-Stage 5.1: ===> 740ms
Sub-Stage 5.2: ===> 673ms
Sub-Stage 5.3: ===> 433ms
Stage 5: ===> 1847ms
```

可以看到，1.3s可以直接所见到400ms，因为少了数据量的来回传输，传输的数据也相应的减少了，甚至单次的时间消耗都比分开的两次都低。

整理一下代码：

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2024-11-22-optimizing-slow-queries-from-15s-to-1s/final_code.2024-11-22_16-25-17.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
<div class="caption mt-0">
    最终优化代码
</div>

本身很复杂的逻辑此时已经完全简化了，实现了数据库操作复杂语句和应用层逻辑的剥离了，这也是分层的一个比较实用的逻辑和应用

跑测一下

```sql
Stage 1: ===> 213ms
Stage 2: ===> 118ms
Stage 3: ===> 3ms
Stage 4: ===> 486ms
Stage 5: ===> 496ms
```

可以看到，已经在ms级别了，这边看着是已经达到预期的目标了。另外还有一些优化手段，比如数据集真的大到一定量级，IN太多的情况下，可以考虑分页拉取，不过正如前面说的，除了数据库引擎层消耗以外，还有网络和应用层也会消耗，所以是需要取舍的。

这里我们砍掉了最大头之后，可以回头对前面的阶段也优化一下，主要是针对拉全列改成拉需要的列，跑测一下看看

```sql
Stage 1: ===> 218ms
Stage 2: ===> 113ms
Stage 3: ===> 0ms
Stage 4: ===> 226ms
Stage 5: ===> 511ms
```

到这里的这波优化已经取得不错的成果了，这边其实还有办法进一步继续优化的，但是这个接口牵涉太多的历史业务逻辑，因此这边暂时没有继续深挖，这个其实也是很多还债过程中最难受的点，你需要保持兼容，如果前辈们没良心的堆，那大概这个草台很容易在优化重构过程中会崩塌，祝好

## 结论

因为脱敏的需求，有些截图就不放了，虽然我觉得那些有助于理解整个优化过程中的思路和一步一步的优化带来的代码变迁。说到这里有时候我们在团队协作中会有结对Code Review或者定期抽样代码评审的方式，其实也是保证一个人的思路能传递给其他人，另外也能让好的思想在团队内部传播，能让新同学更快速跟上，并且长期保持团队代码质量、工程能力和协作能力。

另外咱们还是应该坚持对事不对人，因为每个人都有一段成长期，并且很多人在面临高压或者高速增长的业务的情况下，有很大的可能出现技术债（~~不然某节和某团的区别从何而来~~），并且不管是谁写的东西都是有”保质期“的。
