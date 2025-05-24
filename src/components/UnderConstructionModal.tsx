
import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UnderConstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
}

const UnderConstructionModal = ({ 
  isOpen, 
  onClose, 
  title,
  message = "This section is currently under construction. Please check back later!"
}: UnderConstructionModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-panel">
        <DialogHeader>
          <DialogTitle className="text-center font-serif text-xl">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-4">
          <div className="rounded-full bg-cappalove-peach/30 p-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-cappalove-gold" />
          </div>
          <p className="text-center text-gray-700 mb-4">
            {message}
          </p>
          <div className="h-2 w-24 bg-gradient-to-r from-cappalove-peach to-cappalove-blue rounded-full mb-4"></div>
          <Button 
            onClick={onClose}
            className="bg-gradient-to-r from-cappalove-peach to-cappalove-blue hover:from-cappalove-blue hover:to-cappalove-peach text-gray-800"
          >
            Return to Homepage
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UnderConstructionModal;
