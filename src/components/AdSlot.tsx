interface AdSlotProps {
    type: 'inline' | 'sidebar' | 'footer';
    id?: string;
}

export default function AdSlot({ type, id }: AdSlotProps) {
    const className = `ad-slot ad-slot--${type}`;

    return (
        <div className={className} id={id || `ad-${type}`}>
            <span>Advertisement</span>
            {/* 
        Google AdSense or Ezoic placeholder.
        Replace with actual ad code when monetizing:
        
        <ins className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-XXXXXXXX"
          data-ad-slot="XXXXXXXX"
          data-ad-format="auto"
          data-full-width-responsive="true" />
      */}
        </div>
    );
}
