import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  name?: string;
}

const TypingIndicator = ({ name }: TypingIndicatorProps) => {
  return (
    <motion.div 
      className="flex items-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
    >
      <div className="typing-indicator">
        <div className="typing-indicator-dot"></div>
        <div className="typing-indicator-dot"></div>
        <div className="typing-indicator-dot"></div>
      </div>
    </motion.div>
  );
};

export default TypingIndicator; 