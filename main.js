import { createElement, render } from './micro-react'

const element = createElement('h1',
 { id: 'title', style: 'background:red', class: 'title' }, 'Hello World',
  createElement('span', null, 'Hello World'),
  createElement('a', {href:'https://bilibili.com'}, 'Bilibili'),
  )
const container = document.getElementById('root')

render(element, container)
