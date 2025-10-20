import {useState, useEffect, useRef} from "react";
import type {AuthUser} from "aws-amplify/auth";
import { v4 as uuidv4 } from 'uuid';
import { API_ENDPOINTS } from '../config/api';

interface DevConsoleProps {
    user: AuthUser | null;
}

interface ConsoleMessage {
    id: number;
    timestamp: string;
    type: 'info' | 'success' | 'error' | 'sse';
    message: string;
}

export default function DevConsole({user}: DevConsoleProps) {
    const [messages, setMessages] = useState<ConsoleMessage[]>([]);
    const [sseConnected, setSseConnected] = useState(false);
    const [sseUrl, setSseUrl] = useState<string>(API_ENDPOINTS.SSE.EVENTS);
    const [isConnecting, setIsConnecting] = useState(false);
    const [auctionId, setAuctionId] = useState('Enter Auction ID');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const eventSourceRef = useRef<EventSource | null>(null);
    const messageIdCounter = useRef(0);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [messages]);

    // Cleanup SSE connection on unmount
    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    const addMessage = (type: ConsoleMessage['type'], message: string) => {
        const newMessage: ConsoleMessage = {
            id: messageIdCounter.current++,
            timestamp: new Date().toLocaleTimeString(),
            type,
            message
        };
        setMessages(prev => [...prev, newMessage]);
    };

    // SSE Connection Functions
    const connectSSE = () => {
        if (eventSourceRef.current) {
            addMessage('info', 'Already connected to SSE stream');
            return;
        }

        setIsConnecting(true);
        addMessage('info', `Connecting to SSE stream at ${sseUrl}...`);

        try {
            const eventSource = new EventSource(sseUrl);

            eventSource.onopen = () => {
                setSseConnected(true);
                setIsConnecting(false);
                addMessage('success', 'SSE connection established');
            };

            eventSource.onmessage = (event) => {
                addMessage('sse', `SSE Event: ${event.data}`);
            };

            eventSource.onerror = () => {
                setSseConnected(false);
                setIsConnecting(false);
                addMessage('error', 'SSE connection error');
                eventSource.close();
                eventSourceRef.current = null;
            };

            eventSourceRef.current = eventSource;
        } catch (error) {
            setIsConnecting(false);
            addMessage('error', `Failed to connect: ${error}`);
        }
    };

    const disconnectSSE = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
            setSseConnected(false);
            addMessage('info', 'SSE connection closed');
        }
    };

    // API Request Functions
    const makeRequest = async (serviceName: string, endpoint: string, method: string = 'GET', body?: object) => {
        addMessage('info', `[${method}] ${serviceName} -> ${endpoint}`);
        try {
            const options: RequestInit = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            if (body) {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(endpoint, options);

            // Try to parse JSON, fallback to text if it fails
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                try {
                    data = await response.json();
                } catch (e) {
                    const text = await response.text();
                    data = { error: 'Invalid JSON response', body: text };
                }
            } else {
                const text = await response.text();
                data = text || { message: 'Empty response' };
            }

            if (response.ok) {
                addMessage('success', `${serviceName} Response: ${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}`);
            } else {
                addMessage('error', `${serviceName} Error (${response.status}): ${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}`);
            }
        } catch (error) {
            addMessage('error', `${serviceName} Request failed: ${error}`);
        }
    };

    // Auction Service Queries
    const auctionQueries = [
        {
            label: 'Get All Auctions',
            action: () => makeRequest('Auction Service', API_ENDPOINTS.AUCTION.BASE, 'GET')
        },
        {
            label: 'Get Auction by ID',
            action: () => makeRequest('Auction Service', API_ENDPOINTS.AUCTION.BY_ID(auctionId), 'GET'),
            usesId: true
        },
        {
            label: 'Create Test Auction',
            action: () => makeRequest('Auction Service', API_ENDPOINTS.AUCTION.BASE, 'POST', {
                itemName: 'Test Item',
                description: 'Test auction from dev console',
                startingPrice: 100,
                sellerId: user?.username || 'I_AM_A_SELLER',
                startTime: new Date().toISOString(),
                endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            })
        },
        {
            label: 'Update Auction',
            action: () => makeRequest('Auction Service', API_ENDPOINTS.AUCTION.BY_ID(auctionId), 'PUT', {
                itemName: 'Updated Item Name',
                description: 'Updated description from dev console',
                startingPrice: 150
            }),
            usesId: true
        },
        {
            label: 'Open Auction',
            action: () => makeRequest('Auction Service', API_ENDPOINTS.AUCTION.OPEN(auctionId), 'POST'),
            usesId: true
        },
        {
            label: 'End Auction',
            action: () => makeRequest('Auction Service', API_ENDPOINTS.AUCTION.END(auctionId), 'POST'),
            usesId: true
        },
        {
            label: 'Health Check',
            action: () => makeRequest('Auction Service', API_ENDPOINTS.AUCTION.HEALTH, 'GET')
        }
    ];

    // Bid-Command Service (CQRS Write Side)
    const [bidderId, setBidderId] = useState(user?.username || 'test-bidder');
    const [bidAmount, setBidAmount] = useState<number>(100);

    // Bid-Query Service (CQRS Read Side)
    const [queryCursor, setQueryCursor] = useState('');
    const [queryLimit, setQueryLimit] = useState<number>(50);
    const [queryDirection, setQueryDirection] = useState<'asc' | 'desc'>('desc');

    // Update bidderId when user changes
    useEffect(() => {
        if (user?.username) {
            setBidderId(user.username);
        }
    }, [user]);

    // Generate UUID for Idempotency-Key
    const generateUUID = () => {
        return uuidv4();
    };

    // Enhanced makeRequest to support custom headers
    const makeRequestWithHeaders = async (
        serviceName: string,
        endpoint: string,
        method: string = 'GET',
        body?: object,
        headers?: Record<string, string>
    ) => {
        addMessage('info', `[${method}] ${serviceName} -> ${endpoint}`);
        try {
            const options: RequestInit = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
            };

            if (body) {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(endpoint, options);

            // Try to parse JSON, fallback to text if it fails
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                try {
                    data = await response.json();
                } catch (e) {
                    const text = await response.text();
                    data = { error: 'Invalid JSON response', body: text };
                }
            } else {
                const text = await response.text();
                data = text || { message: 'Empty response' };
            }

            if (response.ok) {
                addMessage('success', `${serviceName} Response (${response.status}):\n${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}`);
            } else {
                addMessage('error', `${serviceName} Error (${response.status}):\n${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}`);
            }
        } catch (error) {
            addMessage('error', `${serviceName} Request failed: ${error}`);
        }
    };

    // Bid-Command Service Actions
    const placeBid = () => {
        const idempotencyKey = generateUUID();
        addMessage('info', `Generated Idempotency-Key: ${idempotencyKey}`);

        makeRequestWithHeaders(
            'Bid-Command Service',
            API_ENDPOINTS.BID_COMMAND.PLACE_BID(auctionId),
            'POST',
            {
                bidderId: bidderId,
                amount: bidAmount
            },
            {
                'Idempotency-Key': idempotencyKey
                // 'Authorization': 'Bearer <token>' // Add when auth is ready
            }
        );
    };

    // Bid-Query Service Actions
    const queryBids = () => {
        const endpoint = API_ENDPOINTS.BID_QUERY.BY_AUCTION(auctionId, {
            cursor: queryCursor || undefined,
            limit: queryLimit,
            direction: queryDirection
        });

        makeRequestWithHeaders(
            'Bid-Query Service',
            endpoint,
            'GET',
            undefined,
            {
                // 'Authorization': 'Bearer <token>' // Add when auth is ready
            }
        );
    };

    const clearConsole = () => {
        setMessages([]);
        addMessage('info', 'Console cleared');
    };

    const getMessageColor = (type: ConsoleMessage['type']) => {
        switch (type) {
            case 'info':
                return 'text-blue-400';
            case 'success':
                return 'text-green-400';
            case 'error':
                return 'text-red-400';
            case 'sse':
                return 'text-purple-400';
            default:
                return 'text-gray-400';
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
                <h2 className="text-md font-bold text-gray-900">Test SSE dev console</h2>
            </div>

            {/* Main Layout: Left Controls (30%) and Right Console (70%) */}
            <div className="flex gap-4 h-[calc(100vh-16rem)]">
                {/* Left Column: Controls */}
                <div className="w-[30%] space-y-4 overflow-y-auto">
                    {/* SSE Connection Controls */}
                    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">SSE Stream</h3>
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={sseUrl}
                                onChange={(e) => setSseUrl(e.target.value)}
                                disabled={sseConnected}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                placeholder="SSE endpoint URL"
                            />
                            {sseConnected ? (
                                <button
                                    onClick={disconnectSSE}
                                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                                >
                                    Disconnect
                                </button>
                            ) : (
                                <button
                                    onClick={connectSSE}
                                    disabled={isConnecting}
                                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isConnecting ? 'Connecting...' : 'Connect'}
                                </button>
                            )}
                            <div className={`flex items-center justify-center space-x-2 ${sseConnected ? 'text-green-600' : 'text-gray-400'}`}>
                                <div className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                                <span className="text-xs font-medium">{sseConnected ? 'Connected' : 'Disconnected'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Auction Service */}
                    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Auction Service</h3>
                        <div className="space-y-3">
                            {/* Auction ID Input */}
                            <div>
                                <label htmlFor="auctionId" className="block text-xs font-medium text-gray-700 mb-1">
                                    Auction ID
                                </label>
                                <input
                                    id="auctionId"
                                    type="text"
                                    value={auctionId}
                                    onChange={(e) => setAuctionId(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Enter auction ID"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Used for Get, Update, Open, and End operations
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-2">
                                {auctionQueries.map((query, index) => (
                                    <button
                                        key={index}
                                        onClick={query.action}
                                        className="w-full px-3 py-2 text-left text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
                                    >
                                        {query.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bid-Command Service (CQRS Write) */}
                    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Bid-Command Service</h3>
                        <p className="text-xs text-gray-500 mb-3">CQRS Write Side - Place Bids</p>
                        <div className="space-y-3">
                            {/* Bidder ID Input */}
                            <div>
                                <label htmlFor="bidderId" className="block text-xs font-medium text-gray-700 mb-1">
                                    Bidder ID
                                </label>
                                <input
                                    id="bidderId"
                                    type="text"
                                    value={bidderId}
                                    onChange={(e) => setBidderId(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Enter bidder ID"
                                />
                            </div>

                            {/* Bid Amount Input */}
                            <div>
                                <label htmlFor="bidAmount" className="block text-xs font-medium text-gray-700 mb-1">
                                    Bid Amount
                                </label>
                                <input
                                    id="bidAmount"
                                    type="number"
                                    value={bidAmount}
                                    onChange={(e) => setBidAmount(parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Enter bid amount"
                                    step="0.01"
                                    min="0"
                                />
                            </div>

                            {/* Place Bid Button */}
                            <button
                                onClick={placeBid}
                                className="w-full px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                            >
                                Place Bid
                            </button>
                        </div>
                    </div>

                    {/* Bid-Query Service (CQRS Read) */}
                    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Bid-Query Service</h3>
                        <p className="text-xs text-gray-500 mb-3">CQRS Read Side - Get Bid History</p>
                        <div className="space-y-3">
                            {/* Cursor Input */}
                            <div>
                                <label htmlFor="queryCursor" className="block text-xs font-medium text-gray-700 mb-1">
                                    Cursor (Optional)
                                </label>
                                <input
                                    id="queryCursor"
                                    type="text"
                                    value={queryCursor}
                                    onChange={(e) => setQueryCursor(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="Paste nextCursor from response"
                                />
                            </div>

                            {/* Limit Input */}
                            <div>
                                <label htmlFor="queryLimit" className="block text-xs font-medium text-gray-700 mb-1">
                                    Limit (1-200)
                                </label>
                                <input
                                    id="queryLimit"
                                    type="number"
                                    value={queryLimit}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value) || 50;
                                        setQueryLimit(Math.min(Math.max(val, 1), 200));
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="50"
                                    min="1"
                                    max="200"
                                />
                            </div>

                            {/* Direction Select */}
                            <div>
                                <label htmlFor="queryDirection" className="block text-xs font-medium text-gray-700 mb-1">
                                    Direction
                                </label>
                                <select
                                    id="queryDirection"
                                    value={queryDirection}
                                    onChange={(e) => setQueryDirection(e.target.value as 'asc' | 'desc')}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                >
                                    <option value="desc">Newest First (desc)</option>
                                    <option value="asc">Oldest First (asc)</option>
                                </select>
                            </div>

                            {/* Query Bids Button */}
                            <button
                                onClick={queryBids}
                                className="w-full px-3 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                            >
                                Get Bids
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Console Output */}
                <div className="w-[70%] bg-gray-900 rounded-lg shadow-lg border border-gray-700 flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
                        <div className="flex items-center space-x-2">
                            <span className="ml-4 text-sm font-mono text-gray-400">SSE Console Output</span>
                        </div>
                        <button
                            onClick={clearConsole}
                            className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors font-mono"
                        >
                            Clear
                        </button>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto font-mono text-sm">
                        {messages.length === 0 ? (
                            <div className="text-gray-500 text-center py-8">
                                Console is empty. Connect to SSE or make a service request to see output.
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} className="mb-2">
                                    <span className="text-gray-500">[{msg.timestamp}]</span>{' '}
                                    <span className={getMessageColor(msg.type)}>
                                        [{msg.type.toUpperCase()}]
                                    </span>{' '}
                                    <span className="text-gray-300 whitespace-pre-wrap break-all">
                                        {msg.message}
                                    </span>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
}