import { Heart, User } from "lucide-react";

type MessageAvatarProps = {
  isAssistant: boolean;
};

const MessageAvatar = ({ isAssistant }: MessageAvatarProps) => {
  return (
    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
      isAssistant 
        ? 'bg-gradient-to-r from-ailovve-peach to-ailovve-blue'
        : 'bg-gradient-to-r from-cappalove-blue to-cappalove-darkblue'
    } shadow-sm`}>
      {isAssistant ? (
        <Heart className="h-4 w-4 text-white" />
      ) : (
        <User className="h-4 w-4 text-white" />
      )}
    </div>
  );
};

export default MessageAvatar;
