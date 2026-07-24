import { useState, useEffect, useRef } from "react";

// mode: "once" (default, single position) | "watch" (continuous updates)
export function useGeolocation(mode = "once") {
    const [coords, setCoords] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const watchIdRef = useRef(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError("Geolocation not supported by this browser");
            setLoading(false);
            return;
        }

        const onSuccess = (position) => {
            setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
            setLoading(false);
        };
        const onError = (err) => {
            setError(err.message);
            setLoading(false);
        };

        if (mode === "watch") {
            watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
                enableHighAccuracy: true,
                maximumAge: 10000,
            });
        } else {
            navigator.geolocation.getCurrentPosition(onSuccess, onError);
        }

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [mode]);

    return { coords, error, loading };
}