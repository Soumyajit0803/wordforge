"use client";
import Link from "next/link";

const AppButton = ({
  onClick,
  text,
  startIcon,
  routeURL,
  fixWidth=false,
  variant='normal',
  styles
}: {
  onClick?: () => void;
  text: string;
  startIcon?: React.ReactNode;
  routeURL?: string;
  fixWidth?: boolean;
  variant?: "primary" | "danger" | "normal";
  styles?: React.CSSProperties;
}) => {
  const bgcol = variant === "danger" ? "#EA4335" : variant === "primary" ? "var(--blue)" : "transparent";
  if(!routeURL)return (
    <button
      onClick={onClick}
      style={{
        color: variant !== "normal" ? "#fff" : "var(--foreground)",
        background: bgcol,
        border: variant==='normal'?"1px double var(--foreground)":"none",
        padding: "1rem",
        fontSize: "1rem",
        fontWeight: "bold",
        cursor: "pointer",
        width: fixWidth?"min-content":"100%",
        whiteSpace: "nowrap",
        textTransform: "uppercase",
        textDecoration: "none",
        transition: "background-color 0.2s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem"
      }}
    >
      {startIcon}
      {text}
    </button>
  );
  else return (
    <Link
      href={routeURL}
      style={{
        color: variant !== "normal" ? "#fff" : "var(--foreground)",
        background: bgcol,
        border: variant==='normal'?"1px double var(--foreground)":"none",
        padding: "1rem",
        fontSize: "1rem",
        fontWeight: "bold",
        cursor: "pointer",
        width: fixWidth ? "min-content" : "100%",
        whiteSpace: "nowrap",
        textTransform: "uppercase",
        textDecoration: "none",
        transition: "background-color 0.2s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        ...styles
      }}
    >
      {startIcon}
      {text}
    </Link>
  )
};

export default AppButton;
