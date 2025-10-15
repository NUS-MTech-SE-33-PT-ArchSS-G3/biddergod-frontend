import { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { AuctionCard } from './AuctionCard';
import { getAllAuctions } from '../services/auctionService';
import { mapAuctionToDisplay } from '../types/auction';
import type { AuctionDisplay } from '../types/auction';
import type { UserWithEmail } from '../App';
import EditProfileDialog, { type ProfileFormData } from './EditProfileDialog';
import { updateUserProfile } from '../services/userService';

interface UserProfileProps {
  user: UserWithEmail;
}

export default function UserProfile({ user }: UserProfileProps) {
  const [myAuctions, setMyAuctions] = useState<AuctionDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'created' | 'bidding'>('created');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');

  useEffect(() => {
    fetchMyAuctions();
  }, [user.username]);

  const fetchMyAuctions = async () => {
    try {
      setLoading(true);
      setError(null);
      const allAuctions = await getAllAuctions();
      const displayAuctions = allAuctions.map(mapAuctionToDisplay);

      // Filter auctions created by this user
      const userAuctions = displayAuctions.filter(
        auction => auction.sellerName === user.username
      );

      setMyAuctions(userAuctions);
    } catch (err) {
      console.error('Error fetching user auctions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load auctions');
    } finally {
      setLoading(false);
    }
  };

  const handleAuctionUpdate = () => {
    fetchMyAuctions();
  };

  const handleEditProfile = async (profileData: ProfileFormData) => {
    try {
      // Get the access token from Amplify session
      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken?.toString();

      if (!accessToken) {
        alert('Failed to get authentication token. Please sign in again.');
        return;
      }

      // Call the update API
      const result = await updateUserProfile(accessToken, {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
      });

      // Update local state
      setFirstName(result.user.firstName || '');
      setLastName(result.user.lastName || '');

      alert('Profile updated successfully!');
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error; // Re-throw to let dialog handle it
    }
  };

  // Calculate stats
  const totalAuctions = myAuctions.length;
  const activeAuctions = myAuctions.filter(a => a.status === 'open').length;
  const draftAuctions = myAuctions.filter(a => a.status === 'draft').length;
  const closedAuctions = myAuctions.filter(a => a.status === 'closed').length;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-4xl font-bold">
              {(user.email || user.username).charAt(0).toUpperCase()}
            </span>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {user.email || user.username}
                </h1>
                {(firstName || lastName) && (
                  <p className="text-lg text-gray-700 mt-1">
                    {firstName} {lastName}
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsEditDialogOpen(true)}
                className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors"
              >
                Edit Profile
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Username: {user.username}
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-indigo-600">
                  {totalAuctions}
                </div>
                <div className="text-sm text-gray-600">Total Auctions</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {activeAuctions}
                </div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-600">
                  {draftAuctions}
                </div>
                <div className="text-sm text-gray-600">Draft</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-600">
                  {closedAuctions}
                </div>
                <div className="text-sm text-gray-600">Closed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('created')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'created'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Auctions ({totalAuctions})
            </button>
            <button
              onClick={() => setActiveTab('bidding')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'bidding'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Auctions I'm Bidding On (0)
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'created' && (
            <div>
              {loading && (
                <div className="text-center py-12">
                  <p className="text-gray-600">Loading your auctions...</p>
                </div>
              )}

              {!loading && error && (
                <div className="text-center py-12">
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={fetchMyAuctions}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!loading && !error && myAuctions.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No auctions yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    You haven't created any auctions. Start by creating your first auction!
                  </p>
                </div>
              )}

              {!loading && !error && myAuctions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myAuctions.map((auction) => (
                    <AuctionCard
                      key={auction.id}
                      {...auction}
                      currentUsername={user.username}
                      onAuctionUpdate={handleAuctionUpdate}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'bidding' && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔨</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Coming Soon
              </h3>
              <p className="text-gray-600">
                Bidding functionality will be available once the bidding service is integrated.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSubmit={handleEditProfile}
        currentFirstName={firstName}
        currentLastName={lastName}
      />
    </div>
  );
}