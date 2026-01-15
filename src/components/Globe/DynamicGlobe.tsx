'use client';

import dynamic from 'next/dynamic';

const Globe = dynamic(() => import('./Globe'), {
    ssr: false,
    loading: () => (
        <div style={{
            width: '100%',
            height: '100%',
            background: '#050508'
        }} />
    )
});

export default function DynamicGlobe(props: any) {
    return <Globe {...props} />;
}
