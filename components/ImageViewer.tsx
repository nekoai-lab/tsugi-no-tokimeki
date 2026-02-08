"use client";

import { X } from 'lucide-react';

interface ImageViewerProps {
    imageUrl: string;
    caption?: string;
    onClose: () => void;
}

export default function ImageViewer({ imageUrl, caption, onClose }: ImageViewerProps) {
    return (
        <div
            className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white z-10"
            >
                <X className="w-6 h-6" />
            </button>

            <img
                src={imageUrl}
                alt={caption || ''}
                className="max-w-full max-h-full object-contain p-4"
                onClick={(e) => e.stopPropagation()}
            />

            {caption && (
                <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-white text-sm text-center">{caption}</p>
                </div>
            )}
        </div>
    );
}
