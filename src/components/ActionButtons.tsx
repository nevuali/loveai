import { FileIcon, PackageSearch, TestTube, Users, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActionButtonsProps {
  onSend: (message: string) => void;
  className?: string;
}

const ActionButtons = ({ onSend, className = "" }: ActionButtonsProps) => {
  const actionList = [
    {
      icon: PackageSearch,
      label: 'Create Holiday Package',
      onClick: () => onSend('Create Holiday Package')
    },
    {
      icon: FileIcon,
      label: 'Find Our Most Suitable Holiday',
      onClick: () => onSend('Find Our Most Suitable Holiday')
    },
    {
      icon: TestTube,
      label: 'Which Honeymoon Couple Are You Test',
      onClick: () => onSend('Which Honeymoon Couple Are You Test')
    },
    {
      icon: Users,
      label: 'Family-Specific Holiday',
      onClick: () => onSend('Family-Specific Holiday')
    },
    {
      icon: HelpCircle,
      label: 'Give Me Advice',
      onClick: () => onSend('Give Me Advice')
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className={`w-full grid grid-cols-1 md:grid-cols-2 gap-3 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {actionList.map((action, i) => (
        <motion.button
          key={i}
          className="flex items-center gap-2 p-4 rounded-xl border border-cappalove-border bg-white hover:bg-cappalove-hover/30 transition-colors"
          variants={itemVariants}
          whileHover={{ scale: 1.03, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
          whileTap={{ scale: 0.98 }}
          onClick={action.onClick}
        >
          <action.icon className="h-5 w-5 text-cappalove-blue" />
          <span>{action.label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
};

export default ActionButtons;
