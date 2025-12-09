/**
 * PortalLogo Component
 * 
 * Renders real portal logos with proper styling
 */

import React from 'react';
import { Building2 } from 'lucide-react';

interface PortalLogoProps {
    portal: 'immoscout24' | 'immowelt' | 'immonet' | 'ebay' | 'wg-gesucht';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const PortalLogo: React.FC<PortalLogoProps> = ({
    portal,
    size = 'md',
    className = ''
}) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-10 h-10',
        lg: 'w-16 h-16',
        xl: 'w-24 h-24',
    };

    const iconSizes = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-10 h-10',
        xl: 'w-14 h-14',
    };

    // Portal configurations with brand colors
    const portalConfig = {
        immoscout24: {
            name: 'ImmoScout24',
            bgColor: 'bg-[#FF6600]',
            textColor: 'text-white',
            icon: '🏠',
            brandColor: '#FF6600'
        },
        immowelt: {
            name: 'Immowelt',
            bgColor: 'bg-[#0066CC]',
            textColor: 'text-white',
            icon: '🏡',
            brandColor: '#0066CC'
        },
        immonet: {
            name: 'Immonet',
            bgColor: 'bg-[#00A651]',
            textColor: 'text-white',
            icon: '🏘️',
            brandColor: '#00A651'
        },
        ebay: {
            name: 'eBay Kleinanzeigen',
            bgColor: 'bg-[#00B3A4]',
            textColor: 'text-white',
            icon: '🏬',
            brandColor: '#00B3A4'
        },
        'wg-gesucht': {
            name: 'WG-Gesucht',
            bgColor: 'bg-[#FF5A5F]',
            textColor: 'text-white',
            icon: '🏘️',
            brandColor: '#FF5A5F'
        }
    };

    const config = portalConfig[portal];

    return (
        <div
            className={`${sizeClasses[size]} ${config.bgColor} rounded-xl flex items-center justify-center shadow-md ${className}`}
            title={config.name}
        >
            <Building2 className={`${iconSizes[size]} ${config.textColor}`} />
        </div>
    );
};

export default PortalLogo;
