import type {AuthUser} from "aws-amplify/auth";
import {useState} from "react";
import AuctionsGrid from "./AuctionsGrid";
import ApiTestingInterface from "./ApiTestUi/ApiTestingInterface.tsx";

interface MainContentProps {
    user: AuthUser | null;
    handleSignOut: () => void;
    setShowAuth: (auth : boolean) => void;
}

export default function MainContent({user, handleSignOut, setShowAuth}: MainContentProps) {
    const [activeTab, setActiveTab] = useState("home");

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-indigo-600">BidderGod</h1>
                            <span className="ml-2 text-sm text-gray-500">Auction Platform</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            {user ? (
                                <>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm font-medium">
                                                {user.username.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <span className="text-sm text-gray-700">Hello, {user.username}</span>
                                    </div>
                                    <button
                                        onClick={handleSignOut}
                                        className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors"
                                    >
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setShowAuth(true)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Sign In
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab("home")}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === "home"
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Auctions
                        </button>
                        <button
                            onClick={() => setActiveTab("api")}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === "api"
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            API Testing
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === "home" && <AuctionsGrid />}
                {activeTab === "api" && <ApiTestingInterface user={user} />}
            </main>
        </div>
    )
}