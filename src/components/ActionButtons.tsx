import { MessageSquare, MapPin, Heart, Zap } from 'lucide-react';

interface ActionButtonsProps {
  onSend: (message: string) => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onSend }) => {
  const buttons = [
    {
      icon: MessageSquare,
      label: "Plan Trip",
      description: "AI-powered honeymoon planning",
      message: "I want to plan my perfect honeymoon. Can you help me?",
      gradient: "from-purple-500 to-blue-500"
    },
    {
      icon: MapPin,
      label: "Destinations", 
      description: "Explore romantic locations",
      message: "Show me the best honeymoon destinations you offer.",
      gradient: "from-pink-500 to-purple-500"
    },
    {
      icon: Heart,
      label: "Packages",
      description: "Curated honeymoon experiences",
      message: "What honeymoon packages do you have available?",
      gradient: "from-red-500 to-pink-500"
    },
    {
      icon: Zap,
      label: "Quick Match",
      description: "Instant recommendations",
      message: "Help me find the perfect honeymoon package quickly.",
      gradient: "from-yellow-500 to-orange-500"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {buttons.map((button, index) => {
        const Icon = button.icon;
        return (
          <button
            key={index}
            onClick={() => onSend(button.message)}
            className="group relative glass-card rounded-2xl p-6 text-center transition-all duration-300 hover:glass-elevated hover:-translate-y-1 border border-white/10 hover:border-white/20"
          >
            {/* Background gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${button.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`} />
            
            <div className="relative z-10 flex flex-col items-center gap-3">
              {/* Icon container */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${button.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              
              {/* Text content */}
              <div className="space-y-1">
                <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                  {button.label}
                </h3>
                <p className="text-xs text-white/60 group-hover:text-white/80 transition-colors leading-relaxed">
                  {button.description}
                </p>
              </div>
            </div>
            
            {/* Hover effect overlay */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="absolute inset-0 rounded-2xl border border-purple-400/20" />
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ActionButtons;
