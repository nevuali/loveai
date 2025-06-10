import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Palette } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';

interface ThemeToggleProps {
  variant?: 'button' | 'icon' | 'menu';
  className?: string;
  showLabel?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  variant = 'button', 
  className = '',
  showLabel = false 
}) => {
  const { actualTheme, toggleTheme } = useTheme();

  const themeOptions = [
    { value: 'light', label: 'Açık Tema', icon: Sun },
    { value: 'dark', label: 'Koyu Tema', icon: Moon },
  ];

  const currentTheme = themeOptions.find(theme => theme.value === actualTheme);
  const nextTheme = themeOptions.find(theme => theme.value !== actualTheme);

  if (variant === 'icon') {
    return (
      <motion.button
        onClick={toggleTheme}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          w-10 h-10 rounded-full flex items-center justify-center
          bg-gradient-to-r from-[#d4af37]/10 to-[#b8860b]/10 
          hover:from-[#d4af37]/20 hover:to-[#b8860b]/20
          border border-[#d4af37]/20 hover:border-[#d4af37]/40
          text-primary transition-all duration-300
          ${className}
        `}
        title={`${nextTheme?.label} olarak değiştir`}
      >
        <motion.div
          key={actualTheme}
          initial={{ rotate: -180, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {currentTheme?.icon && <currentTheme.icon className="w-5 h-5" />}
        </motion.div>
      </motion.button>
    );
  }

  if (variant === 'menu') {
    return (
      <Button
        onClick={toggleTheme}
        variant="ghost"
        className={`w-full justify-start gap-3 text-left hover:bg-[#d4af37]/10 ${className}`}
      >
        <div className="w-5 h-5 flex items-center justify-center">
          {currentTheme?.icon && <currentTheme.icon className="w-4 h-4" />}
        </div>
        <div className="flex-1">
          <div className="font-medium">{currentTheme?.label}</div>
          {showLabel && (
            <div className="text-xs text-secondary">
              {nextTheme?.label} olarak değiştir
            </div>
          )}
        </div>
      </Button>
    );
  }

  // Default button variant
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      <Button
        onClick={toggleTheme}
        variant="outline"
        size="sm"
        className="
          relative overflow-hidden
          bg-gradient-to-r from-white/80 to-gray-50/80 
          dark:from-gray-800/80 dark:to-gray-900/80
          border-[#d4af37]/30 hover:border-[#d4af37]/50
          text-primary hover:text-[#d4af37]
          backdrop-blur-sm
          transition-all duration-300
        "
      >
        <motion.div
          key={actualTheme}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2"
        >
          {currentTheme?.icon && <currentTheme.icon className="w-4 h-4" />}
          {showLabel && (
            <span className="text-sm font-medium">
              {currentTheme?.label}
            </span>
          )}
        </motion.div>
        
        {/* Subtle background animation */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-[#d4af37]/5 to-[#b8860b]/5"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      </Button>
    </motion.div>
  );
};

// Advanced theme selector component
export const ThemeSelector: React.FC<{ className?: string }> = ({ className }) => {
  const { actualTheme, toggleTheme } = useTheme();

  const themes = [
    { 
      value: 'light', 
      label: 'Açık', 
      icon: Sun, 
      preview: 'bg-white border-gray-200',
      description: 'Gündüz kullanım için ideal'
    },
    { 
      value: 'dark', 
      label: 'Koyu', 
      icon: Moon, 
      preview: 'bg-gray-900 border-gray-700',
      description: 'Gece kullanım için ideal' 
    },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <Palette className="w-4 h-4 text-[#d4af37]" />
        Tema Seçimi
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {themes.map((theme) => (
          <motion.button
            key={theme.value}
            onClick={toggleTheme}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              p-4 rounded-xl border transition-all duration-200
              ${actualTheme === theme.value 
                ? 'border-[#d4af37] bg-[#d4af37]/10 shadow-lg' 
                : 'border-gray-200 dark:border-gray-700 hover:border-[#d4af37]/50'
              }
            `}
          >
            <div className="flex flex-col items-center gap-3">
              {/* Theme preview */}
              <div className={`
                w-12 h-8 rounded-lg border-2 ${theme.preview}
                flex items-center justify-center
                ${actualTheme === theme.value ? 'ring-2 ring-[#d4af37]/30' : ''}
              `}>
                <theme.icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </div>
              
              {/* Theme info */}
              <div className="text-center">
                <div className="font-medium text-primary text-sm">
                  {theme.label}
                </div>
                <div className="text-xs text-secondary mt-1">
                  {theme.description}
                </div>
              </div>
              
              {/* Active indicator */}
              {actualTheme === theme.value && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2 h-2 rounded-full bg-[#d4af37]"
                />
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default ThemeToggle;