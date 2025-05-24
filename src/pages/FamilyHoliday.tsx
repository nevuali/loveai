import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const FamilyHoliday = () => {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen flex-col items-center justify-center px-4 bg-white">
      <div className="rounded-2xl bg-white/90 backdrop-blur-lg border border-gray-200 p-10 shadow-2xl shadow-gray-300/50 max-w-md w-full text-center transition-all duration-300 hover:shadow-xl">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-cappalove-gold/30 p-3">
            <FileText className="h-10 w-10 text-cappalove-gold" />
          </div>
        </div>
        <h1 className="font-serif text-3xl font-semibold text-gray-800 mb-4">Family-Specific Holiday</h1>
        <p className="text-gray-700 mb-8">
          Our family holiday planning tool is currently in development. Soon you'll be able to create the perfect family getaway.
        </p>
        <button onClick={() => navigate('/')} className="mt-6 px-8 py-3 rounded-full bg-cappalove-gold text-white font-semibold text-lg shadow-lg hover:bg-cappalove-peach transition-all duration-300 hover:scale-105">Return to Homepage</button>
      </div>
    </div>
  );
};

export default FamilyHoliday;
