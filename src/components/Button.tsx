import { type JSXElement } from 'solid-js'

type Props = {
  class?: string
  onClick?: () => void
  variant?: 'contained' | 'outlined'
  children: JSXElement
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

export default function Button(props: Props) {
  return (
    <button
      type={props.type || 'button'}
      onClick={() => props.onClick?.()}
      disabled={props.disabled}
      class={props.class}
      classList={{
        'rounded-xl p-2': true,
        'bg-green-500 text-white hover:bg-green-600': props.variant !== 'outlined' && !props.disabled,
        'bg-green-300 text-white cursor-not-allowed': props.variant !== 'outlined' && props.disabled,
        'border border-green-500 text-green-500 hover:bg-green-50': props.variant === 'outlined' && !props.disabled,
        'border border-green-300 text-green-300 cursor-not-allowed': props.variant === 'outlined' && props.disabled,
      }}
    >
      {props.children}
    </button>
  )
}