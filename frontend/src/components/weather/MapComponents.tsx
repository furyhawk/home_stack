import { useEffect } from "react";
import { useMap } from "react-leaflet";

// Component to handle map invalidation when tab becomes visible
export function MapInvalidator() {
    const map = useMap();

    useEffect(() => {
        // Invalidate size after mount and on window resize
        const timer = setTimeout(() => map.invalidateSize(), 100);
        const handleResize = () => map.invalidateSize();
        window.addEventListener('resize', handleResize);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', handleResize);
        };
    }, [map]);

    return null;
}

// Component to center map when center prop changes
export const MapCenter = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
};
