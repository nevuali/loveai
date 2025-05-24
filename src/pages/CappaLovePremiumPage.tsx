import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CappaLovePremiumPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col items-center justify-center px-4 bg-white">
      <div className="rounded-2xl bg-white/90 backdrop-blur-lg border border-gray-200 p-10 shadow-2xl shadow-gray-300/50 max-w-md w-full text-center transition-all duration-300 hover:shadow-xl">
        <div className="flex justify-center mb-4">
           <Heart className="h-10 w-10 text-pink-500" />
        </div>
        <h1 className="font-serif text-3xl font-semibold text-gray-800 mb-4">CappaLove Premium</h1>
        <p className="text-gray-700 mb-8">
          Unlock exclusive honeymoon packages and features with CappaLove Premium. Coming soon!
        </p>
        <button onClick={() => navigate('/')} className="mt-6 px-8 py-3 rounded-full bg-pink-500 text-white font-semibold text-lg shadow-lg hover:bg-pink-600 transition-all duration-300 hover:scale-105">Return to Homepage</button>
      </div>
    </div>
  );
};

export default CappaLovePremiumPage; 