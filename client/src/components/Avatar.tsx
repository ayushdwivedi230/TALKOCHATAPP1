interface AvatarProps {
  username: string;
  size?: 'sm' | 'md' | 'lg';
  online?: boolean;
}

export function Avatar({ username, size = 'md', online }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  // Generate a consistent color based on username
  const getGradient = (name: string) => {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue1 = hash % 360;
    const hue2 = (hash * 2) % 360;
    return `linear-gradient(135deg, hsl(${hue1}, 70%, 60%), hsl(${hue2}, 70%, 50%))`;
  };

  const initial = username.charAt(0).toUpperCase();

  return (
    <div className="relative inline-block">
      <div 
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white`}
        style={{ background: getGradient(username) }}
        data-testid={`avatar-${username}`}
      >
        {initial}
      </div>
      {online !== undefined && (
        <div 
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
            online ? 'bg-chart-2' : 'bg-muted-foreground'
          }`}
          data-testid={`status-${online ? 'online' : 'offline'}`}
        />
      )}
    </div>
  );
}
