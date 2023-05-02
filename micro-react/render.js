function createDom(fiber) {
  // 创建元素节点
  const dom = fiber.type === 'TEXT_ELEMENT' ? document.createTextNode(fiber.props.nodeValue) : document.createElement(fiber.type)

  // 添加属性
  const isProperty = (key) => key !== 'children'

  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach((name) => {
      if (fiber.type === 'TEXT_ELEMENT') {
        dom[name] = fiber.props[name]
      } else {
        dom.setAttribute(name, fiber.props[name])
      }
    })
  return dom
}

function render(element, container) {
  // 主要作用是创建第一个fiber
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    sibiling: null,
    child: null,
    parent: null,
  }
  nextUnitOfWork = wipRoot
}

// 下一个工作的任务
let nextUnitOfWork = null

let wipRoot = null

function commitRoot() {
  commitWork(wipRoot.child)
  wipRoot = null
}
function commitWork(fiber) {
  if (!fiber) {
    return
  }
  const domParent = fiber.parent.dom
  domParent.appendChild(fiber.dom)
  commitWork(fiber.child)
  commitWork(fiber.sibiling)
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
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

  // 给children 新建fiber
  const filber = createNewFiber(fiber)

  return filber
}

function createNewFiber(fiber) {
  const element = fiber.props.children

  let prevSibling = null

  // 建立fiber之间的联系，构建Fiber Tree
  for (let i = 0; i < element.length; i++) {
    const newFiber = {
      type: element[i].type,
      props: element[i].props,
      parent: fiber,
      dom: null, // 孩子一开始是没有dom的，只有根元素才有，所以执行任务一开始就要创建dom
      child: null,
      sibiling: null,
    }

    // 如果是第一个，
    if (i === 0) {
      // 你就是儿子
      fiber.child = newFiber
    } else {
      // 你就是兄弟
      prevSibling.sibiling = newFiber
    }

    // 原来的儿子变成兄弟
    prevSibling = newFiber
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

export default render

// 这里有问题，如果递🐢任务太多，会阻塞主线程
// function render(element, container) {
//   // 创建元素节点
//   const dom = element.type === 'TEXT_ELEMENT' ? document.createTextNode(element.props.nodeValue) : document.createElement(element.type)

//   // 如果还有子元素 ，继续递🐢
//   if (element.props.children) {
//     element.props.children.forEach((child) => render(child, dom))
//   }

//   // 添加属性
//   const isProperty = (key) => key !== 'children'

//   Object.keys(element.props)
//     .filter(isProperty)
//     .forEach((name) => {
//       if (element.type === 'TEXT_ELEMENT') {
//         dom[name] = element.props[name]
//       } else {
//         dom.setAttribute(name, element.props[name])
//       }
//     })

//   // 追加到父容器中
//   container.append(dom)
// }
