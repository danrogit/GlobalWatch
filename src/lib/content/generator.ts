import { AggregatedEvent } from '../gdelt/types';

/**
 * Format date for display
 */
export function formatDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Format date and time for display
 */
export function formatDateTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Get relative time string
 */
export function getRelativeTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

/**
 * Extract domain from URL for display
 */
export function extractDomain(url: string): string {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch {
        return url.substring(0, 40);
    }
}

/**
 * Generate meta description for event page
 */
export function generateMetaDescription(event: AggregatedEvent): string {
    const confidenceText = event.confidence === 'confirmed'
        ? 'Verified'
        : event.confidence === 'reported'
            ? 'Reported'
            : 'Unverified';

    return `${confidenceText}: ${event.eventType} in ${event.city}, ${event.country}. ` +
        `${event.eventCount} report${event.eventCount !== 1 ? 's' : ''} ` +
        `detected since ${formatDate(event.firstSeen)}. View sources and verification status.`;
}

/**
 * Generate page title for event page
 */
export function generatePageTitle(event: AggregatedEvent): string {
    return `${event.eventType} in ${event.city}, ${event.countryCode} | GlobalWatch`;
}
