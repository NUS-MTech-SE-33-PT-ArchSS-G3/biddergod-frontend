import {useState, useEffect} from "react";
import type {AuthUser} from "aws-amplify/auth";
import {fetchAuthSession} from "aws-amplify/auth";
import {UserInformation} from "./UserInformation.tsx";
import TokensCopyTool from "./TokensCopyTool.tsx";
import SwaggerUI from "swagger-ui-react"
import "swagger-ui-react/swagger-ui.css"

interface ApiTestingInterfaceProps {
    user: AuthUser | null;
}

export default function ApiTestingInterface({user}: ApiTestingInterfaceProps) {
    const [accessToken, setAccessToken] = useState<string>("");
    const [idToken, setIdToken] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const[showSwaggerUI, setShowSwaggerUI] = useState(false);

    // const USERS_SERVICE_URL = "http://localhost:8080";
    const USERS_SERVICE_URL = import.meta.env.VITE_USER_API_URL;

    useEffect(() => {
        if (user) {
            void getTokens();
        }
    }, [user]);

    const getTokens = async () => {
        try {
            setIsLoading(true);
            const session = await fetchAuthSession();
            const accessToken = session.tokens?.accessToken?.toString();
            const idToken = session.tokens?.idToken?.toString();
            if (accessToken) {
                setAccessToken(accessToken);
            }
            if (idToken) {
                setIdToken(idToken);
            }
        } catch (error) {
            console.error("Error getting tokens:", error);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Users Service API
                </h2>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    user
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                }`}>
                    <span className={user ? '🟢' : '🔴'}></span>
                    {user ? 'Authenticated' : 'Authentication Required'}
                </div>
            </div>
            {user && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <UserInformation user={user}/>
                    <TokensCopyTool
                        accessToken={accessToken}
                        idToken={idToken}
                        isLoading={isLoading}
                    />
                </div>
            )}

            {/* API Documentation */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    API Documentation
                </h3>
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">Service URL</h4>
                        <p className="text-sm text-blue-800 font-mono">{USERS_SERVICE_URL}</p>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">API Documentation</h4>
                        <p className="text-sm text-gray-600 mb-3">
                            Access the interactive API documentation when the service is running:
                        </p>
                        <button
                            onClick={() => setShowSwaggerUI(!showSwaggerUI)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            {showSwaggerUI ? 'Hide Swagger UI' : 'Show Swagger UI'}
                        </button>
                        {showSwaggerUI && (
                            <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                                <SwaggerUI url={`${USERS_SERVICE_URL}/api-docs`}/>
                            </div>
                        )}
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-medium text-yellow-900 mb-2">Prerequisites</h4>
                        <ul className="text-sm text-yellow-800 space-y-1">
                            <li>User must be authenticated to access protected endpoints</li>
                            <li>Include Authorization header with Bearer token for authenticated requests</li>
                        </ul>
                    </div>
                </div>
            </div>

        </div>
    );
}