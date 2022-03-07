# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### DistributedSemaphore <a name="DistributedSemaphore" id="cdk-concurrency-controller.DistributedSemaphore"></a>

#### Initializers <a name="Initializers" id="cdk-concurrency-controller.DistributedSemaphore.Initializer"></a>

```typescript
import { DistributedSemaphore } from 'cdk-concurrency-controller'

new DistributedSemaphore(scope: Construct, id: string, props: DistributedSemaphoreProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphore.Initializer.parameter.scope">scope</a></code> | <code>monocdk.Construct</code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphore.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphore.Initializer.parameter.props">props</a></code> | <code><a href="#cdk-concurrency-controller.DistributedSemaphoreProps">DistributedSemaphoreProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="cdk-concurrency-controller.DistributedSemaphore.Initializer.parameter.scope"></a>

- *Type:* monocdk.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-concurrency-controller.DistributedSemaphore.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="cdk-concurrency-controller.DistributedSemaphore.Initializer.parameter.props"></a>

- *Type:* <a href="#cdk-concurrency-controller.DistributedSemaphoreProps">DistributedSemaphoreProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphore.toString">toString</a></code> | Returns a string representation of this construct. |

---

##### `toString` <a name="toString" id="cdk-concurrency-controller.DistributedSemaphore.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphore.isConstruct">isConstruct</a></code> | Return whether the given object is a Construct. |

---

##### `isConstruct` <a name="isConstruct" id="cdk-concurrency-controller.DistributedSemaphore.isConstruct"></a>

```typescript
import { DistributedSemaphore } from 'cdk-concurrency-controller'

DistributedSemaphore.isConstruct(x: any)
```

Return whether the given object is a Construct.

###### `x`<sup>Required</sup> <a name="x" id="cdk-concurrency-controller.DistributedSemaphore.isConstruct.parameter.x"></a>

- *Type:* any

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphore.property.node">node</a></code> | <code>monocdk.ConstructNode</code> | The construct tree node associated with this construct. |

---

##### `node`<sup>Required</sup> <a name="node" id="cdk-concurrency-controller.DistributedSemaphore.property.node"></a>

```typescript
public readonly node: ConstructNode;
```

- *Type:* monocdk.ConstructNode

The construct tree node associated with this construct.

---


## Structs <a name="Structs" id="Structs"></a>

### DistributedSemaphoreProps <a name="DistributedSemaphoreProps" id="cdk-concurrency-controller.DistributedSemaphoreProps"></a>

#### Initializer <a name="Initializer" id="cdk-concurrency-controller.DistributedSemaphoreProps.Initializer"></a>

```typescript
import { DistributedSemaphoreProps } from 'cdk-concurrency-controller'

const distributedSemaphoreProps: DistributedSemaphoreProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphoreProps.property.doWork">doWork</a></code> | <code>monocdk.aws_stepfunctions.IChainable</code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphoreProps.property.concurrencyLimit">concurrencyLimit</a></code> | <code>number</code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphoreProps.property.lockCountAttributeName">lockCountAttributeName</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphoreProps.property.lockName">lockName</a></code> | <code>string</code> | *No description.* |

---

##### `doWork`<sup>Required</sup> <a name="doWork" id="cdk-concurrency-controller.DistributedSemaphoreProps.property.doWork"></a>

```typescript
public readonly doWork: IChainable;
```

- *Type:* monocdk.aws_stepfunctions.IChainable

---

##### `concurrencyLimit`<sup>Optional</sup> <a name="concurrencyLimit" id="cdk-concurrency-controller.DistributedSemaphoreProps.property.concurrencyLimit"></a>

```typescript
public readonly concurrencyLimit: number;
```

- *Type:* number
- *Default:* 5

---

##### `lockCountAttributeName`<sup>Optional</sup> <a name="lockCountAttributeName" id="cdk-concurrency-controller.DistributedSemaphoreProps.property.lockCountAttributeName"></a>

```typescript
public readonly lockCountAttributeName: string;
```

- *Type:* string
- *Default:* 'CurrentLockCount'

---

##### `lockName`<sup>Optional</sup> <a name="lockName" id="cdk-concurrency-controller.DistributedSemaphoreProps.property.lockName"></a>

```typescript
public readonly lockName: string;
```

- *Type:* string
- *Default:* 'DefaultLock'

---



