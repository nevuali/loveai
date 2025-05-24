import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const FindHoliday = () => {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen flex-col items-center justify-center px-4 bg-white">
      <div className="rounded-2xl bg-white/90 backdrop-blur-lg border border-gray-200 p-10 shadow-2xl shadow-gray-300/50 max-w-md w-full text-center transition-all duration-300 hover:shadow-xl">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-cappalove-blue/30 p-3">
            <Search className="h-10 w-10 text-cappalove-blue" />
          </div>
        </div>
        <h1 className="font-serif text-3xl font-semibold text-gray-800 mb-4">Find Our Most Suitable Holiday</h1>
        <p className="text-gray-700 mb-8">
          Our honeymoon matching system is coming soon. We'll help you find the perfect destination based on your preferences.
        </p>
        <button onClick={() => navigate('/')} className="mt-6 px-8 py-3 rounded-full bg-cappalove-blue text-white font-semibold text-lg shadow-lg hover:bg-cappalove-peach transition-all duration-300 hover:scale-105">Return to Homepage</button>
      </div>
    </div>
  );
};

export default FindHoliday;
