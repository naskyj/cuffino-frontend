import clsx from "clsx";

function Skeleton({ className, ...props }) {
  return (
    <div
      data-slot="skeleton"
      className={clsx("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
