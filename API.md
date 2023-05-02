# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### AcquireSemaphoreFragment <a name="AcquireSemaphoreFragment" id="cdk-concurrency-controller.AcquireSemaphoreFragment"></a>

#### Initializers <a name="Initializers" id="cdk-concurrency-controller.AcquireSemaphoreFragment.Initializer"></a>

```typescript
import { AcquireSemaphoreFragment } from 'cdk-concurrency-controller'

new AcquireSemaphoreFragment(scope: Construct, id: string, props: AcquireSemaphoreFragmentProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.AcquireSemaphoreFragment.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.AcquireSemaphoreFragment.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.AcquireSemaphoreFragment.Initializer.parameter.props">props</a></code> | <code><a href="#cdk-concurrency-controller.AcquireSemaphoreFragmentProps">AcquireSemaphoreFragmentProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="cdk-concurrency-controller.AcquireSemaphoreFragment.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-concurrency-controller.AcquireSemaphoreFragment.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="cdk-concurrency-controller.AcquireSemaphoreFragment.Initializer.parameter.props"></a>

- *Type:* <a href="#cdk-concurrency-controller.AcquireSemaphoreFragmentProps">AcquireSemaphoreFragmentProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-concurrency-controller.AcquireSemaphoreFragment.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#cdk-concurrency-controller.AcquireSemaphoreFragment.next">next</a></code> | Continue normal execution with the given state. |
| <code><a href="#cdk-concurrency-controller.AcquireSemaphoreFragment.prefixStates">prefixStates</a></code> | Prefix the IDs of all states in this state machine fragment. |
| <code><a href="#cdk-concurrency-controller.AcquireSemaphoreFragment.toSingleState">toSingleState</a></code> | Wrap all states in this state machine fragment up into a single state. |

---

##### `toString` <a name="toString" id="cdk-concurrency-controller.AcquireSemaphoreFragment.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `next` <a name="next" id="cdk-concurrency-controller.AcquireSemaphoreFragment.next"></a>

```typescript
public next(next: IChainable): Chain
```

Continue normal execution with the given state.

###### `next`<sup>Required</sup> <a name="next" id="cdk-concurrency-controller.AcquireSemaphoreFragment.next.parameter.next"></a>

- *Type:* aws-cdk-lib.aws_stepfunctions.IChainable

---

##### `prefixStates` <a name="prefixStates" id="cdk-concurrency-controller.AcquireSemaphoreFragment.prefixStates"></a>

```typescript
public prefixStates(prefix?: string): StateMachineFragment
```

Prefix the IDs of all states in this state machine fragment.

Use this to avoid multiple copies of the state machine all having the
same state IDs.

###### `prefix`<sup>Optional</sup> <a name="prefix" id="cdk-concurrency-controller.AcquireSemaphoreFragment.prefixStates.parameter.prefix"></a>

- *Type:* string

The prefix to add.

Will use construct ID by default.

---

##### `toSingleState` <a name="toSingleState" id="cdk-concurrency-controller.AcquireSemaphoreFragment.toSingleState"></a>

```typescript
public toSingleState(options?: SingleStateOptions): Parallel
```

Wrap all states in this state machine fragment up into a single state.

This can be used to add retry or error handling onto this state
machine fragment.

Be aware that this changes the result of the inner state machine
to be an array with the result of the state machine in it. Adjust
your paths accordingly. For example, change 'outputPath' to
'$[0]'.

###### `options`<sup>Optional</sup> <a name="options" id="cdk-concurrency-controller.AcquireSemaphoreFragment.toSingleState.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_stepfunctions.SingleStateOptions

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-concurrency-controller.AcquireSemaphoreFragment.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### ~~`isConstruct`~~ <a name="isConstruct" id="cdk-concurrency-controller.AcquireSemaphoreFragment.isConstruct"></a>

```typescript
import { AcquireSemaphoreFragment } from 'cdk-concurrency-controller'

AcquireSemaphoreFragment.isConstruct(x: any)
```

Checks if `x` is a construct.

###### `x`<sup>Required</sup> <a name="x" id="cdk-concurrency-controller.AcquireSemaphoreFragment.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.AcquireSemaphoreFragment.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#cdk-concurrency-controller.AcquireSemaphoreFragment.property.endStates">endStates</a></code> | <code>aws-cdk-lib.aws_stepfunctions.INextable[]</code> | The states to chain onto if this fragment is used. |
| <code><a href="#cdk-concurrency-controller.AcquireSemaphoreFragment.property.id">id</a></code> | <code>string</code> | Descriptive identifier for this chainable. |
| <code><a href="#cdk-concurrency-controller.AcquireSemaphoreFragment.property.startState">startState</a></code> | <code>aws-cdk-lib.aws_stepfunctions.State</code> | The start state of this state machine fragment. |

---

##### `node`<sup>Required</sup> <a name="node" id="cdk-concurrency-controller.AcquireSemaphoreFragment.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `endStates`<sup>Required</sup> <a name="endStates" id="cdk-concurrency-controller.AcquireSemaphoreFragment.property.endStates"></a>

```typescript
public readonly endStates: INextable[];
```

- *Type:* aws-cdk-lib.aws_stepfunctions.INextable[]

The states to chain onto if this fragment is used.

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-concurrency-controller.AcquireSemaphoreFragment.property.id"></a>

```typescript
public readonly id: string;
```

- *Type:* string

Descriptive identifier for this chainable.

---

##### `startState`<sup>Required</sup> <a name="startState" id="cdk-concurrency-controller.AcquireSemaphoreFragment.property.startState"></a>

```typescript
public readonly startState: State;
```

- *Type:* aws-cdk-lib.aws_stepfunctions.State

The start state of this state machine fragment.

---


### AcquireViaStartExecutionFragment <a name="AcquireViaStartExecutionFragment" id="cdk-concurrency-controller.AcquireViaStartExecutionFragment"></a>

#### Initializers <a name="Initializers" id="cdk-concurrency-controller.AcquireViaStartExecutionFragment.Initializer"></a>

```typescript
import { AcquireViaStartExecutionFragment } from 'cdk-concurrency-controller'

