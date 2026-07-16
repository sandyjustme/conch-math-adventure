interface Props {
  size?: number;
  className?: string;
}

export default function Mascot({ size = 40, className = "" }: Props) {
  return (
    <img
      src="/mascot.png"
      alt="海小喵，数学探险的伙伴"
      width={size}
      height={size}
      className={`inline-block ${className}`}
      style={{ objectFit: "contain" }}
    />
  );
}
