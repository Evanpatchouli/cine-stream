export default function USpan({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        color: "#cccccc",
        fontSize: "0.875rem",
        lineHeight: "1.25rem",
        fontWeight: 400,
      }}
    >
      {children}
    </span>
  );
}
