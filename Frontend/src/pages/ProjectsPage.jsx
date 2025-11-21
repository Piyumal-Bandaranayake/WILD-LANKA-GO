import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/footer';

const ProjectsPage = () => {
  const [selectedProject, setSelectedProject] = useState(null);

  const categories = [
    { id: 'all', name: 'All Projects', icon: '🌍' },
    { id: 'wildlife', name: 'Wildlife Conservation', icon: '🦁' },
    { id: 'community', name: 'Community Impact', icon: '👥' }
  ];

  const projects = [
    {
      id: 1,
      title: "Elephant Corridor Protection",
      category: "wildlife",
      description: "Creating safe passage routes for elephants between national parks to prevent human-elephant conflicts.",
      image: "https://africageographic.com/wp-content/uploads/2016/10/elephant-crossing-at-wildlife-corridor.jpg",
      funding: { raised: 450000, goal: 600000 },
      status: "active",
      impact: "Protected 15 elephant families and reduced conflicts by 40%",
      location: "Yala National Park",
      duration: "18 months",
      beneficiaries: "500+ local families",
      features: ["GPS tracking collars", "Community training", "Fence maintenance", "Emergency response team"]
    },
    {
      id: 2,
      title: "Marine Turtle Conservation",
      category: "wildlife",
      description: "Protecting nesting beaches and monitoring sea turtle populations along Sri Lanka's coastline.",
      image: "https://hub.holidayexecutives.com/app/uploads/2021/06/LK-TUR1-1024x683.jpg",
      funding: { raised: 320000, goal: 500000 },
      status: "active",
      impact: "Successfully hatched 2,500+ turtle eggs and released 1,800+ hatchlings",
      location: "Rekawa Beach",
      duration: "12 months",
      beneficiaries: "3,000+ turtles annually",
      features: ["Beach monitoring", "Nest protection", "Community patrols", "Research equipment"]
    },
    {
      id: 3,
      title: "Community Wildlife Education",
      category: "community",
      description: "Training local communities in wildlife conservation practices and sustainable living.",
      image: "https://c.pxhere.com/photos/4d/70/snake_python_children_meeting_touching_learning_wild_ranger-898118.jpg!d",
      funding: { raised: 180000, goal: 250000 },
      status: "active",
      impact: "Educated 2,000+ community members and established 15 conservation clubs",
      location: "Multiple villages",
      duration: "8 months",
      beneficiaries: "5,000+ community members",
      features: ["Workshop materials", "Training sessions", "Educational resources", "Community outreach"]
    },
    {
      id: 4,
      title: "Leopard Rescue Network",
      category: "wildlife",
      description: "Emergency response system for injured or displaced leopards across Sri Lanka.",
      image: "https://images.unsplash.com/photo-1591883032503-69a1e001bf50?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8TGVvcGFyZCUyMFJlc2N1ZSUyME5ldHdvcmt8ZW58MHx8MHx8fDA%3D",
      funding: { raised: 280000, goal: 400000 },
      status: "active",
      impact: "Rescued 25 leopards and rehabilitated 18 back to the wild",
      location: "Central Highlands",
      duration: "10 months",
      beneficiaries: "30+ leopards",
      features: ["Rescue equipment", "Veterinary care", "Rehabilitation facilities", "Tracking devices"]
    },
    {
      id: 5,
      title: "Forest Restoration Initiative",
      category: "wildlife",
      description: "Replanting native trees and restoring degraded forest areas to create wildlife corridors.",
      image: "https://www.toronto.ca/wp-content/uploads/2023/01/96a1-tree-planting-stewardship-events-banner.png",
      funding: { raised: 150000, goal: 300000 },
      status: "active",
      impact: "Planted 10,000+ native trees and restored 50 hectares of forest",
      location: "Sinharaja Forest",
      duration: "15 months",
      beneficiaries: "Entire ecosystem",
      features: ["Native seedlings", "Soil preparation", "Maintenance program", "Monitoring system"]
    },
    {
      id: 6,
      title: "Bird Sanctuary Protection",
      category: "wildlife",
      description: "Establishing protected areas for migratory birds and local species conservation.",
      image: "https://images.unsplash.com/photo-1754936705277-abe010304814?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzZ8fEJpcmQlMjBTYW5jdHVhcnklMjBQcm90ZWN0aW9ufGVufDB8fDB8fHww",
      funding: { raised: 220000, goal: 350000 },
      status: "active",
      impact: "Protected 200+ bird species and established 5 new nesting sites",
      location: "Bundala National Park",
      duration: "12 months",
      beneficiaries: "200+ bird species",
      features: ["Nesting platforms", "Water management", "Predator control", "Research station"]
    }
  ];

  const filteredProjects = projects.slice(0, 3); // Show only first 3 projects

  const ProjectCard = ({ project }) => {
    const percentage = Math.round((project.funding.raised / project.funding.goal) * 100);
    
    return (
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden">
        <div className="flex">
          {/* Left Content */}
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h3>
                <p className="text-sm text-gray-500 mb-3">{project.location}</p>
                <p className="text-gray-600 leading-relaxed mb-4">{project.description}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ml-4 ${
                project.status === 'active' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {project.status === 'active' ? 'Active' : 'Completed'}
              </span>
            </div>
            
            {/* Impact */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-1">Impact</h4>
              <p className="text-gray-600 text-sm">{project.impact}</p>
            </div>
            
            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Funding Progress</span>
                <span className="text-lg font-bold text-emerald-600">{percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>LKR {project.funding.raised.toLocaleString()}</span>
                <span>LKR {project.funding.goal.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          {/* Right Sidebar */}
          <div className="w-64 p-6 bg-gray-50 border-l border-gray-200">
            {/* Stats */}
            <div className="space-y-4 mb-6">
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-xl font-bold text-gray-800">{project.beneficiaries}</div>
                <div className="text-xs text-gray-600">Beneficiaries</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-xl font-bold text-gray-800">{project.duration}</div>
                <div className="text-xs text-gray-600">Duration</div>
              </div>
            </div>
            
            {/* Button */}
            <button
              onClick={() => setSelectedProject(project)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ProjectModal = ({ project, onClose }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with Gradient */}
        <div className={`relative h-6 w-full ${
          project.category === 'wildlife' 
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
            : 'bg-gradient-to-r from-blue-500 to-purple-500'
        }`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-12 h-12 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-8">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-3xl">
              {categories.find(cat => cat.id === project.category)?.icon}
            </span>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{project.title}</h2>
              <p className="text-gray-600">{project.location}</p>
            </div>
          </div>
          
          <p className="text-lg text-gray-700 mb-6">{project.description}</p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="bg-emerald-50 rounded-xl p-4">
                <h4 className="font-semibold text-emerald-800 mb-2">Impact</h4>
                <p className="text-emerald-700">{project.impact}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Beneficiaries</h4>
                <p className="text-blue-700">{project.beneficiaries}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-teal-50 rounded-xl p-4">
                <h4 className="font-semibold text-teal-800 mb-2">Duration</h4>
                <p className="text-teal-700">{project.duration}</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4">
                <h4 className="font-semibold text-purple-800 mb-2">Status</h4>
                <p className="text-purple-700 capitalize">{project.status}</p>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <h4 className="text-xl font-semibold text-gray-900 mb-4">Project Features</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {project.features.map((feature, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 text-center">
                  <span className="text-sm font-medium text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6">
            <h4 className="text-xl font-semibold text-gray-900 mb-4">Funding Progress</h4>
            <div className="mb-4">
              <div className="flex justify-between text-lg mb-2">
                <span className="text-gray-700">Raised</span>
                <span className="font-bold text-emerald-600">
                  LKR {project.funding.raised.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${Math.min((project.funding.raised / project.funding.goal) * 100, 100)}%` 
                  }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>Goal: LKR {project.funding.goal.toLocaleString()}</span>
                <span>{Math.round((project.funding.raised / project.funding.goal) * 100)}% funded</span>
              </div>
            </div>
            <div className="flex gap-4">
              <a 
                href="/donation"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors text-center inline-block"
              >
                Support This Project
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Navbar />
      
       {/* Hero Section */}
       <div className="pt-20 pb-16 relative overflow-hidden">
         <div className="absolute inset-0 z-0">
           <img
             src="https://media.istockphoto.com/id/1128140771/photo/juvenile-bird-fate-is-in-the-hands-of-human.jpg?s=612x612&w=0&k=20&c=kU02SyLyBcYMf8iBemH13MkUOEFLxlS5y9QARMNzEdI="
             alt="Conservation Projects - Juvenile bird in caring human hands"
             className="w-full h-full object-cover"
           />
           <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/85 via-emerald-700/70 to-teal-800/75"></div>
         </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center text-white">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Our Conservation Projects
            </h1>
            <p className="text-xl lg:text-2xl text-emerald-100 mb-8 max-w-3xl mx-auto">
              See how your donations are making a real difference in wildlife conservation across Sri Lanka
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <span className="font-semibold">6 Active Projects</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <span className="font-semibold">LKR 1.6M+ Raised</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <span className="font-semibold">10,000+ Beneficiaries</span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Projects Grid */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </div>

      {/* Project Photo Gallery */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Projects in Action</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              See the real impact of our conservation efforts through these inspiring photos from our field work
            </p>
          </div>
          
          {/* Photo Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Gallery Item 1 */}
            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <img 
                src="https://africageographic.com/wp-content/uploads/2016/10/elephant-crossing-at-wildlife-corridor.jpg"
                alt="Elephant Corridor Protection"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="text-lg font-bold mb-1">Elephant Corridor Protection</h3>
                <p className="text-sm">Creating safe passage routes for elephants</p>
              </div>
            </div>

            {/* Gallery Item 2 */}
            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <img 
                src="https://hub.holidayexecutives.com/app/uploads/2021/06/LK-TUR1-1024x683.jpg"
                alt="Marine Turtle Conservation"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="text-lg font-bold mb-1">Marine Turtle Conservation</h3>
                <p className="text-sm">Protecting nesting beaches and monitoring populations</p>
              </div>
            </div>

            {/* Gallery Item 3 */}
            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <img 
                src="https://c.pxhere.com/photos/4d/70/snake_python_children_meeting_touching_learning_wild_ranger-898118.jpg!d"
                alt="Community Education"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="text-lg font-bold mb-1">Community Education</h3>
                <p className="text-sm">Training local communities in conservation</p>
              </div>
            </div>

            {/* Gallery Item 4 */}
            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <img 
                src="https://images.unsplash.com/photo-1591883032503-69a1e001bf50?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8TGVvcGFyZCUyMFJlc2N1ZSUyME5ldHdvcmt8ZW58MHx8MHx8fDA%3D"
                alt="Leopard Rescue Network"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="text-lg font-bold mb-1">Leopard Rescue Network</h3>
                <p className="text-sm">Emergency response for injured leopards</p>
              </div>
            </div>

            {/* Gallery Item 5 */}
            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <img 
                src="https://www.toronto.ca/wp-content/uploads/2023/01/96a1-tree-planting-stewardship-events-banner.png"
                alt="Forest Restoration"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="text-lg font-bold mb-1">Forest Restoration</h3>
                <p className="text-sm">Replanting native trees and restoring habitats</p>
              </div>
            </div>

            {/* Gallery Item 6 */}
            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <img 
                src="https://images.unsplash.com/photo-1754936705277-abe010304814?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzZ8fEJpcmQlMjBTYW5jdHVhcnklMjBQcm90ZWN0aW9ufGVufDB8fDB8fHww"
                alt="Bird Sanctuary Protection"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="text-lg font-bold mb-1">Bird Sanctuary Protection</h3>
                <p className="text-sm">Establishing protected areas for migratory birds</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Call to Action */}
      <div className="py-16 bg-emerald-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Your donation can help fund these critical conservation projects and protect Sri Lanka's wildlife for future generations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/donation"
              className="bg-white hover:bg-gray-50 text-emerald-600 px-8 py-4 rounded-xl font-semibold transition-colors shadow-lg"
            >
              Make a Donation
            </a>
            <a
              href="/about"
              className="border border-white text-white hover:bg-white hover:text-emerald-600 px-8 py-4 rounded-xl font-semibold transition-colors"
            >
              Learn More About Us
            </a>
          </div>
        </div>
      </div>

      {/* Project Modal */}
      {selectedProject && (
        <ProjectModal 
          project={selectedProject} 
          onClose={() => setSelectedProject(null)} 
        />
      )}

      <Footer />
    </div>
  );
};

export default ProjectsPage;
