import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface ResponseTimerProps {
    seconds: number;
    isActive: boolean;
}

const ResponseTimer = ({ seconds, isActive }: ResponseTimerProps) => {
    if (!isActive || seconds <= 0) return null;

    const percentage = (seconds / 6) * 100;

    const getColor = () => {
        if (seconds > 4) return 'text-green-400';
        if (seconds > 2) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getProgressColor = () => {
        if (seconds > 4) return 'stroke-green-400';
        if (seconds > 2) return 'stroke-yellow-400';
        return 'stroke-red-400';
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mt-6 flex flex-col items-center"
        >
            {/* Circular timer */}
            <div className="relative w-24 h-24">
                {/* Background circle */}
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="48"
                        cy="48"
                        r="40"
                        className="fill-none stroke-white/10"
                        strokeWidth="6"
                    />
                    {/* Progress circle */}
                    <motion.circle
                        cx="48"
                        cy="48"
                        r="40"
                        className={`fill-none ${getProgressColor()}`}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={251.2}
                        initial={{ strokeDashoffset: 0 }}
                        animate={{ strokeDashoffset: 251.2 - (percentage / 100) * 251.2 }}
                        transition={{ duration: 0.3 }}
                    />
                </svg>

                {/* Timer text */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.span
                        key={seconds}
                        initial={{ scale: 1.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`text-3xl font-bold ${getColor()}`}
                    >
                        {seconds}
                    </motion.span>
                </div>
            </div>

            {/* Warning text for low time */}
            {seconds <= 2 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 flex items-center gap-2 text-red-400 text-sm font-medium"
                >
                    <Clock className="w-4 h-4" />
                    Speak now or question will be skipped!
                </motion.div>
            )}

            {seconds > 2 && (
                <div className="mt-3 text-white/60 text-sm">
                    Time remaining to respond
                </div>
            )}
        </motion.div>
    );
};

export default ResponseTimer;
