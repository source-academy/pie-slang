import React, { useState, useCallback, useEffect } from 'react';

interface UseResizableProps {
    initialWidth?: number; // percentage
    minWidth?: number;
    maxWidth?: number;
}

export function useResizable({ initialWidth = 50, minWidth = 20, maxWidth = 80 }: UseResizableProps) {
    const [leftWidth, setLeftWidth] = useState(initialWidth);
    const [isDragging, setIsDragging] = useState(false);

    const startDragging = useCallback(() => {
        setIsDragging(true);
    }, []);

    const stopDragging = useCallback(() => {
        setIsDragging(false);
    }, []);

    const onDrag = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        const newWidth = (e.clientX / window.innerWidth) * 100;
        if (newWidth >= minWidth && newWidth <= maxWidth) {
            setLeftWidth(newWidth);
        }
    }, [isDragging, minWidth, maxWidth]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', onDrag);
            window.addEventListener('mouseup', stopDragging);
        } else {
            window.removeEventListener('mousemove', onDrag);
            window.removeEventListener('mouseup', stopDragging);
        }
        return () => {
            window.removeEventListener('mousemove', onDrag);
            window.removeEventListener('mouseup', stopDragging);
        };
    }, [isDragging, onDrag, stopDragging]);

    return { leftWidth, startDragging, isDragging };
}
