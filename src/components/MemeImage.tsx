"use client";

export default function MemeImage({
  imageUrl,
  topText,
  bottomText,
  title,
  aspect = "aspect-[4/3]",
}: {
  imageUrl: string;
  topText: string;
  bottomText: string;
  title: string;
  aspect?: string;
}) {
  return (
    <div className={`relative w-full overflow-hidden bg-black ${aspect}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30" />
      {topText && (
        <p className="meme-text absolute left-0 right-0 top-3 px-4 text-center text-xl leading-tight text-white sm:text-2xl">
          {topText}
        </p>
      )}
      {bottomText && (
        <p className="meme-text absolute bottom-3 left-0 right-0 px-4 text-center text-xl leading-tight text-white sm:text-2xl">
          {bottomText}
        </p>
      )}
    </div>
  );
}
