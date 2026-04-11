"use client";
import Link from "next/link";

const AppButton = ({
  onClick,
  text,
  startIcon,
  routeURL,
}: {
  onClick?: () => void;
  text: string;
  startIcon?: React.ReactNode;
  routeURL?: string;
}) => {
  if(!routeURL)return (
    <button
      onClick={onClick}
      style={{
        color: "var(--foreground)",
        background: "transparent",
        border: "1px double var(--foreground)",
        padding: "1rem",
        fontSize: "1rem",
        fontWeight: "bold",
        cursor: "pointer",
        width: "100%",
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
        color: "var(--foreground)",
        background: "transparent",
        border: "1px double var(--foreground)",
        padding: "1rem",
        fontSize: "1rem",
        fontWeight: "bold",
        cursor: "pointer",
        width: "min(100%, 20ch)",
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
    </Link>
  )
};

export default AppButton;
