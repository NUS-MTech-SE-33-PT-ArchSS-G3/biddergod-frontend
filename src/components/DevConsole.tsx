import {useState, useEffect, useRef} from "react";
import type {AuthUser} from "aws-amplify/auth";

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
    const [sseUrl, setSseUrl] = useState('http://localhost:8000/events');
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
            const data = await response.json();

            if (response.ok) {
                addMessage('success', `${serviceName} Response: ${JSON.stringify(data, null, 2)}`);
            } else {
                addMessage('error', `${serviceName} Error (${response.status}): ${JSON.stringify(data, null, 2)}`);
            }
        } catch (error) {
            addMessage('error', `${serviceName} Request failed: ${error}`);
        }
    };

    // Auction Service Queries
    const auctionQueries = [
        {
            label: 'Get All Auctions',
            action: () => makeRequest('Auction Service', 'http://localhost:8000/api/auctions', 'GET')
        },
        {
            label: 'Get Auction by ID',
            action: () => makeRequest('Auction Service', `http://localhost:8000/api/auctions/${auctionId}`, 'GET'),
            usesId: true
        },
        {
            label: 'Create Test Auction',
            action: () => makeRequest('Auction Service', 'http://localhost:8000/api/auctions', 'POST', {
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
            action: () => makeRequest('Auction Service', `http://localhost:8000/api/auctions/${auctionId}`, 'PUT', {
                itemName: 'Updated Item Name',
                description: 'Updated description from dev console',
                startingPrice: 150
            }),
            usesId: true
        },
        {
            label: 'Open Auction',
            action: () => makeRequest('Auction Service', `http://localhost:8000/api/auctions/${auctionId}/open`, 'POST'),
            usesId: true
        },
        {
            label: 'End Auction',
            action: () => makeRequest('Auction Service', `http://localhost:8000/api/auctions/${auctionId}/end`, 'POST'),
            usesId: true
        },
        {
            label: 'Health Check',
            action: () => makeRequest('Auction Service', 'http://localhost:8000/api/auction-health', 'GET')
        }
    ];

    // Bidding Service Queries
    const biddingQueries = [
        {
            label: 'Place Test Bid',
            action: () => makeRequest('Bidding Service', 'http://localhost:8000/api/auctions/1/bids', 'POST', {
                bidderId: user?.username || 'test-user',
                amount: 150
            })
        },
        {
            label: 'Get Bids for Auction',
            action: () => makeRequest('Bidding Service', 'http://localhost:8000/api/auctions/1/bids', 'GET')
        },
        {
            label: 'Health Check',
            action: () => makeRequest('Bidding Service', 'http://localhost:8082/healthz', 'GET')
        }
    ];

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

                    {/* Bidding Service */}
                    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Bidding Service</h3>
                        <div className="space-y-2">
                            {biddingQueries.map((query, index) => (
                                <button
                                    key={index}
                                    onClick={query.action}
                                    className="w-full px-3 py-2 text-left text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium"
                                >
                                    {query.label}
                                </button>
                            ))}
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