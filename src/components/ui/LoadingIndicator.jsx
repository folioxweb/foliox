export default function LoadingIndicator({ loading }) {

  if (!loading) return null;

  return (
    <span className="relative flex h-3 w-3">

      <span
        className="
          absolute
          inline-flex
          h-full
          w-full
          rounded-full
          bg-sky-400
          opacity-60
          animate-ping
        "
      />

      <span
        className="
          relative
          inline-flex
          h-3
          w-3
          rounded-full
          bg-sky-500
        "
      />

    </span>
  );

}