# Pie Proof Editor — 前端完整数据流（按运行时渲染顺序）

## 目录

- [技术栈速览](#技术栈速览)
- [阶段 0：模块加载](#阶段-0模块加载浏览器加载-js)
- [阶段 1：React 树首次渲染](#阶段-1react-树首次渲染)
- [阶段 2：AppContent 初始化](#阶段-2appcontent-初始化核心协调层)
- [阶段 3：用户选择 Example](#阶段-3用户选择-example)
- [阶段 4：开始证明 startSession](#阶段-4开始证明startsession)
- [阶段 5：syncFromWorker — ProofTree 到 React Flow](#阶段-5syncfromworker--prooftree--react-flow-节点边)
- [阶段 6：React Flow 渲染](#阶段-6react-flow-渲染)
- [阶段 7：拖放战术](#阶段-7用户交互--拖放战术)
- [阶段 8：triggerApplyTactic 全局回调](#阶段-8triggerapplytactic--全局回调桥梁)
- [阶段 9：连线触发 onConnect](#阶段-9连线触发onconnect)
- [阶段 10：AI Hint 流程](#阶段-10ai-hint-流程)
- [阶段 11：Undo/Redo](#阶段-11undoredo)
- [阶段 12：子树折叠](#阶段-12子树折叠)
- [阶段 13：Proof Script 生成](#阶段-13proof-script-生成)
- [数据流总结图](#数据流总结图)
- [核心设计决策](#核心设计决策)

---

## 技术栈速览

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| UI 框架 | React + ReactDOM | 18.3.1 | StrictMode |
| 构建工具 | Vite | 6.0.7 | ESNext + sourcemaps |
| 状态管理 | Zustand | 5.0.3 | immer + subscribeWithSelector 中间件 |
| 图可视化 | @xyflow/react (React Flow) | 12.3.6 | 证明树节点/边渲染、拖拽、连接 |
| UI 组件 | Radix UI | - | 无样式原语组件 |
| 样式 | Tailwind CSS | 3.4.17 | utility-first + PostCSS |
| 动画 | Framer Motion | 11.15.0 | 过渡动画 |
| Worker 通信 | Comlink | 4.4.2 | 主线程 ↔ Worker 透明 RPC |
| 异步状态 | @tanstack/react-query | 5.64.2 | 5min staleTime |
| AI 集成 | @google/genai | 1.25.0 | AI hint 生成 |
| 编辑器 | @monaco-editor/react | 4.6.0 | 代码编辑 |
| ID 生成 | nanoid | 5.0.9 | 唯一节点 ID |
| 样式工具 | clsx + tailwind-merge + cva | - | cn() 合并类名 |

---

## 阶段 0：模块加载（浏览器加载 JS）

```
Vite 打包产物加载
  ├── worker-client.ts 立即执行：
  │     ├── new ProofWorkerConstructor()  → 创建 Web Worker 线程
  │     ├── Comlink.wrap<ProofWorkerAPI>(worker)  → 返回 proofWorker 代理对象
  │     ├── 同理创建 diagnosticsWorker, testWorker
  │     └── 挂载 window.testProofWorker / window.proofWorker 供控制台调试
  │
  └── Worker 线程内部：
        ├── proof-worker.ts 执行
        ├── 定义 proofWorkerAPI 对象（startSession/applyTactic/getHint/scanFile...）
        ├── sessions = new Map()  → 空的会话存储
        └── Comlink.expose(proofWorkerAPI)  → 暴露 API 给主线程
```

**关键点**：Worker 在模块加载时就创建了，但 `@pie/` 的解释器模块还没导入——它们是在每个 API 方法内部 `await import()` 懒加载的。这避免了 Worker 启动时加载整个解释器的开销。

**涉及文件**：
- `src/shared/lib/worker-client.ts` — Worker 实例化和 Comlink 包装
- `src/workers/proof-worker.ts` — Worker API 定义和 Comlink 暴露

---

## 阶段 1：React 树首次渲染

```
main.tsx
  └── createRoot(#root).render(<StrictMode><App /></StrictMode>)

App 组件
  └── <Providers>
        ├── QueryClientProvider（staleTime=5min, retry=1）
        └── ReactFlowProvider（React Flow 全局上下文）
            └── <AppContent />
```

**涉及文件**：
- `src/main.tsx` — 入口点
- `src/app/providers.tsx` — QueryClient + ReactFlowProvider
- `src/app/App.tsx` — App 和 AppContent 组件

---

## 阶段 2：AppContent 初始化（核心协调层）

AppContent 挂载时按顺序发生以下事情：

```
1. useProofSession() 初始化
   ├── 内部 useState: isLoading=false, error=null, availableLemmas=[], claimType=null
   ├── 订阅 metadataStore.globalContext
   └── 订阅 proofStore.syncFromWorker, sessionId, saveSnapshot

2. useKeyboardShortcuts() 注册键盘监听
   └── document.addEventListener('keydown', handler)
       ├── Ctrl+Z → proofStore.undo()
       ├── Ctrl+Shift+Z / Ctrl+Y → proofStore.redo()
       └── cleanup: removeEventListener

3. 订阅 Zustand stores（每个 selector 独立订阅）
   ├── proofStore: nodes, updateNode, setManualPosition
   ├── exampleStore: selectedExample, selectExample, exampleSource
   └── metadataStore: globalContext

4. useEffect → setApplyTacticCallback(handleApplyTactic)
   └── 注册全局回调到 tactic-callback.ts 模块级变量
       （所有子组件可通过 triggerApplyTactic() 调用此回调）
```

**涉及文件**：
- `src/app/App.tsx:19` — AppContent 组件
- `src/features/proof-editor/hooks/useProofSession.ts` — 证明会话 hook
- `src/features/proof-editor/hooks/useKeyboardShortcuts.ts` — 键盘快捷键 hook
- `src/features/proof-editor/utils/tactic-callback.ts` — 全局回调模块

---

## 阶段 3：用户选择 Example

```
用户操作：<select> 下拉框选择一个 Example（如 "0 + n = n"）

selectExample(exampleId)  → exampleStore.set()
  ├── 查表 getExampleById(id) 获取 { sourceCode, defaultClaim }
  ├── state.selectedExample = id
  ├── state.exampleSource = sourceCode
  └── state.exampleClaim = defaultClaim

exampleSource 变化触发 AppContent useEffect（500ms debounce）：
  └── scan(exampleSource)
        │
        ▼ 主线程
        proofWorker.scanFile(sourceCode)  ──Comlink RPC──▶  Worker 线程
        │
        ▼ Worker 线程内部 scanFile()
        ├── await import("@pie/parser/parser")  ← 首次懒加载解释器
        ├── await import("@pie/utils/context")
        ├── schemeParse(sourceCode) → astList（S-expression AST 数组）
        ├── 遍历 astList：
        │     ├── Claim → addClaimToContext(ctx, ...) → 记录 pendingClaims
        │     ├── Definition → addDefineToContext(ctx, ...) → 记录 definitions[]
        │     └── DefineTactically → addDefineTacticallyToContext()
        │                            → 记录 theorems[]
        │                            （同时从 pendingClaims 移除已证明的）
        └── return { definitions, theorems, claims }
        │
        ◀──Comlink 序列化返回──
        │
        ▼ 主线程 scan() 回调
        ├── setGlobalContext({ definitions, theorems }) → metadataStore
        └── return { claims, theorems }
        │
        ▼ AppContent useEffect 回调
        ├── setFoundClaims(result.claims)
        ├── setFoundTheorems(result.theorems)
        └── 如果没有选中的 proof，自动选第一个 claim
            → handleSelectProof(claims[0].name)
```

**涉及文件**：
- `src/features/proof-editor/store/example-store.ts` — Example 选择状态
- `src/features/proof-editor/data/examples.ts` — 预定义的示例数据
- `src/app/App.tsx:54-82` — scan useEffect 和 debounce 逻辑
- `src/workers/proof-worker.ts:150-260` — Worker scanFile 实现

---

## 阶段 4：开始证明（startSession）

```
handleSelectProof(proofName)
  └── startSession(exampleSource, proofName)
        │
        ▼ useProofSession.startSession()
        ├── setIsLoading(true)
        ├── proofWorker.startSession(sourceCode, claimName)  ──RPC──▶  Worker
        │
        ▼ Worker.startSession() 内部
        ├── await import(...) 全部解释器模块
        ├── schemeParse(sourceCode) → AST
        ├── 遍历 AST 构建 ctx（Context 有序 Map）
        │     ├── 只处理到目标 claim 为止（之后的声明不可用）
        │     ├── 跳过未证明的 claim（除目标 claim 外）
        │     └── 收集 globalDefinitions[], globalTheorems[]
        ├── new ProofManager()
        ├── pm.startProof(claimName, ctx, loc) → 创建根 Goal
        ├── pm.getProofTreeData() → 原始树数据
        ├── buildProofTree(rawData) → 标准 ProofTree
        │     └── transformGoalNode() 递归转换每个节点：
        │           ├── goal: { id, type, expandedType, context[], isComplete, isCurrent }
        │           ├── children: GoalNode[]
        │           ├── appliedTactic, completedBy
        │           └── isSubtreeComplete（递归计算）
        ├── sessions.set(sessionId, { pm, ctx, claimName, claimType })
        └── return { sessionId, proofTree, globalContext, claimType }
        │
        ◀──返回主线程──
        │
        ▼ useProofSession 回调
        ├── syncFromWorker(proofTree, sessionId, claimName, theorems) ← 核心同步
        ├── saveSnapshot()  ← 保存 undo 历史
        ├── setGlobalContext(globalContext) → metadataStore
        ├── setMetadataClaimName(claimName) → metadataStore
        └── setSourceCode(sourceCode) → metadataStore
```

**涉及文件**：
- `src/app/App.tsx:41-50` — handleSelectProof
- `src/features/proof-editor/hooks/useProofSession.ts:46-86` — startSession
- `src/workers/proof-worker.ts:292-529` — Worker startSession 实现
- `src/features/proof-editor/store/proof-store.ts:356-519` — syncFromWorker

---

## 阶段 5：syncFromWorker — ProofTree → React Flow 节点/边

这是整个前端的**核心转换管线**：

```
syncFromWorker(proofTree, sessionId, claimName, theorems)
  │
  ├── ① convertProofTreeToReactFlow(proofTree) → { nodes, edges }
  │     │
  │     ├── calculateTreeLayout(root) → positions Map
  │     │     ├── 第一遍：calculateSubtreeWidths() 递归计算每棵子树宽度
  │     │     │     └── 叶节点宽度 = NODE_WIDTH (200px)
  │     │     │         内部节点 = max(200, 子节点宽度之和 + 间距)
  │     │     └── 第二遍：assignPositions() 分配坐标
  │     │           ├── 父节点居中于分配空间
  │     │           ├── tactic 节点在 goal 和子 goal 之间 (y + 135)
  │     │           └── 子节点水平等分、居中于父节点下方
  │     │
  │     └── traverseTree() 递归创建 React Flow 节点和边
  │           ├── 每个 ProtoGoalNode → GoalNode
  │           │     ├── 确定 status: todo / completed / in-progress / pending
  │           │     ├── 转换 context entries（加 id 前缀 "ctx-"、origin）
  │           │     └── data: { kind, goalType, expandedGoalType, context, status, ... }
  │           │
  │           ├── 有 appliedTactic + children
  │           │     → TacticNode（id = "tactic-for-{goalId}"）
  │           │     ├── parseTacticType() 从 tactic 名字匹配 TacticType
  │           │     ├── data: { kind, tacticType, displayName, params, status="applied" }
  │           │     └── 创建边：
  │           │           goal → tactic（goal-to-tactic）
  │           │           tactic → 每个 child（tactic-to-goal）
  │           │
  │           └── 有 completedBy 但无 children
  │                 → 叶子 TacticNode（id = "tactic-completing-{goalId}"）
  │                 └── 同上，只有 goal → tactic 边
  │
  ├── ② 处理 Lemma 节点
  │     ├── 如果传入了 theorems：
  │     │     创建新 LemmaNode 列表（网格布局，5 个一行，y = -200）
  │     └── 否则：保留已有的 lemma 节点
  │
  ├── ③ 手动位置保持（Manual Position Preservation）
  │     ├── 读取 manualPositions Map（用户拖拽过的节点位置）
  │     ├── 计算 positionDeltas：manual - auto 的偏移量
  │     ├── 对有 manual 位置的节点：直接使用 manual 位置
  │     ├── 对父节点有偏移的子节点：自动偏移（跟随父节点移动）
  │     └── 其余节点：使用自动计算位置
  │
  ├── ④ 合并节点和边
  │     ├── mergedNodes = lemmaNodes + dynamicNodes
  │     └── mergedEdges = existingLemmaEdges + proofEdges
  │
  └── ⑤ set() 写入 Zustand store（immer 不可变更新）
        ├── state.nodes = mergedNodes
        ├── state.edges = mergedEdges
        ├── state.sessionId, rootGoalId, isProofComplete
        ├── state.proofTreeData = proofTree（用于生成 proof script）
        ├── 如果 claimName 变了：清空 collapsedBranches + manualPositions
        └── autoCollapse：递归查找已完成子树，加入 collapsedBranches Set
```

### 布局算法常量

```
NODE_WIDTH        = 200px
NODE_HEIGHT       = 120px
HORIZONTAL_SPACING = 50px
VERTICAL_SPACING  = 150px
```

**涉及文件**：
- `src/features/proof-editor/utils/convert-proof-tree.ts` — 整个转换逻辑
- `src/features/proof-editor/store/proof-store.ts:356-519` — syncFromWorker

---

## 阶段 6：React Flow 渲染

```
ProofCanvas 组件响应 store 变化重新渲染：

useProofStore(s => s.nodes)  → nodes 变化触发
useProofStore(s => s.edges)  → edges 变化触发

渲染管线：
  │
  ├── hiddenNodeIds = useMemo()
  │     └── 遍历 collapsedBranches，递归标记所有后代节点为 hidden
  │
  ├── ghostNodes = useMemo()
  │     └── 从 hintStore.goalHints 构建 GhostTacticNode 数据
  │
  ├── allNodes = [...nodes.map(标记 hidden), ...ghostNodes]
  │
  ├── styledEdges = edges.map(edge => 加上 getEdgeStyle(kind) 颜色)
  ├── allEdges = [...styledEdges.map(标记 hidden), ...ghostEdges]
  │
  └── <ReactFlow
        nodes={allNodes}
        edges={allEdges}
        nodeTypes={{ goal, tactic, lemma, ghost }}
        edgeTypes={...}
        onNodesChange / onEdgesChange / onConnect / onDrop / ...
      />
```

### 节点类型及渲染

#### GoalNode

```
├── 颜色 by status:
│     pending    → 橙色边框 + 橙色淡背景
│     in-progress → 琥珀色边框 + 琥珀色淡背景
│     completed  → 绿色边框 + 绿色淡背景
│     todo       → 粉色边框 + 粉色淡背景
├── Handle (top = target "goal-input", bottom = source "goal-output")
├── context 变量 → ContextVarBlock 子组件
│     └── 右侧 Handle "ctx-{id}" 用于连接到 tactic 的 context-input
├── hint 按钮（灯泡 / 星星图标，有 API key 时显示渐变紫色）
└── collapse 按钮（仅 completed + subtreeComplete 时显示折叠 chevron）
```

#### TacticNode

```
├── 状态颜色:
│     incomplete → 琥珀色
│     ready     → 蓝色
│     applied   → 绿色
│     error     → 红色
├── Handle (top = target "goal-input", left = target "context-input")
├── Handle (bottom = source "tactic-output")
├── 内联参数输入（status=incomplete 时显示）
├── 删除按钮
└── 错误信息展示
```

#### LemmaNode

```
├── 显示 lemma 名称 + 类型签名
├── Handle (bottom = source "lemma-output")
└── 每个参数有独立 Handle "lemma-input-{param}"
```

#### GhostTacticNode

```
├── 半透明样式，紫色虚线边连接 goal
├── 显示 hint 文本、置信度、分类
└── 三个按钮: Accept / More Detail / Dismiss
```

**涉及文件**：
- `src/features/proof-editor/components/ProofCanvas.tsx` — 画布主组件
- `src/features/proof-editor/components/nodes/GoalNode.tsx` — 目标节点
- `src/features/proof-editor/components/nodes/TacticNode.tsx` — 战术节点
- `src/features/proof-editor/components/nodes/LemmaNode.tsx` — 引理节点
- `src/features/proof-editor/components/nodes/GhostTacticNode.tsx` — AI Hint 预览节点
- `src/features/proof-editor/components/edges/index.ts` — 自定义边样式

---

## 阶段 7：用户交互 — 拖放战术

### 路径 A：从 TacticPalette 拖到画布空白处

```
TacticPalette
  └── <div draggable onDragStart={setData("application/tactic-type", tacticType)}>

ProofCanvas.onDrop()
  ├── event.dataTransfer.getData("application/tactic-type")
  ├── screenToFlowPosition({ x: clientX, y: clientY })
  ├── 判断无参数 tactic → status = "ready"，有参数 → status = "incomplete"
  └── addTacticNode(data, position) → 创建悬浮的 tactic 节点
      用户需要手动连线到 goal
```

### 路径 B：从 TacticPalette 直接拖到 GoalNode 上

```
GoalNode.handleDrop()
  ├── 读取 tacticType
  ├── 检查 TACTIC_REQUIREMENTS[tacticType]
  │
  ├── 如果需要参数（variableName / expression）：
  │     └── setPendingTactic() → 显示参数输入弹窗
  │         用户输入后 → handleSubmitParam()
  │           └── triggerApplyTactic(goalId, tacticType, params)
  │
  └── 如果不需要参数（intro / split / left / right）：
        └── triggerApplyTactic(goalId, tacticType, {})
```

**涉及文件**：
- `src/features/proof-editor/components/panels/TacticPalette.tsx` — 战术面板
- `src/features/proof-editor/components/ProofCanvas.tsx:426-466` — onDrop 处理
- `src/features/proof-editor/components/nodes/GoalNode.tsx:122-194` — handleDrop

---

## 阶段 8：triggerApplyTactic — 全局回调桥梁

```
tactic-callback.ts → applyTactic(goalId, tacticType, params, tacticNodeId?)
  │
  ├── 检查 applyTacticCallback 是否注册（由 AppContent 注册）
  │
  └── setTimeout(0, async () => {   ← 关键：延迟到下一个事件循环 tick
        await applyTacticCallback!({ goalId, tacticType, params, tacticNodeId })
      })
```

### 为什么用 setTimeout(0)?

React 18 concurrent mode 要求状态更新在正确的批处理上下文中。
组件把回调存储在 React 组件树外部的模块级变量中，
直接调用会导致 "Should have a queue" 错误。
`setTimeout(0)` 将回调推迟到下一个事件循环 tick，
使其在 React 的正常调度上下文中执行。

### handleApplyTactic 完整流程

```
AppContent.handleApplyTactic()
  ├── 如果有 tacticNodeId：转移手动位置到新 ID "tactic-for-{goalId}"
  ├── await useProofSession.applyTactic(goalId, tacticType, params)
  │     │
  │     ├── proofWorker.applyTactic(sessionId, goalId, tacticType, params)
  │     │     ──Comlink RPC──▶ Worker
  │     │
  │     ▼ Worker.applyTactic() 内部
  │     ├── sessions.get(sessionId) 获取 ProofManager
  │     ├── pm.currentState.setCurrentGoalById(goalId) ← 切换到目标 goal
  │     ├── pm.currentState.pendingBranches = 0
  │     │     ← 可视化编辑器不用 then 块，用户直接指定 goal
  │     ├── 根据 tacticType 创建 Tactic 实例：
  │     │     ├── "intro"     → new IntroTactic(loc, variableName?)
  │     │     ├── "exact"     → Parser.parsePie(expression) → new ExactTactic(loc, term)
  │     │     ├── "exists"    → Parser.parsePie(expression) → new ExistsTactic(loc, value, name)
  │     │     ├── "split"     → new SpiltTactic(loc)
  │     │     ├── "left"      → new LeftTactic(loc)
  │     │     ├── "right"     → new RightTactic(loc)
  │     │     ├── "elimNat"   → new EliminateNatTactic(loc, variableName)
  │     │     ├── "elimList"  → new EliminateListTactic(loc, variableName)
  │     │     ├── "elimEither"→ new EliminateEitherTactic(loc, variableName)
  │     │     ├── "elimAbsurd"→ new EliminateAbsurdTactic(loc, variableName)
  │     │     └── default     → return error "Unknown tactic type"
  │     ├── pm.applyTactic(tactic)
  │     │     ├── 成功：tactic 修改 ProofState，可能产生新的子 Goal
  │     │     └── 失败：返回 stop(error message)
  │     ├── this.getProofTree(sessionId) → 获取更新后的完整 ProofTree
  │     └── return { success, proofTree, error? }
  │     │
  │     ◀──返回主线程──
  │     │
  │     ▼ useProofSession.applyTactic 回调
  │     ├── 成功：syncFromWorker(proofTree, sessionId)  → 重复阶段 5
  │     │         saveSnapshot()  → 保存 undo 快照
  │     └── 失败：setError(errorMessage)
  │
  └── 回到 AppContent
        ├── 成功：日志输出
        └── 失败：updateNode(tacticNodeId, { status: 'error', errorMessage })
             → TacticNode 变红显示错误
```

**涉及文件**：
- `src/features/proof-editor/utils/tactic-callback.ts` — 全局回调机制
- `src/app/App.tsx:84-134` — handleApplyTactic
- `src/features/proof-editor/hooks/useProofSession.ts:96-138` — applyTactic
- `src/workers/proof-worker.ts:531-859` — Worker applyTactic 实现

---

## 阶段 9：连线触发（onConnect）

```
用户在 React Flow 中从 Handle 拖线到另一个 Handle

ProofCanvas.handleConnect(connection)
  │
  ├── storeOnConnect(connection) → 创建视觉边
  │
  ├── 判断连接类型：
  │
  │   ┌─ Goal → Tactic（常规连线 goal-output → goal-input）
  │   │   ├── updateNode(tacticId, { connectedGoalId: goalId })
  │   │   └── 如果 tactic.status === "ready"：
  │   │         └── triggerApplyTactic(...) → 阶段 8
  │   │
  │   ├─ Goal → Tactic（上下文连线 ctx-xxx → context-input）
  │   │   ├── 提取 contextVarId，找到 contextEntry
  │   │   ├── updateNode(tacticId, { params.variableName, status: "ready" })
  │   │   └── triggerApplyTactic(...) → 阶段 8
  │   │
  │   ├─ Lemma → Tactic（lemma-output → context-input）
  │   │   ├── buildLemmaExpression() 构建表达式字符串
  │   │   │     └── 检查所有参数的 context-to-lemma 边，
  │   │   │         拼装为 "(lemmaName arg1 arg2)" 格式
  │   │   ├── updateNode(tacticId, { params.expression, status: "ready" })
  │   │   └── 如果表达式完整（无 "?"）+ tactic 已连 goal：
  │   │         └── triggerApplyTactic(...) → 阶段 8
  │   │
  │   ├─ Goal → Lemma（直接应用 / 参数绑定）
  │   │   ├── 构建表达式
  │   │   └── 完整时 → triggerApplyTactic(goalId, "exact", { expression })
  │   │
  │   └─ 其他方向：忽略
```

### 连接验证

```
isValidConnection(connection, nodes) 检查：
  ├── Goal → Tactic: goal-output → goal-input 或 ctx-* → context-input
  ├── Tactic → Goal: tactic-output → goal-input
  ├── Lemma → Tactic: lemma-output → context-input
  ├── Goal → Lemma: goal-output → lemma-input 或 ctx-* → lemma-input-*
  └── 其他组合一律拒绝

额外逻辑检查：
  └── 禁止连接到 completed 或 todo 状态的 goal
```

**涉及文件**：
- `src/features/proof-editor/components/ProofCanvas.tsx:208-388` — handleConnect
- `src/features/proof-editor/store/proof-store.ts:869-972` — isValidConnection

---

## 阶段 10：AI Hint 流程

```
用户点击 GoalNode 上的灯泡按钮
  │
  ├── GoalNode.handleHintClick() → triggerRequestHint(goalId)
  │     └── 调用全局 requestHintCallback（由 ProofCanvas 注册）
  │
  ▼ useHintSystem.requestHint(goalId)
  ├── hintStore.requestHint(goalId) → 设置 loading 状态
  │
  ├── 无 session：
  │     ├── 创建 guidance hint（"请先开始证明会话"）
  │     ├── hintStore.updateHint(goalId, guidanceHint)
  │     └── hintStore.setGhostNode(goalId, ghostNode)
  │           → ghostNode 位于 goal 下方 150px
  │
  └── 有 session：
        ├── proofWorker.getHint({
        │     sessionId, goalId, currentLevel, previousHint, apiKey
        │   })
        │     │
        │     ▼ Worker.getHint()
        │     ├── 找到 goal 节点
        │     ├── 如果有 apiKey:
        │     │     → generateProgressiveHint(apiKey, request)
        │     │       └── 调用 Google GenAI API 生成 hint
        │     └── 否则 / AI 失败:
        │           → generateRuleBasedHint(request)
        │             └── 基于 goalType 和 context 的规则匹配
        │     return HintResponse {
        │       level, explanation, category?, tacticType?, params?, confidence
        │     }
        │
        ├── hintStore.updateHint(goalId, hint)
        └── hintStore.setGhostNode(goalId, ghostNode)
```

### Hint 级别递进

```
category  →  tactic  →  full
  │              │          │
  │              │          └── 完整 tactic + 参数 + 详细解释
  │              └── 推荐具体 tactic 类型 + 原因
  └── 提示应该使用的战术类别（introduction / elimination / ...）
```

### Ghost Node 交互

```
ProofCanvas 重渲染：
  ├── ghostNodes = useMemo() 从 hintStore 构建
  ├── ghostEdges = 虚线紫色边（goal → ghost）
  └── GhostTacticNode 渲染：
        ├── "Accept" → acceptGhostNode(goalId)
        │     ├── 创建真实 TacticNode (addTacticNode)
        │     │     参数和状态从 hint 继承
        │     └── dismissGhostNode()  清除 ghost
        ├── "More Detail" → getMoreDetail(goalId)
        │     └── hint level 升级，重新调用 Worker.getHint(nextLevel)
        └── "Dismiss" → dismissGhostNode(goalId)
              └── 从 hintStore 清除 ghostNode
```

**涉及文件**：
- `src/features/proof-editor/hooks/useHintSystem.ts` — Hint 系统 hook
- `src/features/proof-editor/store/hint-store.ts` — Hint 状态存储
- `src/features/proof-editor/components/nodes/GhostTacticNode.tsx` — Ghost 节点组件
- `src/workers/proof-worker.ts:876-969` — Worker getHint 实现

---

## 阶段 11：Undo/Redo

### 触发方式

```
用户按 Ctrl+Z

useKeyboardShortcuts 监听到 keydown
  └── proofStore.undo()
        └── set(state => {
              state.historyIndex -= 1
              const snapshot = state.history[historyIndex]
              state.nodes = snapshot.nodes   ← 直接替换
              state.edges = snapshot.edges
            })
              └── React Flow 重渲染，恢复到之前状态
```

### 快照保存时机

```
- startSession 成功后    → saveSnapshot()
- applyTactic 成功后     → saveSnapshot()
- deleteTacticCascade 前 → saveSnapshot()   ← 删除前先保存，支持撤销
```

### 快照内容

```ts
{
  nodes: JSON.parse(JSON.stringify(state.nodes)),  // 深拷贝
  edges: JSON.parse(JSON.stringify(state.edges)),  // 深拷贝
  timestamp: Date.now()
}
```

### Redo

```
Ctrl+Shift+Z 或 Ctrl+Y → proofStore.redo()
  └── historyIndex += 1，恢复到下一个快照

saveSnapshot() 时会截断 redo 历史：
  state.history = state.history.slice(0, historyIndex + 1)
```

**涉及文件**：
- `src/features/proof-editor/hooks/useKeyboardShortcuts.ts`
- `src/features/proof-editor/store/proof-store.ts:531-565` — saveSnapshot / undo / redo

---

## 阶段 12：子树折叠

### 手动折叠

```
GoalNode（status = completed + isSubtreeComplete = true）显示 chevron 按钮

用户点击 chevron
  └── toggleBranchCollapse(goalId)
        → collapsedBranches Set toggle（add / delete）
        │
        ▼ ProofCanvas 重渲染
        hiddenNodeIds = useMemo()
          └── 从 collapsedBranches 递归标记所有后代节点 ID
        allNodes = nodes.map(n => ({ ...n, hidden: hiddenNodeIds.has(n.id) }))
        allEdges = edges.map(e => ({ ...e, hidden: src或target被隐藏 }))
          └── React Flow 自动隐藏 hidden 节点和边
```

### 自动折叠

```
syncFromWorker 时，如果 autoCollapseEnabled = true：
  └── findCollapsibleNodes(root) 递归查找
        ├── 条件：isSubtreeComplete && 有可视后代
        ├── 不嵌套折叠（父已折叠则不再折叠子节点）
        └── collapsedBranches.add(id)
              只添加不移除，不覆盖用户已展开的节点
```

### 全局展开

```
"Expand All" 按钮
  └── expandAllBranches() → collapsedBranches.clear()
```

**涉及文件**：
- `src/features/proof-editor/components/nodes/GoalNode.tsx:85-87` — collapse 状态和按钮
- `src/features/proof-editor/components/ProofCanvas.tsx:544-567` — hiddenNodeIds 计算
- `src/features/proof-editor/store/proof-store.ts:489-517` — 自动折叠逻辑

---

## 阶段 13：Proof Script 生成

```
useGeneratedProofScript() selector
  └── 当 proofTreeData 和 claimName 都存在时：
        generateProofScript(proofTree, claimName)
          ├── 遍历证明树
          ├── 单子节点：顺序拼接 tactic
          ├── 多子节点：包装在 (then ...) 块中
          └── return "(define-tactically claimName tactic1 (then tactic2a tactic2b) ...)"

显示在 SourceCodePanel 底部
```

**涉及文件**：
- `src/features/proof-editor/utils/generate-proof-script.ts`
- `src/features/proof-editor/store/proof-store.ts:1006-1010` — useGeneratedProofScript selector

---

## 数据流总结图

```
┌──────────────────────────────────────────────────────────────────────┐
│                              主线程                                    │
│                                                                        │
│  用户操作 ──▶ React 组件 ──▶ triggerApplyTactic() ───┐                │
│       │              │                                 │                │
│       │         Zustand Stores (7 个)                  │                │
│       │    ┌───────────────────────────┐               │                │
│       │    │ proofStore   (核心)       │◀─ syncFromWorker ──┤           │
│       │    │   nodes / edges / history │               │                │
│       │    ├───────────────────────────┤               │                │
│       │    │ metadataStore             │        AppContent              │
│       │    │ hintStore                 │     handleApplyTactic()        │
│       │    │ uiStore                   │               │                │
│       │    │ exampleStore              │               │                │
│       │    │ historyStore              │               │                │
│       │    │ goalDescriptionStore      │               │                │
│       │    └──────────┬────────────────┘               │                │
│       │               │ selector 订阅                   │                │
│       │               ▼                                 │                │
│       │        React Flow 渲染                          │                │
│       │        (GoalNode / TacticNode /                 │                │
│       │         LemmaNode / GhostNode)                  │                │
│       │                                                 │                │
│       └─────────────────────────────────────────────────┘                │
│                            │                                             │
│                     Comlink RPC                                          │
│                            │                                             │
├────────────────────────────┼─────────────────────────────────────────────┤
│                            ▼                                             │
│                     Web Worker 线程                                      │
│  ┌───────────────────────────────────────────────────────┐              │
│  │ ProofWorkerAPI                                         │              │
│  │  sessions: Map<id, { ProofManager, ctx, ... }>         │              │
│  │                                                         │              │
│  │  startSession()  → 解析 + 构建 ctx + 创建 PM + 返回 Tree│              │
│  │  applyTactic()   → 切 goal + 创 tactic + apply + 返回   │              │
│  │  scanFile()      → 解析 + 遍历 + 返回 definitions       │              │
│  │  getHint()       → AI / 规则 hint 生成                  │              │
│  │  closeSession()  → 清理 session                         │              │
│  └───────────────────────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 核心设计决策

### 1. Worker 内部用动态 import

Worker 创建时不加载解释器模块。每个 API 方法（startSession / applyTactic / scanFile）内部 `await import("@pie/...")` 懒加载。这样 Worker 启动快，首次调用时才付出加载代价。后续调用会命中模块缓存。

### 2. 全局回调 + setTimeout(0)

`tactic-callback.ts` 用模块级变量存储回调函数，任何组件都可通过 `triggerApplyTactic()` 触发。`setTimeout(0)` 是为了解决 React 18 concurrent mode 下，从组件树外部触发状态更新时的批处理时序问题（"Should have a queue" error）。

### 3. syncFromWorker 的手动位置保持

每次 Worker 返回新 ProofTree，布局算法会重新计算所有节点位置。但如果用户手动拖动过某个节点（记录在 `manualPositions` Map），sync 时会：
- 直接使用手动位置
- 子节点跟随父节点的偏移量自动调整
- 新 session 时清空手动位置

### 4. Undo 是快照模式而非命令模式

每次操作前用 `JSON.parse(JSON.stringify())` 深拷贝 nodes + edges 作为快照。undo 直接替换整个 state。优点是实现简单、不会出 bug；代价是内存占用较高（但证明树通常不大，可接受）。

### 5. Zustand 7 个独立 Store

按关注点分离：proof / metadata / hint / ui / example / history / goalDescription。每个 store 独立，避免一个 store 变化导致无关组件重渲染。`subscribeWithSelector` 中间件支持细粒度 selector 订阅，`immer` 中间件让不可变更新用可变语法书写。

### 6. 渐进式 Hint 设计

三级 hint（category → tactic → full）避免直接给出答案。每次用户点 "More Detail" 才升级到下一级。支持 AI（Google GenAI）和规则（rule-based）两种后端，AI 失败自动降级到规则。

### 7. Comlink 透明 RPC

Comlink 让 Worker 调用看起来像普通 async 函数调用。主线程 `proofWorker.startSession(...)` 实际通过 postMessage 序列化传输，返回 Promise。开发者无需手动处理消息协议。
