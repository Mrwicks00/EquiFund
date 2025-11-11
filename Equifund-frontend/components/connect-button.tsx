"use client"

type ConnectButtonProps = {
  className?: string
}

export default function ConnectButton({ className }: ConnectButtonProps) {
  return <appkit-button class={className} />
}
