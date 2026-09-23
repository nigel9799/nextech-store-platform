export function MessengerIcon({ size = 17 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="messenger-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        fill="currentColor"
        d="M12 2C6.37 2 2 6.13 2 11.7c0 2.91 1.19 5.42 3.13 7.16V22l2.86-1.57c1.22.34 2.57.52 4.01.52 5.63 0 10-4.13 10-9.7S17.63 2 12 2Zm1.03 13.06-2.55-2.72-4.98 2.72 5.48-5.82 2.6 2.72 4.93-2.72-5.48 5.82Z"
      />
    </svg>
  );
}
