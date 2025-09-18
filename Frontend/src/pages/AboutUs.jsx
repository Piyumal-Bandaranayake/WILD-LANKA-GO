import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/footer';
import backgroundImage from '../assets/logo.png';

export default function AboutUs() {
    return (
        <>
            <Navbar />
            
            {/* Hero Section */}
            <section className="relative py-20 bg-green-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-green-800 mb-4">About WildLankado</h1>
                        <p className="text-lg text-green-700 max-w-3xl mx-auto">
                            Dedicated to providing Sri Lanka's wildlife heritage through sustainable tourism and conservation education
                        </p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-10">
                        <div className="md:w-1/2">
                            <img 
                                className="w-full rounded-xl shadow-lg"
                                src="https://images.unsplash.com/photo-1555212697-194d092e3b8f?q=80&w=830&h=844&auto=format&fit=crop"
                                alt="Wildlife in Sri Lanka"
                            />
                        </div>
                        
                        <div className="md:w-1/2">
                            <div className="mb-8">
                                <h2 className="text-2xl font-semibold text-green-800 mb-3">Our Mission</h2>
                                <p className="text-gray-700">
                                    To provide exceptional wildlife experiences that educate, inspire, and contribute to the conservation 
                                    of Sri Lanka's unique biodiversity while supporting local communities and promoting sustainable tourism practices.
                                </p>
                            </div>
                            
                            <div>
                                <h2 className="text-2xl font-semibold text-green-800 mb-3">Our Vision</h2>
                                <p className="text-gray-700">
                                    To be Sri Lanka's leading wildlife tourism platform that sets the standard for responsible wildlife encounters, 
                                    conservation education, and community-based eco-tourism initiatives.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Values Section */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-semibold text-green-800 text-center mb-12">Our Values</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-green-50 p-6 rounded-lg shadow-md">
                            <div className="text-green-700 text-2xl mb-4">🌿</div>
                            <h3 className="text-xl font-semibold text-green-800 mb-3">Conservation-First</h3>
                            <p className="text-gray-700">
                                We prioritize wildlife protection and habitat conservation in all our activities and operations.
                            </p>
                        </div>
                        
                        <div className="bg-green-50 p-6 rounded-lg shadow-md">
                            <div className="text-green-700 text-2xl mb-4">🤝</div>
                            <h3 className="text-xl font-semibold text-green-800 mb-3">Community Support</h3>
                            <p className="text-gray-700">
                                We work closely with local communities to ensure tourism benefits are shared equitably.
                            </p>
                        </div>
                        
                        <div className="bg-green-50 p-6 rounded-lg shadow-md">
                            <div className="text-green-700 text-2xl mb-4">♻️</div>
                            <h3 className="text-xl font-semibold text-green-800 mb-3">Sustainability</h3>
                            <p className="text-gray-700">
                                We promote eco-friendly practices that minimize environmental impact while maximizing visitor experience.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Features Section */}
            <section className="py-16 bg-green-100">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-semibold text-green-800 text-center mb-12">Our Key Features</h2>
                    
                    <div className="max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex items-start gap-4">
                                <div className="size-12 p-2 bg-green-200 rounded-full flex items-center justify-center">
                                    <span className="text-xl">📅</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-medium text-green-800 mb-2">Easy Tour Booking</h3>
                                    <p className="text-gray-700">
                                        Book your wildlife tours and safaris with just a few clicks. Choose your preferred dates and get instant confirmation.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-4">
                                <div className="size-12 p-2 bg-green-200 rounded-full flex items-center justify-center">
                                    <span className="text-xl">🧭</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-medium text-green-800 mb-2">Expert Wildlife Guides</h3>
                                    <p className="text-gray-700">
                                        Our professional guides ensure a memorable, educational, and safe experience in Sri Lanka's diverse ecosystems.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-4">
                                <div className="size-12 p-2 bg-green-200 rounded-full flex items-center justify-center">
                                    <span className="text-xl">🆘</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-medium text-green-800 mb-2">Emergency Support</h3>
                                    <p className="text-gray-700">
                                        In case of emergencies, our dedicated support team is available to assist you, ensuring your safety throughout your tour.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-4">
                                <div className="size-12 p-2 bg-green-200 rounded-full flex items-center justify-center">
                                    <span className="text-xl">✨</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-medium text-green-800 mb-2">Customizable Tours</h3>
                                    <p className="text-gray-700">
                                        Tailor your tour to match your interests, whether you're focused on wildlife, nature, or photography.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    );
}