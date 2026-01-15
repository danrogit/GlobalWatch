'use client';

import { useState } from 'react';

interface EventImageProps {
    src: string;
    alt: string;
}

export default function EventImage({ src, alt }: EventImageProps) {
    const [hasError, setHasError] = useState(false);

    if (hasError) return null;

    return (
        <div className="event-featured-image" style={{ marginBottom: '24px', borderRadius: '12px', overflow: 'hidden' }}>
            <img
                src={src}
                alt={alt}
                style={{ width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'cover' }}
                onError={() => setHasError(true)}
            />
        </div>
    );
}
