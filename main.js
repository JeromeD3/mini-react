import { createElement, render } from './micro-react'
import { useState } from './micro-react/render'
// const handleInput = (e) => {
//   renderer(e.target.value)
// }

// const renderer = (value) => {
//   const container = document.querySelector('#root')

//   const element =
//   createElement('div', { class:'container'},
//   createElement('input', { oninput: (e) => handleInput(e) }, null),
//   createElement('h1', null, value)
//   )

//   render(element, container)
// }

// renderer('hello')

// ====================================

// const App = (props) => {
//   return createElement('h1', { class: 'container' }, props.name)
// }

// const container = document.querySelector('#root')
// const element = createElement(App, { name: 'dxb' })
// render(element, container)

// ====================================

const container = document.querySelector('#root')
const Count = () => {
  const [state, setState] = useState(0)
  return createElement('button', { onclick: () => setState((pre) => pre + 1) }, state)
}

const element = createElement(Count)
render(element, container)
