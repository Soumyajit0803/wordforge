"use client";
import Link from "next/link";

const AppButton = ({
  onClick,
  text,
  startIcon,
  routeURL,
  fixWidth=false,
  disabled=false,
  variant='normal',
  submitType=false,
  styles
}: {
  onClick?: () => void;
  text: string;
  startIcon?: React.ReactNode;
  routeURL?: string;
  fixWidth?: boolean;
  disabled?: boolean;
  variant?: "primary" | "danger" | "normal";
  submitType?: boolean,
  styles?: React.CSSProperties;
}) => {
  const bgcol = variant === "danger" ? "#EA4335" : variant === "primary" ? "var(--foreground)" : "transparent";
  if(!routeURL)return (
    <button
      onClick={onClick}
      disabled={disabled}
      type={submitType?"submit":"button"}
      style={{
        color: variant !== "normal" ? "#fff" : "var(--foreground)",
        opacity: disabled?0.5:1,
        background: bgcol,
        border: variant==='normal'?"1px double var(--foreground)":"none",
        padding: "1rem",
        fontSize: "1rem",
        fontWeight: "bold",
        cursor: disabled?"not-allowed":"pointer",
        width: fixWidth?"min-content":"100%",
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
        cursor: disabled?"not-allowed":"pointer",
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
