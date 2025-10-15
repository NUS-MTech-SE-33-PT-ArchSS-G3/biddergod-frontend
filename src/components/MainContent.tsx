import type {AuthUser} from "aws-amplify/auth";
import {useState} from "react";
import AuctionsGrid from "./AuctionsGrid";
import ApiTestingInterface from "./ApiTestUi/ApiTestingInterface.tsx";
import DevConsole from "./DevConsole";
import CreateAuctionDialog, { type AuctionFormData } from "./CreateAuctionDialog";
import UserProfile from "./UserProfile";
import { createAuction } from "../services/auctionService";
import type { UserWithEmail } from "../App";

interface MainContentProps {
    user: UserWithEmail | null;
    handleSignOut: () => void;
    setShowAuth: (auth : boolean) => void;
}

export default function MainContent({user, handleSignOut, setShowAuth}: MainContentProps) {
    const [activeTab, setActiveTab] = useState("home");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [auctionGridKey, setAuctionGridKey] = useState(0);

    const handleCreateAuction = async (auctionData: AuctionFormData) => {
        try {
            setIsCreating(true);
            setCreateError(null);

            // Convert form data to backend format
            const startTime = new Date().toISOString();
            const endTime = new Date(auctionData.auctionEndTime).toISOString();

            const requestData = {
                itemName: auctionData.title,
                itemDescription: auctionData.description,
                startingPrice: auctionData.startingPrice,
                sellerId: user?.username || 'anonymous', // Use authenticated user
                startTime,
                endTime,
            };

            await createAuction(requestData);

            // change grid key to refresh
            setAuctionGridKey(prev => prev + 1);

            // Show success notification
            console.log('Auction created successfully!');
            alert('Auction created successfully!');

        } catch (error) {
            console.error('Failed to create auction:', error);
            setCreateError(error instanceof Error ? error.message : 'Failed to create auction');
            alert(`Failed to create auction: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error; // Re-throw to let dialog handle it if needed
        } finally {
            setIsCreating(false);
        }
    };

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
                                    <button
                                        onClick={() => setActiveTab("profile")}
                                        className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                                    >
                                        <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm font-medium">
                                                {(user.email || user.username).charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <span className="text-sm text-gray-700">Hello, {user.email || user.username}</span>
                                    </button>
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
                            Cognito Tokens
                        </button>
                        <button
                            onClick={() => setActiveTab("dev")}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === "dev"
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            DevConsole
                        </button>
                    </div>
                </div>
            </nav>

            {/* Create Auction Button - Only show on Auctions tab */}
            {activeTab === "home" && (
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex justify-end">
                            <button
                                onClick={() => setIsCreateDialogOpen(true)}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                + Create Auction
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === "home" && <AuctionsGrid key={auctionGridKey} currentUsername={user?.username} />}
                {activeTab === "profile" && user && <UserProfile user={user} />}
                {activeTab === "api" && <ApiTestingInterface user={user} />}
                {activeTab === "dev" && <DevConsole user={user} />}
            </main>

            {/* Create Auction Dialog */}
            <CreateAuctionDialog
                isOpen={isCreateDialogOpen}
                onClose={() => setIsCreateDialogOpen(false)}
                onSubmit={handleCreateAuction}
            />
        </div>
    )
}