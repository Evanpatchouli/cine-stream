import "./index.css";

export default function UA({ children }: { children: React.ReactNode }) {
  return (
    <a
      className="unimportant-a"
      style={{
        fontSize: "0.875rem",
        lineHeight: "1.25rem",
        fontWeight: 400,
      }}
    >
      {children}
    </a>
  );
}