new AcquireViaStartExecutionFragment(scope: Construct, id: string, props: AcquireViaStartExecutionFragmentProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.AcquireViaStartExecutionFragment.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.AcquireViaStartExecutionFragment.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.AcquireViaStartExecutionFragment.Initializer.parameter.props">props</a></code> | <code><a href="#cdk-concurrency-controller.AcquireViaStartExecutionFragmentProps">AcquireViaStartExecutionFragmentProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="cdk-concurrency-controller.AcquireViaStartExecutionFragment.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-concurrency-controller.AcquireViaStartExecutionFragment.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="cdk-concurrency-controller.AcquireViaStartExecutionFragment.Initializer.parameter.props"></a>

- *Type:* <a href="#cdk-concurrency-controller.AcquireViaStartExecutionFragmentProps">AcquireViaStartExecutionFragmentProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-concurrency-controller.AcquireViaStartExecutionFragment.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#cdk-concurrency-controller.AcquireViaStartExecutionFragment.next">next</a></code> | Continue normal execution with the given state. |
| <code><a href="#cdk-concurrency-controller.AcquireViaStartExecutionFragment.prefixStates">prefixStates</a></code> | Prefix the IDs of all states in this state machine fragment. |
| <code><a href="#cdk-concurrency-controller.AcquireViaStartExecutionFragment.toSingleState">toSingleState</a></code> | Wrap all states in this state machine fragment up into a single state. |

---

##### `toString` <a name="toString" id="cdk-concurrency-controller.AcquireViaStartExecutionFragment.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `next` <a name="next" id="cdk-concurrency-controller.AcquireViaStartExecutionFragment.next"></a>

```typescript
public next(next: IChainable): Chain
```

Continue normal execution with the given state.

###### `next`<sup>Required</sup> <a name="next" id="cdk-concurrency-controller.AcquireViaStartExecutionFragment.next.parameter.next"></a>

- *Type:* aws-cdk-lib.aws_stepfunctions.IChainable

---

##### `prefixStates` <a name="prefixStates" id="cdk-concurrency-controller.AcquireViaStartExecutionFragment.prefixStates"></a>

```typescript
public prefixStates(prefix?: string): StateMachineFragment
```

Prefix the IDs of all states in this state machine fragment.

Use this to avoid multiple copies of the state machine all having the
same state IDs.

###### `prefix`<sup>Optional</sup> <a name="prefix" id="cdk-concurrency-controller.AcquireViaStartExecutionFragment.prefixStates.parameter.prefix"></a>

- *Type:* string

The prefix to add.

Will use construct ID by default.

---

##### `toSingleState` <a name="toSingleState" id="cdk-concurrency-controller.AcquireViaStartExecutionFragment.toSingleState"></a>

```typescript
public toSingleState(options?: SingleStateOptions): Parallel
```

Wrap all states in this state machine fragment up into a single state.

This can be used to add retry or error handling onto this state
machine fragment.

Be aware that this changes the result of the inner state machine
to be an array with the result of the state machine in it. Adjust
your paths accordingly. For example, change 'outputPath' to
'$[0]'.

###### `options`<sup>Optional</sup> <a name="options" id="cdk-concurrency-controller.AcquireViaStartExecutionFragment.toSingleState.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_stepfunctions.SingleStateOptions

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-concurrency-controller.AcquireViaStartExecutionFragment.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### ~~`isConstruct`~~ <a name="isConstruct" id="cdk-concurrency-controller.AcquireViaStartExecutionFragment.isConstruct"></a>

```typescript
import { AcquireViaStartExecutionFragment } from 'cdk-concurrency-controller'

AcquireViaStartExecutionFragment.isConstruct(x: any)
```

Checks if `x` is a construct.

###### `x`<sup>Required</sup> <a name="x" id="cdk-concurrency-controller.AcquireViaStartExecutionFragment.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.AcquireViaStartExecutionFragment.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#cdk-concurrency-controller.AcquireViaStartExecutionFragment.property.endStates">endStates</a></code> | <code>aws-cdk-lib.aws_stepfunctions.INextable[]</code> | The states to chain onto if this fragment is used. |
| <code><a href="#cdk-concurrency-controller.AcquireViaStartExecutionFragment.property.id">id</a></code> | <code>string</code> | Descriptive identifier for this chainable. |
| <code><a href="#cdk-concurrency-controller.AcquireViaStartExecutionFragment.property.startState">startState</a></code> | <code>aws-cdk-lib.aws_stepfunctions.State</code> | The start state of this state machine fragment. |

---

##### `node`<sup>Required</sup> <a name="node" id="cdk-concurrency-controller.AcquireViaStartExecutionFragment.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `endStates`<sup>Required</sup> <a name="endStates" id="cdk-concurrency-controller.AcquireViaStartExecutionFragment.property.endStates"></a>

```typescript
public readonly endStates: INextable[];
```

- *Type:* aws-cdk-lib.aws_stepfunctions.INextable[]

The states to chain onto if this fragment is used.

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-concurrency-controller.AcquireViaStartExecutionFragment.property.id"></a>

```typescript
public readonly id: string;
```

- *Type:* string

Descriptive identifier for this chainable.

---

##### `startState`<sup>Required</sup> <a name="startState" id="cdk-concurrency-controller.AcquireViaStartExecutionFragment.property.startState"></a>

```typescript
public readonly startState: State;
```

- *Type:* aws-cdk-lib.aws_stepfunctions.State

The start state of this state machine fragment.

---


### DistributedSemaphore <a name="DistributedSemaphore" id="cdk-concurrency-controller.DistributedSemaphore"></a>

#### Initializers <a name="Initializers" id="cdk-concurrency-controller.DistributedSemaphore.Initializer"></a>

```typescript
import { DistributedSemaphore } from 'cdk-concurrency-controller'

new DistributedSemaphore(scope: Construct, id: string, props?: DistributedSemaphoreProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphore.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphore.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphore.Initializer.parameter.props">props</a></code> | <code><a href="#cdk-concurrency-controller.DistributedSemaphoreProps">DistributedSemaphoreProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="cdk-concurrency-controller.DistributedSemaphore.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-concurrency-controller.DistributedSemaphore.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Optional</sup> <a name="props" id="cdk-concurrency-controller.DistributedSemaphore.Initializer.parameter.props"></a>

- *Type:* <a href="#cdk-concurrency-controller.DistributedSemaphoreProps">DistributedSemaphoreProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphore.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphore.acquire">acquire</a></code> | Acquire a permit for a limited resource. |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphore.release">release</a></code> | Release the permit for the resource. |

---

##### `toString` <a name="toString" id="cdk-concurrency-controller.DistributedSemaphore.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `acquire` <a name="acquire" id="cdk-concurrency-controller.DistributedSemaphore.acquire"></a>

```typescript
public acquire(options?: AcquireOptions): StateMachineFragment
```

Acquire a permit for a limited resource.

###### `options`<sup>Optional</sup> <a name="options" id="cdk-concurrency-controller.DistributedSemaphore.acquire.parameter.options"></a>

- *Type:* <a href="#cdk-concurrency-controller.AcquireOptions">AcquireOptions</a>

use default semaphore if not specified.

---

##### `release` <a name="release" id="cdk-concurrency-controller.DistributedSemaphore.release"></a>

```typescript
public release(options?: ReleaseOptions): StateMachineFragment
```

Release the permit for the resource.

###### `options`<sup>Optional</sup> <a name="options" id="cdk-concurrency-controller.DistributedSemaphore.release.parameter.options"></a>

- *Type:* <a href="#cdk-concurrency-controller.ReleaseOptions">ReleaseOptions</a>

use default semaphore if not specified.

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphore.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### ~~`isConstruct`~~ <a name="isConstruct" id="cdk-concurrency-controller.DistributedSemaphore.isConstruct"></a>

```typescript
import { DistributedSemaphore } from 'cdk-concurrency-controller'

DistributedSemaphore.isConstruct(x: any)
```

Checks if `x` is a construct.

###### `x`<sup>Required</sup> <a name="x" id="cdk-concurrency-controller.DistributedSemaphore.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphore.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphore.property.acquireSemaphoreStateMachine">acquireSemaphoreStateMachine</a></code> | <code>aws-cdk-lib.aws_stepfunctions.IStateMachine</code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphore.property.allSemaphores">allSemaphores</a></code> | <code><a href="#cdk-concurrency-controller.SemaphoreDefinition">SemaphoreDefinition</a>[]</code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphore.property.cleanupSemaphoreStateMachine">cleanupSemaphoreStateMachine</a></code> | <code>aws-cdk-lib.aws_stepfunctions.IStateMachine</code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphore.property.defaultSemaphore">defaultSemaphore</a></code> | <code><a href="#cdk-concurrency-controller.SemaphoreDefinition">SemaphoreDefinition</a></code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphore.property.releaseSemaphoreStateMachine">releaseSemaphoreStateMachine</a></code> | <code>aws-cdk-lib.aws_stepfunctions.IStateMachine</code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphore.property.semaphoreTable">semaphoreTable</a></code> | <code><a href="#cdk-concurrency-controller.SemaphoreTableDefinition">SemaphoreTableDefinition</a></code> | *No description.* |

---

##### `node`<sup>Required</sup> <a name="node" id="cdk-concurrency-controller.DistributedSemaphore.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `acquireSemaphoreStateMachine`<sup>Required</sup> <a name="acquireSemaphoreStateMachine" id="cdk-concurrency-controller.DistributedSemaphore.property.acquireSemaphoreStateMachine"></a>

```typescript
public readonly acquireSemaphoreStateMachine: IStateMachine;
```

- *Type:* aws-cdk-lib.aws_stepfunctions.IStateMachine

---

##### `allSemaphores`<sup>Required</sup> <a name="allSemaphores" id="cdk-concurrency-controller.DistributedSemaphore.property.allSemaphores"></a>

```typescript
public readonly allSemaphores: SemaphoreDefinition[];
```

- *Type:* <a href="#cdk-concurrency-controller.SemaphoreDefinition">SemaphoreDefinition</a>[]

---

##### `cleanupSemaphoreStateMachine`<sup>Required</sup> <a name="cleanupSemaphoreStateMachine" id="cdk-concurrency-controller.DistributedSemaphore.property.cleanupSemaphoreStateMachine"></a>

```typescript
public readonly cleanupSemaphoreStateMachine: IStateMachine;
```

- *Type:* aws-cdk-lib.aws_stepfunctions.IStateMachine

---

##### `defaultSemaphore`<sup>Required</sup> <a name="defaultSemaphore" id="cdk-concurrency-controller.DistributedSemaphore.property.defaultSemaphore"></a>

```typescript
public readonly defaultSemaphore: SemaphoreDefinition;
```

- *Type:* <a href="#cdk-concurrency-controller.SemaphoreDefinition">SemaphoreDefinition</a>

---

##### `releaseSemaphoreStateMachine`<sup>Required</sup> <a name="releaseSemaphoreStateMachine" id="cdk-concurrency-controller.DistributedSemaphore.property.releaseSemaphoreStateMachine"></a>

```typescript
public readonly releaseSemaphoreStateMachine: IStateMachine;
```

- *Type:* aws-cdk-lib.aws_stepfunctions.IStateMachine

---

##### `semaphoreTable`<sup>Required</sup> <a name="semaphoreTable" id="cdk-concurrency-controller.DistributedSemaphore.property.semaphoreTable"></a>

```typescript
public readonly semaphoreTable: SemaphoreTableDefinition;
```

- *Type:* <a href="#cdk-concurrency-controller.SemaphoreTableDefinition">SemaphoreTableDefinition</a>

---


### ReleaseSemaphoreFragment <a name="ReleaseSemaphoreFragment" id="cdk-concurrency-controller.ReleaseSemaphoreFragment"></a>

#### Initializers <a name="Initializers" id="cdk-concurrency-controller.ReleaseSemaphoreFragment.Initializer"></a>

```typescript
import { ReleaseSemaphoreFragment } from 'cdk-concurrency-controller'

new ReleaseSemaphoreFragment(scope: Construct, id: string, props: ReleaseSemaphoreFragmentProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.ReleaseSemaphoreFragment.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.ReleaseSemaphoreFragment.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.ReleaseSemaphoreFragment.Initializer.parameter.props">props</a></code> | <code><a href="#cdk-concurrency-controller.ReleaseSemaphoreFragmentProps">ReleaseSemaphoreFragmentProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="cdk-concurrency-controller.ReleaseSemaphoreFragment.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-concurrency-controller.ReleaseSemaphoreFragment.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="cdk-concurrency-controller.ReleaseSemaphoreFragment.Initializer.parameter.props"></a>

- *Type:* <a href="#cdk-concurrency-controller.ReleaseSemaphoreFragmentProps">ReleaseSemaphoreFragmentProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-concurrency-controller.ReleaseSemaphoreFragment.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#cdk-concurrency-controller.ReleaseSemaphoreFragment.next">next</a></code> | Continue normal execution with the given state. |
| <code><a href="#cdk-concurrency-controller.ReleaseSemaphoreFragment.prefixStates">prefixStates</a></code> | Prefix the IDs of all states in this state machine fragment. |
| <code><a href="#cdk-concurrency-controller.ReleaseSemaphoreFragment.toSingleState">toSingleState</a></code> | Wrap all states in this state machine fragment up into a single state. |

---

##### `toString` <a name="toString" id="cdk-concurrency-controller.ReleaseSemaphoreFragment.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `next` <a name="next" id="cdk-concurrency-controller.ReleaseSemaphoreFragment.next"></a>

```typescript
public next(next: IChainable): Chain
```

Continue normal execution with the given state.

###### `next`<sup>Required</sup> <a name="next" id="cdk-concurrency-controller.ReleaseSemaphoreFragment.next.parameter.next"></a>

- *Type:* aws-cdk-lib.aws_stepfunctions.IChainable

---

##### `prefixStates` <a name="prefixStates" id="cdk-concurrency-controller.ReleaseSemaphoreFragment.prefixStates"></a>

```typescript
public prefixStates(prefix?: string): StateMachineFragment
```

Prefix the IDs of all states in this state machine fragment.

Use this to avoid multiple copies of the state machine all having the
same state IDs.

###### `prefix`<sup>Optional</sup> <a name="prefix" id="cdk-concurrency-controller.ReleaseSemaphoreFragment.prefixStates.parameter.prefix"></a>

- *Type:* string

The prefix to add.

Will use construct ID by default.

---

##### `toSingleState` <a name="toSingleState" id="cdk-concurrency-controller.ReleaseSemaphoreFragment.toSingleState"></a>

```typescript
public toSingleState(options?: SingleStateOptions): Parallel
```

Wrap all states in this state machine fragment up into a single state.

This can be used to add retry or error handling onto this state
machine fragment.

Be aware that this changes the result of the inner state machine
to be an array with the result of the state machine in it. Adjust
your paths accordingly. For example, change 'outputPath' to
'$[0]'.

###### `options`<sup>Optional</sup> <a name="options" id="cdk-concurrency-controller.ReleaseSemaphoreFragment.toSingleState.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_stepfunctions.SingleStateOptions

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-concurrency-controller.ReleaseSemaphoreFragment.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### ~~`isConstruct`~~ <a name="isConstruct" id="cdk-concurrency-controller.ReleaseSemaphoreFragment.isConstruct"></a>

```typescript
import { ReleaseSemaphoreFragment } from 'cdk-concurrency-controller'

ReleaseSemaphoreFragment.isConstruct(x: any)
```

Checks if `x` is a construct.

###### `x`<sup>Required</sup> <a name="x" id="cdk-concurrency-controller.ReleaseSemaphoreFragment.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.ReleaseSemaphoreFragment.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#cdk-concurrency-controller.ReleaseSemaphoreFragment.property.endStates">endStates</a></code> | <code>aws-cdk-lib.aws_stepfunctions.INextable[]</code> | The states to chain onto if this fragment is used. |
| <code><a href="#cdk-concurrency-controller.ReleaseSemaphoreFragment.property.id">id</a></code> | <code>string</code> | Descriptive identifier for this chainable. |
| <code><a href="#cdk-concurrency-controller.ReleaseSemaphoreFragment.property.startState">startState</a></code> | <code>aws-cdk-lib.aws_stepfunctions.State</code> | The start state of this state machine fragment. |

---

##### `node`<sup>Required</sup> <a name="node" id="cdk-concurrency-controller.ReleaseSemaphoreFragment.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `endStates`<sup>Required</sup> <a name="endStates" id="cdk-concurrency-controller.ReleaseSemaphoreFragment.property.endStates"></a>

```typescript
public readonly endStates: INextable[];
```

- *Type:* aws-cdk-lib.aws_stepfunctions.INextable[]

The states to chain onto if this fragment is used.

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-concurrency-controller.ReleaseSemaphoreFragment.property.id"></a>

```typescript
public readonly id: string;
```

- *Type:* string

Descriptive identifier for this chainable.

---

##### `startState`<sup>Required</sup> <a name="startState" id="cdk-concurrency-controller.ReleaseSemaphoreFragment.property.startState"></a>

```typescript
public readonly startState: State;
```

- *Type:* aws-cdk-lib.aws_stepfunctions.State

The start state of this state machine fragment.

---


### ReleaseViaStartExecutionFragment <a name="ReleaseViaStartExecutionFragment" id="cdk-concurrency-controller.ReleaseViaStartExecutionFragment"></a>

#### Initializers <a name="Initializers" id="cdk-concurrency-controller.ReleaseViaStartExecutionFragment.Initializer"></a>

```typescript
import { ReleaseViaStartExecutionFragment } from 'cdk-concurrency-controller'

new ReleaseViaStartExecutionFragment(scope: Construct, id: string, props: ReleaseViaStartExecutionFragmentProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.ReleaseViaStartExecutionFragment.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.ReleaseViaStartExecutionFragment.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.ReleaseViaStartExecutionFragment.Initializer.parameter.props">props</a></code> | <code><a href="#cdk-concurrency-controller.ReleaseViaStartExecutionFragmentProps">ReleaseViaStartExecutionFragmentProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="cdk-concurrency-controller.ReleaseViaStartExecutionFragment.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-concurrency-controller.ReleaseViaStartExecutionFragment.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="cdk-concurrency-controller.ReleaseViaStartExecutionFragment.Initializer.parameter.props"></a>

- *Type:* <a href="#cdk-concurrency-controller.ReleaseViaStartExecutionFragmentProps">ReleaseViaStartExecutionFragmentProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-concurrency-controller.ReleaseViaStartExecutionFragment.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#cdk-concurrency-controller.ReleaseViaStartExecutionFragment.next">next</a></code> | Continue normal execution with the given state. |
| <code><a href="#cdk-concurrency-controller.ReleaseViaStartExecutionFragment.prefixStates">prefixStates</a></code> | Prefix the IDs of all states in this state machine fragment. |
| <code><a href="#cdk-concurrency-controller.ReleaseViaStartExecutionFragment.toSingleState">toSingleState</a></code> | Wrap all states in this state machine fragment up into a single state. |

---

##### `toString` <a name="toString" id="cdk-concurrency-controller.ReleaseViaStartExecutionFragment.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `next` <a name="next" id="cdk-concurrency-controller.ReleaseViaStartExecutionFragment.next"></a>

```typescript
public next(next: IChainable): Chain
```

Continue normal execution with the given state.

###### `next`<sup>Required</sup> <a name="next" id="cdk-concurrency-controller.ReleaseViaStartExecutionFragment.next.parameter.next"></a>

- *Type:* aws-cdk-lib.aws_stepfunctions.IChainable

---

##### `prefixStates` <a name="prefixStates" id="cdk-concurrency-controller.ReleaseViaStartExecutionFragment.prefixStates"></a>

```typescript
public prefixStates(prefix?: string): StateMachineFragment
```

Prefix the IDs of all states in this state machine fragment.

Use this to avoid multiple copies of the state machine all having the
same state IDs.

###### `prefix`<sup>Optional</sup> <a name="prefix" id="cdk-concurrency-controller.ReleaseViaStartExecutionFragment.prefixStates.parameter.prefix"></a>

- *Type:* string

The prefix to add.

Will use construct ID by default.

---

##### `toSingleState` <a name="toSingleState" id="cdk-concurrency-controller.ReleaseViaStartExecutionFragment.toSingleState"></a>

```typescript
public toSingleState(options?: SingleStateOptions): Parallel
```

Wrap all states in this state machine fragment up into a single state.

This can be used to add retry or error handling onto this state
machine fragment.

Be aware that this changes the result of the inner state machine
to be an array with the result of the state machine in it. Adjust
your paths accordingly. For example, change 'outputPath' to
'$[0]'.

###### `options`<sup>Optional</sup> <a name="options" id="cdk-concurrency-controller.ReleaseViaStartExecutionFragment.toSingleState.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_stepfunctions.SingleStateOptions

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-concurrency-controller.ReleaseViaStartExecutionFragment.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### ~~`isConstruct`~~ <a name="isConstruct" id="cdk-concurrency-controller.ReleaseViaStartExecutionFragment.isConstruct"></a>

```typescript
import { ReleaseViaStartExecutionFragment } from 'cdk-concurrency-controller'

ReleaseViaStartExecutionFragment.isConstruct(x: any)
```

Checks if `x` is a construct.

###### `x`<sup>Required</sup> <a name="x" id="cdk-concurrency-controller.ReleaseViaStartExecutionFragment.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.ReleaseViaStartExecutionFragment.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#cdk-concurrency-controller.ReleaseViaStartExecutionFragment.property.endStates">endStates</a></code> | <code>aws-cdk-lib.aws_stepfunctions.INextable[]</code> | The states to chain onto if this fragment is used. |
| <code><a href="#cdk-concurrency-controller.ReleaseViaStartExecutionFragment.property.id">id</a></code> | <code>string</code> | Descriptive identifier for this chainable. |
| <code><a href="#cdk-concurrency-controller.ReleaseViaStartExecutionFragment.property.startState">startState</a></code> | <code>aws-cdk-lib.aws_stepfunctions.State</code> | The start state of this state machine fragment. |

---

##### `node`<sup>Required</sup> <a name="node" id="cdk-concurrency-controller.ReleaseViaStartExecutionFragment.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `endStates`<sup>Required</sup> <a name="endStates" id="cdk-concurrency-controller.ReleaseViaStartExecutionFragment.property.endStates"></a>

```typescript
public readonly endStates: INextable[];
```

- *Type:* aws-cdk-lib.aws_stepfunctions.INextable[]

The states to chain onto if this fragment is used.

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-concurrency-controller.ReleaseViaStartExecutionFragment.property.id"></a>

```typescript
public readonly id: string;
```

- *Type:* string

Descriptive identifier for this chainable.

---

##### `startState`<sup>Required</sup> <a name="startState" id="cdk-concurrency-controller.ReleaseViaStartExecutionFragment.property.startState"></a>

```typescript
public readonly startState: State;
```

- *Type:* aws-cdk-lib.aws_stepfunctions.State

The start state of this state machine fragment.

---


## Structs <a name="Structs" id="Structs"></a>

### AcquireOptions <a name="AcquireOptions" id="cdk-concurrency-controller.AcquireOptions"></a>

#### Initializer <a name="Initializer" id="cdk-concurrency-controller.AcquireOptions.Initializer"></a>

```typescript
import { AcquireOptions } from 'cdk-concurrency-controller'

const acquireOptions: AcquireOptions = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.AcquireOptions.property.name">name</a></code> | <code>string</code> | The name for the semaphore. |
| <code><a href="#cdk-concurrency-controller.AcquireOptions.property.userId">userId</a></code> | <code>string</code> | The semaphore user id to acquire/release resource usage. |
| <code><a href="#cdk-concurrency-controller.AcquireOptions.property.nextTryWaitTime">nextTryWaitTime</a></code> | <code>string</code> | Wait a fixed amount of time (in second) for another try to acquire semaphore if not acquired in previous tries. |
| <code><a href="#cdk-concurrency-controller.AcquireOptions.property.taskTimeout">taskTimeout</a></code> | <code>aws-cdk-lib.aws_stepfunctions.Timeout</code> | Maximum run time for the execution. |
| <code><a href="#cdk-concurrency-controller.AcquireOptions.property.timeout">timeout</a></code> | <code>aws-cdk-lib.Duration</code> | Maximum run time for the execution. |

---

##### `name`<sup>Required</sup> <a name="name" id="cdk-concurrency-controller.AcquireOptions.property.name"></a>

```typescript
public readonly name: string;
```

- *Type:* string

The name for the semaphore.

Or it can be JsonPath expression that extracts the value from the state object at runtime.
This allows custom semaphore names from runtime input for multiple resources.

Example value: `$.semaphoreName`

---

##### `userId`<sup>Required</sup> <a name="userId" id="cdk-concurrency-controller.AcquireOptions.property.userId"></a>

```typescript
public readonly userId: string;
```

- *Type:* string

The semaphore user id to acquire/release resource usage.

---

##### `nextTryWaitTime`<sup>Optional</sup> <a name="nextTryWaitTime" id="cdk-concurrency-controller.AcquireOptions.property.nextTryWaitTime"></a>

```typescript
public readonly nextTryWaitTime: string;
```

- *Type:* string
- *Default:* '3' seconds

Wait a fixed amount of time (in second) for another try to acquire semaphore if not acquired in previous tries.

---

##### `taskTimeout`<sup>Optional</sup> <a name="taskTimeout" id="cdk-concurrency-controller.AcquireOptions.property.taskTimeout"></a>

```typescript
public readonly taskTimeout: Timeout;
```

- *Type:* aws-cdk-lib.aws_stepfunctions.Timeout
- *Default:* No timeout

Maximum run time for the execution.

---

##### ~~`timeout`~~<sup>Optional</sup> <a name="timeout" id="cdk-concurrency-controller.AcquireOptions.property.timeout"></a>

- *Deprecated:* Use taskTimeout instead

```typescript
public readonly timeout: Duration;
```

- *Type:* aws-cdk-lib.Duration
- *Default:* No timeout

Maximum run time for the execution.

---

### AcquireSemaphoreFragmentProps <a name="AcquireSemaphoreFragmentProps" id="cdk-concurrency-controller.AcquireSemaphoreFragmentProps"></a>

#### Initializer <a name="Initializer" id="cdk-concurrency-controller.AcquireSemaphoreFragmentProps.Initializer"></a>

```typescript
import { AcquireSemaphoreFragmentProps } from 'cdk-concurrency-controller'

const acquireSemaphoreFragmentProps: AcquireSemaphoreFragmentProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.AcquireSemaphoreFragmentProps.property.name">name</a></code> | <code>string</code> | The name for the semaphore. |
| <code><a href="#cdk-concurrency-controller.AcquireSemaphoreFragmentProps.property.userId">userId</a></code> | <code>string</code> | The semaphore user id to acquire/release resource usage. |
| <code><a href="#cdk-concurrency-controller.AcquireSemaphoreFragmentProps.property.nextTryWaitTime">nextTryWaitTime</a></code> | <code>string</code> | Wait a fixed amount of time (in second) for another try to acquire semaphore if not acquired in previous tries. |
| <code><a href="#cdk-concurrency-controller.AcquireSemaphoreFragmentProps.property.limit">limit</a></code> | <code>string</code> | The value for concurrency control. |
| <code><a href="#cdk-concurrency-controller.AcquireSemaphoreFragmentProps.property.semaphoreTable">semaphoreTable</a></code> | <code><a href="#cdk-concurrency-controller.SemaphoreTableDefinition">SemaphoreTableDefinition</a></code> | The DynamoDB table to use for the semaphore. |
| <code><a href="#cdk-concurrency-controller.AcquireSemaphoreFragmentProps.property.retryStrategy">retryStrategy</a></code> | <code>aws-cdk-lib.aws_stepfunctions.RetryProps</code> | Retry strategy on Errors.ALL when releasing a semaphore use from the semaphore table. |

---

##### `name`<sup>Required</sup> <a name="name" id="cdk-concurrency-controller.AcquireSemaphoreFragmentProps.property.name"></a>

```typescript
public readonly name: string;
```

- *Type:* string

The name for the semaphore.

Or it can be JsonPath expression that extracts the value from the state object at runtime.
This allows custom semaphore names from runtime input for multiple resources.

Example value: `$.semaphoreName`

---

##### `userId`<sup>Required</sup> <a name="userId" id="cdk-concurrency-controller.AcquireSemaphoreFragmentProps.property.userId"></a>

```typescript
public readonly userId: string;
```

- *Type:* string

The semaphore user id to acquire/release resource usage.

---

##### `nextTryWaitTime`<sup>Optional</sup> <a name="nextTryWaitTime" id="cdk-concurrency-controller.AcquireSemaphoreFragmentProps.property.nextTryWaitTime"></a>

```typescript
public readonly nextTryWaitTime: string;
```

- *Type:* string
- *Default:* '3' seconds

Wait a fixed amount of time (in second) for another try to acquire semaphore if not acquired in previous tries.

---

##### `limit`<sup>Required</sup> <a name="limit" id="cdk-concurrency-controller.AcquireSemaphoreFragmentProps.property.limit"></a>

```typescript
public readonly limit: string;
```

- *Type:* string

The value for concurrency control.

---

##### `semaphoreTable`<sup>Required</sup> <a name="semaphoreTable" id="cdk-concurrency-controller.AcquireSemaphoreFragmentProps.property.semaphoreTable"></a>

```typescript
public readonly semaphoreTable: SemaphoreTableDefinition;
```

- *Type:* <a href="#cdk-concurrency-controller.SemaphoreTableDefinition">SemaphoreTableDefinition</a>

The DynamoDB table to use for the semaphore.

---

##### `retryStrategy`<sup>Optional</sup> <a name="retryStrategy" id="cdk-concurrency-controller.AcquireSemaphoreFragmentProps.property.retryStrategy"></a>

```typescript
public readonly retryStrategy: RetryProps;
```

- *Type:* aws-cdk-lib.aws_stepfunctions.RetryProps
- *Default:* '{ interval: Duration.seconds(1), maxAttempts: 5, backoffRate: 1.5 }'

Retry strategy on Errors.ALL when releasing a semaphore use from the semaphore table.

NOTE: `errors` property is always overridden to [Errors.ALL].

---

### AcquireSemaphoreOptions <a name="AcquireSemaphoreOptions" id="cdk-concurrency-controller.AcquireSemaphoreOptions"></a>

#### Initializer <a name="Initializer" id="cdk-concurrency-controller.AcquireSemaphoreOptions.Initializer"></a>

```typescript
import { AcquireSemaphoreOptions } from 'cdk-concurrency-controller'

const acquireSemaphoreOptions: AcquireSemaphoreOptions = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.AcquireSemaphoreOptions.property.name">name</a></code> | <code>string</code> | The name for the semaphore. |
| <code><a href="#cdk-concurrency-controller.AcquireSemaphoreOptions.property.userId">userId</a></code> | <code>string</code> | The semaphore user id to acquire/release resource usage. |
| <code><a href="#cdk-concurrency-controller.AcquireSemaphoreOptions.property.nextTryWaitTime">nextTryWaitTime</a></code> | <code>string</code> | Wait a fixed amount of time (in second) for another try to acquire semaphore if not acquired in previous tries. |

---

##### `name`<sup>Required</sup> <a name="name" id="cdk-concurrency-controller.AcquireSemaphoreOptions.property.name"></a>

```typescript
public readonly name: string;
```

- *Type:* string

The name for the semaphore.

Or it can be JsonPath expression that extracts the value from the state object at runtime.
This allows custom semaphore names from runtime input for multiple resources.

Example value: `$.semaphoreName`

---

##### `userId`<sup>Required</sup> <a name="userId" id="cdk-concurrency-controller.AcquireSemaphoreOptions.property.userId"></a>

```typescript
public readonly userId: string;
```

- *Type:* string

The semaphore user id to acquire/release resource usage.

---

##### `nextTryWaitTime`<sup>Optional</sup> <a name="nextTryWaitTime" id="cdk-concurrency-controller.AcquireSemaphoreOptions.property.nextTryWaitTime"></a>

```typescript
public readonly nextTryWaitTime: string;
```

- *Type:* string
- *Default:* '3' seconds

Wait a fixed amount of time (in second) for another try to acquire semaphore if not acquired in previous tries.

---

### AcquireSemaphoreTaskInput <a name="AcquireSemaphoreTaskInput" id="cdk-concurrency-controller.AcquireSemaphoreTaskInput"></a>

#### Initializer <a name="Initializer" id="cdk-concurrency-controller.AcquireSemaphoreTaskInput.Initializer"></a>

```typescript
import { AcquireSemaphoreTaskInput } from 'cdk-concurrency-controller'

const acquireSemaphoreTaskInput: AcquireSemaphoreTaskInput = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.AcquireSemaphoreTaskInput.property.limit">limit</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.AcquireSemaphoreTaskInput.property.name">name</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.AcquireSemaphoreTaskInput.property.nextTryWaitTime">nextTryWaitTime</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.AcquireSemaphoreTaskInput.property.userId">userId</a></code> | <code>string</code> | *No description.* |

---

##### `limit`<sup>Required</sup> <a name="limit" id="cdk-concurrency-controller.AcquireSemaphoreTaskInput.property.limit"></a>

```typescript
public readonly limit: string;
```

- *Type:* string

---

##### `name`<sup>Required</sup> <a name="name" id="cdk-concurrency-controller.AcquireSemaphoreTaskInput.property.name"></a>

```typescript
public readonly name: string;
```

- *Type:* string

---

##### `nextTryWaitTime`<sup>Required</sup> <a name="nextTryWaitTime" id="cdk-concurrency-controller.AcquireSemaphoreTaskInput.property.nextTryWaitTime"></a>

```typescript
public readonly nextTryWaitTime: string;
```

- *Type:* string

---

##### `userId`<sup>Required</sup> <a name="userId" id="cdk-concurrency-controller.AcquireSemaphoreTaskInput.property.userId"></a>

```typescript
public readonly userId: string;
```

- *Type:* string

---

### AcquireViaStartExecutionFragmentProps <a name="AcquireViaStartExecutionFragmentProps" id="cdk-concurrency-controller.AcquireViaStartExecutionFragmentProps"></a>

#### Initializer <a name="Initializer" id="cdk-concurrency-controller.AcquireViaStartExecutionFragmentProps.Initializer"></a>

```typescript
import { AcquireViaStartExecutionFragmentProps } from 'cdk-concurrency-controller'

const acquireViaStartExecutionFragmentProps: AcquireViaStartExecutionFragmentProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.AcquireViaStartExecutionFragmentProps.property.taskTimeout">taskTimeout</a></code> | <code>aws-cdk-lib.aws_stepfunctions.Timeout</code> | Maximum run time for the execution. |
| <code><a href="#cdk-concurrency-controller.AcquireViaStartExecutionFragmentProps.property.timeout">timeout</a></code> | <code>aws-cdk-lib.Duration</code> | Maximum run time for the execution. |
| <code><a href="#cdk-concurrency-controller.AcquireViaStartExecutionFragmentProps.property.input">input</a></code> | <code><a href="#cdk-concurrency-controller.AcquireSemaphoreTaskInput">AcquireSemaphoreTaskInput</a></code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.AcquireViaStartExecutionFragmentProps.property.stateMachine">stateMachine</a></code> | <code>aws-cdk-lib.aws_stepfunctions.IStateMachine</code> | The Step Functions state machine to start the execution on. |

---

##### `taskTimeout`<sup>Optional</sup> <a name="taskTimeout" id="cdk-concurrency-controller.AcquireViaStartExecutionFragmentProps.property.taskTimeout"></a>

```typescript
public readonly taskTimeout: Timeout;
```

- *Type:* aws-cdk-lib.aws_stepfunctions.Timeout
- *Default:* No timeout

Maximum run time for the execution.

---

##### ~~`timeout`~~<sup>Optional</sup> <a name="timeout" id="cdk-concurrency-controller.AcquireViaStartExecutionFragmentProps.property.timeout"></a>

- *Deprecated:* Use taskTimeout instead

```typescript
public readonly timeout: Duration;
```

- *Type:* aws-cdk-lib.Duration
- *Default:* No timeout

Maximum run time for the execution.

---

##### `input`<sup>Required</sup> <a name="input" id="cdk-concurrency-controller.AcquireViaStartExecutionFragmentProps.property.input"></a>

```typescript
public readonly input: AcquireSemaphoreTaskInput;
```

- *Type:* <a href="#cdk-concurrency-controller.AcquireSemaphoreTaskInput">AcquireSemaphoreTaskInput</a>

---

##### `stateMachine`<sup>Required</sup> <a name="stateMachine" id="cdk-concurrency-controller.AcquireViaStartExecutionFragmentProps.property.stateMachine"></a>

```typescript
public readonly stateMachine: IStateMachine;
```

- *Type:* aws-cdk-lib.aws_stepfunctions.IStateMachine

The Step Functions state machine to start the execution on.

---

### DistributedSemaphoreProps <a name="DistributedSemaphoreProps" id="cdk-concurrency-controller.DistributedSemaphoreProps"></a>

#### Initializer <a name="Initializer" id="cdk-concurrency-controller.DistributedSemaphoreProps.Initializer"></a>

```typescript
import { DistributedSemaphoreProps } from 'cdk-concurrency-controller'

const distributedSemaphoreProps: DistributedSemaphoreProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphoreProps.property.acquireSemaphoreStateMachineProps">acquireSemaphoreStateMachineProps</a></code> | <code><a href="#cdk-concurrency-controller.SemaphoreStateMachineProps">SemaphoreStateMachineProps</a></code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphoreProps.property.cleanupSemaphoreStateMachineProps">cleanupSemaphoreStateMachineProps</a></code> | <code><a href="#cdk-concurrency-controller.SemaphoreStateMachineProps">SemaphoreStateMachineProps</a></code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphoreProps.property.defaultSemaphore">defaultSemaphore</a></code> | <code><a href="#cdk-concurrency-controller.SemaphoreDefinition">SemaphoreDefinition</a></code> | The default semaphore settings. |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphoreProps.property.releaseSemaphoreStateMachineProps">releaseSemaphoreStateMachineProps</a></code> | <code><a href="#cdk-concurrency-controller.SemaphoreStateMachineProps">SemaphoreStateMachineProps</a></code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.DistributedSemaphoreProps.property.semaphores">semaphores</a></code> | <code><a href="#cdk-concurrency-controller.SemaphoreDefinition">SemaphoreDefinition</a>[]</code> | *No description.* |

---

##### `acquireSemaphoreStateMachineProps`<sup>Optional</sup> <a name="acquireSemaphoreStateMachineProps" id="cdk-concurrency-controller.DistributedSemaphoreProps.property.acquireSemaphoreStateMachineProps"></a>

```typescript
public readonly acquireSemaphoreStateMachineProps: SemaphoreStateMachineProps;
```

- *Type:* <a href="#cdk-concurrency-controller.SemaphoreStateMachineProps">SemaphoreStateMachineProps</a>

---

##### `cleanupSemaphoreStateMachineProps`<sup>Optional</sup> <a name="cleanupSemaphoreStateMachineProps" id="cdk-concurrency-controller.DistributedSemaphoreProps.property.cleanupSemaphoreStateMachineProps"></a>

```typescript
public readonly cleanupSemaphoreStateMachineProps: SemaphoreStateMachineProps;
```

- *Type:* <a href="#cdk-concurrency-controller.SemaphoreStateMachineProps">SemaphoreStateMachineProps</a>

---

##### `defaultSemaphore`<sup>Optional</sup> <a name="defaultSemaphore" id="cdk-concurrency-controller.DistributedSemaphoreProps.property.defaultSemaphore"></a>

```typescript
public readonly defaultSemaphore: SemaphoreDefinition;
```

- *Type:* <a href="#cdk-concurrency-controller.SemaphoreDefinition">SemaphoreDefinition</a>
- *Default:* '{ name: "DefaultSemaphore", limit: "5" }'

The default semaphore settings.

It is used when no other pattern of semaphore applied.
This can be used as a quick start when working with a single arbitrary resource.

NOTE: the default semaphore name cannot use JsonPath expression for the sake of a safe fallback.

---

##### `releaseSemaphoreStateMachineProps`<sup>Optional</sup> <a name="releaseSemaphoreStateMachineProps" id="cdk-concurrency-controller.DistributedSemaphoreProps.property.releaseSemaphoreStateMachineProps"></a>

```typescript
public readonly releaseSemaphoreStateMachineProps: SemaphoreStateMachineProps;
```

- *Type:* <a href="#cdk-concurrency-controller.SemaphoreStateMachineProps">SemaphoreStateMachineProps</a>

---

##### `semaphores`<sup>Optional</sup> <a name="semaphores" id="cdk-concurrency-controller.DistributedSemaphoreProps.property.semaphores"></a>

```typescript
public readonly semaphores: SemaphoreDefinition[];
```

- *Type:* <a href="#cdk-concurrency-controller.SemaphoreDefinition">SemaphoreDefinition</a>[]

---

### ReleaseOptions <a name="ReleaseOptions" id="cdk-concurrency-controller.ReleaseOptions"></a>

#### Initializer <a name="Initializer" id="cdk-concurrency-controller.ReleaseOptions.Initializer"></a>

```typescript
import { ReleaseOptions } from 'cdk-concurrency-controller'

const releaseOptions: ReleaseOptions = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.ReleaseOptions.property.name">name</a></code> | <code>string</code> | The name for the semaphore. |
| <code><a href="#cdk-concurrency-controller.ReleaseOptions.property.userId">userId</a></code> | <code>string</code> | The semaphore user id to acquire/release resource usage. |
| <code><a href="#cdk-concurrency-controller.ReleaseOptions.property.checkSemaphoreUseFirst">checkSemaphoreUseFirst</a></code> | <code>boolean</code> | Check if the semaphore use exists before trying to release it. |
| <code><a href="#cdk-concurrency-controller.ReleaseOptions.property.taskTimeout">taskTimeout</a></code> | <code>aws-cdk-lib.aws_stepfunctions.Timeout</code> | Maximum run time for the execution. |
| <code><a href="#cdk-concurrency-controller.ReleaseOptions.property.timeout">timeout</a></code> | <code>aws-cdk-lib.Duration</code> | Maximum run time for the execution. |

---

##### `name`<sup>Required</sup> <a name="name" id="cdk-concurrency-controller.ReleaseOptions.property.name"></a>

```typescript
public readonly name: string;
```

- *Type:* string

The name for the semaphore.

Or it can be JsonPath expression that extracts the value from the state object at runtime.
This allows custom semaphore names from runtime input for multiple resources.

Example value: `$.semaphoreName`

---

##### `userId`<sup>Required</sup> <a name="userId" id="cdk-concurrency-controller.ReleaseOptions.property.userId"></a>

```typescript
public readonly userId: string;
```

- *Type:* string

The semaphore user id to acquire/release resource usage.

---

##### `checkSemaphoreUseFirst`<sup>Optional</sup> <a name="checkSemaphoreUseFirst" id="cdk-concurrency-controller.ReleaseOptions.property.checkSemaphoreUseFirst"></a>

```typescript
public readonly checkSemaphoreUseFirst: boolean;
```

- *Type:* boolean
- *Default:* false

Check if the semaphore use exists before trying to release it.

This can help to shift the load from write capacity to read capacity in case of missing semaphore use
(best effort to avoid hot partitions and save write capacity for crucial actions),
where DDB provides 3x throughput on read capacity than write capacity per partition.
see more about hot partition: https://aws.amazon.com/premiumsupport/knowledge-center/dynamodb-table-throttled/#You_have_a_hot_partition_in_your_table

---

##### `taskTimeout`<sup>Optional</sup> <a name="taskTimeout" id="cdk-concurrency-controller.ReleaseOptions.property.taskTimeout"></a>

```typescript
public readonly taskTimeout: Timeout;
```

- *Type:* aws-cdk-lib.aws_stepfunctions.Timeout
- *Default:* No timeout

Maximum run time for the execution.

---

##### ~~`timeout`~~<sup>Optional</sup> <a name="timeout" id="cdk-concurrency-controller.ReleaseOptions.property.timeout"></a>

- *Deprecated:* Use taskTimeout instead

```typescript
public readonly timeout: Duration;
```

- *Type:* aws-cdk-lib.Duration
- *Default:* No timeout

Maximum run time for the execution.

---

### ReleaseSemaphoreFragmentProps <a name="ReleaseSemaphoreFragmentProps" id="cdk-concurrency-controller.ReleaseSemaphoreFragmentProps"></a>

#### Initializer <a name="Initializer" id="cdk-concurrency-controller.ReleaseSemaphoreFragmentProps.Initializer"></a>

```typescript
import { ReleaseSemaphoreFragmentProps } from 'cdk-concurrency-controller'

const releaseSemaphoreFragmentProps: ReleaseSemaphoreFragmentProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.ReleaseSemaphoreFragmentProps.property.name">name</a></code> | <code>string</code> | The name for the semaphore. |
| <code><a href="#cdk-concurrency-controller.ReleaseSemaphoreFragmentProps.property.userId">userId</a></code> | <code>string</code> | The semaphore user id to acquire/release resource usage. |
| <code><a href="#cdk-concurrency-controller.ReleaseSemaphoreFragmentProps.property.checkSemaphoreUseFirst">checkSemaphoreUseFirst</a></code> | <code>boolean</code> | Check if the semaphore use exists before trying to release it. |
| <code><a href="#cdk-concurrency-controller.ReleaseSemaphoreFragmentProps.property.semaphoreTable">semaphoreTable</a></code> | <code><a href="#cdk-concurrency-controller.SemaphoreTableDefinition">SemaphoreTableDefinition</a></code> | The DynamoDB table to use for the semaphore. |
| <code><a href="#cdk-concurrency-controller.ReleaseSemaphoreFragmentProps.property.retryStrategy">retryStrategy</a></code> | <code>aws-cdk-lib.aws_stepfunctions.RetryProps</code> | Retry strategy on Errors.ALL when releasing a semaphore use from the semaphore table. |

---

##### `name`<sup>Required</sup> <a name="name" id="cdk-concurrency-controller.ReleaseSemaphoreFragmentProps.property.name"></a>

```typescript
public readonly name: string;
```

- *Type:* string

The name for the semaphore.

Or it can be JsonPath expression that extracts the value from the state object at runtime.
This allows custom semaphore names from runtime input for multiple resources.

Example value: `$.semaphoreName`

---

##### `userId`<sup>Required</sup> <a name="userId" id="cdk-concurrency-controller.ReleaseSemaphoreFragmentProps.property.userId"></a>

```typescript
public readonly userId: string;
```

- *Type:* string

The semaphore user id to acquire/release resource usage.

---

##### `checkSemaphoreUseFirst`<sup>Optional</sup> <a name="checkSemaphoreUseFirst" id="cdk-concurrency-controller.ReleaseSemaphoreFragmentProps.property.checkSemaphoreUseFirst"></a>

```typescript
public readonly checkSemaphoreUseFirst: boolean;
```

- *Type:* boolean
- *Default:* false

Check if the semaphore use exists before trying to release it.

This can help to shift the load from write capacity to read capacity in case of missing semaphore use
(best effort to avoid hot partitions and save write capacity for crucial actions),
where DDB provides 3x throughput on read capacity than write capacity per partition.
see more about hot partition: https://aws.amazon.com/premiumsupport/knowledge-center/dynamodb-table-throttled/#You_have_a_hot_partition_in_your_table

---

##### `semaphoreTable`<sup>Required</sup> <a name="semaphoreTable" id="cdk-concurrency-controller.ReleaseSemaphoreFragmentProps.property.semaphoreTable"></a>

```typescript
public readonly semaphoreTable: SemaphoreTableDefinition;
```

- *Type:* <a href="#cdk-concurrency-controller.SemaphoreTableDefinition">SemaphoreTableDefinition</a>

The DynamoDB table to use for the semaphore.

---

##### `retryStrategy`<sup>Optional</sup> <a name="retryStrategy" id="cdk-concurrency-controller.ReleaseSemaphoreFragmentProps.property.retryStrategy"></a>

```typescript
public readonly retryStrategy: RetryProps;
```

- *Type:* aws-cdk-lib.aws_stepfunctions.RetryProps
- *Default:* '{ interval: Duration.seconds(1), maxAttempts: 5, backoffRate: 1.5 }'

Retry strategy on Errors.ALL when releasing a semaphore use from the semaphore table.

NOTE: `errors` property is always overridden to [Errors.ALL].

---

### ReleaseSemaphoreOptions <a name="ReleaseSemaphoreOptions" id="cdk-concurrency-controller.ReleaseSemaphoreOptions"></a>

#### Initializer <a name="Initializer" id="cdk-concurrency-controller.ReleaseSemaphoreOptions.Initializer"></a>

```typescript
import { ReleaseSemaphoreOptions } from 'cdk-concurrency-controller'

const releaseSemaphoreOptions: ReleaseSemaphoreOptions = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.ReleaseSemaphoreOptions.property.name">name</a></code> | <code>string</code> | The name for the semaphore. |
| <code><a href="#cdk-concurrency-controller.ReleaseSemaphoreOptions.property.userId">userId</a></code> | <code>string</code> | The semaphore user id to acquire/release resource usage. |
| <code><a href="#cdk-concurrency-controller.ReleaseSemaphoreOptions.property.checkSemaphoreUseFirst">checkSemaphoreUseFirst</a></code> | <code>boolean</code> | Check if the semaphore use exists before trying to release it. |

---

##### `name`<sup>Required</sup> <a name="name" id="cdk-concurrency-controller.ReleaseSemaphoreOptions.property.name"></a>

```typescript
public readonly name: string;
```

- *Type:* string

The name for the semaphore.

Or it can be JsonPath expression that extracts the value from the state object at runtime.
This allows custom semaphore names from runtime input for multiple resources.

Example value: `$.semaphoreName`

---

##### `userId`<sup>Required</sup> <a name="userId" id="cdk-concurrency-controller.ReleaseSemaphoreOptions.property.userId"></a>

```typescript
public readonly userId: string;
```

- *Type:* string

The semaphore user id to acquire/release resource usage.

---

##### `checkSemaphoreUseFirst`<sup>Optional</sup> <a name="checkSemaphoreUseFirst" id="cdk-concurrency-controller.ReleaseSemaphoreOptions.property.checkSemaphoreUseFirst"></a>

```typescript
public readonly checkSemaphoreUseFirst: boolean;
```

- *Type:* boolean
- *Default:* false

Check if the semaphore use exists before trying to release it.

This can help to shift the load from write capacity to read capacity in case of missing semaphore use
(best effort to avoid hot partitions and save write capacity for crucial actions),
where DDB provides 3x throughput on read capacity than write capacity per partition.
see more about hot partition: https://aws.amazon.com/premiumsupport/knowledge-center/dynamodb-table-throttled/#You_have_a_hot_partition_in_your_table

---

### ReleaseSemaphoreTaskInput <a name="ReleaseSemaphoreTaskInput" id="cdk-concurrency-controller.ReleaseSemaphoreTaskInput"></a>

#### Initializer <a name="Initializer" id="cdk-concurrency-controller.ReleaseSemaphoreTaskInput.Initializer"></a>

```typescript
import { ReleaseSemaphoreTaskInput } from 'cdk-concurrency-controller'

const releaseSemaphoreTaskInput: ReleaseSemaphoreTaskInput = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.ReleaseSemaphoreTaskInput.property.name">name</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.ReleaseSemaphoreTaskInput.property.userId">userId</a></code> | <code>string</code> | *No description.* |

---

##### `name`<sup>Required</sup> <a name="name" id="cdk-concurrency-controller.ReleaseSemaphoreTaskInput.property.name"></a>

```typescript
public readonly name: string;
```

- *Type:* string

---

##### `userId`<sup>Required</sup> <a name="userId" id="cdk-concurrency-controller.ReleaseSemaphoreTaskInput.property.userId"></a>

```typescript
public readonly userId: string;
```

- *Type:* string

---

### ReleaseViaStartExecutionFragmentProps <a name="ReleaseViaStartExecutionFragmentProps" id="cdk-concurrency-controller.ReleaseViaStartExecutionFragmentProps"></a>

#### Initializer <a name="Initializer" id="cdk-concurrency-controller.ReleaseViaStartExecutionFragmentProps.Initializer"></a>

```typescript
import { ReleaseViaStartExecutionFragmentProps } from 'cdk-concurrency-controller'

const releaseViaStartExecutionFragmentProps: ReleaseViaStartExecutionFragmentProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.ReleaseViaStartExecutionFragmentProps.property.taskTimeout">taskTimeout</a></code> | <code>aws-cdk-lib.aws_stepfunctions.Timeout</code> | Maximum run time for the execution. |
| <code><a href="#cdk-concurrency-controller.ReleaseViaStartExecutionFragmentProps.property.timeout">timeout</a></code> | <code>aws-cdk-lib.Duration</code> | Maximum run time for the execution. |
| <code><a href="#cdk-concurrency-controller.ReleaseViaStartExecutionFragmentProps.property.input">input</a></code> | <code><a href="#cdk-concurrency-controller.ReleaseSemaphoreTaskInput">ReleaseSemaphoreTaskInput</a></code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.ReleaseViaStartExecutionFragmentProps.property.stateMachine">stateMachine</a></code> | <code>aws-cdk-lib.aws_stepfunctions.IStateMachine</code> | The Step Functions state machine to start the execution on. |

---

##### `taskTimeout`<sup>Optional</sup> <a name="taskTimeout" id="cdk-concurrency-controller.ReleaseViaStartExecutionFragmentProps.property.taskTimeout"></a>

```typescript
public readonly taskTimeout: Timeout;
```

- *Type:* aws-cdk-lib.aws_stepfunctions.Timeout
- *Default:* No timeout

Maximum run time for the execution.

---

##### ~~`timeout`~~<sup>Optional</sup> <a name="timeout" id="cdk-concurrency-controller.ReleaseViaStartExecutionFragmentProps.property.timeout"></a>

- *Deprecated:* Use taskTimeout instead

```typescript
public readonly timeout: Duration;
```

- *Type:* aws-cdk-lib.Duration
- *Default:* No timeout

Maximum run time for the execution.

---

##### `input`<sup>Required</sup> <a name="input" id="cdk-concurrency-controller.ReleaseViaStartExecutionFragmentProps.property.input"></a>

```typescript
public readonly input: ReleaseSemaphoreTaskInput;
```

- *Type:* <a href="#cdk-concurrency-controller.ReleaseSemaphoreTaskInput">ReleaseSemaphoreTaskInput</a>

---

##### `stateMachine`<sup>Required</sup> <a name="stateMachine" id="cdk-concurrency-controller.ReleaseViaStartExecutionFragmentProps.property.stateMachine"></a>

```typescript
public readonly stateMachine: IStateMachine;
```

- *Type:* aws-cdk-lib.aws_stepfunctions.IStateMachine

The Step Functions state machine to start the execution on.

---

### SemaphoreDefinition <a name="SemaphoreDefinition" id="cdk-concurrency-controller.SemaphoreDefinition"></a>

#### Initializer <a name="Initializer" id="cdk-concurrency-controller.SemaphoreDefinition.Initializer"></a>

```typescript
import { SemaphoreDefinition } from 'cdk-concurrency-controller'

const semaphoreDefinition: SemaphoreDefinition = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.SemaphoreDefinition.property.limit">limit</a></code> | <code>string</code> | The value for concurrency control. |
| <code><a href="#cdk-concurrency-controller.SemaphoreDefinition.property.name">name</a></code> | <code>string</code> | The name for the semaphore. |

---

##### `limit`<sup>Required</sup> <a name="limit" id="cdk-concurrency-controller.SemaphoreDefinition.property.limit"></a>

```typescript
public readonly limit: string;
```

- *Type:* string

The value for concurrency control.

---

##### `name`<sup>Required</sup> <a name="name" id="cdk-concurrency-controller.SemaphoreDefinition.property.name"></a>

```typescript
public readonly name: string;
```

- *Type:* string

The name for the semaphore.

Or it can be JsonPath expression that extracts the value from the state object at runtime.
This allows custom semaphore names from runtime input for multiple resources.

Example value: `$.semaphoreName`

---

### SemaphoreStateMachineProps <a name="SemaphoreStateMachineProps" id="cdk-concurrency-controller.SemaphoreStateMachineProps"></a>

#### Initializer <a name="Initializer" id="cdk-concurrency-controller.SemaphoreStateMachineProps.Initializer"></a>

```typescript
import { SemaphoreStateMachineProps } from 'cdk-concurrency-controller'

const semaphoreStateMachineProps: SemaphoreStateMachineProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.SemaphoreStateMachineProps.property.taskTimeout">taskTimeout</a></code> | <code>aws-cdk-lib.aws_stepfunctions.Timeout</code> | Maximum run time for the execution. |
| <code><a href="#cdk-concurrency-controller.SemaphoreStateMachineProps.property.timeout">timeout</a></code> | <code>aws-cdk-lib.Duration</code> | Maximum run time for the execution. |
| <code><a href="#cdk-concurrency-controller.SemaphoreStateMachineProps.property.logs">logs</a></code> | <code>aws-cdk-lib.aws_stepfunctions.LogOptions</code> | Defines what execution history events are logged and where they are logged. |
| <code><a href="#cdk-concurrency-controller.SemaphoreStateMachineProps.property.tracingEnabled">tracingEnabled</a></code> | <code>boolean</code> | Specifies whether Amazon X-Ray tracing is enabled for this state machine. |

---

##### `taskTimeout`<sup>Optional</sup> <a name="taskTimeout" id="cdk-concurrency-controller.SemaphoreStateMachineProps.property.taskTimeout"></a>

```typescript
public readonly taskTimeout: Timeout;
```

- *Type:* aws-cdk-lib.aws_stepfunctions.Timeout
- *Default:* No timeout

Maximum run time for the execution.

---

##### ~~`timeout`~~<sup>Optional</sup> <a name="timeout" id="cdk-concurrency-controller.SemaphoreStateMachineProps.property.timeout"></a>

- *Deprecated:* Use taskTimeout instead

```typescript
public readonly timeout: Duration;
```

- *Type:* aws-cdk-lib.Duration
- *Default:* No timeout

Maximum run time for the execution.

---

##### `logs`<sup>Optional</sup> <a name="logs" id="cdk-concurrency-controller.SemaphoreStateMachineProps.property.logs"></a>

```typescript
public readonly logs: LogOptions;
```

- *Type:* aws-cdk-lib.aws_stepfunctions.LogOptions
- *Default:* No logging

Defines what execution history events are logged and where they are logged.

---

##### `tracingEnabled`<sup>Optional</sup> <a name="tracingEnabled" id="cdk-concurrency-controller.SemaphoreStateMachineProps.property.tracingEnabled"></a>

```typescript
public readonly tracingEnabled: boolean;
```

- *Type:* boolean
- *Default:* false

Specifies whether Amazon X-Ray tracing is enabled for this state machine.

---

### SemaphoreTableDefinition <a name="SemaphoreTableDefinition" id="cdk-concurrency-controller.SemaphoreTableDefinition"></a>

#### Initializer <a name="Initializer" id="cdk-concurrency-controller.SemaphoreTableDefinition.Initializer"></a>

```typescript
import { SemaphoreTableDefinition } from 'cdk-concurrency-controller'

const semaphoreTableDefinition: SemaphoreTableDefinition = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.SemaphoreTableDefinition.property.countAttributeName">countAttributeName</a></code> | <code>string</code> | The attribute name for a semaphore in-use count. |
| <code><a href="#cdk-concurrency-controller.SemaphoreTableDefinition.property.partitionKey">partitionKey</a></code> | <code>aws-cdk-lib.aws_dynamodb.Attribute</code> | *No description.* |
| <code><a href="#cdk-concurrency-controller.SemaphoreTableDefinition.property.table">table</a></code> | <code>aws-cdk-lib.aws_dynamodb.ITable</code> | *No description.* |

---

##### `countAttributeName`<sup>Required</sup> <a name="countAttributeName" id="cdk-concurrency-controller.SemaphoreTableDefinition.property.countAttributeName"></a>

```typescript
public readonly countAttributeName: string;
```

- *Type:* string

The attribute name for a semaphore in-use count.

---

##### `partitionKey`<sup>Required</sup> <a name="partitionKey" id="cdk-concurrency-controller.SemaphoreTableDefinition.property.partitionKey"></a>

```typescript
public readonly partitionKey: Attribute;
```

- *Type:* aws-cdk-lib.aws_dynamodb.Attribute

---

##### `table`<sup>Required</sup> <a name="table" id="cdk-concurrency-controller.SemaphoreTableDefinition.property.table"></a>

```typescript
public readonly table: ITable;
```

- *Type:* aws-cdk-lib.aws_dynamodb.ITable

---

### SemaphoreTimeoutOptions <a name="SemaphoreTimeoutOptions" id="cdk-concurrency-controller.SemaphoreTimeoutOptions"></a>

#### Initializer <a name="Initializer" id="cdk-concurrency-controller.SemaphoreTimeoutOptions.Initializer"></a>

```typescript
import { SemaphoreTimeoutOptions } from 'cdk-concurrency-controller'

const semaphoreTimeoutOptions: SemaphoreTimeoutOptions = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.SemaphoreTimeoutOptions.property.taskTimeout">taskTimeout</a></code> | <code>aws-cdk-lib.aws_stepfunctions.Timeout</code> | Maximum run time for the execution. |
| <code><a href="#cdk-concurrency-controller.SemaphoreTimeoutOptions.property.timeout">timeout</a></code> | <code>aws-cdk-lib.Duration</code> | Maximum run time for the execution. |

---

##### `taskTimeout`<sup>Optional</sup> <a name="taskTimeout" id="cdk-concurrency-controller.SemaphoreTimeoutOptions.property.taskTimeout"></a>

```typescript
public readonly taskTimeout: Timeout;
```

- *Type:* aws-cdk-lib.aws_stepfunctions.Timeout
- *Default:* No timeout

Maximum run time for the execution.

---

##### ~~`timeout`~~<sup>Optional</sup> <a name="timeout" id="cdk-concurrency-controller.SemaphoreTimeoutOptions.property.timeout"></a>

- *Deprecated:* Use taskTimeout instead

```typescript
public readonly timeout: Duration;
```

- *Type:* aws-cdk-lib.Duration
- *Default:* No timeout

Maximum run time for the execution.

---

### SemaphoreUseDefinition <a name="SemaphoreUseDefinition" id="cdk-concurrency-controller.SemaphoreUseDefinition"></a>

#### Initializer <a name="Initializer" id="cdk-concurrency-controller.SemaphoreUseDefinition.Initializer"></a>

```typescript
import { SemaphoreUseDefinition } from 'cdk-concurrency-controller'

const semaphoreUseDefinition: SemaphoreUseDefinition = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-concurrency-controller.SemaphoreUseDefinition.property.name">name</a></code> | <code>string</code> | The name for the semaphore. |
| <code><a href="#cdk-concurrency-controller.SemaphoreUseDefinition.property.userId">userId</a></code> | <code>string</code> | The semaphore user id to acquire/release resource usage. |

---

##### `name`<sup>Required</sup> <a name="name" id="cdk-concurrency-controller.SemaphoreUseDefinition.property.name"></a>

```typescript
public readonly name: string;
```

- *Type:* string

The name for the semaphore.

Or it can be JsonPath expression that extracts the value from the state object at runtime.
This allows custom semaphore names from runtime input for multiple resources.

Example value: `$.semaphoreName`

---

##### `userId`<sup>Required</sup> <a name="userId" id="cdk-concurrency-controller.SemaphoreUseDefinition.property.userId"></a>

```typescript
public readonly userId: string;
```

- *Type:* string

The semaphore user id to acquire/release resource usage.

---



