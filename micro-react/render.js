const isProperty = (key) => key !== 'children'

function createDom(fiber) {
  // 创建元素节点
  const dom = fiber.type === 'TEXT_ELEMENT' ? document.createTextNode(fiber.props.nodeValue) : document.createElement(fiber.type)
  // 添加属性

  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach((name) => {
      if (name === 'class') {
        dom.setAttribute(name, fiber.props[name])
      } else {
        dom[name] = fiber.props[name]
      }
    })
  return dom
}

function render(element, container) {
  deletions = []
  // 主要作用是创建第一个fiber
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    sibiling: null,
    child: null,
    parent: null,
    alternate: currentRoot, // 上一个fiber
  }
  nextUnitOfWork = wipRoot
}

// 下一个工作的任务
let nextUnitOfWork = null
//  用于判断是否渲染完成
let wipRoot = null
let currentRoot = null
let deletions = null // 删除的fiber

function commitRoot() {
  deletions.forEach(commitWork)
  commitWork(wipRoot.child)

  currentRoot = wipRoot
  wipRoot = null
}

function commitWork(fiber) {
  if (!fiber) {
    return
  }
  // 对于函数式组件，他没有自己的dom，所以要找到他的父级dom
  let domParentFiber = fiber.parent
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }

  const domParent = domParentFiber.dom
  if (fiber.effectTag === 'PLACEMENT' && fiber.dom != null) {
    domParent.appendChild(fiber.dom)
  } else if (fiber.effectTag === 'DELETION') {
    commitDeletion(fiber, domParent)
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props)
  }

  commitWork(fiber.child)
  commitWork(fiber.sibiling)
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber.child, domParent)
  }
}

function updateDom(dom, prevProps, nextProps) {
  const isNew = (key) => prevProps[key] !== nextProps[key]

  const isGone = (key) => !(key in nextProps)
  const isExist = (key) => !(key in prevProps)
  const isEvent = (key) => key.startsWith('on')

  // 删除旧的属性
  Object.keys(prevProps)
    .filter((key) => isProperty(key) && !isEvent(key))
    .filter(isGone)
    .forEach((key) => {
      dom[key] = ''
    })

  // 添加新的属性
  Object.keys(nextProps)
    .filter((key) => isProperty(key) && !isEvent(key))
    .filter((key) => isExist(key) || isNew(key))
    .forEach((key) => {
      dom[key] = nextProps[key]
    })

  // 删除已经没有的事件处理函数
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => isGone(key) || isNew(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      dom.removeEventListener(eventType, prevProps[name])
    })

  // 添加新的事件处理函数
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew)
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      dom.addEventListener(eventType, nextProps[name])
    })
}

// 调度函数
function workLoop(deadLine) {
  // 是否停止
  let shouldYield = false

  // 有工作，不应该退出
  // 与栈式递🐢不同，这里每个任务执行完都判断一下是否有剩余时间
  while (nextUnitOfWork && !shouldYield) {
    // 完成了任务，又返回了新任务
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    // 如果当前帧剩余时间不足1ms，就停止
    shouldYield = deadLine.timeRemaining() < 1
  }

  // 告诉浏览器，空闲的时候，再次调用
  // 异步函数，不会阻塞主线程
  requestIdleCallback(workLoop)

  // Commit 阶段 -> 实现异步渲染，同步提交
  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }
}

requestIdleCallback(workLoop)

// 执行任务
function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function

  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }

  // 返回下一个任务
  // 如果有孩子，就返回孩子
  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  while (nextFiber) {
    // 没有孩子就返回兄弟
    if (nextFiber.sibiling) {
      return nextFiber.sibiling
    }
    // 没有兄弟，返回父亲的兄弟
    nextFiber = nextFiber.parent
  }
}

// 处理非函数组件
function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  const elements = fiber.props.children
  // diff 算法，创建、删除、更新fiber
  reconcileChildren(fiber, elements)
}

// 处理函数组件
function updateFunctionComponent(fiber) {
  const children = [fiber.type(fiber.props)]

  reconcileChildren(fiber, children)
}

// diff算法
function reconcileChildren(wipFiber, elements) {
  let index = 0
  // 如果有上一次的fiber，返回他的child
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child
  // 存放兄弟，用于构建链表
  let prevSibling = null

  while (index < elements.length || oldFiber != null) {
    const element = elements[index]
    const sameType = oldFiber && element && element.type === oldFiber.type

    let newFiber = null // 新的fiber

    if (sameType) {
      // 更新 , 复用节点, 只更新属性
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: 'UPDATE',
      }
    }

    if (element && !sameType) {
      // 添加
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null, // 因为是新建的，所以没有老节点
        effectTag: 'PLACEMENT',
      }
    }

    if (oldFiber && !sameType) {
      // 删除
      oldFiber.effectTag = 'DELETION'
      deletions.push(oldFiber)
    }

    if (oldFiber) {
      //获取兄弟
      oldFiber = oldFiber.sibiling
    }

    // 如果是第一个，
    if (index === 0) {
      // 你就是儿子
      wipFiber.child = newFiber
    } else {
      // 你就是兄弟
      prevSibling.sibiling = newFiber
    }

    // 原来的儿子变成兄弟
    prevSibling = newFiber

    index++
  }
}

export default render
