export function Notice({
  type = "info",
  children,
}: {
  type?: "info" | "error";
  children: React.ReactNode;
}) {
  return (
    <p
      className={`form-notice form-notice-${type}`}
      role={type === "error" ? "alert" : "status"}
    >
      {children}
    </p>
  );
}
