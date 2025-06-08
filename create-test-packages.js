const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = {
  "type": "service_account",
  "project_id": "ailovve",
  "private_key_id": "your_private_key_id",
  "private_key": "your_private_key",
  "client_email": "your_client_email",
  "client_id": "your_client_id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
};

// Use environment variables or development config
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: 'ailovve'
    });
  } catch (error) {
    console.log('Using web config for development...');
    // For development, we'll create packages through the web interface
  }
}

const testPackages = [
  {
    title: "Romantic Paris Getaway",
    description: "A magical 5-day romantic escape to the City of Love with luxury accommodations and intimate experiences.",
    longDescription: "Experience the romance of Paris with this carefully curated 5-day package. Stay in a boutique hotel in the heart of the city, enjoy private Seine river cruise, candlelit dinners at Michelin-starred restaurants, and visit iconic landmarks together.",
    location: "Paris",
    country: "France",
    region: "Europe",
    duration: 5,
    price: 2800,
    originalPrice: 3200,
    currency: "USD",
    category: "romantic",
    subcategory: "city",
    features: ["Luxury Hotel", "Private Tours", "Fine Dining", "River Cruise"],
    inclusions: ["5-star accommodation", "All meals", "Private transportation", "Tour guide"],
    exclusions: ["International flights", "Travel insurance", "Personal expenses"],
    highlights: ["Eiffel Tower dinner", "Louvre private tour", "Seine river cruise", "Montmartre exploration"],
    images: [
      "https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800",
      "https://images.unsplash.com/photo-1549144511-f099e773c147?w=800"
    ],
    maxGuests: 2,
    difficulty: "easy",
    tags: ["romantic", "luxury", "city", "culture", "food"],
    availability: true,
    rating: 4.8,
    reviews: 156,
    views: 2400,
    bookings: 89,
    isPromoted: true,
    status: "published"
  },
  {
    title: "Santorini Sunset Romance",
    description: "Breathtaking 7-day honeymoon package in Santorini with infinity pool suites and private sunset dinners.",
    longDescription: "Discover the magic of Santorini with this exclusive 7-day honeymoon package. Enjoy stunning caldera views, private infinity pool suites, wine tasting tours, and unforgettable sunset experiences.",
    location: "Santorini",
    country: "Greece",
    region: "Europe",
    duration: 7,
    price: 3500,
    originalPrice: 4000,
    currency: "USD",
    category: "romantic",
    subcategory: "island",
    features: ["Infinity Pool Suite", "Wine Tasting", "Sunset Dinners", "Private Beach"],
    inclusions: ["Luxury suite", "All breakfasts", "Wine tours", "Airport transfers"],
    exclusions: ["International flights", "Lunch and dinner", "Activities"],
    highlights: ["Caldera view suite", "Wine tasting tour", "Sunset dinner cruise", "Oia village tour"],
    images: [
      "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800",
      "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800"
    ],
    maxGuests: 2,
    difficulty: "easy",
    tags: ["romantic", "luxury", "island", "sunset", "wine"],
    availability: true,
    rating: 4.9,
    reviews: 203,
    views: 3100,
    bookings: 134,
    isPromoted: true,
    status: "published"
  },
  {
    title: "Bali Adventure & Romance",
    description: "10-day luxury adventure combining romantic beaches, temple visits, and exciting outdoor activities.",
    longDescription: "Experience the best of Bali with this 10-day adventure package. From romantic beach resorts to temple explorations and thrilling outdoor activities, this package offers the perfect blend of romance and adventure.",
    location: "Bali",
    country: "Indonesia",
    region: "Asia",
    duration: 10,
    price: 2200,
    originalPrice: 2600,
    currency: "USD",
    category: "adventure",
    subcategory: "tropical",
    features: ["Beach Resort", "Temple Tours", "Volcano Hiking", "Spa Treatments"],
    inclusions: ["4-star accommodation", "Daily breakfast", "Guided tours", "Spa sessions"],
    exclusions: ["International flights", "Lunch and dinner", "Personal activities"],
    highlights: ["Mount Batur sunrise hike", "Uluwatu temple sunset", "Rice terrace tour", "Traditional spa"],
    images: [
      "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=800",
      "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800"
    ],
    maxGuests: 4,
    difficulty: "moderate",
    tags: ["adventure", "tropical", "culture", "beaches", "temples"],
    availability: true,
    rating: 4.7,
    reviews: 187,
    views: 2800,
    bookings: 112,
    isPromoted: false,
    status: "published"
  },
  {
    title: "Swiss Alps Luxury Retreat",
    description: "5-day luxury mountain retreat in the Swiss Alps with skiing, spa treatments, and gourmet dining.",
    longDescription: "Escape to the breathtaking Swiss Alps for a 5-day luxury retreat. Enjoy world-class skiing, rejuvenating spa treatments, and exquisite Alpine cuisine in a stunning mountain setting.",
    location: "Zermatt",
    country: "Switzerland",
    region: "Europe",
    duration: 5,
    price: 4200,
    originalPrice: 4800,
    currency: "USD",
    category: "luxury",
    subcategory: "mountain",
    features: ["5-star Resort", "Ski Access", "Luxury Spa", "Gourmet Dining"],
    inclusions: ["Luxury accommodation", "All meals", "Ski equipment", "Spa access"],
    exclusions: ["International flights", "Ski lessons", "Personal shopping"],
    highlights: ["Matterhorn views", "Gornergrat railway", "Luxury spa", "Fine dining"],
    images: [
      "https://images.unsplash.com/photo-1551524164-687a55dd1126?w=800",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"
    ],
    maxGuests: 2,
    difficulty: "moderate",
    tags: ["luxury", "mountain", "skiing", "spa", "fine-dining"],
    availability: true,
    rating: 4.9,
    reviews: 94,
    views: 1600,
    bookings: 67,
    isPromoted: false,
    status: "published"
  }
];

console.log('📦 Test packages created for admin dashboard:');
testPackages.forEach((pkg, index) => {
  console.log(`${index + 1}. ${pkg.title} - ${pkg.location}, ${pkg.country}`);
});

console.log('\n🔥 To add these packages to Firebase:');
console.log('1. Go to admin dashboard');
console.log('2. Click "Add Package" for each one');
console.log('3. Copy the data from above');
console.log('\nOr run this in Firebase console to add them programmatically.');

module.exports = testPackages;