interface SpinnerProps {
  size?: number
}

export default function Spinner({ size = 36 }: SpinnerProps) {
  return (
    <div
      className="spinner"
      style={{ width: size, height: size }}
    />
  )
}
