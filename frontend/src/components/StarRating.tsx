// src/components/StarRating.tsx
import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';

interface StarRatingProps {
    rating: number; // 1~5 사이의 평점
    size?: 'sm' | 'md' | 'lg'; // 별 크기 옵션
}

const StarRating: React.FC<StarRatingProps> = ({ rating, size = 'md' }) => {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
    };

    return (
        <div className="flex items-center">
            {[...Array(5)].map((_, index) => (
                <StarIcon
                    key={index}
                    className={`${sizeClasses[size]} ${
                        index < rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                />
            ))}
        </div>
    );
};

export default StarRating;