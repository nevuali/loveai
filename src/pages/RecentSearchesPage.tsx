import { MapPin, Sparkles, ShoppingBag, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RecentSearchesPage = () => {
  const navigate = useNavigate();

  const recentSearches = [
    { title: "Romantic Beach Destinations", icon: MapPin },
    { title: "All-Inclusive Packages", icon: ShoppingBag },
    { title: "Special Anniversary Ideas", icon: Sparkles },
    { title: "Best Honeymoon Islands", icon: MapPin },
    { title: "Couples Spa Retreats", icon: Heart },
  ];

  return (
    <div className="flex h-screen flex-col items-center justify-center px-4 bg-white">
      <div className="rounded-2xl bg-white/90 backdrop-blur-lg border border-gray-200 p-10 shadow-2xl shadow-gray-300/50 max-w-md w-full text-center transition-all duration-300 hover:shadow-xl">
        <div className="flex justify-center mb-4">
           <MapPin className="h-10 w-10 text-cappalove-darkblue" />
        </div>
        <h1 className="font-serif text-3xl font-semibold text-gray-800 mb-4">Recent Searches</h1>
        <p className="text-gray-700 mb-8">
          This section will show your recent searches. Feature coming soon!
        </p>
        {/* Optionally list recent searches here */}
        {/* <div className="mt-4 flex flex-col gap-2 px-3 w-full">
          {recentSearches.map((item, index) => (
            <div key={index} className="sidebar-item group">
              <item.icon className="h-4 w-4 text-gray-500" />
              <span>{item.title}</span>
            </div>
          ))}
        </div> */}
        <button onClick={() => navigate('/')} className="mt-6 px-8 py-3 rounded-full bg-cappalove-darkblue text-white font-semibold text-lg shadow-lg hover:bg-cappalove-peach transition-all duration-300 hover:scale-105">Return to Homepage</button>
      </div>
    </div>
  );
};

export default RecentSearchesPage; 