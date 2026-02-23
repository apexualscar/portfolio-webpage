'use client';

interface VideoEmbedProps {
  url: string;
}

export default function VideoEmbed({ url }: VideoEmbedProps) {
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  const isVimeo = url.includes('vimeo.com');

  if (isYouTube) {
    const videoId = url.split('v=')[1] || url.split('youtu.be/')[1];
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  if (isVimeo) {
    const videoId = url.split('vimeo.com/')[1];
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        <iframe
          src={`https://player.vimeo.com/video/${videoId}`}
          title="Vimeo video player"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
      <video src={url} controls className="h-full w-full object-cover" />
    </div>
  );
}
