import type {AuthUser} from "aws-amplify/auth";

{/* User Information */
}

interface UserInformationProps {
    user: AuthUser;
}

export function UserInformation({user}: UserInformationProps) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                User Information
            </h3>
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="text-sm font-medium text-gray-700">Username</label>
                    <p className="text-gray-900 mt-1 font-mono">{user.username}</p>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">User ID</label>
                    <p className="text-gray-900 mt-1 font-mono">{user.userId}</p>
                </div>
            </div>
        </div>
    )
}


