import type { CommunityVideo } from "@/types/civic";

export default function VideoPlayer({ video, className = "" }: { video: CommunityVideo; className?: string }) {
  if (video.videoType === "youtube" && video.youtubeId) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${video.youtubeId}`}
        title={video.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className={`w-full aspect-video ${className}`}
      />
    );
  }

  return (
    <video
      src={video.playbackUrl}
      controls
      preload="metadata"
      className={`w-full aspect-video bg-black ${className}`}
    />
  );
}
