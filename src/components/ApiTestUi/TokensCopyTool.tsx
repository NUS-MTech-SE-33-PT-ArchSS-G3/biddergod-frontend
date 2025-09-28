interface TokensCopyToolProps {
  accessToken: string;
  idToken: string;
  isLoading: boolean;
}

export default function TokensCopyTool({ accessToken, idToken, isLoading }: TokensCopyToolProps) {
  const copyTokenToClipboard = (token: string) => {
    navigator.clipboard.writeText(token);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Authentication Tokens
      </h3>

      {/* Access Token */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Access Token
          </label>
          <button
            onClick={() => copyTokenToClipboard(accessToken)}
            disabled={!accessToken}
            className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Copy Token
          </button>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 border">
          {isLoading ? (
            <span className="text-gray-500 text-sm">Loading token...</span>
          ) : (
            <span className="text-xs text-gray-600 font-mono break-all">
              {accessToken ? `${accessToken.substring(0, 60)}...` : "No token available"}
            </span>
          )}
        </div>
      </div>

      {/* ID Token */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            ID Token
          </label>
          <button
            onClick={() => copyTokenToClipboard(idToken)}
            disabled={!idToken}
            className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Copy Token
          </button>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 border">
          {isLoading ? (
            <span className="text-gray-500 text-sm">Loading token...</span>
          ) : (
            <span className="text-xs text-gray-600 font-mono break-all">
              {idToken ? `${idToken.substring(0, 60)}...` : "No token available"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}