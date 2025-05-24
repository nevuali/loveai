import { HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Advice = () => {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen flex-col items-center justify-center px-4 bg-white">
      <div className="rounded-2xl bg-white/90 backdrop-blur-lg border border-gray-200 p-10 shadow-2xl shadow-gray-300/50 max-w-md w-full text-center transition-all duration-300 hover:shadow-xl">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-cappalove-darkblue/20 p-3">
            <HelpCircle className="h-10 w-10 text-cappalove-darkblue" />
          </div>
        </div>
        <h1 className="font-serif text-3xl font-semibold text-gray-800 mb-4">Give Me Advice</h1>
        <p className="text-gray-700 mb-8">
          Our personalized advice system is being developed. Soon you'll receive tailored recommendations for your perfect honeymoon.
        </p>
        <button onClick={() => navigate('/')} className="mt-6 px-8 py-3 rounded-full bg-cappalove-darkblue text-white font-semibold text-lg shadow-lg hover:bg-cappalove-peach transition-all duration-300 hover:scale-105">Return to Homepage</button>
      </div>
    </div>
  );
};

export default Advice;
