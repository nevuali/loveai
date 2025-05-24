import { Heart, MapPin, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Package {
  id: number;
  name: string;
  description: string;
  price: string;
  location: string;
  duration?: string;
}

interface HoneymoonPackagesProps {
  packages: Package[];
  onPackageClick: (packageId: number) => void;
}

const HoneymoonPackages = ({ packages, onPackageClick }: HoneymoonPackagesProps) => {
  return (
    <div className="mt-12 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-serif text-gray-800 mb-2">Popular Honeymoon Packages</h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">Discover our handpicked selection of romantic getaways perfect for your dream honeymoon</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {packages.map((pkg) => (
          <div key={pkg.id} className="flex flex-col justify-between rounded-2xl shadow-lg bg-white border border-cappalove-border hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 min-h-[370px] max-h-[370px] p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm text-gray-500 truncate">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{pkg.location}</span>
              </div>
              <span className="bg-white rounded-full p-1.5 shadow flex items-center justify-center absolute top-6 right-6">
                <Heart className="h-5 w-5 text-pink-500" />
              </span>
            </div>
            <h3 className="font-serif text-lg font-semibold text-gray-900 mb-2 line-clamp-2 break-words overflow-hidden min-h-[48px]">{pkg.name}</h3>
            <p className="text-gray-700 text-base leading-relaxed line-clamp-3 break-words overflow-hidden mb-4 min-h-[66px]">{pkg.description}</p>
            <div className="flex items-center text-xs text-gray-500 mb-6 truncate">
              <Calendar className="h-4 w-4 mr-1 text-cappalove-darkblue flex-shrink-0" />
              <span className="truncate">{pkg.duration || "7-10 days"}</span>
            </div>
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 flex-col sm:flex-row gap-2 sm:gap-0 min-h-[56px]">
              <div className="font-serif font-bold text-xl text-cappalove-darkblue truncate w-full sm:w-auto text-left">{pkg.price}</div>
              <Button 
                className="love-gradient-button gap-1 px-5 py-2 rounded-full text-base whitespace-nowrap truncate w-full sm:w-auto"
                size="sm"
                onClick={() => onPackageClick(pkg.id)}
              >
                <span className="truncate">View Details</span>
                <ArrowRight className="h-4 w-4 flex-shrink-0" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HoneymoonPackages;
