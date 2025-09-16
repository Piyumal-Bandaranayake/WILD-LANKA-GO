import React from 'react';

const ActivityEventCards = () => {
  // Sample data for activities and events
  const activities = [
    {
      id: 1,
      title: "Wildlife Safari Adventure",
      category: "Safari Tour",
      image: "https://images.unsplash.com/photo-1590650516494-0c8e4a4dd67e?w=600&h=400&auto=format&fit=crop&q=60",
      description: "Experience the thrill of encountering elephants, leopards, and more in their natural habitat."
    },
    {
      id: 2,
      title: "Bird Watching Expedition",
      category: "Birding",
      image: "https://images.unsplash.com/photo-1551085254-e96b210db58a?w=600&h=400&auto=format&fit=crop&q=60",
      description: "Discover Sri Lanka's diverse avian species with expert guides in prime locations."
    },
    {
      id: 3,
      title: "Whale & Dolphin Watching",
      category: "Marine Life",
      image: "https://images.unsplash.com/photo-1589555235390-68c0e625beac?w=600&h=400&auto=format&fit=crop&q=60",
      description: "Witness the magnificent blue whales and playful dolphins in the Indian Ocean."
    }
  ];

  const events = [
    {
      id: 1,
      title: "Annual Elephant Gathering",
      category: "Special Event",
      image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&h=400&auto=format&fit=crop&q=60",
      description: "Join us for the spectacular gathering of elephants in Minneriya National Park."
    },
    {
      id: 2,
      title: "Leopard Tracking Experience",
      category: "Wildlife Event",
      image: "https://images.unsplash.com/photo-1561739663-18a6d082d2b9?w=600&h=400&auto=format&fit=crop&q=60",
      description: "Expert-guided tracking of Sri Lanka's elusive leopards in Yala National Park."
    },
    {
      id: 3,
      title: "Turtle Conservation Program",
      category: "Conservation",
      image: "https://images.unsplash.com/photo-1583513364301-f9339bc6122c?w=600&h=400&auto=format&fit=crop&q=60",
      description: "Participate in turtle conservation efforts and witness hatchlings reaching the ocean."
    }
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
        
        * {
          font-family: 'Poppins', sans-serif;
        }
      `}</style>
      
      {/* Activities Section */}
      <section className="py-12 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center text-green-700 dark:text-green-400">Wildlife Activities</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 text-center mt-2 max-w-lg mx-auto">
            Experience the best of Sri Lankan wildlife through our expertly guided activities and adventures.
          </p>
          
          <div className="flex flex-wrap justify-center gap-8 pt-12">
            {activities.map((activity) => (
              <div key={activity.id} className="max-w-80 w-full hover:-translate-y-1 transition duration-300 bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden">
                <img className="w-full h-48 object-cover" src={activity.image} alt={activity.title} />
                <div className="p-5">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{activity.title}</h3>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">{activity.category}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">{activity.description}</p>
                  <button className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm transition-colors">
                    Learn More
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-12 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center text-green-700 dark:text-green-400">Upcoming Events</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 text-center mt-2 max-w-lg mx-auto">
            Join our special wildlife events and create unforgettable memories in nature.
          </p>
          
          <div className="flex flex-wrap justify-center gap-8 pt-12">
            {events.map((event) => (
              <div key={event.id} className="max-w-80 w-full hover:-translate-y-1 transition duration-300 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <img className="w-full h-48 object-cover" src={event.image} alt={event.title} />
                <div className="p-5">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{event.title}</h3>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">{event.category}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">{event.description}</p>
                  <div className="flex justify-between items-center mt-4">
                    <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm transition-colors">
                      Register
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400">2 weeks left</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default ActivityEventCards;