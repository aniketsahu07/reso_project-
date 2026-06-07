import { useState } from 'react';

export function Avatar({ src, name, size = 9 }: {
  src?: string;
  name?: string;
  size?: number;
}) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const [imgError, setImgError] = useState(false);

  if (!src || imgError) {
    return (
      <div className={`w-${size} h-${size} rounded-full bg-indigo-700 flex items-center justify-center text-white font-bold text-sm`}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={`w-${size} h-${size} rounded-full object-cover`}
      onError={() => setImgError(true)}
    />
  );
}
