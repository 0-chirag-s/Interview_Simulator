import { motion } from 'framer-motion';

type BotStatus = 'idle' | 'speaking' | 'listening' | 'processing' | 'waiting';

interface BotAvatarProps {
    status: BotStatus;
}

const BotAvatar = ({ status }: BotAvatarProps) => {
    const getStatusColor = () => {
        switch (status) {
            case 'speaking':
                return 'from-indigo-500 to-purple-500';
            case 'listening':
                return 'from-red-500 to-pink-500';
            case 'processing':
                return 'from-yellow-500 to-orange-500';
            case 'waiting':
                return 'from-green-500 to-teal-500';
            default:
                return 'from-gray-500 to-gray-600';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'speaking':
                return 'Speaking...';
            case 'listening':
                return 'Listening...';
            case 'processing':
                return 'Processing...';
            case 'waiting':
                return 'Your turn to speak';
            default:
                return 'Ready';
        }
    };

    return (
        <div className="flex flex-col items-center">
            {/* Avatar Container */}
            <div className="relative">
                {/* Outer glow ring */}
                <motion.div
                    className={`absolute inset-0 rounded-full bg-gradient-to-r ${getStatusColor()} blur-xl opacity-50`}
                    animate={{
                        scale: status === 'speaking' || status === 'listening' ? [1, 1.2, 1] : 1,
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: status === 'speaking' || status === 'listening' ? Infinity : 0,
                        ease: 'easeInOut'
                    }}
                />

                {/* Main avatar circle */}
                <motion.div
                    className={`relative w-32 h-32 rounded-full bg-gradient-to-br ${getStatusColor()} p-1 shadow-2xl`}
                    animate={{
                        scale: status === 'speaking' ? [1, 1.05, 1] : 1,
                    }}
                    transition={{
                        duration: 0.5,
                        repeat: status === 'speaking' ? Infinity : 0,
                        ease: 'easeInOut'
                    }}
                >
                    <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center overflow-hidden">
                        {/* Bot face */}
                        <div className="relative">
                            {/* Eyes */}
                            <div className="flex gap-6 mb-2">
                                <motion.div
                                    className="w-4 h-4 bg-white rounded-full"
                                    animate={{
                                        scaleY: status === 'listening' ? [1, 0.3, 1] : 1,
                                    }}
                                    transition={{
                                        duration: 0.3,
                                        repeat: status === 'listening' ? Infinity : 0,
                                        repeatDelay: 2
                                    }}
                                />
                                <motion.div
                                    className="w-4 h-4 bg-white rounded-full"
                                    animate={{
                                        scaleY: status === 'listening' ? [1, 0.3, 1] : 1,
                                    }}
                                    transition={{
                                        duration: 0.3,
                                        repeat: status === 'listening' ? Infinity : 0,
                                        repeatDelay: 2,
                                        delay: 0.1
                                    }}
                                />
                            </div>

                            {/* Mouth / Sound waves */}
                            {status === 'speaking' ? (
                                <div className="flex items-center justify-center gap-1">
                                    {[1, 2, 3, 4, 5].map((bar) => (
                                        <motion.div
                                            key={bar}
                                            className="w-1.5 bg-white rounded-full"
                                            animate={{
                                                height: [8, 16, 8],
                                            }}
                                            transition={{
                                                duration: 0.4,
                                                repeat: Infinity,
                                                delay: bar * 0.1,
                                                ease: 'easeInOut'
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : status === 'processing' ? (
                                <motion.div
                                    className="w-8 h-8 border-2 border-white border-t-transparent rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                />
                            ) : (
                                <motion.div
                                    className="w-8 h-2 bg-white rounded-full"
                                    animate={{
                                        scaleX: status === 'waiting' ? [1, 1.2, 1] : 1,
                                    }}
                                    transition={{
                                        duration: 1,
                                        repeat: status === 'waiting' ? Infinity : 0,
                                        ease: 'easeInOut'
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Status indicator dot */}
                <motion.div
                    className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-4 border-gray-900 ${status === 'speaking' ? 'bg-indigo-500' :
                            status === 'listening' ? 'bg-red-500' :
                                status === 'processing' ? 'bg-yellow-500' :
                                    status === 'waiting' ? 'bg-green-500' :
                                        'bg-gray-500'
                        }`}
                    animate={{
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                />
            </div>

            {/* Status text */}
            <motion.div
                key={status}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
            >
                <span className={`text-sm font-medium px-4 py-2 rounded-full ${status === 'speaking' ? 'bg-indigo-500/20 text-indigo-300' :
                        status === 'listening' ? 'bg-red-500/20 text-red-300' :
                            status === 'processing' ? 'bg-yellow-500/20 text-yellow-300' :
                                status === 'waiting' ? 'bg-green-500/20 text-green-300' :
                                    'bg-gray-500/20 text-gray-300'
                    }`}>
                    {getStatusText()}
                </span>
            </motion.div>
        </div>
    );
};

export default BotAvatar;
