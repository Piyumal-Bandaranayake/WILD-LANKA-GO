import React, { useState } from "react";

export default function GuideDashboard() {
  const [onDuty, setOnDuty] = useState(true); // You can toggle this later based on user interaction

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div
        className="mx-auto grid gap-6"
        style={{
          maxWidth: "1200px", // Constrain the container width
          gridTemplateColumns: "250px minmax(600px, 1fr) 300px", // Adjusted width for sidebar and right section
        }}
      >
        {/* Sidebar */}
        <aside className="w-full" style={{ maxWidth: 250 }}>
          <div className="rounded-2xl p-6 shadow-lg bg-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#FDECEC]">
                {/* Placeholder for icon */}
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">Ruwan Jayasinghe</div>
                <div className="text-sm text-gray-500">Wildlife Guide</div>
              </div>
            </div>
            <hr className="my-6 border-gray-200" />
            <div className="space-y-2">
              <button className="flex items-center gap-3 px-5 py-3 rounded-xl hover:bg-green-50 text-green-600">
                Dashboard
              </button>
              <button className="flex items-center gap-3 px-5 py-3 rounded-xl hover:bg-green-50 text-green-600">
                Assigned Tours
              </button>
              <button className="flex items-center gap-3 px-5 py-3 rounded-xl hover:bg-green-50 text-green-600">
                Profile Settings
              </button>
              <button className="flex items-center gap-3 px-5 py-3 rounded-xl hover:bg-green-50 text-green-600">
                tour materials
              </button>
               <button className="flex items-center gap-3 px-5 py-3 rounded-xl hover:bg-green-50 text-green-600">
                History
              </button>
               <button className="flex items-center gap-3 px-5 py-3 rounded-xl hover:bg-green-50 text-green-600">
                logout
              </button>
               
            </div>
          </div>
        </aside>

        {/* Main Dashboard */}
        <main className="space-y-6">
          <section className="rounded-2xl p-6 bg-gradient-to-r from-green-400 to-blue-500 text-white relative overflow-hidden">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="text-xs opacity-90">{onDuty ? "On Duty" : "Off Duty"}</span>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={onDuty}
                  onChange={() => setOnDuty(!onDuty)}
                />
                <div className="w-11 h-6 bg-white/30 rounded-full peer-checked:bg-white/60 relative transition">
                  <div className="absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full transition-all peer-checked:translate-x-5"></div>
                </div>
              </label>
            </div>

            <h2 className="text-2xl md:text-3xl font-semibold">Good Morning, Ruwan! 🌞</h2>
            <p className="mt-2 opacity-95">
              You have 2 tours scheduled today. Check your assignments and tourist information.
            </p>
            <button className="mt-5 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg shadow-sm">
              View Today's Schedule
            </button>
          </section>

          {/* Stats Section */}
          <section className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-white shadow-lg p-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-50 text-gray-500">
                  {/* Placeholder for icon */}
                </div>
                <div>
                  <div className="text-3xl font-semibold text-gray-900">5</div>
                  <div className="text-sm text-gray-500">Active Tours</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white shadow-lg p-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-50 text-gray-500">
                  {/* Placeholder for icon */}
                </div>
                <div>
                  <div className="text-3xl font-semibold text-gray-900">23</div>
                  <div className="text-sm text-gray-500">Tours This Month</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white shadow-lg p-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-50 text-gray-500">
                  {/* Placeholder for icon */}
                </div>
                <div>
                  <div className="text-3xl font-semibold text-gray-900">4.9</div>
                  <div className="text-sm text-gray-500">Tourist Rating</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white shadow-lg p-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-50 text-gray-500">
                  {/* Placeholder for icon */}
                </div>
                <div>
                  <div className="text-3xl font-semibold text-gray-900">LKR 185K</div>
                  <div className="text-sm text-gray-500">Total Earnings</div>
                </div>
              </div>
            </div>
          </section>

          {/* Tour Controls Section */}
          <section className="rounded-2xl bg-white shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900">Tour Controls</h3>
            <div className="grid grid-cols-4 gap-4 mt-4">
              <button className="bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg flex justify-center items-center gap-2">
                {/* Placeholder for icon */}
                Start Tour
              </button>
              <button className="bg-yellow-500 hover:bg-yellow-400 text-white py-2 rounded-lg flex justify-center items-center gap-2">
                {/* Placeholder for icon */}
                Break Time
              </button>
              <button className="bg-blue-500 hover:bg-blue-400 text-white py-2 rounded-lg flex justify-center items-center gap-2">
                {/* Placeholder for icon */}
                Photo Spot
              </button>
              <button className="bg-red-500 hover:bg-red-400 text-white py-2 rounded-lg flex justify-center items-center gap-2">
                {/* Placeholder for icon */}
                End Tour
              </button>
            </div>
          </section>
        </main>

        {/* Right Sidebar */}
        <aside className="w-full" style={{ maxWidth: 300 }}>
          <div className="rounded-2xl p-6 shadow-lg bg-white">
            <h4 className="text-xl font-semibold text-gray-900">Notifications</h4>
            <div className="mt-4 text-gray-600">
              <p className="text-sm">Upcoming Tours</p>
              <ul className="space-y-2 mt-2">
                <li className="flex items-center justify-between">
                  <span>Elephant Safari - Udawalawe</span>
                  <span>6:00 AM</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Rainforest Exploration - Sinharaja</span>
                  <span>10:00 AM</span>
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
