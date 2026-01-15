'use client';

import { useState } from 'react';

interface EventImageProps {
    src: string;
    alt: string;
}

export default function EventImage({ src, alt }: EventImageProps) {
    const [hasError, setHasError] = useState(false);

    if (hasError || !src) {
        return null;
    }

    return (
        <div style={{ marginBottom: '1rem', overflow: 'hidden' }}>
            <img
                src={src}
                alt={alt}
                style={{ width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'cover' }}
                onError={() => setHasError(true)}
            />
        </div>
    );
}
