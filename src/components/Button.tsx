import { type JSXElement } from 'solid-js'

type Props = {
  class?: string
  onClick?: () => void
  variant?: 'contained' | 'outlined'
  children: JSXElement
}

export default function Button(props) {
  return (
    <button
      onClick={() => props.onClick?.()}
      class={props.class}
      classList={{
        'rounded-xl p-2': true,
        'bg-green-500 text-white': props.variant !== 'outlined',
        'border border-green-500 text-green-500': props.variant === 'outlined',
      }}
    >
      {props.children}
    </button>
  )
}